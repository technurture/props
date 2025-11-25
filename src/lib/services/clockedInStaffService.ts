import dbConnect from '@/lib/dbConnect';
import Attendance from '@/models/Attendance';
import User from '@/models/User';
import { UserRole } from '@/types/emr';
import { UserLean, BranchLean, normalizeObjectId, normalizeBranchId } from '@/types/mongoose-lean';

export interface ClockedInStaffMember {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  phoneNumber: string;
  branchId: BranchLean | string;
  profileImage?: string;
}

export interface GetClockedInStaffOptions {
  role?: UserRole | string;
  branchId?: string;
}

export async function getClockedInStaff(
  options: GetClockedInStaffOptions = {}
): Promise<ClockedInStaffMember[]> {
  await dbConnect();

  const { role, branchId } = options;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  interface AttendanceQuery {
    date: { $gte: Date; $lt: Date };
    clockOut: null;
    branchId?: string;
  }

  const attendanceQuery: AttendanceQuery = {
    date: { $gte: today, $lt: tomorrow },
    clockOut: null
  };

  if (branchId) {
    attendanceQuery.branchId = branchId;
  }

  const activeAttendance = await Attendance.find(attendanceQuery).lean();

  if (activeAttendance.length === 0) {
    return [];
  }

  const clockedInUserIds = activeAttendance.map(att => att.user);

  interface UserQuery {
    _id: { $in: typeof clockedInUserIds };
    isActive: boolean;
    role?: UserRole | string;
    branchId?: string;
  }

  const userQuery: UserQuery = {
    _id: { $in: clockedInUserIds },
    isActive: true
  };

  if (role) {
    userQuery.role = role;
  }

  if (branchId) {
    userQuery.branchId = branchId;
  }

  const users = await User.find(userQuery)
    .select('_id firstName lastName email role phoneNumber branchId profileImage')
    .populate('branchId', 'name address city state')
    .sort({ firstName: 1, lastName: 1 })
    .lean<UserLean[]>();

  return users.map(user => {
    const branchId = user.branchId;
    const normalizedBranch: BranchLean | string = typeof branchId === 'object' && branchId && 'name' in branchId
      ? branchId as BranchLean
      : (normalizeBranchId(branchId) || '');
    
    return {
      _id: normalizeObjectId(user._id) || '',
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role as UserRole,
      phoneNumber: user.phoneNumber || '',
      branchId: normalizedBranch,
      profileImage: user.profileImage
    };
  });
}

export async function getClockedInStaffByRole(
  role: UserRole | string,
  branchId?: string
): Promise<ClockedInStaffMember[]> {
  return getClockedInStaff({ role, branchId });
}

export async function getClockedInDoctors(
  branchId?: string
): Promise<ClockedInStaffMember[]> {
  return getClockedInStaff({ role: UserRole.DOCTOR, branchId });
}

export async function getClockedInNurses(
  branchId?: string
): Promise<ClockedInStaffMember[]> {
  return getClockedInStaff({ role: UserRole.NURSE, branchId });
}

export async function getClockedInLabStaff(
  branchId?: string
): Promise<ClockedInStaffMember[]> {
  return getClockedInStaff({ role: UserRole.LAB, branchId });
}

export async function getClockedInPharmacyStaff(
  branchId?: string
): Promise<ClockedInStaffMember[]> {
  return getClockedInStaff({ role: UserRole.PHARMACY, branchId });
}
