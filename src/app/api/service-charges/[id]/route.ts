import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import ServiceCharge from '@/models/ServiceCharge';
import { checkRole, UserRole } from '@/lib/middleware/auth';
import mongoose from 'mongoose';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  
  return checkRole([UserRole.ADMIN, UserRole.BILLING, UserRole.ACCOUNTING])(
    req,
    async (req: NextRequest, session: any) => {
      try {
        await dbConnect();

        if (!mongoose.Types.ObjectId.isValid(id)) {
          return NextResponse.json(
            { error: 'Invalid service charge ID' },
            { status: 400 }
          );
        }

        const serviceCharge = await ServiceCharge.findById(id)
          .populate('createdBy', 'firstName lastName email')
          .populate('updatedBy', 'firstName lastName email')
          .populate('branch', 'name code');

        if (!serviceCharge) {
          return NextResponse.json(
            { error: 'Service charge not found' },
            { status: 404 }
          );
        }

        return NextResponse.json({ serviceCharge });
      } catch (error: any) {
        console.error('Error fetching service charge:', error);
        return NextResponse.json(
          { error: error.message || 'Failed to fetch service charge' },
          { status: 500 }
        );
      }
    }
  );
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  
  return checkRole([UserRole.ADMIN])(
    req,
    async (req: NextRequest, session: any) => {
      try {
        await dbConnect();

        if (!mongoose.Types.ObjectId.isValid(id)) {
          return NextResponse.json(
            { error: 'Invalid service charge ID' },
            { status: 400 }
          );
        }

        const body = await req.json();
        const { serviceName, category, price, description, isActive } = body;

        const serviceCharge = await ServiceCharge.findById(id);

        if (!serviceCharge) {
          return NextResponse.json(
            { error: 'Service charge not found' },
            { status: 404 }
          );
        }

        if (price !== undefined && price < 0) {
          return NextResponse.json(
            { error: 'Price must be a positive number' },
            { status: 400 }
          );
        }

        if (serviceName && serviceName !== serviceCharge.serviceName) {
          const existingService = await ServiceCharge.findOne({
            _id: { $ne: id },
            serviceName: { $regex: new RegExp(`^${serviceName}$`, 'i') },
            category: category || serviceCharge.category,
            branch: session.user.branch._id
          });

          if (existingService) {
            return NextResponse.json(
              { error: 'A service with this name and category already exists' },
              { status: 409 }
            );
          }
        }

        if (serviceName !== undefined) serviceCharge.serviceName = serviceName;
        if (category !== undefined) serviceCharge.category = category;
        if (price !== undefined) serviceCharge.price = price;
        if (description !== undefined) serviceCharge.description = description;
        if (isActive !== undefined) serviceCharge.isActive = isActive;
        serviceCharge.updatedBy = session.user.id;

        await serviceCharge.save();

        const populatedService = await ServiceCharge.findById(serviceCharge._id)
          .populate('createdBy', 'firstName lastName email')
          .populate('updatedBy', 'firstName lastName email')
          .populate('branch', 'name code');

        return NextResponse.json({
          message: 'Service charge updated successfully',
          serviceCharge: populatedService
        });
      } catch (error: any) {
        console.error('Error updating service charge:', error);
        return NextResponse.json(
          { error: error.message || 'Failed to update service charge' },
          { status: 500 }
        );
      }
    }
  );
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  
  return checkRole([UserRole.ADMIN])(
    req,
    async (req: NextRequest, session: any) => {
      try {
        await dbConnect();

        if (!mongoose.Types.ObjectId.isValid(id)) {
          return NextResponse.json(
            { error: 'Invalid service charge ID' },
            { status: 400 }
          );
        }

        const serviceCharge = await ServiceCharge.findByIdAndDelete(id);

        if (!serviceCharge) {
          return NextResponse.json(
            { error: 'Service charge not found' },
            { status: 404 }
          );
        }

        return NextResponse.json({
          message: 'Service charge deleted successfully'
        });
      } catch (error: any) {
        console.error('Error deleting service charge:', error);
        return NextResponse.json(
          { error: error.message || 'Failed to delete service charge' },
          { status: 500 }
        );
      }
    }
  );
}
