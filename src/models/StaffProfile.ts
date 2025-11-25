import mongoose, { Document, Schema } from 'mongoose';

export interface IWorkSchedule {
  day: string;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
}

export interface IStaffProfile extends Document {
  userId: mongoose.Types.ObjectId;
  branchId: mongoose.Types.ObjectId;
  specialization?: string;
  licenseNumber?: string;
  department?: string;
  bio?: string;
  profileImage?: string;
  workSchedule: IWorkSchedule[];
  createdAt: Date;
  updatedAt: Date;
}

const WorkScheduleSchema = new Schema({
  day: { 
    type: String, 
    required: true,
    enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
  },
  startTime: { type: String, required: true },
  endTime: { type: String, required: true },
  isAvailable: { type: Boolean, default: true }
}, { _id: false });

const StaffProfileSchema = new Schema<IStaffProfile>({
  userId: { 
    type: Schema.Types.ObjectId, 
    ref: 'User', 
    required: [true, 'User ID is required'],
    unique: true
  },
  branchId: { 
    type: Schema.Types.ObjectId, 
    ref: 'Branch', 
    required: [true, 'Branch is required'],
    index: true
  },
  specialization: { 
    type: String,
    trim: true
  },
  licenseNumber: { 
    type: String,
    trim: true
  },
  department: { 
    type: String,
    trim: true
  },
  bio: { 
    type: String,
    maxlength: [1000, 'Bio cannot exceed 1000 characters']
  },
  profileImage: { 
    type: String,
    trim: true
  },
  workSchedule: {
    type: [WorkScheduleSchema],
    default: []
  }
}, { timestamps: true });

StaffProfileSchema.index({ department: 1 });
StaffProfileSchema.index({ specialization: 1 });

export default mongoose.models.StaffProfile || mongoose.model<IStaffProfile>('StaffProfile', StaffProfileSchema);
