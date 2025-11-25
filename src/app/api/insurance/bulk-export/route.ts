import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Insurance from '@/models/Insurance';
import { checkRole, UserRole } from '@/lib/middleware/auth';

export async function GET(req: NextRequest) {
  return checkRole([UserRole.ADMIN, UserRole.MANAGER])(
    req,
    async (req: NextRequest, session: any) => {
      try {
        await dbConnect();

        const { searchParams } = new URL(req.url);
        const isActive = searchParams.get('isActive');

        const query: any = {
          branchId: session.user.branch._id,
        };

        if (isActive !== null && isActive !== undefined && isActive !== '') {
          query.isActive = isActive === 'true';
        }

        const insurances = await Insurance.find(query)
          .select('name code contactEmail contactPhone description isActive')
          .sort({ name: 1 })
          .lean();

        const exportData = insurances.map((insurance: any) => ({
          providerName: insurance.name,
          providerCode: insurance.code || '',
          contactEmail: insurance.contactEmail || '',
          contactPhone: insurance.contactPhone || '',
          coverageType: insurance.description || '',
          isActive: insurance.isActive,
        }));

        return NextResponse.json(exportData, { status: 200 });
      } catch (error: any) {
        console.error('Error in bulk export:', error);
        return NextResponse.json(
          { error: error.message || 'Failed to export data' },
          { status: 500 }
        );
      }
    }
  );
}
