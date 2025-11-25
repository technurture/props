import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import PatientVisit from '@/models/PatientVisit';
import LabTest from '@/models/LabTest';
import Patient from '@/models/Patient';
import User from '@/models/User';
import { checkRole, UserRole } from '@/lib/middleware/auth';

export async function POST(req: NextRequest) {
  return checkRole([UserRole.FRONT_DESK, UserRole.ADMIN])(
    req,
    async (req: NextRequest, session: any) => {
      try {
        await dbConnect();

        const body = await req.json();

        const requiredFields = [
          'patientId',
          'supervisingDoctorId',
          'testName',
          'testCategory'
        ];

        const missingFields = requiredFields.filter(field => !body[field]);
        if (missingFields.length > 0) {
          return NextResponse.json(
            { error: `Missing required fields: ${missingFields.join(', ')}` },
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

        const supervisingDoctor = await User.findOne({
          _id: body.supervisingDoctorId,
          role: UserRole.DOCTOR,
          isActive: true
        });
        if (!supervisingDoctor) {
          return NextResponse.json(
            { error: 'Supervising doctor not found or inactive' },
            { status: 404 }
          );
        }

        const branchId = session.user.branch?._id || session.user.branch;
        if (!branchId) {
          return NextResponse.json(
            { error: 'Branch ID is required' },
            { status: 400 }
          );
        }

        const visitCount = await PatientVisit.countDocuments();
        const visitNumber = `V${String(visitCount + 1).padStart(6, '0')}`;

        const visit = await PatientVisit.create({
          visitNumber,
          patient: body.patientId,
          assignedDoctor: body.supervisingDoctorId,
          supervisingDoctor: body.supervisingDoctorId,
          branchId,
          visitDate: new Date(),
          visitType: 'lab_only',
          labOnly: true,
          currentStage: 'lab',
          status: 'in_progress',
          stages: {
            frontDesk: {
              clockedInBy: session.user.id,
              clockedInAt: new Date(),
              notes: body.frontDeskNotes || 'Lab-only visit - Direct lab test request',
              nextAction: 'lab'
            },
            lab: {
              clockedInBy: session.user.id,
              clockedInAt: new Date(),
              notes: 'Auto-clocked in for lab-only visit'
            }
          }
        });

        const testCount = await LabTest.countDocuments();
        const testNumber = `TE${String(testCount + 1).padStart(6, '0')}`;

        const labTest = await LabTest.create({
          testNumber,
          patient: body.patientId,
          doctor: body.supervisingDoctorId,
          visit: visit._id,
          branchId,
          testName: body.testName,
          testCategory: body.testCategory,
          description: body.description || '',
          priority: body.priority || 'routine',
          requestedBy: session.user.id,
          requestedAt: new Date(),
          status: 'pending'
        });

        const populatedVisit = await PatientVisit.findById(visit._id)
          .populate('patient', 'firstName lastName patientId phoneNumber')
          .populate('supervisingDoctor', 'firstName lastName')
          .populate('branchId', 'name');

        const populatedLabTest = await LabTest.findById(labTest._id)
          .populate('patient', 'firstName lastName patientId phoneNumber')
          .populate('doctor', 'firstName lastName')
          .populate('branchId', 'name')
          .populate('requestedBy', 'firstName lastName');

        return NextResponse.json(
          {
            message: 'Lab-only visit created successfully',
            visit: populatedVisit,
            labTest: populatedLabTest
          },
          { status: 201 }
        );

      } catch (error: any) {
        console.error('Create lab-only visit error:', error);

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
          { error: 'Failed to create lab-only visit', message: error.message },
          { status: 500 }
        );
      }
    }
  );
}
