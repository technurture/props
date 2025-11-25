import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import ServiceCharge from '@/models/ServiceCharge';
import { checkRole, UserRole } from '@/lib/middleware/auth';

export async function GET(req: NextRequest) {
  console.log('[Service Charges GET] Request received');
  return checkRole([UserRole.ADMIN, UserRole.BILLING, UserRole.ACCOUNTING, UserRole.DOCTOR, UserRole.LAB, UserRole.NURSE, UserRole.PHARMACY])(
    req,
    async (req: NextRequest, session: any) => {
      try {
        console.log('[Service Charges GET] Inside handler, session:', session?.user?.email);
        await dbConnect();

        const { searchParams } = new URL(req.url);
        const category = searchParams.get('category');
        const isActive = searchParams.get('isActive');
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');
        const search = searchParams.get('search');

        const query: any = {
          branch: session.user.branch._id
        };

        if (category) {
          query.category = category;
        }

        if (isActive !== null && isActive !== undefined) {
          query.isActive = isActive === 'true';
        }

        if (search) {
          query.$or = [
            { serviceName: { $regex: search, $options: 'i' } },
            { description: { $regex: search, $options: 'i' } }
          ];
        }

        const skip = (page - 1) * limit;

        const [serviceCharges, totalCount] = await Promise.all([
          ServiceCharge.find(query)
            .populate('createdBy', 'firstName lastName email')
            .populate('updatedBy', 'firstName lastName email')
            .populate('branch', 'name code')
            .sort({ category: 1, serviceName: 1 })
            .skip(skip)
            .limit(limit)
            .lean(),
          ServiceCharge.countDocuments(query)
        ]);

        const totalPages = Math.ceil(totalCount / limit);

        return NextResponse.json({
          serviceCharges,
          pagination: {
            currentPage: page,
            totalPages,
            totalCount,
            limit,
            hasNextPage: page < totalPages,
            hasPreviousPage: page > 1
          }
        });
      } catch (error: any) {
        console.error('Error fetching service charges:', error);
        return NextResponse.json(
          { error: error.message || 'Failed to fetch service charges' },
          { status: 500 }
        );
      }
    }
  );
}

export async function POST(req: NextRequest) {
  return checkRole([UserRole.ADMIN])(
    req,
    async (req: NextRequest, session: any) => {
      try {
        await dbConnect();
        const body = await req.json();

        const { serviceName, category, price, description, isActive } = body;

        if (!serviceName || !category || price === undefined || price === null) {
          return NextResponse.json(
            { error: 'Service name, category, and price are required' },
            { status: 400 }
          );
        }

        if (price < 0) {
          return NextResponse.json(
            { error: 'Price must be a positive number' },
            { status: 400 }
          );
        }

        const existingService = await ServiceCharge.findOne({
          serviceName: { $regex: new RegExp(`^${serviceName}$`, 'i') },
          category,
          branch: session.user.branch._id
        });

        if (existingService) {
          return NextResponse.json(
            { error: 'A service with this name and category already exists' },
            { status: 409 }
          );
        }

        const serviceCharge = await ServiceCharge.create({
          serviceName,
          category,
          price,
          description,
          isActive: isActive !== undefined ? isActive : true,
          branch: session.user.branch._id,
          createdBy: session.user.id
        });

        const populatedService = await ServiceCharge.findById(serviceCharge._id)
          .populate('createdBy', 'firstName lastName email')
          .populate('branch', 'name code');

        return NextResponse.json(
          { 
            message: 'Service charge created successfully',
            serviceCharge: populatedService
          },
          { status: 201 }
        );
      } catch (error: any) {
        console.error('Error creating service charge:', error);
        return NextResponse.json(
          { error: error.message || 'Failed to create service charge' },
          { status: 500 }
        );
      }
    }
  );
}
