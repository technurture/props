import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Invoice, { InvoiceStatus } from '@/models/Invoice';
import Payment, { PaymentStatus } from '@/models/Payment';
import { requireAuth } from '@/lib/middleware/auth';
import { verifyPayment } from '@/lib/services/paystack';

export async function POST(req: NextRequest) {
  return requireAuth(req, async (req: NextRequest, _session: any) => {
    try {
      await dbConnect();

      const body = await req.json();

      const { reference } = body;

      if (!reference) {
        return NextResponse.json(
          { error: 'Payment reference is required' },
          { status: 400 }
        );
      }

      const payment = await Payment.findOne({ paystackReference: reference })
        .populate('invoiceId')
        .populate('patientId', 'patientId firstName lastName email phoneNumber');

      if (!payment) {
        return NextResponse.json(
          { error: 'Payment not found' },
          { status: 404 }
        );
      }

      if (payment.status === PaymentStatus.SUCCESSFUL) {
        return NextResponse.json({
          message: 'Payment already verified',
          payment,
          invoice: payment.invoiceId
        });
      }

      try {
        const verificationResponse = await verifyPayment(reference);

        if (!verificationResponse.status) {
          await Payment.findByIdAndUpdate(payment._id, {
            status: PaymentStatus.FAILED
          });

          return NextResponse.json(
            { 
              error: 'Payment verification failed', 
              message: verificationResponse.message 
            },
            { status: 400 }
          );
        }

        const paystackData = verificationResponse.data;

        if (paystackData.status === 'success') {
          await Payment.findByIdAndUpdate(payment._id, {
            status: PaymentStatus.SUCCESSFUL,
            paymentDate: new Date(paystackData.paid_at)
          });

          const invoice = await Invoice.findById(payment.invoiceId);

          if (!invoice) {
            return NextResponse.json(
              { error: 'Invoice not found for this payment' },
              { status: 404 }
            );
          }

          const newPaidAmount = invoice.paidAmount + payment.amount;
          const newBalance = invoice.grandTotal - newPaidAmount;

          let newStatus = InvoiceStatus.PENDING;
          if (newBalance === 0) {
            newStatus = InvoiceStatus.PAID;
          } else if (newPaidAmount > 0) {
            newStatus = InvoiceStatus.PARTIALLY_PAID;
          }

          await Invoice.findByIdAndUpdate(invoice._id, {
            paidAmount: newPaidAmount,
            balance: newBalance,
            status: newStatus
          });

          const updatedInvoice = await Invoice.findById(invoice._id)
            .populate('patientId', 'patientId firstName lastName email phoneNumber')
            .populate('branchId', 'name address city state')
            .populate('generatedBy', 'firstName lastName email');

          return NextResponse.json({
            message: 'Payment verified successfully',
            payment: {
              ...payment.toObject(),
              status: PaymentStatus.SUCCESSFUL
            },
            invoice: updatedInvoice,
            paystackData: {
              amount: paystackData.amount / 100,
              currency: paystackData.currency,
              paidAt: paystackData.paid_at,
              channel: paystackData.channel,
              gatewayResponse: paystackData.gateway_response
            }
          });
        } else if (paystackData.status === 'failed') {
          await Payment.findByIdAndUpdate(payment._id, {
            status: PaymentStatus.FAILED
          });

          return NextResponse.json(
            { 
              error: 'Payment failed', 
              message: paystackData.gateway_response || 'Payment was not successful' 
            },
            { status: 400 }
          );
        } else {
          return NextResponse.json({
            message: 'Payment is still pending',
            payment,
            status: paystackData.status
          });
        }

      } catch (paystackError: any) {
        console.error('Paystack verification error:', paystackError);
        return NextResponse.json(
          { 
            error: 'Failed to verify payment with Paystack', 
            message: paystackError.message 
          },
          { status: 500 }
        );
      }

    } catch (error: any) {
      console.error('Verify payment error:', error);
      return NextResponse.json(
        { error: 'Failed to verify payment', message: error.message },
        { status: 500 }
      );
    }
  });
}
