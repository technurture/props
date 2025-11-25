import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import PatientVisit from '@/models/PatientVisit';
import Patient from '@/models/Patient';
import { checkRole, UserRole } from '@/lib/middleware/auth';
import { addConsultationFeeToVisit } from '@/lib/services/billingService';

async function generateVisitNumber(): Promise<string> {
  const today = new Date();
  const year = today.getFullYear().toString().slice(-2);
  const month = (today.getMonth() + 1).toString().padStart(2, '0');
  const day = today.getDate().toString().padStart(2, '0');
  
  const prefix = `V${year}${month}${day}`;
  
  const lastVisit = await PatientVisit.findOne({
    visitNumber: new RegExp(`^${prefix}`)
  }).sort({ visitNumber: -1 });
  
  let sequence = 1;
  if (lastVisit) {
    const lastSequence = parseInt(lastVisit.visitNumber.slice(-4));
    sequence = lastSequence + 1;
  }
  
  return `${prefix}${sequence.toString().padStart(4, '0')}`;
}

export async function POST(req: NextRequest) {
  return checkRole([UserRole.FRONT_DESK, UserRole.ADMIN])(
    req,
    async (req: NextRequest, session: any) => {
      try {
        await dbConnect();

        const body = await req.json();

        if (!body.patientId) {
          return NextResponse.json(
            { error: 'Patient ID is required' },
            { status: 400 }
          );
        }

        if (!body.branchId) {
          return NextResponse.json(
            { error: 'Branch ID is required' },
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

        const existingActiveVisit = await PatientVisit.findOne({
          patient: body.patientId,
          status: 'in_progress'
        });

        if (existingActiveVisit) {
          return NextResponse.json(
            { 
              error: 'Patient already has an active visit',
              visitNumber: existingActiveVisit.visitNumber 
            },
            { status: 409 }
          );
        }

        const visitNumber = await generateVisitNumber();

        let assignedDoctor = body.assignedDoctor;

        if (body.appointmentId && !assignedDoctor) {
          const Appointment = (await import('@/models/Appointment')).default;
          const appointment = await Appointment.findById(body.appointmentId);
          if (appointment && appointment.doctorId) {
            assignedDoctor = appointment.doctorId;
          }
        }

        const visitData = {
          visitNumber,
          patient: body.patientId,
          appointment: body.appointmentId,
          assignedDoctor,
          branchId: body.branchId,
          visitDate: new Date(),
          currentStage: 'front_desk',
          status: 'in_progress',
          stages: {
            frontDesk: {
              clockedInBy: session.user.id,
              clockedInAt: new Date(),
              notes: body.notes || '',
              nextAction: body.nextAction || 'Patient checked in, awaiting nurse'
            }
          }
        };

        const visit = await PatientVisit.create(visitData);

        const populatedVisit = await PatientVisit.findById(visit._id)
          .populate('patient', 'patientId firstName lastName phoneNumber email dateOfBirth gender')
          .populate('appointment')
          .populate('assignedDoctor', 'firstName lastName email role')
          .populate('branchId', 'name address city state')
          .populate('stages.frontDesk.clockedInBy', 'firstName lastName email role');

        if (assignedDoctor) {
          const consultationResult = await addConsultationFeeToVisit(
            visit._id.toString(),
            body.branchId,
            body.patientId,
            session.user.id
          );

          if (!consultationResult.success) {
            console.warn('Failed to add consultation fee:', consultationResult.message);
          }
        }

        return NextResponse.json(
          {
            message: 'Patient clocked in successfully',
            visit: populatedVisit
          },
          { status: 201 }
        );

      } catch (error: any) {
        console.error('Clock-in error:', error);

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
          { error: 'Failed to clock in patient', message: error.message },
          { status: 500 }
        );
      }
    }
  );
}
