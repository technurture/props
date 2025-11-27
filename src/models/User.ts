import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';
import { UserRole } from '@/types/emr';

export interface IUser extends Document {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  role: UserRole;
  branchId: mongoose.Types.ObjectId;
  assignedBranch?: mongoose.Types.ObjectId;
  tenantId?: mongoose.Types.ObjectId;
  profileImage?: string;
  hospitalName?: string;
  addressLine1?: string;
  addressLine2?: string;
  pincode?: string;
  country?: string;
  state?: string;
  city?: string;
  isActive: boolean;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
  getFullName(): string;
}

const UserSchema = new Schema<IUser>({
  email: { 
    type: String, 
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    validate: {
      validator: function(v: string) {
        return /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(v);
      },
      message: 'Please enter a valid email'
    }
  },
  password: { 
    type: String, 
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters']
  },
  firstName: { 
    type: String, 
    required: [true, 'First name is required'],
    trim: true
  },
  lastName: { 
    type: String, 
    required: [true, 'Last name is required'],
    trim: true
  },
  phoneNumber: { 
    type: String, 
    required: [true, 'Phone number is required'],
    trim: true
  },
  role: {
    type: String,
    enum: Object.values(UserRole),
    required: [true, 'User role is required']
  },
  branchId: { 
    type: Schema.Types.ObjectId, 
    ref: 'Branch', 
    required: [true, 'Branch is required']
  },
  assignedBranch: {
    type: Schema.Types.ObjectId,
    ref: 'Branch'
  },
  tenantId: {
    type: Schema.Types.ObjectId,
    ref: 'Tenant',
    index: true
  },
  profileImage: {
    type: String,
    trim: true
  },
  hospitalName: {
    type: String,
    trim: true
  },
  addressLine1: {
    type: String,
    trim: true
  },
  addressLine2: {
    type: String,
    trim: true
  },
  pincode: {
    type: String,
    trim: true
  },
  country: {
    type: String,
    trim: true
  },
  state: {
    type: String,
    trim: true
  },
  city: {
    type: String,
    trim: true
  },
  isActive: { 
    type: Boolean, 
    default: true 
  },
  lastLogin: { 
    type: Date 
  },
}, { timestamps: true });

UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error: any) {
    next(error);
  }
});

UserSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

UserSchema.methods.getFullName = function(): string {
  return `${this.firstName} ${this.lastName}`;
};

UserSchema.statics.findByEmail = function(email: string) {
  return this.findOne({ email: email.toLowerCase() });
};

UserSchema.index({ branchId: 1 });
UserSchema.index({ role: 1 });
UserSchema.index({ isActive: 1 });
UserSchema.index({ assignedBranch: 1 });

export default mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
