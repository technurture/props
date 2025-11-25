import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Notification from '@/models/Notification';
import { requireAuth } from '@/lib/middleware/auth';

export async function PUT(req: NextRequest) {
  return requireAuth(req, async (req: NextRequest, session: any) => {
    try {
      await dbConnect();

      const result = await Notification.updateMany(
        {
          recipient: session.user.id,
          isRead: false
        },
        {
          $set: {
            isRead: true,
            readAt: new Date()
          }
        }
      );

      return NextResponse.json({
        message: 'All notifications marked as read',
        count: result.modifiedCount
      });

    } catch (error: any) {
      console.error('Mark all notifications as read error:', error);
      return NextResponse.json(
        { error: 'Failed to mark all notifications as read', message: error.message },
        { status: 500 }
      );
    }
  });
}
