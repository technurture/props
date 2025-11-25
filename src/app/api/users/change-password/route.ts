import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';
import { requireAuth } from '@/lib/middleware/auth';

export async function POST(req: NextRequest) {
  return requireAuth(req, async (req: NextRequest, session: any) => {
    try {
      await dbConnect();

      const body = await req.json();
      const { currentPassword, newPassword, confirmPassword } = body;

      if (!currentPassword || !newPassword || !confirmPassword) {
        return NextResponse.json(
          { error: 'All fields are required' },
          { status: 400 }
        );
      }

      if (newPassword !== confirmPassword) {
        return NextResponse.json(
          { error: 'New password and confirm password do not match' },
          { status: 400 }
        );
      }

      if (newPassword.length < 6) {
        return NextResponse.json(
          { error: 'Password must be at least 6 characters long' },
          { status: 400 }
        );
      }

      const user = await User.findById(session.user.id);

      if (!user) {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        );
      }

      const isPasswordValid = await user.comparePassword(currentPassword);

      if (!isPasswordValid) {
        return NextResponse.json(
          { error: 'Current password is incorrect' },
          { status: 401 }
        );
      }

      user.password = newPassword;
      await user.save();

      return NextResponse.json({
        message: 'Password changed successfully'
      });

    } catch (error: any) {
      console.error('Change password error:', error);
      return NextResponse.json(
        { error: 'Failed to change password', message: error.message },
        { status: 500 }
      );
    }
  });
}
