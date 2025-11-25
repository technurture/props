import mongoose, { Document, Schema } from 'mongoose';

export interface IBranch extends Document {
  name: string;
  code: string;
  address: string;
  city: string;
  state: string;
  lga?: string;
  ward?: string;
  country: string;
  phone: string;
  email: string;
  manager?: mongoose.Types.ObjectId;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const BranchSchema = new Schema<IBranch>({
  name: { 
    type: String, 
    required: [true, 'Branch name is required'],
    trim: true
  },
  code: { 
    type: String, 
    required: [true, 'Branch code is required'],
    unique: true,
    uppercase: true,
    trim: true
  },
  address: { 
    type: String, 
    required: [true, 'Address is required'],
    trim: true
  },
  city: { 
    type: String, 
    required: [true, 'City is required'],
    trim: true
  },
  state: { 
    type: String, 
    required: [true, 'State is required'],
    trim: true
  },
  lga: { 
    type: String,
    trim: true
  },
  ward: { 
    type: String,
    trim: true
  },
  country: { 
    type: String, 
    required: [true, 'Country is required'],
    default: 'Nigeria',
    trim: true
  },
  phone: { 
    type: String, 
    required: [true, 'Phone number is required'],
    trim: true
  },
  email: { 
    type: String, 
    required: [true, 'Email is required'],
    lowercase: true,
    trim: true,
    validate: {
      validator: function(v: string) {
        return /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(v);
      },
      message: 'Please enter a valid email'
    }
  },
  manager: { 
    type: Schema.Types.ObjectId, 
    ref: 'User'
  },
  isActive: { 
    type: Boolean, 
    default: true 
  },
}, { timestamps: true });

BranchSchema.index({ isActive: 1 });
BranchSchema.index({ city: 1, state: 1 });

export default mongoose.models.Branch || mongoose.model<IBranch>('Branch', BranchSchema);
