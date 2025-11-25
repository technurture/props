import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Admission, { AdmissionStatus } from '@/models/Admission';
import Patient from '@/models/Patient';
import PatientVisit from '@/models/PatientVisit';
import User from '@/models/User';
import { requireAuth, checkRole, UserRole } from '@/lib/middleware/auth';
import { buildPaginationResponse } from '@/lib/utils/queryHelpers';
import { buildRoleScopedFilters } from '@/lib/utils/roleFilters';

export async function POST(req: NextRequest) {
  return checkRole([UserRole.DOCTOR, UserRole.ADMIN])(
    req,
    async (req: NextRequest, session: any) => {
      try {
        await dbConnect();

        const body = await req.json();

        const requiredFields = [
          'admissionNumber',
          'patientId',
          'branchId',
          'type',
          'admittingDoctorId',
          'primaryDoctorId',
          'admissionReason'
        ];

        const missingFields = requiredFields.filter(field => !body[field]);
        if (missingFields.length > 0) {
          return NextResponse.json(
            { error: `Missing required fields: ${missingFields.join(', ')}` },
            { status: 400 }
          );
        }

        const existingAdmission = await Admission.findOne({
          admissionNumber: body.admissionNumber.toUpperCase()
        });
        if (existingAdmission) {
          return NextResponse.json(
            { error: 'Admission number already exists' },
            { status: 409 }
          );
        }

        const patient = await Patient.findById(body.patientId);
        if (!patient) {
          return NextResponse.json(
            { error: 'Patient not found' },
            { status: 404 }
          );
        }

        const activeAdmission = await Admission.findOne({
          patientId: body.patientId,
          status: AdmissionStatus.ADMITTED
        });
        if (activeAdmission) {
          return NextResponse.json(
            { error: 'Patient already has an active admission' },
            { status: 409 }
          );
        }

        const admittingDoctor = await User.findById(body.admittingDoctorId);
        if (!admittingDoctor) {
          return NextResponse.json(
            { error: 'Admitting doctor not found' },
            { status: 404 }
          );
        }
        if (admittingDoctor.role !== UserRole.DOCTOR) {
          return NextResponse.json(
            { error: 'Admitting doctor must have DOCTOR role' },
            { status: 400 }
          );
        }

        const primaryDoctor = await User.findById(body.primaryDoctorId);
        if (!primaryDoctor) {
          return NextResponse.json(
            { error: 'Primary doctor not found' },
            { status: 404 }
          );
        }
        if (primaryDoctor.role !== UserRole.DOCTOR) {
          return NextResponse.json(
            { error: 'Primary doctor must have DOCTOR role' },
            { status: 400 }
          );
        }

        const admissionData = {
          admissionNumber: body.admissionNumber.toUpperCase(),
          patientId: body.patientId,
          branchId: body.branchId,
          visitId: body.visitId,
          admissionDate: body.admissionDate ? new Date(body.admissionDate) : new Date(),
          expectedDischargeDate: body.expectedDischargeDate ? new Date(body.expectedDischargeDate) : undefined,
          status: AdmissionStatus.ADMITTED,
          type: body.type,
          admittingDoctorId: body.admittingDoctorId,
          primaryDoctorId: body.primaryDoctorId,
          ward: body.ward,
          room: body.room,
          bed: body.bed,
          admissionReason: body.admissionReason,
          diagnosis: body.diagnosis,
          treatmentPlan: body.treatmentPlan,
          dailyRate: body.dailyRate,
          createdBy: session.user.id
        };

        const admission = await Admission.create(admissionData);

        if (body.visitId) {
          await PatientVisit.findByIdAndUpdate(
            body.visitId,
            {
              visitType: 'inpatient',
              admissionId: admission._id
            }
          );
        }

        const populatedAdmission = await Admission.findById(admission._id)
          .populate('patientId', 'patientId firstName lastName phoneNumber email')
          .populate('admittingDoctorId', 'firstName lastName email role')
          .populate('primaryDoctorId', 'firstName lastName email role')
          .populate('branchId', 'name address city state')
          .populate('createdBy', 'firstName lastName email');

        return NextResponse.json(
          {
            message: 'Admission created successfully',
            admission: populatedAdmission
          },
          { status: 201 }
        );

      } catch (error: any) {
        console.error('Create admission error:', error);

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
          { error: 'Failed to create admission', message: error.message },
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
      const sortBy = searchParams.get('sortBy') || 'newest';
      const patientId = searchParams.get('patient');
      const doctorId = searchParams.get('doctor');
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
          { admissionNumber: { $regex: search, $options: 'i' } }
        ];
      }

      if (patientId) {
        query.patientId = patientId;
      }

      if (doctorId) {
        query.$or = [
          { admittingDoctorId: doctorId },
          { primaryDoctorId: doctorId }
        ];
      }

      if (branchId) {
        query.branchId = branchId;
      }

      if (status) {
        query.status = status.toUpperCase();
      }

      if (dateFrom || dateTo) {
        query.admissionDate = {};
        if (dateFrom) {
          query.admissionDate.$gte = new Date(dateFrom);
        }
        if (dateTo) {
          query.admissionDate.$lte = new Date(dateTo);
        }
      }

      const roleScopedFilters = buildRoleScopedFilters(session);
      if (roleScopedFilters.admissionFilter) {
        Object.assign(query, roleScopedFilters.admissionFilter);
      }

      const skip = (page - 1) * limit;

      const sortOptions: any = {};
      if (sortBy === 'oldest') {
        sortOptions.admissionDate = 1;
      } else {
        sortOptions.admissionDate = -1;
      }

      const [admissions, totalCount] = await Promise.all([
        Admission.find(query)
          .populate('patientId', 'patientId firstName lastName phoneNumber email dateOfBirth gender')
          .populate('admittingDoctorId', 'firstName lastName email role')
          .populate('primaryDoctorId', 'firstName lastName email role')
          .populate('branchId', 'name address city state')
          .populate('createdBy', 'firstName lastName email')
          .sort(sortOptions)
          .skip(skip)
          .limit(limit)
          .lean(),
        Admission.countDocuments(query)
      ]);

      const pagination = buildPaginationResponse(page, totalCount, limit);

      return NextResponse.json({
        admissions,
        pagination: {
          ...pagination,
          currentPage: page,
          totalPages: pagination.totalPages,
          totalCount,
          limit,
          hasNextPage: pagination.hasNextPage,
          hasPrevPage: pagination.hasPrevPage
        }
      });

    } catch (error: any) {
      console.error('Get admissions error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch admissions', message: error.message },
        { status: 500 }
      );
    }
  });
}
