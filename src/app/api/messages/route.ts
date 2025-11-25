import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Message from '@/models/Message';
import Notification from '@/models/Notification';
import User from '@/models/User';
import { requireAuth } from '@/lib/middleware/auth';
import mongoose from 'mongoose';

export async function POST(req: NextRequest) {
  return requireAuth(req, async (req: NextRequest, session: any) => {
    try {
      await dbConnect();

      const body = await req.json();

      const requiredFields = ['recipient', 'subject', 'message'];
      const missingFields = requiredFields.filter(field => !body[field]);
      if (missingFields.length > 0) {
        return NextResponse.json(
          { error: `Missing required fields: ${missingFields.join(', ')}` },
          { status: 400 }
        );
      }

      const recipient = await User.findById(body.recipient);
      if (!recipient) {
        return NextResponse.json(
          { error: 'Recipient not found' },
          { status: 404 }
        );
      }

      const messageData = {
        sender: session.user.id,
        recipient: body.recipient,
        subject: body.subject,
        message: body.message,
        priority: body.priority || 'normal',
        attachments: body.attachments || [],
        relatedPatient: body.relatedPatient,
        relatedVisit: body.relatedVisit,
      };

      const newMessage = await Message.create(messageData);

      const populatedMessage = await Message.findById(newMessage._id)
        .populate('sender', 'firstName lastName email role')
        .populate('recipient', 'firstName lastName email role')
        .populate('relatedPatient', 'patientId firstName lastName')
        .populate('relatedVisit');

      await Notification.create({
        recipient: body.recipient,
        sender: session.user.id,
        title: `New message from ${session.user.firstName} ${session.user.lastName}`,
        message: body.subject,
        type: 'message',
        relatedModel: 'Message',
        relatedId: newMessage._id,
        actionUrl: `/messages/${newMessage._id}`
      });

      return NextResponse.json(
        {
          message: 'Message sent successfully',
          data: populatedMessage
        },
        { status: 201 }
      );

    } catch (error: any) {
      console.error('Send message error:', error);

      if (error.name === 'ValidationError') {
        const validationErrors = Object.keys(error.errors).map(
          key => error.errors[key].message
        );
        return NextResponse.json(
          { error: 'Validation error', details: validationErrors },
          { status: 400 }
        );
      }

      return NextResponse.json(
        { error: 'Failed to send message', message: error.message },
        { status: 500 }
      );
    }
  });
}

export async function GET(req: NextRequest) {
  return requireAuth(req, async (req: NextRequest, session: any) => {
    try {
      await dbConnect();

      const { searchParams } = new URL(req.url);
      const page = parseInt(searchParams.get('page') || '1');
      const limit = parseInt(searchParams.get('limit') || '20');

      const userId = new mongoose.Types.ObjectId(session.user.id);

      const conversations = await Message.aggregate([
        {
          $match: {
            $or: [
              { sender: userId },
              { recipient: userId }
            ]
          }
        },
        {
          $sort: { createdAt: -1 }
        },
        {
          $addFields: {
            conversationWith: {
              $cond: {
                if: { $eq: ['$sender', userId] },
                then: '$recipient',
                else: '$sender'
              }
            }
          }
        },
        {
          $group: {
            _id: '$conversationWith',
            lastMessage: { $first: '$$ROOT' },
            unreadCount: {
              $sum: {
                $cond: [
                  {
                    $and: [
                      { $eq: ['$recipient', userId] },
                      { $eq: ['$isRead', false] }
                    ]
                  },
                  1,
                  0
                ]
              }
            }
          }
        },
        {
          $sort: { 'lastMessage.createdAt': -1 }
        },
        {
          $skip: (page - 1) * limit
        },
        {
          $limit: limit
        }
      ]);

      await User.populate(conversations, {
        path: '_id',
        select: 'firstName lastName email role'
      });

      await User.populate(conversations, {
        path: 'lastMessage.sender',
        select: 'firstName lastName email role'
      });

      await User.populate(conversations, {
        path: 'lastMessage.recipient',
        select: 'firstName lastName email role'
      });

      const totalConversations = await Message.aggregate([
        {
          $match: {
            $or: [
              { sender: userId },
              { recipient: userId }
            ]
          }
        },
        {
          $addFields: {
            conversationWith: {
              $cond: {
                if: { $eq: ['$sender', userId] },
                then: '$recipient',
                else: '$sender'
              }
            }
          }
        },
        {
          $group: {
            _id: '$conversationWith'
          }
        },
        {
          $count: 'total'
        }
      ]);

      const totalCount = totalConversations[0]?.total || 0;
      const totalPages = Math.ceil(totalCount / limit);

      return NextResponse.json({
        conversations,
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
      console.error('Get conversations error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch conversations', message: error.message },
        { status: 500 }
      );
    }
  });
}
