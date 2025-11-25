import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Message from '@/models/Message';
import User from '@/models/User';
import { requireAuth } from '@/lib/middleware/auth';
import mongoose from 'mongoose';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  return requireAuth(req, async (req: NextRequest, session: any) => {
    try {
      await dbConnect();

      const { conversationId } = await params;

      if (!mongoose.Types.ObjectId.isValid(conversationId)) {
        return NextResponse.json(
          { error: 'Invalid conversation ID' },
          { status: 400 }
        );
      }

      const otherUser = await User.findById(conversationId);
      if (!otherUser) {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        );
      }

      const { searchParams } = new URL(req.url);
      const page = parseInt(searchParams.get('page') || '1');
      const limit = parseInt(searchParams.get('limit') || '50');

      const userId = new mongoose.Types.ObjectId(session.user.id);
      const otherUserId = new mongoose.Types.ObjectId(conversationId);

      const query = {
        $or: [
          { sender: userId, recipient: otherUserId },
          { sender: otherUserId, recipient: userId }
        ]
      };

      const skip = (page - 1) * limit;

      const [messages, totalCount] = await Promise.all([
        Message.find(query)
          .populate('sender', 'firstName lastName email role')
          .populate('recipient', 'firstName lastName email role')
          .populate('relatedPatient', 'patientId firstName lastName')
          .populate('relatedVisit')
          .sort({ createdAt: 1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        Message.countDocuments(query)
      ]);

      await Message.updateMany(
        {
          sender: otherUserId,
          recipient: userId,
          isRead: false
        },
        {
          $set: {
            isRead: true,
            readAt: new Date()
          }
        }
      );

      const totalPages = Math.ceil(totalCount / limit);

      return NextResponse.json({
        messages,
        conversationWith: otherUser,
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
      console.error('Get conversation messages error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch messages', message: error.message },
        { status: 500 }
      );
    }
  });
}
