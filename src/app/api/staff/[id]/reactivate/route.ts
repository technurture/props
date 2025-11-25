import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';
import { checkRole, UserRole } from '@/lib/middleware/auth';
import { canAccessResource } from '@/lib/utils/queryHelpers';
import mongoose from 'mongoose';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return checkRole([UserRole.ADMIN])(
    req,
    async (req: NextRequest, session: any) => {
      try {
        await dbConnect();

        const { id } = await params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
          return NextResponse.json(
            { error: 'Invalid staff ID' },
            { status: 400 }
          );
        }

        const staff = await User.findById(id);

        if (!staff) {
          return NextResponse.json(
            { error: 'Staff member not found' },
            { status: 404 }
          );
        }

        const hasAccess = canAccessResource(session.user, staff.branchId?.toString());
        if (!hasAccess) {
          return NextResponse.json(
            { error: 'Forbidden. You do not have access to this branch resource.' },
            { status: 403 }
          );
        }

        if (staff.isActive) {
          return NextResponse.json(
            { error: 'Staff member is already active' },
            { status: 400 }
          );
        }

        let body: any = {};
        try {
          body = await req.json();
        } catch (e) {
          // No body provided, that's okay
        }

        if (body.password) {
          if (typeof body.password !== 'string' || body.password.length < 6) {
            return NextResponse.json(
              { error: 'Password must be at least 6 characters long' },
              { status: 400 }
            );
          }
          staff.password = body.password;
        }

        staff.isActive = true;
        await staff.save();

        return NextResponse.json({
          message: 'Staff member reactivated successfully',
          staffId: staff._id
        });

      } catch (error: any) {
        console.error('Reactivate staff error:', error);
        return NextResponse.json(
          { error: 'Failed to reactivate staff member', message: error.message },
          { status: 500 }
        );
      }
    }
  );
}
