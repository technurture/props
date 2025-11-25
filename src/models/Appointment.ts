import mongoose, { Document, Schema } from 'mongoose';

export enum AppointmentStatus {
  SCHEDULED = 'SCHEDULED',
  CONFIRMED = 'CONFIRMED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  NO_SHOW = 'NO_SHOW'
}

export enum AppointmentType {
  CONSULTATION = 'CONSULTATION',
  FOLLOW_UP = 'FOLLOW_UP',
  EMERGENCY = 'EMERGENCY',
  ROUTINE_CHECKUP = 'ROUTINE_CHECKUP',
  VACCINATION = 'VACCINATION',
  PROCEDURE = 'PROCEDURE'
}

export interface IAppointment extends Document {
  appointmentNumber: string;
  patientId: mongoose.Types.ObjectId;
  doctorId: mongoose.Types.ObjectId;
  branchId: mongoose.Types.ObjectId;
  appointmentDate: Date;
  appointmentTime: string;
  duration: number;
  status: AppointmentStatus;
  type: AppointmentType;
  reasonForVisit: string;
  notes?: string;
  createdBy: mongoose.Types.ObjectId;
  cancelledBy?: mongoose.Types.ObjectId;
  cancelReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const AppointmentSchema = new Schema<IAppointment>({
  appointmentNumber: { 
    type: String, 
    required: [true, 'Appointment number is required'],
    unique: true,
    uppercase: true,
    trim: true
  },
  patientId: { 
    type: Schema.Types.ObjectId, 
    ref: 'Patient', 
    required: [true, 'Patient is required']
  },
  doctorId: { 
    type: Schema.Types.ObjectId, 
    ref: 'User', 
    required: [true, 'Doctor is required']
  },
  branchId: { 
    type: Schema.Types.ObjectId, 
    ref: 'Branch', 
    required: [true, 'Branch is required']
  },
  appointmentDate: { 
    type: Date, 
    required: [true, 'Appointment date is required']
  },
  appointmentTime: { 
    type: String, 
    required: [true, 'Appointment time is required']
  },
  duration: { 
    type: Number, 
    default: 30,
    min: [15, 'Duration must be at least 15 minutes']
  },
  status: {
    type: String,
    enum: Object.values(AppointmentStatus),
    default: AppointmentStatus.SCHEDULED
  },
  type: {
    type: String,
    enum: Object.values(AppointmentType),
    default: AppointmentType.CONSULTATION
  },
  reasonForVisit: { 
    type: String, 
    required: [true, 'Reason for visit is required'],
    trim: true
  },
  notes: { 
    type: String,
    trim: true
  },
  createdBy: { 
    type: Schema.Types.ObjectId, 
    ref: 'User', 
    required: [true, 'Created by is required']
  },
  cancelledBy: { 
    type: Schema.Types.ObjectId, 
    ref: 'User'
  },
  cancelReason: { 
    type: String,
    trim: true
  }
}, { timestamps: true });

AppointmentSchema.index({ patientId: 1 });
AppointmentSchema.index({ doctorId: 1 });
AppointmentSchema.index({ branchId: 1 });
AppointmentSchema.index({ appointmentDate: 1 });
AppointmentSchema.index({ status: 1 });
AppointmentSchema.index({ appointmentDate: 1, doctorId: 1 });

export default mongoose.models.Appointment || mongoose.model<IAppointment>('Appointment', AppointmentSchema);
