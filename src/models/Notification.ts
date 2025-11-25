import mongoose, { Document, Schema } from 'mongoose';

export interface INotification extends Document {
  recipient: mongoose.Types.ObjectId;
  sender?: mongoose.Types.ObjectId;
  branchId: mongoose.Types.ObjectId;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error' | 'clock_out' | 'appointment' | 'message';
  isRead: boolean;
  readAt?: Date;
  relatedModel?: 'Patient' | 'PatientVisit' | 'Appointment' | 'Billing' | 'Message';
  relatedId?: mongoose.Types.ObjectId;
  actionUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema = new Schema<INotification>({
  recipient: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  sender: { type: Schema.Types.ObjectId, ref: 'User' },
  branchId: { type: Schema.Types.ObjectId, ref: 'Branch', required: true, index: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  type: {
    type: String,
    enum: ['info', 'warning', 'success', 'error', 'clock_out', 'appointment', 'message'],
    default: 'info'
  },
  isRead: { type: Boolean, default: false },
  readAt: { type: Date },
  relatedModel: {
    type: String,
    enum: ['Patient', 'PatientVisit', 'Appointment', 'Billing', 'Message']
  },
  relatedId: { type: Schema.Types.ObjectId },
  actionUrl: { type: String },
}, { timestamps: true });

export default mongoose.models.Notification || mongoose.model<INotification>('Notification', NotificationSchema);
