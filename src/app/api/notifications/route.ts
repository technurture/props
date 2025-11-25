import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Notification from '@/models/Notification';
import User from '@/models/User';
import { requireAuth, checkRole, UserRole } from '@/lib/middleware/auth';

export async function GET(req: NextRequest) {
  return requireAuth(req, async (req: NextRequest, session: any) => {
    try {
      await dbConnect();

      const { searchParams } = new URL(req.url);
      const page = parseInt(searchParams.get('page') || '1');
      const limit = parseInt(searchParams.get('limit') || '20');
      const isRead = searchParams.get('isRead');
      const type = searchParams.get('type');
      const viewAll = searchParams.get('viewAll');

      const query: any = {};

      if (session.user.role === UserRole.ADMIN && viewAll === 'true') {
        if (session.user.branchId) {
          query.branchId = session.user.branchId;
        }
      } else {
        query.recipient = session.user.id;
      }

      if (isRead !== null && isRead !== undefined && isRead !== '') {
        query.isRead = isRead === 'true';
      }

      if (type) {
        query.type = type;
      }

      const skip = (page - 1) * limit;

      const [notifications, totalCount] = await Promise.all([
        Notification.find(query)
          .populate('sender', 'firstName lastName email role')
          .populate('recipient', 'firstName lastName email role')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        Notification.countDocuments(query)
      ]);

      const totalPages = Math.ceil(totalCount / limit);

      return NextResponse.json({
        notifications,
        pagination: {
          currentPage: page,
          totalPages,
          totalCount,
          limit,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        }
      });

    } catch (error: any) {
      console.error('Get notifications error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch notifications', message: error.message },
        { status: 500 }
      );
    }
  });
}

export async function POST(req: NextRequest) {
  return checkRole([UserRole.ADMIN])(
    req,
    async (req: NextRequest, session: any) => {
      try {
        await dbConnect();

        const body = await req.json();
        const { title, message, type, targetType, targetValue, actionUrl } = body;

        if (!title || !message) {
          return NextResponse.json(
            { error: 'Title and message are required' },
            { status: 400 }
          );
        }

        const recipients = [];

        if (targetType === 'all') {
          const users = await User.find({ 
            branchId: session.user.branchId,
            isActive: true 
          }).select('_id');
          recipients.push(...users.map(u => u._id));
        } else if (targetType === 'department' || targetType === 'role') {
          const users = await User.find({ 
            role: targetValue,
            branchId: session.user.branchId,
            isActive: true 
          }).select('_id');
          recipients.push(...users.map(u => u._id));
        } else if (targetType === 'user') {
          recipients.push(targetValue);
        } else {
          return NextResponse.json(
            { error: 'Invalid target type' },
            { status: 400 }
          );
        }

        const notifications = recipients.map(recipientId => ({
          recipient: recipientId,
          sender: session.user.id,
          branchId: session.user.branchId,
          title,
          message,
          type: type || 'info',
          actionUrl,
          isRead: false
        }));

        const createdNotifications = await Notification.insertMany(notifications);

        return NextResponse.json(
          {
            message: `Successfully sent ${createdNotifications.length} notification(s)`,
            count: createdNotifications.length
          },
          { status: 201 }
        );

      } catch (error: any) {
        console.error('Create notification error:', error);
        return NextResponse.json(
          { error: 'Failed to create notification', message: error.message },
          { status: 500 }
        );
      }
    }
  );
}

export async function DELETE(req: NextRequest) {
  return checkRole([UserRole.ADMIN])(
    req,
    async (req: NextRequest, session: any) => {
      try {
        await dbConnect();

        const { searchParams } = new URL(req.url);
        const deleteAll = searchParams.get('all');

        if (deleteAll === 'true') {
          const result = await Notification.deleteMany({ 
            branchId: session.user.branchId 
          });

          return NextResponse.json({
            message: `Deleted ${result.deletedCount} notifications`,
            deletedCount: result.deletedCount
          });
        }

        return NextResponse.json(
          { error: 'Invalid delete operation' },
          { status: 400 }
        );

      } catch (error: any) {
        console.error('Delete notifications error:', error);
        return NextResponse.json(
          { error: 'Failed to delete notifications', message: error.message },
          { status: 500 }
        );
      }
    }
  );
}
