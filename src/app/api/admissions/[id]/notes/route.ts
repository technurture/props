import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Admission, { AdmissionStatus } from '@/models/Admission';
import User from '@/models/User';
import { checkRole, UserRole } from '@/lib/middleware/auth';
import { canAccessResource } from '@/lib/utils/queryHelpers';
import mongoose from 'mongoose';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return checkRole([UserRole.DOCTOR, UserRole.NURSE, UserRole.ADMIN])(
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
            { error: 'Forbidden. You do not have access to add notes to this admission.' },
            { status: 403 }
          );
        }

        if (admission.status === AdmissionStatus.DISCHARGED) {
          return NextResponse.json(
            { error: 'Cannot add notes to a discharged admission' },
            { status: 400 }
          );
        }

        const body = await req.json();

        if (!body.notes) {
          return NextResponse.json(
            { error: 'Notes are required' },
            { status: 400 }
          );
        }

        if (body.doctorId && session.user.role !== UserRole.DOCTOR) {
          const doctor = await User.findById(body.doctorId);
          if (!doctor) {
            return NextResponse.json(
              { error: 'Doctor not found' },
              { status: 404 }
            );
          }
          if (doctor.role !== UserRole.DOCTOR) {
            return NextResponse.json(
              { error: 'Assigned doctor must have DOCTOR role' },
              { status: 400 }
            );
          }
        }

        if (body.nurseId && session.user.role !== UserRole.NURSE) {
          const nurse = await User.findById(body.nurseId);
          if (!nurse) {
            return NextResponse.json(
              { error: 'Nurse not found' },
              { status: 404 }
            );
          }
          if (nurse.role !== UserRole.NURSE) {
            return NextResponse.json(
              { error: 'Assigned nurse must have NURSE role' },
              { status: 400 }
            );
          }
        }

        const newNote = {
          date: body.date ? new Date(body.date) : new Date(),
          doctorId: session.user.role === UserRole.DOCTOR ? session.user.id : body.doctorId,
          nurseId: session.user.role === UserRole.NURSE ? session.user.id : body.nurseId,
          notes: body.notes,
          vitalSigns: body.vitalSigns,
          medications: body.medications || [],
          procedures: body.procedures || []
        };

        if (session.user.role === UserRole.DOCTOR && !newNote.doctorId) {
          newNote.doctorId = session.user.id;
        }

        const updatedAdmission = await Admission.findByIdAndUpdate(
          id,
          { $push: { dailyNotes: newNote } },
          { new: true }
        )
          .populate('patientId', 'patientId firstName lastName phoneNumber email')
          .populate('admittingDoctorId', 'firstName lastName email role')
          .populate('primaryDoctorId', 'firstName lastName email role')
          .populate('dailyNotes.doctorId', 'firstName lastName email role')
          .populate('dailyNotes.nurseId', 'firstName lastName email role')
          .populate('branchId', 'name address city state');

        return NextResponse.json({
          message: 'Daily note added successfully',
          admission: updatedAdmission
        });

      } catch (error: any) {
        console.error('Add daily note error:', error);
        return NextResponse.json(
          { error: 'Failed to add daily note', message: error.message },
          { status: 500 }
        );
      }
    }
  );
}
