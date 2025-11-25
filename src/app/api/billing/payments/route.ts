import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Payment from '@/models/Payment';
import { checkRole, UserRole } from '@/lib/middleware/auth';
import { 
  applyBranchFilter, 
  buildPaginationResponse 
} from '@/lib/utils/queryHelpers';

export async function GET(req: NextRequest) {
  return checkRole([UserRole.BILLING, UserRole.ACCOUNTING, UserRole.ADMIN, UserRole.FRONT_DESK])(
    req,
    async (req: NextRequest, session: any) => {
      try {
        await dbConnect();

        const { searchParams } = new URL(req.url);

        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');
        const status = searchParams.get('status');
        const invoiceId = searchParams.get('invoice');
        const patientId = searchParams.get('patient');
        const branchId = searchParams.get('branch');
        const dateFrom = searchParams.get('dateFrom');
        const dateTo = searchParams.get('dateTo');
        const paymentMethod = searchParams.get('paymentMethod');

        const query: any = {};

        if (status) {
          query.status = status.toUpperCase();
        }

        if (invoiceId) {
          query.invoiceId = invoiceId;
        }

        if (patientId) {
          query.patientId = patientId;
        }

        if (branchId) {
          query.branchId = branchId;
        }

        if (paymentMethod) {
          query.paymentMethod = paymentMethod.toUpperCase();
        }

        if (dateFrom || dateTo) {
          query.paymentDate = {};
          if (dateFrom) {
            query.paymentDate.$gte = new Date(dateFrom);
          }
          if (dateTo) {
            const endDate = new Date(dateTo);
            endDate.setHours(23, 59, 59, 999);
            query.paymentDate.$lte = endDate;
          }
        }

        const allowCrossBranch = true;
        applyBranchFilter(query, session.user, allowCrossBranch);

        const skip = (page - 1) * limit;

        const [payments, totalCount] = await Promise.all([
          Payment.find(query)
            .populate('invoiceId', 'invoiceNumber grandTotal status')
            .populate('patientId', 'patientId firstName lastName phoneNumber email')
            .populate('branchId', 'name address city state')
            .populate('receivedBy', 'firstName lastName email')
            .sort({ paymentDate: -1 })
            .skip(skip)
            .limit(limit)
            .lean(),
          Payment.countDocuments(query)
        ]);

        const pagination = buildPaginationResponse(page, totalCount, limit);

        const totalAmount = await Payment.aggregate([
          { $match: query },
          { 
            $group: { 
              _id: null, 
              total: { $sum: '$amount' } 
            } 
          }
        ]);

        return NextResponse.json({
          payments,
          pagination,
          summary: {
            totalAmount: totalAmount.length > 0 ? totalAmount[0].total : 0
          }
        });

      } catch (error: any) {
        console.error('Get payments error:', error);
        return NextResponse.json(
          { error: 'Failed to fetch payments', message: error.message },
          { status: 500 }
        );
      }
    }
  );
}
