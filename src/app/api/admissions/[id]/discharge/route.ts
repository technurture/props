import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Admission, { AdmissionStatus } from '@/models/Admission';
import PatientVisit from '@/models/PatientVisit';
import { checkRole, UserRole } from '@/lib/middleware/auth';
import { canAccessResource } from '@/lib/utils/queryHelpers';
import mongoose from 'mongoose';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return checkRole([UserRole.DOCTOR, UserRole.ADMIN])(
    req,
    async (req: NextRequest, session: any) => {
      try {
        await dbConnect();

        const { id } = await params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
          return NextResponse.json(
            { error: 'Invalid admission ID' },
            { status: 400 }
          );
        }

        const admission = await Admission.findById(id);

        if (!admission) {
          return NextResponse.json(
            { error: 'Admission not found' },
            { status: 404 }
          );
        }

        if (!canAccessResource(session.user, admission.branchId)) {
          return NextResponse.json(
            { error: 'Forbidden. You do not have access to discharge this admission.' },
            { status: 403 }
          );
        }

        if (admission.status === AdmissionStatus.DISCHARGED) {
          return NextResponse.json(
            { error: 'Patient has already been discharged' },
            { status: 400 }
          );
        }

        const body = await req.json();

        const dischargeData = {
          status: AdmissionStatus.DISCHARGED,
          dischargeDate: body.dischargeDate ? new Date(body.dischargeDate) : new Date(),
          dischargedBy: session.user.id,
          dischargeNotes: body.dischargeNotes || '',
          dischargeSummary: body.dischargeSummary || admission.dischargeSummary
        };

        const updatedAdmission = await Admission.findByIdAndUpdate(
          id,
          { $set: dischargeData },
          { new: true }
        )
          .populate('patientId', 'patientId firstName lastName phoneNumber email')
          .populate('admittingDoctorId', 'firstName lastName email role')
          .populate('primaryDoctorId', 'firstName lastName email role')
          .populate('dischargedBy', 'firstName lastName email role')
          .populate('branchId', 'name address city state');

        if (admission.visitId) {
          await PatientVisit.findByIdAndUpdate(
            admission.visitId,
            { status: 'completed' }
          );
        }

        return NextResponse.json({
          message: 'Patient discharged successfully',
          admission: updatedAdmission,
          totalBilling: updatedAdmission.totalBillingAmount
        });

      } catch (error: any) {
        console.error('Discharge admission error:', error);
        return NextResponse.json(
          { error: 'Failed to discharge patient', message: error.message },
          { status: 500 }
        );
      }
    }
  );
}
