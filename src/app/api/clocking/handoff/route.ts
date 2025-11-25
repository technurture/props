import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import PatientVisit from '@/models/PatientVisit';
import Appointment from '@/models/Appointment';
import User from '@/models/User';
import { requireAuth, UserRole } from '@/lib/middleware/auth';
import { sendBulkNotifications, createInAppNotification } from '@/lib/services/notification';
import { generateInvoiceFromVisit, checkExistingInvoice } from '@/lib/services/invoiceService';

const DEFAULT_STAGE_WORKFLOW: Record<string, string> = {
  'front_desk': 'nurse',
  'nurse': 'returned_to_front_desk',
  'doctor': 'lab',
  'lab': 'pharmacy',
  'pharmacy': 'billing',
  'billing': 'returned_to_front_desk',
  'returned_to_front_desk': 'doctor'
};

const ROLE_TO_STAGE: Record<string, string> = {
  [UserRole.FRONT_DESK]: 'front_desk',
  [UserRole.NURSE]: 'nurse',
  [UserRole.DOCTOR]: 'doctor',
  [UserRole.LAB]: 'lab',
  [UserRole.PHARMACY]: 'pharmacy',
  [UserRole.BILLING]: 'billing'
};

const STAGE_TO_ROLE: Record<string, UserRole> = {
  'front_desk': UserRole.FRONT_DESK,
  'nurse': UserRole.NURSE,
  'doctor': UserRole.DOCTOR,
  'lab': UserRole.LAB,
  'pharmacy': UserRole.PHARMACY,
  'billing': UserRole.BILLING,
  'returned_to_front_desk': UserRole.FRONT_DESK
};

const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  'front_desk': ['nurse', 'lab', 'pharmacy'],
  'nurse': ['doctor', 'returned_to_front_desk'],
  'doctor': ['nurse', 'lab', 'pharmacy', 'billing'],
  'lab': ['doctor', 'pharmacy', 'billing'],
  'pharmacy': ['billing'],
  'billing': ['returned_to_front_desk'],
  'returned_to_front_desk': ['doctor', 'nurse', 'lab', 'pharmacy', 'billing', 'completed']
};

function getStageFieldName(stage: string): string {
  const stageMap: Record<string, string> = {
    'front_desk': 'frontDesk',
    'nurse': 'nurse',
    'doctor': 'doctor',
    'lab': 'lab',
    'pharmacy': 'pharmacy',
    'billing': 'billing',
    'returned_to_front_desk': 'returnedToFrontDesk'
  };
  return stageMap[stage] || stage;
}

export async function POST(req: NextRequest) {
  return requireAuth(req, async (req: NextRequest, session: any) => {
    try {
      await dbConnect();

      const body = await req.json();

      if (!body.visitId) {
        return NextResponse.json(
          { error: 'Visit ID is required' },
          { status: 400 }
        );
      }

      const visit = await PatientVisit.findById(body.visitId)
        .populate('patient', 'patientId firstName lastName phoneNumber email');

      if (!visit) {
        return NextResponse.json(
          { error: 'Visit not found' },
          { status: 404 }
        );
      }

      if (visit.status !== 'in_progress') {
        return NextResponse.json(
          { error: 'Visit is not in progress' },
          { status: 400 }
        );
      }

      const userRole = session.user.role as UserRole;

      const currentStage = visit.currentStage;
      let nextStage = body.targetStage || DEFAULT_STAGE_WORKFLOW[currentStage as keyof typeof DEFAULT_STAGE_WORKFLOW];
      
      if (visit.labOnly && currentStage === 'lab' && !body.targetStage) {
        nextStage = 'billing';
      }
      
      if (!nextStage) {
        return NextResponse.json(
          { error: 'Invalid current stage or workflow' },
          { status: 400 }
        );
      }

      const allowedNextStages = ALLOWED_TRANSITIONS[currentStage] || [];
      if (!allowedNextStages.includes(nextStage)) {
        return NextResponse.json(
          { error: `Cannot transition from ${currentStage} to ${nextStage}. Allowed transitions: ${allowedNextStages.join(', ')}` },
          { status: 400 }
        );
      }

      const currentStageField = getStageFieldName(visit.currentStage);
      const updateData: any = {
        [`stages.${currentStageField}.clockedOutBy`]: session.user.id,
        [`stages.${currentStageField}.clockedOutAt`]: new Date()
      };

      if (nextStage === 'completed') {
        updateData.currentStage = 'completed';
        updateData.status = 'completed';
      } else {
        updateData.currentStage = nextStage;
        
        // Clear clock-in/out data for destination stage to allow staff to clock in again
        // when patient is sent back to a stage they've already visited
        const nextStageField = getStageFieldName(nextStage);
        updateData[`stages.${nextStageField}.clockedInAt`] = null;
        updateData[`stages.${nextStageField}.clockedInBy`] = null;
        updateData[`stages.${nextStageField}.clockedOutAt`] = null;
        updateData[`stages.${nextStageField}.clockedOutBy`] = null;
      }

      if (body.notes) {
        updateData[`stages.${currentStageField}.notes`] = body.notes;
      }

      if (body.nextAction) {
        updateData[`stages.${currentStageField}.nextAction`] = body.nextAction;
      }

      if (body.vitalSigns && currentStageField === 'nurse') {
        updateData[`stages.nurse.vitalSigns`] = body.vitalSigns;
      }

      if (body.diagnosis && currentStageField === 'doctor') {
        updateData[`stages.doctor.diagnosis`] = body.diagnosis;
      }

      if (nextStage !== 'completed') {
        const nextRole = STAGE_TO_ROLE[nextStage];
        if (nextRole) {
          const visitBranchId = typeof visit.branchId === 'object' && visit.branchId?._id 
            ? visit.branchId._id.toString() 
            : visit.branchId?.toString();
          
          const nextStaffMembers = await User.find({
            role: nextRole,
            branchId: visitBranchId,
            isActive: true
          });

          if (nextStaffMembers.length > 0) {
            const notifications = nextStaffMembers.map(staff => ({
              recipient: staff.email,
              subject: `New Patient Handoff - ${(visit.patient as any).firstName} ${(visit.patient as any).lastName}`,
              message: `A patient has been handed off to ${nextRole}.\n\nVisit Number: ${visit.visitNumber}\nPatient: ${(visit.patient as any).firstName} ${(visit.patient as any).lastName}\nStage: ${nextStage}\n\nPlease attend to the patient.`,
              type: 'email' as const
            }));

            await sendBulkNotifications(notifications);

            for (const staff of nextStaffMembers) {
              await createInAppNotification({
                recipientId: staff._id.toString(),
                branchId: visitBranchId,
                title: `New Patient in ${nextStage.replace('_', ' ').toUpperCase()} Queue`,
                message: `${(visit.patient as any).firstName} ${(visit.patient as any).lastName} (${visit.visitNumber}) has been handed off to your department.`,
                type: 'info',
                relatedModel: 'PatientVisit',
                relatedId: visit._id.toString(),
                actionUrl: `/visits/${visit._id}`,
                senderId: session.user.id
              });
            }
          }
        }
      }

      // Update appointment status to COMPLETED when visit is completed via handoff
      if (nextStage === 'completed' && visit.appointment) {
        await Appointment.findByIdAndUpdate(
          visit.appointment,
          { status: 'COMPLETED' },
          { new: true }
        );
      }

      const updatedVisit = await PatientVisit.findByIdAndUpdate(
        body.visitId,
        updateData,
        { new: true }
      )
        .populate('patient', 'patientId firstName lastName phoneNumber email dateOfBirth gender')
        .populate('appointment')
        .populate('branchId', 'name address city state')
        .populate('stages.frontDesk.clockedInBy', 'firstName lastName email role')
        .populate('stages.frontDesk.clockedOutBy', 'firstName lastName email role')
        .populate('stages.nurse.clockedInBy', 'firstName lastName email role')
        .populate('stages.nurse.clockedOutBy', 'firstName lastName email role')
        .populate('stages.doctor.clockedInBy', 'firstName lastName email role')
        .populate('stages.doctor.clockedOutBy', 'firstName lastName email role')
        .populate('stages.lab.clockedInBy', 'firstName lastName email role')
        .populate('stages.lab.clockedOutBy', 'firstName lastName email role')
        .populate('stages.pharmacy.clockedInBy', 'firstName lastName email role')
        .populate('stages.pharmacy.clockedOutBy', 'firstName lastName email role')
        .populate('stages.billing.clockedInBy', 'firstName lastName email role')
        .populate('stages.billing.clockedOutBy', 'firstName lastName email role')
        .populate('stages.returnedToFrontDesk.clockedInBy', 'firstName lastName email role')
        .populate('stages.returnedToFrontDesk.clockedOutBy', 'firstName lastName email role');

      let autoGeneratedInvoice = null;
      if (nextStage === 'billing' && body.autoGenerateInvoice !== false) {
        try {
          const existingInvoice = await checkExistingInvoice(body.visitId);
          if (!existingInvoice) {
            autoGeneratedInvoice = await generateInvoiceFromVisit(
              body.visitId,
              session.user.id,
              body.pricing || {}
            );
          } else {
            autoGeneratedInvoice = existingInvoice;
          }
        } catch (invoiceError: any) {
          console.error('Auto-generate invoice error (non-blocking):', invoiceError);
        }
      }

      const responseMessage = nextStage === 'completed' 
        ? 'Visit completed successfully'
        : `Patient handed off to ${nextStage.replace('_', ' ')} successfully`;
      
      const response: any = {
        message: responseMessage,
        visit: updatedVisit
      };

      if (autoGeneratedInvoice) {
        response.invoice = autoGeneratedInvoice;
        response.message += '. Invoice automatically generated.';
      }

      return NextResponse.json(response, { status: 200 });

    } catch (error: any) {
      console.error('Handoff error:', error);
      return NextResponse.json(
        { error: 'Failed to hand off patient', message: error.message },
        { status: 500 }
      );
    }
  });
}
