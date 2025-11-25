import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import PatientVisit from '@/models/PatientVisit';
import Appointment from '@/models/Appointment';
import { checkRole, UserRole } from '@/lib/middleware/auth';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return checkRole([UserRole.ADMIN, UserRole.FRONT_DESK, UserRole.BILLING])(
    req,
    async (req: NextRequest, session: any) => {
      try {
        await dbConnect();

        const { id } = await params;
        const visitId = id;

        if (!visitId) {
          return NextResponse.json(
            { error: 'Visit ID is required' },
            { status: 400 }
          );
        }

        const visit = await PatientVisit.findById(visitId);

        if (!visit) {
          return NextResponse.json(
            { error: 'Visit not found' },
            { status: 404 }
          );
        }

        // Update visit status to completed (if not already)
        visit.status = 'completed';
        visit.currentStage = 'completed';

        // Add final checkout information
        visit.finalClockOut = {
          clockedOutBy: session.user.id,
          clockedOutAt: new Date()
        };

        await visit.save();

        // Update appointment status to COMPLETED
        if (visit.appointment) {
          await Appointment.findByIdAndUpdate(
            visit.appointment,
            { status: 'COMPLETED' },
            { new: true }
          );
        }

        const populatedVisit = await PatientVisit.findById(visitId)
          .populate('patient', 'firstName lastName patientId')
          .populate('branchId', 'name')
          .populate('appointment')
          .lean();

        return NextResponse.json({
          message: 'Patient checked out successfully',
          visit: populatedVisit
        });

      } catch (error: any) {
        console.error('Checkout error:', error);
        return NextResponse.json(
          { error: 'Failed to check out patient', message: error.message },
          { status: 500 }
        );
      }
    }
  );
}
