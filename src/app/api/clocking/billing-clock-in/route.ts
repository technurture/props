import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import PatientVisit from '@/models/PatientVisit';
import Invoice from '@/models/Invoice';
import Payment, { PaymentMethod, PaymentStatus } from '@/models/Payment';
import ServiceCharge from '@/models/ServiceCharge';
import { requireAuth, UserRole } from '@/lib/middleware/auth';
import { generateInvoiceFromVisit, checkExistingInvoice } from '@/lib/services/invoiceService';

export async function POST(req: NextRequest) {
  return requireAuth(req, async (req: NextRequest, session: any) => {
    try {
      await dbConnect();

      const body = await req.json();
      console.log('[Billing Clock-In] Request received:', {
        visitId: body.visitId,
        invoiceId: body.invoiceId,
        paymentAmount: body.paymentAmount,
        paymentMethod: body.paymentMethod,
        additionalItems: body.additionalItems,
        userId: session.user.id,
        userRole: session.user.role
      });

      if (!body.visitId) {
        console.error('[Billing Clock-In] Missing visitId');
        return NextResponse.json(
          { error: 'Visit ID is required' },
          { status: 400 }
        );
      }

      if (!body.invoiceId) {
        console.error('[Billing Clock-In] Missing invoiceId');
        return NextResponse.json(
          { error: 'Invoice ID is required' },
          { status: 400 }
        );
      }

      if (!body.paymentAmount || body.paymentAmount <= 0) {
        console.error('[Billing Clock-In] Invalid payment amount:', body.paymentAmount);
        return NextResponse.json(
          { error: 'Valid payment amount is required' },
          { status: 400 }
        );
      }

      if (!body.paymentMethod) {
        console.error('[Billing Clock-In] Missing payment method');
        return NextResponse.json(
          { error: 'Payment method is required' },
          { status: 400 }
        );
      }

      const userRole = session.user.role as UserRole;

      if (userRole !== UserRole.BILLING && userRole !== UserRole.ADMIN) {
        console.error('[Billing Clock-In] Unauthorized role:', userRole);
        return NextResponse.json(
          { error: 'Only billing staff can clock in for billing' },
          { status: 403 }
        );
      }

      const visit = await PatientVisit.findById(body.visitId)
        .populate('patient', 'patientId firstName lastName phoneNumber email');

      if (!visit) {
        console.error('[Billing Clock-In] Visit not found:', body.visitId);
        return NextResponse.json(
          { error: 'Visit not found' },
          { status: 404 }
        );
      }

      console.log('[Billing Clock-In] Visit found:', {
        visitId: visit._id,
        status: visit.status,
        currentStage: visit.currentStage,
        billingStage: visit.stages?.billing
      });

      if (visit.status !== 'in_progress') {
        console.error('[Billing Clock-In] Invalid visit status:', visit.status);
        return NextResponse.json(
          { error: 'Visit is not in progress' },
          { status: 400 }
        );
      }

      if (visit.currentStage !== 'billing') {
        console.error('[Billing Clock-In] Invalid current stage:', visit.currentStage);
        return NextResponse.json(
          { 
            error: `Cannot clock in. Patient is currently at ${visit.currentStage} stage`,
            currentStage: visit.currentStage
          },
          { status: 400 }
        );
      }

      if (visit.stages.billing?.clockedInAt) {
        console.error('[Billing Clock-In] Already clocked in at:', visit.stages.billing.clockedInAt);
        return NextResponse.json(
          { error: 'Billing staff has already clocked in for this visit' },
          { status: 400 }
        );
      }

      const invoice = await Invoice.findById(body.invoiceId)
        .populate('patientId', 'patientId firstName lastName phoneNumber email');

      if (!invoice) {
        console.error('[Billing Clock-In] Invoice not found:', body.invoiceId);
        return NextResponse.json(
          { error: 'Invoice not found' },
          { status: 404 }
        );
      }

      console.log('[Billing Clock-In] Invoice found:', {
        invoiceId: invoice._id,
        balance: invoice.balance,
        paidAmount: invoice.paidAmount,
        status: invoice.status
      });

      // Add additional items to invoice if provided
      let updatedBalance = invoice.balance;
      let updatedSubtotal = invoice.subtotal;
      let updatedTax = invoice.tax;
      let updatedGrandTotal = invoice.grandTotal;

      if (body.additionalItems && body.additionalItems.length > 0) {
        console.log('[Billing Clock-In] Processing additional items:', body.additionalItems.length);
        
        // Validate and verify each additional item from database
        const verifiedItems = [];
        for (const clientItem of body.additionalItems) {
          // Validate serviceChargeId exists
          if (!clientItem.serviceChargeId) {
            return NextResponse.json(
              { error: 'Service charge ID is required for additional items' },
              { status: 400 }
            );
          }

          // Validate quantity
          const quantity = parseInt(clientItem.quantity);
          if (isNaN(quantity) || quantity <= 0) {
            return NextResponse.json(
              { error: `Invalid quantity for service charge: ${clientItem.description}` },
              { status: 400 }
            );
          }

          // Fetch actual service charge from database to get real price
          const serviceCharge = await ServiceCharge.findById(clientItem.serviceChargeId);
          
          if (!serviceCharge) {
            return NextResponse.json(
              { error: `Service charge not found: ${clientItem.serviceChargeId}` },
              { status: 404 }
            );
          }

          if (!serviceCharge.isActive) {
            return NextResponse.json(
              { error: `Service charge is not active: ${serviceCharge.serviceName}` },
              { status: 400 }
            );
          }

          // Recalculate total using server-side price (ignore client-supplied price/total)
          const serverUnitPrice = serviceCharge.price;
          const serverTotal = serverUnitPrice * quantity;

          // Create verified item with server-calculated values
          const verifiedItem = {
            description: serviceCharge.serviceName,
            quantity: quantity,
            unitPrice: serverUnitPrice,
            total: serverTotal,
            serviceChargeId: serviceCharge._id.toString(),
            isManuallyAdded: true
          };

          verifiedItems.push(verifiedItem);
          console.log('[Billing Clock-In] Verified item:', verifiedItem);
        }
        
        // Add verified items to invoice
        invoice.items.push(...verifiedItems);
        
        // Recalculate totals using all items
        updatedSubtotal = invoice.items.reduce((sum: number, item: any) => sum + item.total, 0);
        updatedTax = Math.round(updatedSubtotal * 0.075);
        updatedGrandTotal = updatedSubtotal + updatedTax - (invoice.discount || 0);
        updatedBalance = updatedGrandTotal - invoice.paidAmount;

        // Update invoice in database
        await Invoice.findByIdAndUpdate(invoice._id, {
          items: invoice.items,
          subtotal: updatedSubtotal,
          tax: updatedTax,
          grandTotal: updatedGrandTotal,
          balance: updatedBalance
        });

        console.log('[Billing Clock-In] Invoice updated with verified items:', {
          itemsAdded: verifiedItems.length,
          newSubtotal: updatedSubtotal,
          newTax: updatedTax,
          newGrandTotal: updatedGrandTotal,
          newBalance: updatedBalance
        });
      }

      if (body.paymentAmount > updatedBalance) {
        console.error('[Billing Clock-In] Payment exceeds balance:', {
          paymentAmount: body.paymentAmount,
          balance: updatedBalance
        });
        return NextResponse.json(
          { error: `Payment amount (${body.paymentAmount}) cannot exceed invoice balance (${updatedBalance})` },
          { status: 400 }
        );
      }

      const paymentReference = `PAY-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      const paymentData = {
        invoiceId: invoice._id,
        patientId: invoice.patientId,
        branchId: invoice.branchId,
        amount: body.paymentAmount,
        paymentMethod: body.paymentMethod as PaymentMethod,
        paymentReference: paymentReference,
        status: PaymentStatus.SUCCESSFUL,
        receivedBy: session.user.id,
        paymentDate: new Date()
      };

      const payment = await Payment.create(paymentData);
      
      // Populate the receivedBy field with user details
      await payment.populate('receivedBy', 'firstName lastName email role');

      const newPaidAmount = invoice.paidAmount + body.paymentAmount;
      const newBalance = updatedBalance - body.paymentAmount;

      let newStatus = invoice.status;
      if (newBalance === 0) {
        newStatus = 'PAID';
      } else if (newPaidAmount > 0 && newBalance > 0) {
        newStatus = 'PARTIALLY_PAID';
      }

      await Invoice.findByIdAndUpdate(invoice._id, {
        paidAmount: newPaidAmount,
        balance: newBalance,
        status: newStatus
      });

      const now = new Date();
      const updateData: any = {
        'stages.billing.clockedInBy': session.user.id,
        'stages.billing.clockedInAt': now,
        'stages.billing.clockedOutBy': session.user.id,
        'stages.billing.clockedOutAt': now,
        'currentStage': 'returned_to_front_desk',
        'stages.returnedToFrontDesk.clockedInBy': session.user.id,
        'stages.returnedToFrontDesk.clockedInAt': now
      };

      if (body.notes) {
        updateData['stages.billing.notes'] = body.notes;
      }

      const updatedVisit = await PatientVisit.findByIdAndUpdate(
        body.visitId,
        updateData,
        { new: true }
      )
        .populate('patient', 'patientId firstName lastName phoneNumber email dateOfBirth gender')
        .populate('appointment')
        .populate('branchId', 'name address city state')
        .populate('stages.frontDesk.clockedInBy', 'firstName lastName email role')
        .populate('stages.frontDesk.clockedOutBy', 'firstName lastName email role')
        .populate('stages.nurse.clockedInBy', 'firstName lastName email role')
        .populate('stages.nurse.clockedOutBy', 'firstName lastName email role')
        .populate('stages.doctor.clockedInBy', 'firstName lastName email role')
        .populate('stages.doctor.clockedOutBy', 'firstName lastName email role')
        .populate('stages.lab.clockedInBy', 'firstName lastName email role')
        .populate('stages.lab.clockedOutBy', 'firstName lastName email role')
        .populate('stages.pharmacy.clockedInBy', 'firstName lastName email role')
        .populate('stages.pharmacy.clockedOutBy', 'firstName lastName email role')
        .populate('stages.billing.clockedInBy', 'firstName lastName email role')
        .populate('stages.billing.clockedOutBy', 'firstName lastName email role')
        .populate('stages.returnedToFrontDesk.clockedInBy', 'firstName lastName email role')
        .populate('stages.returnedToFrontDesk.clockedOutBy', 'firstName lastName email role');

      const updatedInvoice = await Invoice.findById(invoice._id)
        .populate('patientId', 'patientId firstName lastName phoneNumber email insurance')
        .populate('branchId', 'name address city state')
        .populate('generatedBy', 'firstName lastName email');

      console.log('[Billing Clock-In] Success:', {
        visitId: updatedVisit._id,
        paymentId: payment._id,
        invoiceId: updatedInvoice._id,
        newBalance: updatedInvoice.balance,
        newStatus: updatedInvoice.status
      });

      return NextResponse.json(
        {
          message: 'Payment processed and clocked in successfully',
          visit: updatedVisit,
          payment: payment,
          invoice: updatedInvoice
        },
        { status: 200 }
      );

    } catch (error: any) {
      console.error('[Billing Clock-In] Error:', error);
      console.error('[Billing Clock-In] Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      return NextResponse.json(
        { error: 'Failed to process payment and clock in', message: error.message },
        { status: 500 }
      );
    }
  });
}
