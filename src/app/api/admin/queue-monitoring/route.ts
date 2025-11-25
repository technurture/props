import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import PatientVisit from '@/models/PatientVisit';
import { checkRole, UserRole } from '@/lib/middleware/auth';

export async function GET(req: NextRequest) {
  return checkRole([UserRole.ADMIN])(
    req,
    async (req: NextRequest, session: any) => {
      try {
        await dbConnect();

        const { searchParams } = new URL(req.url);
        const branchId = searchParams.get('branch');

        const query: any = {
          status: 'in_progress'
        };

        if (branchId) {
          query.branchId = branchId;
        }

        const activeVisits = await PatientVisit.find(query)
          .populate('patient', 'firstName lastName patientId phoneNumber')
          .populate('assignedDoctor', 'firstName lastName')
          .populate('branchId', 'name')
          .sort({ visitDate: -1 })
          .lean();

        const currentTime = new Date();
        
        const visitsWithWaitTime = activeVisits.map((visit: any) => {
          const currentStageKey = visit.currentStage === 'front_desk' ? 'frontDesk' : 
                                  visit.currentStage === 'returned_to_front_desk' ? 'returnedToFrontDesk' :
                                  visit.currentStage;
          
          const stageData = visit.stages[currentStageKey];
          const clockedInAt = stageData?.clockedInAt;
          
          let waitTimeMinutes = 0;
          if (clockedInAt) {
            waitTimeMinutes = Math.floor((currentTime.getTime() - new Date(clockedInAt).getTime()) / 1000 / 60);
          }

          return {
            ...visit,
            waitTimeMinutes,
            waitTimeStatus: waitTimeMinutes < 30 ? 'green' : waitTimeMinutes < 60 ? 'yellow' : 'red'
          };
        });

        const stageCounts = {
          front_desk: 0,
          nurse: 0,
          doctor: 0,
          lab: 0,
          pharmacy: 0,
          billing: 0
        };

        const stageVisits: Record<string, any[]> = {
          front_desk: [],
          nurse: [],
          doctor: [],
          lab: [],
          pharmacy: [],
          billing: []
        };

        visitsWithWaitTime.forEach((visit: any) => {
          const stage = visit.currentStage === 'returned_to_front_desk' ? 'front_desk' : visit.currentStage;
          if (stage in stageCounts) {
            stageCounts[stage as keyof typeof stageCounts]++;
            stageVisits[stage].push(visit);
          }
        });

        const totalWaitTime = visitsWithWaitTime.reduce((sum: number, visit: any) => sum + visit.waitTimeMinutes, 0);
        const averageWaitTime = visitsWithWaitTime.length > 0 
          ? Math.round(totalWaitTime / visitsWithWaitTime.length) 
          : 0;

        const busiestDepartment = Object.entries(stageCounts).reduce((max, [key, value]) => {
          return value > max.count ? { stage: key, count: value } : max;
        }, { stage: 'none', count: 0 });

        const summary = {
          totalPatients: visitsWithWaitTime.length,
          averageWaitTime,
          busiestDepartment: {
            stage: busiestDepartment.stage,
            count: busiestDepartment.count,
            displayName: getDepartmentDisplayName(busiestDepartment.stage)
          }
        };

        return NextResponse.json({
          success: true,
          data: {
            stageCounts,
            stageVisits,
            summary,
            activeVisits: visitsWithWaitTime
          }
        });

      } catch (error: any) {
        console.error('Queue monitoring error:', error);
        return NextResponse.json(
          { error: 'Failed to fetch queue monitoring data', message: error.message },
          { status: 500 }
        );
      }
    }
  );
}

function getDepartmentDisplayName(stage: string): string {
  const names: Record<string, string> = {
    front_desk: 'Front Desk',
    nurse: 'Nurse',
    doctor: 'Doctor',
    lab: 'Laboratory',
    pharmacy: 'Pharmacy',
    billing: 'Billing'
  };
  return names[stage] || stage;
}
