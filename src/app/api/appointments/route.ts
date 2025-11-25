import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Appointment, { AppointmentStatus } from '@/models/Appointment';
import Patient from '@/models/Patient';
import User from '@/models/User';
import { requireAuth, checkRole, UserRole } from '@/lib/middleware/auth';
import { sendAppointmentNotification } from '@/lib/services/notification';
import { 
  buildPaginationResponse 
} from '@/lib/utils/queryHelpers';
import { buildRoleScopedFilters } from '@/lib/utils/roleFilters';

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

export async function POST(req: NextRequest) {
  return checkRole([UserRole.FRONT_DESK, UserRole.ADMIN])(
    req,
    async (req: NextRequest, session: any) => {
      try {
        await dbConnect();

        const body = await req.json();

        const requiredFields = [
          'appointmentNumber',
          'patientId',
          'doctorId',
          'branchId',
          'appointmentDate',
          'appointmentTime',
          'reasonForVisit'
        ];

        const missingFields = requiredFields.filter(field => !body[field]);
        if (missingFields.length > 0) {
          return NextResponse.json(
            { error: `Missing required fields: ${missingFields.join(', ')}` },
            { status: 400 }
          );
        }

        const existingAppointment = await Appointment.findOne({ 
          appointmentNumber: body.appointmentNumber.toUpperCase() 
        });
        if (existingAppointment) {
          return NextResponse.json(
            { error: 'Appointment number already exists' },
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

        const doctor = await User.findById(body.doctorId);
        if (!doctor || doctor.role !== UserRole.DOCTOR) {
          return NextResponse.json(
            { error: 'Doctor not found or invalid role' },
            { status: 404 }
          );
        }

        const duration = body.duration || 30;
        const appointmentDate = new Date(body.appointmentDate);
        
        const hasConflict = await checkSchedulingConflict(
          body.doctorId,
          appointmentDate,
          body.appointmentTime,
          duration
        );

        if (hasConflict) {
          return NextResponse.json(
            { 
              error: 'Scheduling conflict detected',
              message: `Dr. ${doctor.getFullName()} already has an appointment at this time`
            },
            { status: 409 }
          );
        }

        const appointmentData = {
          appointmentNumber: body.appointmentNumber.toUpperCase(),
          patientId: body.patientId,
          doctorId: body.doctorId,
          branchId: body.branchId,
          appointmentDate: appointmentDate,
          appointmentTime: body.appointmentTime,
          duration: duration,
          status: body.status || AppointmentStatus.SCHEDULED,
          type: body.type,
          reasonForVisit: body.reasonForVisit,
          notes: body.notes,
          createdBy: session.user.id
        };

        const appointment = await Appointment.create(appointmentData);

        const populatedAppointment = await Appointment.findById(appointment._id)
          .populate('patientId', 'patientId firstName lastName phoneNumber email')
          .populate('doctorId', 'firstName lastName email phoneNumber role')
          .populate('branchId', 'name address city state')
          .populate('createdBy', 'firstName lastName email');

        await sendAppointmentNotification(populatedAppointment, 'created');

        return NextResponse.json(
          {
            message: 'Appointment created successfully',
            appointment: populatedAppointment
          },
          { status: 201 }
        );

      } catch (error: any) {
        console.error('Create appointment error:', error);

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
          { error: 'Failed to create appointment', message: error.message },
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
          { appointmentNumber: { $regex: search, $options: 'i' } }
        ];
      }

      if (patientId) {
        query.patientId = patientId;
      }

      if (doctorId) {
        query.doctorId = doctorId;
      }

      if (branchId) {
        query.branchId = branchId;
      }

      if (status) {
        query.status = status.toUpperCase();
      }

      if (dateFrom || dateTo) {
        query.appointmentDate = {};
        if (dateFrom) {
          query.appointmentDate.$gte = new Date(dateFrom);
        }
        if (dateTo) {
          query.appointmentDate.$lte = new Date(dateTo);
        }
      }

      const roleScopedFilters = buildRoleScopedFilters(session);
      if (roleScopedFilters.appointmentFilter) {
        Object.assign(query, roleScopedFilters.appointmentFilter);
      }

      const skip = (page - 1) * limit;

      const sortOptions: any = {};
      if (sortBy === 'oldest') {
        sortOptions.appointmentDate = 1;
        sortOptions.appointmentTime = 1;
      } else {
        sortOptions.appointmentDate = -1;
        sortOptions.appointmentTime = -1;
      }

      const [appointments, totalCount] = await Promise.all([
        Appointment.find(query)
          .populate('patientId', 'patientId firstName lastName phoneNumber email dateOfBirth gender')
          .populate('doctorId', 'firstName lastName email phoneNumber role')
          .populate('branchId', 'name address city state')
          .populate('createdBy', 'firstName lastName email')
          .sort(sortOptions)
          .skip(skip)
          .limit(limit)
          .lean(),
        Appointment.countDocuments(query)
      ]);

      const pagination = buildPaginationResponse(page, totalCount, limit);

      return NextResponse.json({
        appointments,
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
      console.error('Get appointments error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch appointments', message: error.message },
        { status: 500 }
      );
    }
  });
}
