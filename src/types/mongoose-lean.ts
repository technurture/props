import { Types } from 'mongoose';
import { UserRole } from './emr';

export interface BranchLean {
  _id: string | Types.ObjectId;
  name: string;
  code?: string;
  address?: string;
  city?: string;
  state?: string;
  lga?: string;
  ward?: string;
  country?: string;
  phone?: string;
  email?: string;
  manager?: Types.ObjectId;
  isActive?: boolean;
}

export interface UserLean {
  _id: string | Types.ObjectId;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole | string;
  branchId?: Types.ObjectId | BranchLean;
  assignedBranch?: Types.ObjectId | BranchLean;
  phoneNumber?: string;
  profileImage?: string;
  hospitalName?: string;
  addressLine1?: string;
  addressLine2?: string;
  pincode?: string;
  country?: string;
  state?: string;
  city?: string;
  isActive?: boolean;
  lastLogin?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export function normalizeBranchId(branchId: Types.ObjectId | BranchLean | string | undefined | null): string | null {
  if (!branchId) return null;
  
  if (typeof branchId === 'string') {
    return branchId;
  }
  
  if (typeof branchId === 'object' && 'name' in branchId && '_id' in branchId) {
    const id = branchId._id;
    return typeof id === 'string' ? id : id.toString();
  }
  
  return branchId.toString();
}

export function normalizeObjectId(id: Types.ObjectId | string | undefined | null): string | null {
  if (!id) return null;
  return typeof id === 'string' ? id : id.toString();
}
