import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Branch from '@/models/Branch';
import { UserRole } from '@/types/emr';
import { extractPaginationParams, buildPaginationResponse } from '@/lib/utils/queryHelpers';
import { requireAuth, checkRole } from '@/lib/middleware/auth';

export async function GET(req: NextRequest) {
  return requireAuth(req, async (req: NextRequest, session: any) => {
    try {
      await dbConnect();
      
      const userRole = session.user.role as UserRole;
      const userBranchId = session.user.branch?._id || session.user.branch;
      
      const { searchParams } = new URL(req.url);
      const { page, limit } = extractPaginationParams(searchParams);
      const skip = (page - 1) * limit;

      let filter: any = {};
      
      if (userRole !== UserRole.ADMIN) {
        if (!userBranchId) {
          return NextResponse.json(
            { error: 'No branch assigned to your account' },
            { status: 403 }
          );
        }
        filter._id = userBranchId;
      }
      
      const searchQuery = searchParams.get('search');
      if (searchQuery) {
        filter.$or = [
          { name: { $regex: searchQuery, $options: 'i' } },
          { code: { $regex: searchQuery, $options: 'i' } },
          { city: { $regex: searchQuery, $options: 'i' } }
        ];
      }

      const isActive = searchParams.get('isActive');
      if (isActive !== null) {
        filter.isActive = isActive === 'true';
      }

      const [branches, totalCount] = await Promise.all([
        Branch.find(filter)
          .populate('manager', 'firstName lastName email')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        Branch.countDocuments(filter)
      ]);

      const pagination = buildPaginationResponse(page, totalCount, limit);

      return NextResponse.json({
        branches,
        pagination
      });
    } catch (error: any) {
      console.error('Error fetching branches:', error);
      return NextResponse.json(
        { error: error.message || 'Failed to fetch branches' },
        { status: 500 }
      );
    }
  });
}

export async function POST(req: NextRequest) {
  return checkRole([UserRole.ADMIN])(
    req,
    async (req: NextRequest, _session: any) => {
      try {
        await dbConnect();

        const body = await req.json();
        const { name, code, address, city, state, country, phone, email, manager, isActive } = body;

        if (!name || !code || !address || !city || !state || !country || !phone || !email) {
          return NextResponse.json(
            { error: 'Missing required fields' },
            { status: 400 }
          );
        }

        const existingBranch = await Branch.findOne({ code: code.toUpperCase() });
        if (existingBranch) {
          return NextResponse.json(
            { error: 'Branch code already exists' },
            { status: 400 }
          );
        }

        const branch = await Branch.create({
          name,
          code: code.toUpperCase(),
          address,
          city,
          state,
          country: country || 'Nigeria',
          phone,
          email,
          manager: manager || undefined,
          isActive: isActive !== undefined ? isActive : true
        });

        const populatedBranch = await Branch.findById(branch._id)
          .populate('manager', 'firstName lastName email')
          .lean();

        return NextResponse.json(populatedBranch, { status: 201 });
      } catch (error: any) {
        console.error('Error creating branch:', error);
        return NextResponse.json(
          { error: error.message || 'Failed to create branch' },
          { status: 500 }
        );
      }
    }
  );
}
