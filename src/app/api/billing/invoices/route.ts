import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Invoice, { InvoiceStatus } from '@/models/Invoice';
import Patient from '@/models/Patient';
import { requireAuth, checkRole, UserRole } from '@/lib/middleware/auth';
import { 
  applyBranchFilter, 
  buildPaginationResponse 
} from '@/lib/utils/queryHelpers';

export async function POST(req: NextRequest) {
  return checkRole([UserRole.BILLING, UserRole.ADMIN, UserRole.FRONT_DESK])(
    req,
    async (req: NextRequest, session: any) => {
      try {
        await dbConnect();

        const body = await req.json();

        const requiredFields = [
          'patientId',
          'branchId',
          'items',
          'subtotal',
          'grandTotal'
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
            { error: 'At least one invoice item is required' },
            { status: 400 }
          );
        }

        const patient = await Patient.findById(body.patientId);
        if (!patient) {
          return NextResponse.json(
            { error: 'Patient not found' },
            { status: 404 }
          );
        }

        let finalGrandTotal = body.grandTotal;
        let insuranceClaim = body.insuranceClaim;

        if (patient.insurance && body.applyInsurance) {
          const insuranceDeduction = body.insuranceDeduction || 0;
          finalGrandTotal = Math.max(0, body.grandTotal - insuranceDeduction);
          
          insuranceClaim = {
            provider: patient.insurance.provider,
            claimNumber: body.insuranceClaim?.claimNumber || `CLM-${Date.now()}`,
            claimAmount: insuranceDeduction,
            status: 'PENDING'
          };
        }

        const invoiceData = {
          patientId: body.patientId,
          encounterId: body.encounterId,
          branchId: body.branchId,
          items: body.items,
          subtotal: body.subtotal,
          tax: body.tax || 0,
          discount: body.discount || 0,
          grandTotal: finalGrandTotal,
          status: InvoiceStatus.PENDING,
          paidAmount: 0,
          balance: finalGrandTotal,
          insuranceClaim: insuranceClaim,
          generatedBy: session.user.id
        };

        const invoice = await Invoice.create(invoiceData);

        const populatedInvoice = await Invoice.findById(invoice._id)
          .populate('patientId', 'patientId firstName lastName phoneNumber email insurance')
          .populate('branchId', 'name address city state')
          .populate('generatedBy', 'firstName lastName email');

        return NextResponse.json(
          {
            message: 'Invoice created successfully',
            invoice: populatedInvoice
          },
          { status: 201 }
        );

      } catch (error: any) {
        console.error('Create invoice error:', error);

        if (error.name === 'ValidationError') {
          const validationErrors = Object.keys(error.errors).map(
            key => error.errors[key].message
          );
          return NextResponse.json(
            { error: 'Validation error', details: validationErrors },
            { status: 400 }
          );
        }

        return NextResponse.json(
          { error: 'Failed to create invoice', message: error.message },
          { status: 500 }
        );
      }
    }
  );
}

export async function GET(req: NextRequest) {
  return checkRole([UserRole.BILLING, UserRole.ACCOUNTING, UserRole.ADMIN, UserRole.FRONT_DESK])(req, async (req: NextRequest, session: any) => {
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
          { patientId: { $in: patientIds } },
          { invoiceNumber: { $regex: search, $options: 'i' } }
        ];
      }

      if (patientId) {
        query.patientId = patientId;
      }

      if (branchId) {
        query.branchId = branchId;
      }

      if (status) {
        if (status === 'paid') {
          query.status = InvoiceStatus.PAID;
        } else if (status === 'unpaid') {
          query.status = InvoiceStatus.PENDING;
        } else if (status === 'partial') {
          query.status = InvoiceStatus.PARTIALLY_PAID;
        } else {
          query.status = status.toUpperCase();
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

      const allowCrossBranch = true;
      applyBranchFilter(query, session.user, allowCrossBranch);

      const skip = (page - 1) * limit;

      const [invoices, totalCount] = await Promise.all([
        Invoice.find(query)
          .populate('patientId', 'patientId firstName lastName phoneNumber email insurance')
          .populate('branchId', 'name address city state')
          .populate('generatedBy', 'firstName lastName email')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        Invoice.countDocuments(query)
      ]);

      const pagination = buildPaginationResponse(page, totalCount, limit);

      return NextResponse.json({
        invoices,
        pagination
      });

    } catch (error: any) {
      console.error('Get invoices error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch invoices', message: error.message },
        { status: 500 }
      );
    }
  });
}
