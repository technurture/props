import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Invoice from '@/models/Invoice';
import Payment from '@/models/Payment';
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
          { error: 'Invalid invoice ID' },
          { status: 400 }
        );
      }

      const invoice = await Invoice.findById(id)
        .populate('patientId', 'patientId firstName lastName phoneNumber email dateOfBirth gender address insurance')
        .populate('branchId', 'name address city state phoneNumber email')
        .populate('generatedBy', 'firstName lastName email phoneNumber role')
        .populate('encounterId')
        .lean() as any;

      if (!invoice) {
        return NextResponse.json(
          { error: 'Invoice not found' },
          { status: 404 }
        );
      }

      const invoiceBranchId = (invoice.branchId as any)?._id || invoice.branchId;
      
      if (!canAccessResource(session.user, invoiceBranchId)) {
        return NextResponse.json(
          { error: 'Forbidden. You do not have access to this invoice.' },
          { status: 403 }
        );
      }

      const payments = await Payment.find({ invoiceId: id })
        .populate('receivedBy', 'firstName lastName email')
        .sort({ paymentDate: -1 })
        .lean() as any;

      return NextResponse.json({
        invoice: {
          ...invoice,
          payments
        }
      });

    } catch (error: any) {
      console.error('Get invoice error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch invoice', message: error.message },
        { status: 500 }
      );
    }
  });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return checkRole([UserRole.BILLING, UserRole.ADMIN, UserRole.FRONT_DESK])(
    req,
    async (req: NextRequest, session: any) => {
      try {
        await dbConnect();

        const { id } = await params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
          return NextResponse.json(
            { error: 'Invalid invoice ID' },
            { status: 400 }
          );
        }

        const existingInvoice = await Invoice.findById(id);

        if (!existingInvoice) {
          return NextResponse.json(
            { error: 'Invoice not found' },
            { status: 404 }
          );
        }

        if (!canAccessResource(session.user, existingInvoice.branchId)) {
          return NextResponse.json(
            { error: 'Forbidden. You do not have access to update this invoice.' },
            { status: 403 }
          );
        }

        const body = await req.json();

        const updateData: any = {};
        const allowedFields = ['status', 'dueDate', 'notes', 'items', 'discount', 'taxRate'];

        allowedFields.forEach(field => {
          if (body[field] !== undefined) {
            updateData[field] = body[field];
          }
        });

        if (body.items) {
          const subtotal = body.items.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0);
          const discount = body.discount || existingInvoice.discount || 0;
          const taxRate = body.taxRate || existingInvoice.taxRate || 0;
          const tax = (subtotal - discount) * (taxRate / 100);
          updateData.subtotal = subtotal;
          updateData.tax = tax;
          updateData.grandTotal = subtotal - discount + tax;
        }

        const updatedInvoice = await Invoice.findByIdAndUpdate(
          id,
          { $set: updateData },
          { new: true, runValidators: true }
        )
          .populate('patientId', 'patientId firstName lastName phoneNumber')
          .populate('branchId', 'name')
          .populate('generatedBy', 'firstName lastName');

        return NextResponse.json({
          message: 'Invoice updated successfully',
          invoice: updatedInvoice
        });

      } catch (error: any) {
        console.error('Update invoice error:', error);

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
          { error: 'Failed to update invoice', message: error.message },
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
            { error: 'Invalid invoice ID' },
            { status: 400 }
          );
        }

        const invoice = await Invoice.findById(id);

        if (!invoice) {
          return NextResponse.json(
            { error: 'Invoice not found' },
            { status: 404 }
          );
        }

        if (!canAccessResource(session.user, invoice.branchId)) {
          return NextResponse.json(
            { error: 'Forbidden. You do not have access to delete this invoice.' },
            { status: 403 }
          );
        }

        await Invoice.findByIdAndUpdate(
          id,
          { $set: { status: 'CANCELLED' } },
          { new: true }
        );

        return NextResponse.json({
          message: 'Invoice cancelled successfully',
          invoiceNumber: invoice.invoiceNumber
        });

      } catch (error: any) {
        console.error('Delete invoice error:', error);
        return NextResponse.json(
          { error: 'Failed to cancel invoice', message: error.message },
          { status: 500 }
        );
      }
    }
  );
}
