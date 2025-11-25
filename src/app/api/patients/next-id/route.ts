import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import { requireAuth, checkRole, UserRole } from '@/lib/middleware/auth';
import { peekNextPatientId } from '@/lib/services/patientIdService';

export async function GET(req: NextRequest) {
  return checkRole([UserRole.FRONT_DESK, UserRole.ADMIN])(
    req,
    async (req: NextRequest, session: any) => {
      try {
        await dbConnect();

        const { searchParams } = new URL(req.url);
        const branchId = searchParams.get('branchId');

        if (!branchId) {
          return NextResponse.json(
            { error: 'branchId is required' },
            { status: 400 }
          );
        }

        const result = await peekNextPatientId(branchId);

        return NextResponse.json(result, { status: 200 });

      } catch (error: any) {
        console.error('Peek next patient ID error:', error);
        return NextResponse.json(
          { error: 'Failed to get next patient ID', message: error.message },
          { status: 500 }
        );
      }
    }
  );
}
