import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Billing from '@/models/Billing';
import Patient from '@/models/Patient';
import { requireAuth, checkRole, UserRole } from '@/lib/middleware/auth';
import { 
  applyBranchFilter, 
  buildPaginationResponse 
} from '@/lib/utils/queryHelpers';

export async function POST(req: NextRequest) {
  return checkRole([UserRole.BILLING, UserRole.ACCOUNTING, UserRole.ADMIN, UserRole.FRONT_DESK])(
    req,
    async (req: NextRequest, session: any) => {
      try {
        await dbConnect();

        const body = await req.json();

        const requiredFields = [
          'patient',
          'branch',
          'items',
          'subtotal',
          'totalAmount'
        ];

        const missingFields = requiredFields.filter(field => !body[field]);
        if (missingFields.length > 0) {
          return NextResponse.json(
            { error: `Missing required fields: ${missingFields.join(', ')}` },
            { status: 400 }
          );
        }

        if (!Array.isArray(body.items) || body.items.length === 0) {
          return NextResponse.json(
            { error: 'At least one billing item is required' },
            { status: 400 }
          );
        }

        const patient = await Patient.findById(body.patient);
        if (!patient) {
          return NextResponse.json(
            { error: 'Patient not found' },
            { status: 404 }
          );
        }

        const invoiceNumber = `INV-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

        let totalAmount = body.totalAmount;
        let insurance = body.insurance;

        if (patient.insurance && body.applyInsurance && body.insurance) {
          insurance = {
            provider: patient.insurance.provider,
            policyNumber: patient.insurance.policyNumber,
            claimAmount: body.insurance.claimAmount || 0,
            claimStatus: 'pending',
            approvalNumber: body.insurance.approvalNumber
          };
        }

        const balance = totalAmount - (body.amountPaid || 0);

        let status: 'pending' | 'partially_paid' | 'paid' | 'cancelled' = 'pending';
        let paymentStatus: 'unpaid' | 'partially_paid' | 'paid' = 'unpaid';

        if (body.amountPaid >= totalAmount) {
          status = 'paid';
          paymentStatus = 'paid';
        } else if (body.amountPaid > 0) {
          status = 'partially_paid';
          paymentStatus = 'partially_paid';
        }

        const dueDate = body.dueDate ? new Date(body.dueDate) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

        const billingData = {
          invoiceNumber,
          patient: body.patient,
          visit: body.visit,
          branch: body.branch,
          items: body.items,
          subtotal: body.subtotal,
          tax: body.tax || 0,
          discount: body.discount || 0,
          totalAmount: totalAmount,
          amountPaid: body.amountPaid || 0,
          balance: balance,
          status: status,
          paymentStatus: paymentStatus,
          insurance: insurance,
          createdBy: session.user.id,
          approvedBy: body.approvedBy,
          dueDate: dueDate,
          notes: body.notes
        };

        const billing = await Billing.create(billingData);

        const populatedBilling = await Billing.findById(billing._id)
          .populate('patient', 'patientId firstName lastName phoneNumber email insurance')
          .populate('branch', 'name address city state phoneNumber email')
          .populate('createdBy', 'firstName lastName email role')
          .populate('approvedBy', 'firstName lastName email role')
          .populate('visit', 'visitNumber visitDate currentStage');

        return NextResponse.json(
          {
            message: 'Billing record created successfully',
            billing: populatedBilling
          },
          { status: 201 }
        );

      } catch (error: any) {
        console.error('Create billing record error:', error);

        if (error.name === 'ValidationError') {
          const validationErrors = Object.keys(error.errors).map(
            key => error.errors[key].message
          );
          return NextResponse.json(
            { error: 'Validation error', details: validationErrors },
            { status: 400 }
          );
        }

        if (error.code === 11000) {
          return NextResponse.json(
            { error: 'Invoice number already exists' },
            { status: 409 }
          );
        }

        return NextResponse.json(
          { error: 'Failed to create billing record', message: error.message },
          { status: 500 }
        );
      }
    }
  );
}

export async function GET(req: NextRequest) {
  return checkRole([UserRole.ACCOUNTING, UserRole.ADMIN, UserRole.BILLING, UserRole.FRONT_DESK])(req, async (req: NextRequest, session: any) => {
    try {
      await dbConnect();

      const { searchParams } = new URL(req.url);

      const page = parseInt(searchParams.get('page') || '1');
      const limit = parseInt(searchParams.get('limit') || '20');
      const search = searchParams.get('search') || '';
      const patientId = searchParams.get('patient');
      const branchId = searchParams.get('branch');
      const status = searchParams.get('status');
      const dateFrom = searchParams.get('dateFrom');
      const dateTo = searchParams.get('dateTo');

      const query: any = {};

      if (search) {
        const patients = await Patient.find({
          $or: [
            { firstName: { $regex: search, $options: 'i' } },
            { lastName: { $regex: search, $options: 'i' } },
            { patientId: { $regex: search, $options: 'i' } }
          ]
        }).select('_id');

        const patientIds = patients.map(p => p._id);

        query.$or = [
          { patient: { $in: patientIds } },
          { invoiceNumber: { $regex: search, $options: 'i' } }
        ];
      }

      if (patientId) {
        query.patient = patientId;
      }

      if (branchId) {
        query.branch = branchId;
      }

      if (status) {
        if (status === 'paid') {
          query.status = 'paid';
        } else if (status === 'unpaid') {
          query.status = 'pending';
        } else if (status === 'partial') {
          query.status = 'partially_paid';
        } else {
          query.status = status.toLowerCase();
        }
      }

      if (dateFrom || dateTo) {
        query.createdAt = {};
        if (dateFrom) {
          query.createdAt.$gte = new Date(dateFrom);
        }
        if (dateTo) {
          const endDate = new Date(dateTo);
          endDate.setHours(23, 59, 59, 999);
          query.createdAt.$lte = endDate;
        }
      }

      const userRole = session.user.role as UserRole;
      const allowCrossBranch = userRole === UserRole.ADMIN || userRole === UserRole.ACCOUNTING;
      applyBranchFilter(query, session.user, allowCrossBranch, 'branch');

      const skip = (page - 1) * limit;

      const [billingRecords, totalCount] = await Promise.all([
        Billing.find(query)
          .populate('patient', 'patientId firstName lastName phoneNumber email insurance')
          .populate('branch', 'name address city state phoneNumber email')
          .populate('createdBy', 'firstName lastName email role')
          .populate('approvedBy', 'firstName lastName email role')
          .populate('visit', 'visitNumber visitDate currentStage')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        Billing.countDocuments(query)
      ]);

      const pagination = buildPaginationResponse(page, totalCount, limit);

      return NextResponse.json({
        billingRecords,
        pagination
      });

    } catch (error: any) {
      console.error('Get billing records error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch billing records', message: error.message },
        { status: 500 }
      );
    }
  });
}
