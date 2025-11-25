import mongoose, { Document, Schema } from 'mongoose';

export interface IServiceCharge extends Document {
  serviceName: string;
  category: 'consultation' | 'laboratory' | 'pharmacy' | 'procedure' | 'imaging' | 'emergency' | 'admission' | 'other';
  price: number;
  billingType?: 'flat_rate' | 'per_day' | 'per_hour';
  description?: string;
  isActive: boolean;
  branch: mongoose.Types.ObjectId;
  createdBy: mongoose.Types.ObjectId;
  updatedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const ServiceChargeSchema = new Schema<IServiceCharge>({
  serviceName: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    enum: ['consultation', 'laboratory', 'pharmacy', 'procedure', 'imaging', 'emergency', 'admission', 'other'],
    required: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  billingType: {
    type: String,
    enum: ['flat_rate', 'per_day', 'per_hour'],
    default: 'flat_rate'
  },
  description: {
    type: String,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  branch: {
    type: Schema.Types.ObjectId,
    ref: 'Branch',
    required: true
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  updatedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Index for faster queries
ServiceChargeSchema.index({ category: 1, isActive: 1 });
ServiceChargeSchema.index({ branch: 1, isActive: 1 });
ServiceChargeSchema.index({ serviceName: 'text' });

export default mongoose.models.ServiceCharge || mongoose.model<IServiceCharge>('ServiceCharge', ServiceChargeSchema);
