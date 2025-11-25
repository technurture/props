import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Attendance from '@/models/Attendance';
import { requireAuth, UserRole } from '@/lib/middleware/auth';

export async function POST(req: NextRequest) {
  return requireAuth(req, async (req: NextRequest, session: any) => {
    try {
      if (session.user.role !== UserRole.ADMIN) {
        return NextResponse.json(
          { error: 'Unauthorized - Admin only' },
          { status: 403 }
        );
      }

      await dbConnect();

      const collection = Attendance.collection;

      try {
        await collection.dropIndex('user_1_date_1');
        console.log('Dropped old index: user_1_date_1');
      } catch (error: any) {
        if (error.code !== 27 && !error.message?.includes('index not found')) {
          console.error('Error dropping index:', error);
        }
      }

      await collection.createIndex(
        { user: 1, date: 1, sessionNumber: 1 },
        { unique: true }
      );
      console.log('Created new index: user_1_date_1_sessionNumber_1');

      return NextResponse.json({
        message: 'Migration completed successfully',
        details: {
          droppedIndex: 'user_1_date_1',
          createdIndex: 'user_1_date_1_sessionNumber_1'
        }
      });

    } catch (error: any) {
      console.error('Migration error:', error);
      return NextResponse.json(
        { error: 'Migration failed', message: error.message },
        { status: 500 }
      );
    }
  });
}
