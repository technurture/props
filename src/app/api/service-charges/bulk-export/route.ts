import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import ServiceCharge from '@/models/ServiceCharge';
import { checkRole, UserRole } from '@/lib/middleware/auth';

export async function GET(req: NextRequest) {
  return checkRole([
    UserRole.ADMIN,
    UserRole.MANAGER,
    UserRole.BILLING,
    UserRole.ACCOUNTING,
  ])(req, async (req: NextRequest, session: any) => {
    try {
      await dbConnect();

      const { searchParams } = new URL(req.url);
      const category = searchParams.get('category');
      const isActive = searchParams.get('isActive');

      const query: any = {
        branch: session.user.branch._id,
      };

      if (category) {
        query.category = category;
      }

      if (isActive !== null && isActive !== undefined && isActive !== '') {
        query.isActive = isActive === 'true';
      }

      const serviceCharges = await ServiceCharge.find(query)
        .select('serviceName category price billingType description isActive')
        .sort({ category: 1, serviceName: 1 })
        .lean();

      const exportData = serviceCharges.map((sc: any) => ({
        serviceName: sc.serviceName,
        category: sc.category,
        price: sc.price,
        billingType: sc.billingType || 'flat_rate',
        description: sc.description || '',
        isActive: sc.isActive,
      }));

      return NextResponse.json(exportData, { status: 200 });
    } catch (error: any) {
      console.error('Error in bulk export:', error);
      return NextResponse.json(
        { error: error.message || 'Failed to export data' },
        { status: 500 }
      );
    }
  });
}
