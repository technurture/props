import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Branch from '@/models/Branch';
import { checkRole, UserRole } from '@/lib/middleware/auth';

export async function GET(req: NextRequest) {
  return checkRole([UserRole.ADMIN])(
    req,
    async (req: NextRequest, session: any) => {
      try {
        await dbConnect();

        const { searchParams } = new URL(req.url);
        const isActive = searchParams.get('isActive');

        const query: any = {};

        if (isActive !== null && isActive !== undefined && isActive !== '') {
          query.isActive = isActive === 'true';
        }

        const branches = await Branch.find(query)
          .select('name code address city state country phone email isActive')
          .sort({ name: 1 })
          .lean();

        const exportData = branches.map((branch: any) => ({
          name: branch.name,
          code: branch.code || '',
          address: branch.address,
          city: branch.city,
          state: branch.state,
          country: branch.country,
          phone: branch.phone,
          email: branch.email,
          isActive: branch.isActive,
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
