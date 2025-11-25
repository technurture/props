import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import PatientVisit from '@/models/PatientVisit';
import { requireAuth } from '@/lib/middleware/auth';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ visitId: string }> }
) {
  return requireAuth(req, async (_req: NextRequest, _session: any) => {
    try {
      await dbConnect();

      const { visitId } = await params;

      if (!visitId) {
        return NextResponse.json(
          { error: 'Visit ID is required' },
          { status: 400 }
        );
      }

      const visit = await PatientVisit.findById(visitId)
        .populate('patient', 'patientId firstName lastName phoneNumber email dateOfBirth gender bloodGroup allergies chronicConditions')
        .populate('appointment', 'appointmentNumber reasonForVisit appointmentDate appointmentTime')
        .populate('branch', 'name address city state')
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
        .populate('finalClockOut.clockedOutBy', 'firstName lastName email role')
        .lean() as any;

      if (!visit) {
        return NextResponse.json(
          { error: 'Visit not found' },
          { status: 404 }
        );
      }

      const timeline = [];
      
      if (visit.stages?.frontDesk?.clockedInAt) {
        timeline.push({
          stage: 'Front Desk',
          action: 'Clocked In',
          timestamp: visit.stages.frontDesk.clockedInAt,
          staff: visit.stages.frontDesk.clockedInBy,
          notes: visit.stages.frontDesk.notes,
          nextAction: visit.stages.frontDesk.nextAction
        });
        if (visit.stages.frontDesk.clockedOutAt) {
          timeline.push({
            stage: 'Front Desk',
            action: 'Clocked Out',
            timestamp: visit.stages.frontDesk.clockedOutAt,
            staff: visit.stages.frontDesk.clockedOutBy
          });
        }
      }

      if (visit.stages?.nurse?.clockedInAt) {
        timeline.push({
          stage: 'Nurse',
          action: 'Clocked In',
          timestamp: visit.stages.nurse.clockedInAt,
          staff: visit.stages.nurse.clockedInBy,
          vitalSigns: visit.stages.nurse.vitalSigns,
          notes: visit.stages.nurse.notes,
          nextAction: visit.stages.nurse.nextAction
        });
        if (visit.stages.nurse.clockedOutAt) {
          timeline.push({
            stage: 'Nurse',
            action: 'Clocked Out',
            timestamp: visit.stages.nurse.clockedOutAt,
            staff: visit.stages.nurse.clockedOutBy
          });
        }
      }

      if (visit.stages?.doctor?.clockedInAt) {
        timeline.push({
          stage: 'Doctor',
          action: 'Clocked In',
          timestamp: visit.stages.doctor.clockedInAt,
          staff: visit.stages.doctor.clockedInBy,
          diagnosis: visit.stages.doctor.diagnosis,
          notes: visit.stages.doctor.notes,
          nextAction: visit.stages.doctor.nextAction
        });
        if (visit.stages.doctor.clockedOutAt) {
          timeline.push({
            stage: 'Doctor',
            action: 'Clocked Out',
            timestamp: visit.stages.doctor.clockedOutAt,
            staff: visit.stages.doctor.clockedOutBy
          });
        }
      }

      if (visit.stages?.lab?.clockedInAt) {
        timeline.push({
          stage: 'Lab',
          action: 'Clocked In',
          timestamp: visit.stages.lab.clockedInAt,
          staff: visit.stages.lab.clockedInBy,
          notes: visit.stages.lab.notes,
          nextAction: visit.stages.lab.nextAction
        });
        if (visit.stages.lab.clockedOutAt) {
          timeline.push({
            stage: 'Lab',
            action: 'Clocked Out',
            timestamp: visit.stages.lab.clockedOutAt,
            staff: visit.stages.lab.clockedOutBy
          });
        }
      }

      if (visit.stages?.pharmacy?.clockedInAt) {
        timeline.push({
          stage: 'Pharmacy',
          action: 'Clocked In',
          timestamp: visit.stages.pharmacy.clockedInAt,
          staff: visit.stages.pharmacy.clockedInBy,
          notes: visit.stages.pharmacy.notes,
          nextAction: visit.stages.pharmacy.nextAction
        });
        if (visit.stages.pharmacy.clockedOutAt) {
          timeline.push({
            stage: 'Pharmacy',
            action: 'Clocked Out',
            timestamp: visit.stages.pharmacy.clockedOutAt,
            staff: visit.stages.pharmacy.clockedOutBy
          });
        }
      }

      if (visit.stages?.billing?.clockedInAt) {
        timeline.push({
          stage: 'Billing',
          action: 'Clocked In',
          timestamp: visit.stages.billing.clockedInAt,
          staff: visit.stages.billing.clockedInBy,
          notes: visit.stages.billing.notes,
          nextAction: visit.stages.billing.nextAction
        });
        if (visit.stages.billing.clockedOutAt) {
          timeline.push({
            stage: 'Billing',
            action: 'Clocked Out',
            timestamp: visit.stages.billing.clockedOutAt,
            staff: visit.stages.billing.clockedOutBy
          });
        }
      }

      if (visit.finalClockOut?.clockedOutAt) {
        timeline.push({
          stage: 'Final Clock Out',
          action: 'Visit Completed',
          timestamp: visit.finalClockOut.clockedOutAt,
          staff: visit.finalClockOut.clockedOutBy,
          notes: visit.finalClockOut.notes
        });
      }

      timeline.sort((a, b) => 
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );

      return NextResponse.json({
        visit,
        timeline
      });

    } catch (error: any) {
      console.error('Get visit error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch visit', message: error.message },
        { status: 500 }
      );
    }
  });
}
