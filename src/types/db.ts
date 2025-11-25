import { Types } from 'mongoose';

export interface PopulatedLeanBranch {
  _id: Types.ObjectId;
  name: string;
  address?: string;
  city?: string;
  state?: string;
}

export interface PopulatedLeanUser {
  _id: Types.ObjectId;
  firstName: string;
  lastName: string;
}

export interface PopulatedLeanPatient {
  _id: Types.ObjectId;
  firstName: string;
  lastName: string;
  patientId: string;
  phoneNumber?: string;
  email?: string;
  allergies?: string[];
}

export interface PrescriptionLean {
  _id: Types.ObjectId;
  branch: Types.ObjectId | PopulatedLeanBranch;
  patient?: Types.ObjectId | PopulatedLeanPatient;
  doctor?: Types.ObjectId | PopulatedLeanUser;
  visit?: Types.ObjectId | Record<string, any>;
  dispensedBy?: Types.ObjectId | PopulatedLeanUser;
  [key: string]: any;
}

export interface LabTestLean {
  _id: Types.ObjectId;
  branch: Types.ObjectId | PopulatedLeanBranch;
  patient?: Types.ObjectId | PopulatedLeanPatient;
  doctor?: Types.ObjectId | PopulatedLeanUser;
  visit?: Types.ObjectId | Record<string, any>;
  requestedBy?: Types.ObjectId | PopulatedLeanUser;
  result?: {
    performedBy?: Types.ObjectId | PopulatedLeanUser;
    [key: string]: any;
  };
  testNumber?: string;
  [key: string]: any;
}

export function getBranchId(branch: Types.ObjectId | PopulatedLeanBranch | undefined): string | undefined {
  if (!branch) return undefined;
  if (branch instanceof Types.ObjectId) return branch.toString();
  return (branch as PopulatedLeanBranch)._id.toString();
}
