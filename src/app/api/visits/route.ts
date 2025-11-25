import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import PatientVisit from '@/models/PatientVisit';
import Patient from '@/models/Patient';
import Appointment from '@/models/Appointment';
import { requireAuth, checkRole, UserRole } from '@/lib/middleware/auth';
import { 
  applyBranchFilter, 
  buildPaginationResponse 
} from '@/lib/utils/queryHelpers';
import { buildRoleScopedFilters } from '@/lib/utils/roleFilters';

export async function POST(req: NextRequest) {
  return checkRole([UserRole.ADMIN, UserRole.FRONT_DESK, UserRole.NURSE, UserRole.DOCTOR])(
    req,
    async (req: NextRequest, session: any) => {
      try {
        await dbConnect();

        const body = await req.json();

        const requiredFields = ['patient', 'branchId', 'visitDate'];

        const missingFields = requiredFields.filter(field => !body[field]);
        if (missingFields.length > 0) {
          return NextResponse.json(
            { error: `Missing required fields: ${missingFields.join(', ')}` },
            { status: 400 }
          );
        }

        const timestamp = Date.now();
        const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
        const visitNumber = `VIS-${timestamp}-${random}`;

        const visitData: any = {
          visitNumber,
          patient: body.patient,
          branchId: body.branchId,
          visitDate: new Date(body.visitDate),
          currentStage: 'front_desk',
          status: 'in_progress',
          stages: {
            frontDesk: {
              clockedInBy: session.user.id,
              clockedInAt: new Date()
            }
          }
        };

        if (body.appointment) {
          visitData.appointment = body.appointment;
          
          // Update appointment status to IN_PROGRESS
          await Appointment.findByIdAndUpdate(
            body.appointment,
            { status: 'IN_PROGRESS' },
            { new: true }
          );
        }

        const visit = await PatientVisit.create(visitData);

        const populatedVisit = await PatientVisit.findById(visit._id)
          .populate('patient', 'firstName lastName patientId phoneNumber')
          .populate('branchId', 'name address city state')
          .populate('appointment')
          .populate('stages.frontDesk.clockedInBy', 'firstName lastName')
          .lean();

        return NextResponse.json(
          {
            message: 'Visit created successfully',
            visit: populatedVisit
          },
          { status: 201 }
        );

      } catch (error: any) {
        console.error('Create visit error:', error);

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
          { error: 'Failed to create visit', message: error.message },
          { status: 500 }
        );
      }
    }
  );
}

export async function GET(req: NextRequest) {
  return requireAuth(req, async (req: NextRequest, session: any) => {
    try {
      await dbConnect();

      const { searchParams } = new URL(req.url);

      const page = parseInt(searchParams.get('page') || '1');
      const limit = parseInt(searchParams.get('limit') || '20');
      const search = searchParams.get('search') || '';
      const branchId = searchParams.get('branch');
      const patientId = searchParams.get('patient');
      const currentStage = searchParams.get('stage');
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
          { visitNumber: { $regex: search, $options: 'i' } },
          { patient: { $in: patientIds } }
        ];
      }

      if (branchId) {
        query.branchId = branchId;
      }

      if (patientId) {
        query.patient = patientId;
      }

      if (currentStage) {
        query.currentStage = currentStage;
      }

      if (status && ['in_progress', 'completed', 'cancelled'].includes(status)) {
        query.status = status;
      }

      if (dateFrom || dateTo) {
        query.visitDate = {};
        if (dateFrom) {
          query.visitDate.$gte = new Date(dateFrom);
        }
        if (dateTo) {
          query.visitDate.$lte = new Date(dateTo);
        }
      }

      const roleScopedFilters = buildRoleScopedFilters(session);
      if (roleScopedFilters.branchFilter) {
        Object.assign(query, roleScopedFilters.branchFilter);
      }

      const skip = (page - 1) * limit;

      const [visits, totalCount] = await Promise.all([
        PatientVisit.find(query)
          .populate('patient', 'firstName lastName patientId phoneNumber')
          .populate('branchId', 'name')
          .populate('appointment')
          .sort({ visitDate: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        PatientVisit.countDocuments(query)
      ]);

      const pagination = buildPaginationResponse(page, totalCount, limit);

      return NextResponse.json({
        visits,
        pagination
      });

    } catch (error: any) {
      console.error('Get visits error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch visits', message: error.message },
        { status: 500 }
      );
    }
  });
}
