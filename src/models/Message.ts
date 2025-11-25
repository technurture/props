import mongoose, { Document, Schema } from 'mongoose';

export interface IMessage extends Document {
  sender: mongoose.Types.ObjectId;
  recipient: mongoose.Types.ObjectId;
  branchId: mongoose.Types.ObjectId;
  subject: string;
  message: string;
  isRead: boolean;
  readAt?: Date;
  attachments?: string[];
  relatedPatient?: mongoose.Types.ObjectId;
  relatedVisit?: mongoose.Types.ObjectId;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  createdAt: Date;
  updatedAt: Date;
}

const MessageSchema = new Schema<IMessage>({
  sender: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  recipient: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  branchId: { type: Schema.Types.ObjectId, ref: 'Branch', required: true, index: true },
  subject: { type: String, required: true },
  message: { type: String, required: true },
  isRead: { type: Boolean, default: false },
  readAt: { type: Date },
  attachments: [{ type: String }],
  relatedPatient: { type: Schema.Types.ObjectId, ref: 'Patient' },
  relatedVisit: { type: Schema.Types.ObjectId, ref: 'PatientVisit' },
  priority: {
    type: String,
    enum: ['low', 'normal', 'high', 'urgent'],
    default: 'normal'
  },
}, { timestamps: true });

export default mongoose.models.Message || mongoose.model<IMessage>('Message', MessageSchema);
