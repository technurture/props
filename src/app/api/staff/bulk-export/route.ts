import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';
import { checkRole, UserRole } from '@/lib/middleware/auth';

export async function GET(req: NextRequest) {
  return checkRole([UserRole.ADMIN, UserRole.MANAGER])(
    req,
    async (req: NextRequest, session: any) => {
      try {
        await dbConnect();

        const { searchParams } = new URL(req.url);
        const role = searchParams.get('role');
        const isActive = searchParams.get('isActive');

        const query: any = {
          branchId: session.user.branch._id,
        };

        if (role) {
          query.role = role;
        }

        if (isActive !== null && isActive !== undefined && isActive !== '') {
          query.isActive = isActive === 'true';
        }

        const staff = await User.find(query)
          .select('firstName lastName email phoneNumber role isActive')
          .sort({ firstName: 1 })
          .lean();

        const exportData = staff.map((user: any) => ({
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          phoneNumber: user.phoneNumber,
          role: user.role,
          password: '[KEEP_EXISTING]',
          specialization: '',
          licenseNumber: '',
          department: '',
          isActive: user.isActive,
        }));

        return NextResponse.json(exportData, { status: 200 });
      } catch (error: any) {
        console.error('Error in bulk export:', error);
        return NextResponse.json(
          { error: error.message || 'Failed to export data' },
          { status: 500 }
        );
      }
    }
  );
}
