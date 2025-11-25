import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import PatientVisit from '@/models/PatientVisit';
import { requireAuth, UserRole } from '@/lib/middleware/auth';

function getStageFieldName(stage: string): string {
  const stageMap: Record<string, string> = {
    'front_desk': 'frontDesk',
    'nurse': 'nurse',
    'doctor': 'doctor',
    'lab': 'lab',
    'pharmacy': 'pharmacy',
    'billing': 'billing',
    'returned_to_front_desk': 'returnedToFrontDesk'
  };
  return stageMap[stage] || stage;
}

export async function POST(req: NextRequest) {
  return requireAuth(req, async (req: NextRequest, session: any) => {
    try {
      await dbConnect();

      const userRole = session.user.role as UserRole;
      if (userRole !== UserRole.ADMIN) {
        return NextResponse.json(
          { error: 'Only administrators can reset stage data' },
          { status: 403 }
        );
      }

      const body = await req.json();
      const { visitId, stage } = body;

      if (!visitId || !stage) {
        return NextResponse.json(
          { error: 'Visit ID and stage are required' },
          { status: 400 }
        );
      }

      const visit = await PatientVisit.findById(visitId);
      if (!visit) {
        return NextResponse.json(
          { error: 'Visit not found' },
          { status: 404 }
        );
      }

      const stageField = getStageFieldName(stage);
      const updateData: any = {
        [`stages.${stageField}.clockedInAt`]: null,
        [`stages.${stageField}.clockedInBy`]: null,
        [`stages.${stageField}.clockedOutAt`]: null,
        [`stages.${stageField}.clockedOutBy`]: null,
      };

      const updatedVisit = await PatientVisit.findByIdAndUpdate(
        visitId,
        updateData,
        { new: true }
      );

      return NextResponse.json({
        message: `Successfully reset ${stage} stage data for visit`,
        visit: updatedVisit
      });

    } catch (error: any) {
      console.error('Reset stage data error:', error);
      return NextResponse.json(
        { error: 'Failed to reset stage data', message: error.message },
        { status: 500 }
      );
    }
  });
}
