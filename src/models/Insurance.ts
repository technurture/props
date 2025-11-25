import mongoose, { Document, Schema } from 'mongoose';

export interface IInsurance extends Document {
  name: string;
  code: string;
  type: 'HMO' | 'PPO' | 'Government' | 'Private' | 'Corporate' | 'Other';
  coveragePercentage: number;
  description?: string;
  contactPerson?: string;
  contactEmail?: string;
  contactPhone?: string;
  address?: string;
  isActive: boolean;
  branchId: mongoose.Types.ObjectId;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const InsuranceSchema = new Schema<IInsurance>({
  name: { 
    type: String, 
    required: [true, 'Insurance provider name is required'],
    trim: true
  },
  code: {
    type: String,
    required: [true, 'Insurance code is required'],
    unique: true,
    uppercase: true,
    trim: true
  },
  type: { 
    type: String, 
    enum: ['HMO', 'PPO', 'Government', 'Private', 'Corporate', 'Other'],
    required: [true, 'Insurance type is required']
  },
  coveragePercentage: {
    type: Number,
    required: [true, 'Coverage percentage is required'],
    min: [0, 'Coverage percentage cannot be negative'],
    max: [100, 'Coverage percentage cannot exceed 100']
  },
  description: {
    type: String,
    trim: true
  },
  contactPerson: {
    type: String,
    trim: true
  },
  contactEmail: {
    type: String,
    lowercase: true,
    trim: true,
    validate: {
      validator: function(v: string) {
        if (!v) return true;
        return /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(v);
      },
      message: 'Please enter a valid email'
    }
  },
  contactPhone: {
    type: String,
    trim: true
  },
  address: {
    type: String,
    trim: true
  },
  isActive: { 
    type: Boolean, 
    default: true 
  },
  branchId: { 
    type: Schema.Types.ObjectId, 
    ref: 'Branch', 
    required: [true, 'Branch is required']
  },
  createdBy: { 
    type: Schema.Types.ObjectId, 
    ref: 'User', 
    required: [true, 'Created by is required']
  }
}, { timestamps: true });

InsuranceSchema.index({ branchId: 1 });
InsuranceSchema.index({ name: 1 });
InsuranceSchema.index({ isActive: 1 });

export default mongoose.models.Insurance || mongoose.model<IInsurance>('Insurance', InsuranceSchema);
