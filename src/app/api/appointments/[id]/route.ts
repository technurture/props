import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Appointment, { AppointmentStatus } from '@/models/Appointment';
import User from '@/models/User';
import { requireAuth, checkRole, UserRole } from '@/lib/middleware/auth';
import { sendAppointmentNotification } from '@/lib/services/notification';
import { canAccessResource } from '@/lib/utils/queryHelpers';
import mongoose from 'mongoose';

async function checkSchedulingConflict(
  doctorId: string,
  appointmentDate: Date,
  appointmentTime: string,
  duration: number,
  excludeAppointmentId?: string
): Promise<boolean> {
  const query: any = {
    doctorId,
    appointmentDate: {
      $gte: new Date(appointmentDate.setHours(0, 0, 0, 0)),
      $lt: new Date(appointmentDate.setHours(23, 59, 59, 999))
    },
    status: { $nin: [AppointmentStatus.CANCELLED, AppointmentStatus.NO_SHOW] }
  };

  if (excludeAppointmentId) {
    query._id = { $ne: excludeAppointmentId };
  }

  const existingAppointments = await Appointment.find(query);

  const [newHours, newMinutes] = appointmentTime.split(':').map(Number);
  const newStartMinutes = newHours * 60 + newMinutes;
  const newEndMinutes = newStartMinutes + duration;

  for (const existing of existingAppointments) {
    const [existingHours, existingMinutes] = existing.appointmentTime.split(':').map(Number);
    const existingStartMinutes = existingHours * 60 + existingMinutes;
    const existingEndMinutes = existingStartMinutes + existing.duration;

    if (
      (newStartMinutes >= existingStartMinutes && newStartMinutes < existingEndMinutes) ||
      (newEndMinutes > existingStartMinutes && newEndMinutes <= existingEndMinutes) ||
      (newStartMinutes <= existingStartMinutes && newEndMinutes >= existingEndMinutes)
    ) {
      return true;
    }
  }

  return false;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return requireAuth(req, async (req: NextRequest, session: any) => {
    try {
      await dbConnect();

      const { id } = await params;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return NextResponse.json(
          { error: 'Invalid appointment ID' },
          { status: 400 }
        );
      }

      const appointment = await Appointment.findById(id)
        .populate('patientId', 'patientId firstName lastName phoneNumber email dateOfBirth gender bloodGroup address city state')
        .populate('doctorId', 'firstName lastName email phoneNumber role')
        .populate('branchId', 'name address city state country phone email')
        .populate('createdBy', 'firstName lastName email')
        .populate('cancelledBy', 'firstName lastName email')
        .lean() as any;

      if (!appointment) {
        return NextResponse.json(
          { error: 'Appointment not found' },
          { status: 404 }
        );
      }

      const appointmentBranchId = appointment.branchId?._id || appointment.branchId;
      
      if (!canAccessResource(session.user, appointmentBranchId)) {
        return NextResponse.json(
          { error: 'Forbidden. You do not have access to this appointment.' },
          { status: 403 }
        );
      }

      return NextResponse.json({ appointment });

    } catch (error: any) {
      console.error('Get appointment error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch appointment', message: error.message },
        { status: 500 }
      );
    }
  });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return checkRole([UserRole.FRONT_DESK, UserRole.DOCTOR, UserRole.ADMIN])(
    req,
    async (req: NextRequest, session: any) => {
      try {
        await dbConnect();

        const { id } = await params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
          return NextResponse.json(
            { error: 'Invalid appointment ID' },
            { status: 400 }
          );
        }

        const existingAppointment = await Appointment.findById(id);

        if (!existingAppointment) {
          return NextResponse.json(
            { error: 'Appointment not found' },
            { status: 404 }
          );
        }

        if (!canAccessResource(session.user, existingAppointment.branchId)) {
          return NextResponse.json(
            { error: 'Forbidden. You do not have access to update this appointment.' },
            { status: 403 }
          );
        }

        const body = await req.json();

        const doctorChanged = body.doctorId && body.doctorId !== existingAppointment.doctorId.toString();
        const dateChanged = body.appointmentDate && new Date(body.appointmentDate).getTime() !== existingAppointment.appointmentDate.getTime();
        const timeChanged = body.appointmentTime && body.appointmentTime !== existingAppointment.appointmentTime;

        if (doctorChanged || dateChanged || timeChanged) {
          const checkDoctorId = body.doctorId || existingAppointment.doctorId.toString();
          const checkDate = body.appointmentDate ? new Date(body.appointmentDate) : existingAppointment.appointmentDate;
          const checkTime = body.appointmentTime || existingAppointment.appointmentTime;
          const checkDuration = body.duration || existingAppointment.duration;

          if (doctorChanged) {
            const doctor = await User.findById(body.doctorId);
            if (!doctor || doctor.role !== UserRole.DOCTOR) {
              return NextResponse.json(
                { error: 'Invalid doctor ID' },
                { status: 400 }
              );
            }
          }

          const hasConflict = await checkSchedulingConflict(
            checkDoctorId,
            checkDate,
            checkTime,
            checkDuration,
            id
          );

          if (hasConflict) {
            return NextResponse.json(
              { 
                error: 'Scheduling conflict detected',
                message: 'Doctor already has an appointment at this time'
              },
              { status: 409 }
            );
          }
        }

        const updateData: any = {};

        const allowedFields = [
          'appointmentDate',
          'appointmentTime',
          'duration',
          'status',
          'type',
          'reasonForVisit',
          'notes',
          'doctorId'
        ];

        allowedFields.forEach(field => {
          if (body[field] !== undefined) {
            updateData[field] = body[field];
          }
        });

        const statusChanged = body.status && body.status !== existingAppointment.status;

        const updatedAppointment = await Appointment.findByIdAndUpdate(
          id,
          { $set: updateData },
          { new: true, runValidators: true }
        )
          .populate('patientId', 'patientId firstName lastName phoneNumber email')
          .populate('doctorId', 'firstName lastName email phoneNumber role')
          .populate('branchId', 'name address city state')
          .populate('createdBy', 'firstName lastName email');

        if (statusChanged) {
          await sendAppointmentNotification(updatedAppointment, 'status_changed');
        } else if (doctorChanged || dateChanged || timeChanged) {
          await sendAppointmentNotification(updatedAppointment, 'updated');
        }

        return NextResponse.json({
          message: 'Appointment updated successfully',
          appointment: updatedAppointment
        });

      } catch (error: any) {
        console.error('Update appointment error:', error);

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
          { error: 'Failed to update appointment', message: error.message },
          { status: 500 }
        );
      }
    }
  );
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return checkRole([UserRole.FRONT_DESK, UserRole.DOCTOR, UserRole.ADMIN])(
    req,
    async (req: NextRequest, session: any) => {
      try {
        await dbConnect();

        const { id } = await params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
          return NextResponse.json(
            { error: 'Invalid appointment ID' },
            { status: 400 }
          );
        }

        const appointment = await Appointment.findById(id);

        if (!appointment) {
          return NextResponse.json(
            { error: 'Appointment not found' },
            { status: 404 }
          );
        }

        if (!canAccessResource(session.user, appointment.branchId)) {
          return NextResponse.json(
            { error: 'Forbidden. You do not have access to cancel this appointment.' },
            { status: 403 }
          );
        }

        let cancelReason = 'No reason provided';
        try {
          const body = await req.json();
          cancelReason = body.cancelReason || 'No reason provided';
        } catch (error) {
          // No body provided, use default cancel reason
        }

        const updatedAppointment = await Appointment.findByIdAndUpdate(
          id,
          {
            $set: {
              status: AppointmentStatus.CANCELLED,
              cancelledBy: session.user.id,
              cancelReason: cancelReason
            }
          },
          { new: true }
        )
          .populate('patientId', 'patientId firstName lastName phoneNumber email')
          .populate('doctorId', 'firstName lastName email phoneNumber role')
          .populate('branchId', 'name address city state')
          .populate('cancelledBy', 'firstName lastName email');

        await sendAppointmentNotification(updatedAppointment, 'cancelled');

        return NextResponse.json({
          message: 'Appointment cancelled successfully',
          appointmentNumber: appointment.appointmentNumber,
          appointment: updatedAppointment
        });

      } catch (error: any) {
        console.error('Cancel appointment error:', error);
        return NextResponse.json(
          { error: 'Failed to cancel appointment', message: error.message },
          { status: 500 }
        );
      }
    }
  );
}
