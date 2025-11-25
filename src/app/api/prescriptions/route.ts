import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Prescription from '@/models/Prescription';
import Patient from '@/models/Patient';
import { requireAuth, checkRole, UserRole } from '@/lib/middleware/auth';
import { 
  applyBranchFilter, 
  buildPaginationResponse 
} from '@/lib/utils/queryHelpers';

export async function POST(req: NextRequest) {
  return checkRole([UserRole.DOCTOR, UserRole.ADMIN])(
    req,
    async (req: NextRequest, _session: any) => {
      try {
        await dbConnect();

        const body = await req.json();

        const requiredFields = [
          'patient',
          'doctor',
          'visit',
          'branchId',
          'medications',
          'diagnosis'
        ];

        const missingFields = requiredFields.filter(field => !body[field]);
        if (missingFields.length > 0) {
          return NextResponse.json(
            { error: `Missing required fields: ${missingFields.join(', ')}` },
            { status: 400 }
          );
        }

        if (!Array.isArray(body.medications) || body.medications.length === 0) {
          return NextResponse.json(
            { error: 'At least one medication is required' },
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

        const prescriptionCount = await Prescription.countDocuments();
        const prescriptionNumber = `RX${String(prescriptionCount + 1).padStart(6, '0')}`;

        const prescriptionData = {
          prescriptionNumber,
          patient: body.patient,
          doctor: body.doctor,
          visit: body.visit,
          branchId: body.branchId || body.branch,
          medications: body.medications,
          diagnosis: body.diagnosis,
          notes: body.notes,
          status: 'active'
        };

        const prescription = await Prescription.create(prescriptionData);

        const populatedPrescription = await Prescription.findById(prescription._id)
          .populate('patient', 'firstName lastName patientId phoneNumber')
          .populate('doctor', 'firstName lastName')
          .populate('branchId', 'name')
          .populate('visit');

        return NextResponse.json(
          {
            message: 'Prescription created successfully',
            prescription: populatedPrescription
          },
          { status: 201 }
        );

      } catch (error: any) {
        console.error('Create prescription error:', error);

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
          { error: 'Failed to create prescription', message: error.message },
          { status: 500 }
        );
      }
    }
  );
}

export async function GET(req: NextRequest) {
  return checkRole([UserRole.DOCTOR, UserRole.PHARMACY, UserRole.NURSE, UserRole.ADMIN])(req, async (req: NextRequest, session: any) => {
    try {
      await dbConnect();

      const { searchParams } = new URL(req.url);

      const page = parseInt(searchParams.get('page') || '1');
      const limit = parseInt(searchParams.get('limit') || '20');
      const search = searchParams.get('search') || '';
      const branchId = searchParams.get('branch');
      const patientId = searchParams.get('patient');
      const doctorId = searchParams.get('doctor');
      const visitId = searchParams.get('visit');
      const status = searchParams.get('status');

      const query: any = {};

      if (search) {
        query.$or = [
          { prescriptionNumber: { $regex: search, $options: 'i' } },
          { diagnosis: { $regex: search, $options: 'i' } }
        ];
      }

      if (branchId) {
        query.branchId = branchId;
      }

      if (patientId) {
        query.patient = patientId;
      }

      if (doctorId) {
        query.doctor = doctorId;
      }

      if (visitId) {
        query.visit = visitId;
      }

      if (status && ['active', 'dispensed', 'cancelled'].includes(status)) {
        query.status = status;
      }

      if (session.user.role === 'DOCTOR') {
        query.doctor = session.user.id;
      }

      if (session.user.role === 'PHARMACY') {
        query.status = 'active';
      }

      const allowCrossBranch = true;
      applyBranchFilter(query, session.user, allowCrossBranch);

      const skip = (page - 1) * limit;

      const [prescriptions, totalCount] = await Promise.all([
        Prescription.find(query)
          .populate('patient', 'firstName lastName patientId phoneNumber')
          .populate('doctor', 'firstName lastName')
          .populate('branchId', 'name')
          .populate('visit')
          .populate('dispensedBy', 'firstName lastName')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        Prescription.countDocuments(query)
      ]);

      const pagination = buildPaginationResponse(page, totalCount, limit);

      return NextResponse.json({
        prescriptions,
        pagination
      });

    } catch (error: any) {
      console.error('Get prescriptions error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch prescriptions', message: error.message },
        { status: 500 }
      );
    }
  });
}
