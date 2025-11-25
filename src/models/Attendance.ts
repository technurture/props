import mongoose, { Document, Schema } from 'mongoose';

export interface IAttendance extends Document {
  user: mongoose.Types.ObjectId;
  branchId: mongoose.Types.ObjectId;
  date: Date;
  clockIn: Date;
  clockOut?: Date;
  sessionNumber: number;
  status: 'present' | 'absent' | 'on_leave' | 'half_day';
  workHours?: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const AttendanceSchema = new Schema<IAttendance>({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  branchId: { type: Schema.Types.ObjectId, ref: 'Branch', required: true, index: true },
  date: { type: Date, required: true },
  clockIn: { type: Date, required: true },
  clockOut: { type: Date },
  sessionNumber: { type: Number, required: true, default: 1 },
  status: {
    type: String,
    enum: ['present', 'absent', 'on_leave', 'half_day'],
    default: 'present'
  },
  workHours: { type: Number },
  notes: { type: String },
}, { timestamps: true });

AttendanceSchema.index({ user: 1, date: 1, sessionNumber: 1 }, { unique: true });

const AttendanceModel = mongoose.models.Attendance || (() => {
  const model = mongoose.model<IAttendance>('Attendance', AttendanceSchema);
  
  if (typeof window === 'undefined') {
    model.syncIndexes().catch((err: any) => {
      console.error('Error syncing indexes:', err.message);
    });
  }
  
  return model;
})();

export default AttendanceModel;
