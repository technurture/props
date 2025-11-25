import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Notification from '@/models/Notification';
import { requireAuth, UserRole } from '@/lib/middleware/auth';
import mongoose from 'mongoose';

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return requireAuth(req, async (req: NextRequest, session: any) => {
    try {
      await dbConnect();

      const { id } = await params;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return NextResponse.json(
          { error: 'Invalid notification ID' },
          { status: 400 }
        );
      }

      const notification = await Notification.findById(id);

      if (!notification) {
        return NextResponse.json(
          { error: 'Notification not found' },
          { status: 404 }
        );
      }

      if (session.user.role !== UserRole.ADMIN && notification.recipient.toString() !== session.user.id) {
        return NextResponse.json(
          { error: 'Forbidden. You can only delete your own notifications.' },
          { status: 403 }
        );
      }

      await Notification.findByIdAndDelete(id);

      return NextResponse.json({
        message: 'Notification deleted successfully'
      });

    } catch (error: any) {
      console.error('Delete notification error:', error);
      return NextResponse.json(
        { error: 'Failed to delete notification', message: error.message },
        { status: 500 }
      );
    }
  });
}
