import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Pharmacy from '@/models/Pharmacy';
import { checkRole, UserRole } from '@/lib/middleware/auth';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return checkRole([UserRole.PHARMACY, UserRole.DOCTOR, UserRole.NURSE, UserRole.ADMIN])(
    req,
    async (_req: NextRequest, _session: any) => {
      try {
        await dbConnect();

        const { id } = await params;
        const product = await Pharmacy.findById(id)
          .populate('branchId', 'name code city state')
          .populate('createdBy', 'firstName lastName email');

        if (!product) {
          return NextResponse.json(
            { error: 'Product not found' },
            { status: 404 }
          );
        }

        return NextResponse.json({ product });

      } catch (error: any) {
        console.error('Get product error:', error);
        return NextResponse.json(
          { error: 'Failed to fetch product', message: error.message },
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
  return checkRole([UserRole.PHARMACY, UserRole.ADMIN])(
    req,
    async (req: NextRequest, _session: any) => {
      try {
        await dbConnect();

        const { id } = await params;
        const body = await req.json();

        const product = await Pharmacy.findById(id);
        if (!product) {
          return NextResponse.json(
            { error: 'Product not found' },
            { status: 404 }
          );
        }

        const allowedUpdates = [
          'productName',
          'genericName',
          'category',
          'manufacturer',
          'description',
          'price',
          'offerPrice',
          'purchaseDate',
          'expiryDate',
          'stock',
          'unit',
          'minStockLevel',
          'batchNumber',
          'branchId',
          'isActive'
        ];

        const updates: any = {};
        Object.keys(body).forEach(key => {
          if (allowedUpdates.includes(key)) {
            if (key === 'purchaseDate' || key === 'expiryDate') {
              updates[key] = new Date(body[key]);
            } else {
              updates[key] = body[key];
            }
          }
        });

        const updatedProduct = await Pharmacy.findByIdAndUpdate(
          id,
          updates,
          { new: true, runValidators: true }
        )
          .populate('branchId', 'name code city')
          .populate('createdBy', 'firstName lastName');

        return NextResponse.json({
          message: 'Product updated successfully',
          product: updatedProduct
        });

      } catch (error: any) {
        console.error('Update product error:', error);
        
        if (error.name === 'ValidationError') {
          const validationErrors = Object.keys(error.errors).map(
            key => error.errors[key].message
          );
          return NextResponse.json(
            { error: 'Validation error', details: validationErrors },
            { status: 400 }
          );
        }

        return NextResponse.json(
          { error: 'Failed to update product', message: error.message },
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
  return checkRole([UserRole.PHARMACY, UserRole.ADMIN])(
    req,
    async (_req: NextRequest, _session: any) => {
      try {
        await dbConnect();

        const { id } = await params;
        const product = await Pharmacy.findById(id);
        if (!product) {
          return NextResponse.json(
            { error: 'Product not found' },
            { status: 404 }
          );
        }

        await Pharmacy.findByIdAndDelete(id);

        return NextResponse.json({
          message: 'Product deleted successfully'
        });

      } catch (error: any) {
        console.error('Delete product error:', error);
        return NextResponse.json(
          { error: 'Failed to delete product', message: error.message },
          { status: 500 }
        );
      }
    }
  );
}
