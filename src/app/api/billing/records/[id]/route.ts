import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Billing from '@/models/Billing';
import { requireAuth, checkRole, UserRole } from '@/lib/middleware/auth';
import { canAccessResource } from '@/lib/utils/queryHelpers';
import mongoose from 'mongoose';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return requireAuth(req, async (req: NextRequest, session: any) => {
    try {
      await dbConnect();

      const { id } = await params;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return NextResponse.json(
          { error: 'Invalid billing record ID' },
          { status: 400 }
        );
      }

      const billing = await Billing.findById(id)
        .populate('patient', 'patientId firstName lastName phoneNumber email dateOfBirth gender address insurance')
        .populate('branch', 'name address city state phoneNumber email')
        .populate('createdBy', 'firstName lastName email phoneNumber role')
        .populate('approvedBy', 'firstName lastName email phoneNumber role')
        .populate('visit', 'visitNumber visitDate currentStage status')
        .lean() as any;

      if (!billing) {
        return NextResponse.json(
          { error: 'Billing record not found' },
          { status: 404 }
        );
      }

      const billingBranchId = (billing.branch as any)?._id || billing.branch;
      
      if (!canAccessResource(session.user, billingBranchId)) {
        return NextResponse.json(
          { error: 'Forbidden. You do not have access to this billing record.' },
          { status: 403 }
        );
      }

      return NextResponse.json({
        billing
      });

    } catch (error: any) {
      console.error('Get billing record error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch billing record', message: error.message },
        { status: 500 }
      );
    }
  });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return checkRole([UserRole.BILLING, UserRole.ACCOUNTING, UserRole.ADMIN, UserRole.FRONT_DESK])(
    req,
    async (req: NextRequest, session: any) => {
      try {
        await dbConnect();

        const { id } = await params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
          return NextResponse.json(
            { error: 'Invalid billing record ID' },
            { status: 400 }
          );
        }

        const existingBilling = await Billing.findById(id);

        if (!existingBilling) {
          return NextResponse.json(
            { error: 'Billing record not found' },
            { status: 404 }
          );
        }

        if (!canAccessResource(session.user, existingBilling.branch)) {
          return NextResponse.json(
            { error: 'Forbidden. You do not have access to update this billing record.' },
            { status: 403 }
          );
        }

        const body = await req.json();

        const updateData: any = {};
        const allowedFields = [
          'items',
          'subtotal',
          'tax',
          'discount',
          'totalAmount',
          'amountPaid',
          'status',
          'paymentStatus',
          'insurance',
          'approvedBy',
          'dueDate',
          'notes'
        ];

        allowedFields.forEach(field => {
          if (body[field] !== undefined) {
            updateData[field] = body[field];
          }
        });

        if (body.items && body.items.length > 0) {
          const subtotal = body.items.reduce(
            (sum: number, item: any) => sum + (item.total || item.unitPrice * item.quantity), 
            0
          );
          updateData.subtotal = subtotal;
          
          const discount = body.discount !== undefined ? body.discount : existingBilling.discount;
          const tax = body.tax !== undefined ? body.tax : existingBilling.tax;
          
          updateData.totalAmount = subtotal + tax - discount;
        }

        if (updateData.amountPaid !== undefined || updateData.totalAmount !== undefined) {
          const totalAmount = updateData.totalAmount || existingBilling.totalAmount;
          const amountPaid = updateData.amountPaid !== undefined ? updateData.amountPaid : existingBilling.amountPaid;
          
          updateData.balance = totalAmount - amountPaid;

          if (amountPaid >= totalAmount) {
            updateData.status = 'paid';
            updateData.paymentStatus = 'paid';
          } else if (amountPaid > 0) {
            updateData.status = 'partially_paid';
            updateData.paymentStatus = 'partially_paid';
          } else {
            updateData.status = 'pending';
            updateData.paymentStatus = 'unpaid';
          }
        }

        const updatedBilling = await Billing.findByIdAndUpdate(
          id,
          { $set: updateData },
          { new: true, runValidators: true }
        )
          .populate('patient', 'patientId firstName lastName phoneNumber email insurance')
          .populate('branch', 'name address city state')
          .populate('createdBy', 'firstName lastName email role')
          .populate('approvedBy', 'firstName lastName email role')
          .populate('visit', 'visitNumber visitDate currentStage');

        return NextResponse.json({
          message: 'Billing record updated successfully',
          billing: updatedBilling
        });

      } catch (error: any) {
        console.error('Update billing record error:', error);

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
          { error: 'Failed to update billing record', message: error.message },
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
  return checkRole([UserRole.ADMIN])(
    req,
    async (req: NextRequest, session: any) => {
      try {
        await dbConnect();

        const { id } = await params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
          return NextResponse.json(
            { error: 'Invalid billing record ID' },
            { status: 400 }
          );
        }

        const billing = await Billing.findById(id);

        if (!billing) {
          return NextResponse.json(
            { error: 'Billing record not found' },
            { status: 404 }
          );
        }

        if (!canAccessResource(session.user, billing.branch)) {
          return NextResponse.json(
            { error: 'Forbidden. You do not have access to delete this billing record.' },
            { status: 403 }
          );
        }

        await Billing.findByIdAndUpdate(
          id,
          { $set: { status: 'cancelled' } },
          { new: true }
        );

        return NextResponse.json({
          message: 'Billing record cancelled successfully',
          invoiceNumber: billing.invoiceNumber
        });

      } catch (error: any) {
        console.error('Delete billing record error:', error);
        return NextResponse.json(
          { error: 'Failed to cancel billing record', message: error.message },
          { status: 500 }
        );
      }
    }
  );
}
