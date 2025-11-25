import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Invoice from '@/models/Invoice';
import Payment, { PaymentMethod, PaymentStatus } from '@/models/Payment';
import { checkRole, UserRole } from '@/lib/middleware/auth';
import { initializePayment } from '@/lib/services/paystack';

export async function POST(req: NextRequest) {
  return checkRole([UserRole.BILLING, UserRole.ADMIN, UserRole.FRONT_DESK])(req, async (req: NextRequest, session: any) => {
    try {
      await dbConnect();

      const body = await req.json();

      const { invoiceId, amount, callbackUrl } = body;

      if (!invoiceId || !amount) {
        return NextResponse.json(
          { error: 'Invoice ID and amount are required' },
          { status: 400 }
        );
      }

      const invoice = await Invoice.findById(invoiceId)
        .populate('patientId');

      if (!invoice) {
        return NextResponse.json(
          { error: 'Invoice not found' },
          { status: 404 }
        );
      }

      if (invoice.balance === 0) {
        return NextResponse.json(
          { error: 'Invoice is already fully paid' },
          { status: 400 }
        );
      }

      const patient = invoice.patientId as any;

      if (!patient.email) {
        return NextResponse.json(
          { error: 'Patient email is required for payment processing' },
          { status: 400 }
        );
      }

      if (amount > invoice.balance) {
        return NextResponse.json(
          { error: `Amount exceeds invoice balance of ${invoice.balance}` },
          { status: 400 }
        );
      }

      const paymentReference = `PAY-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      const paymentData = {
        invoiceId: invoice._id,
        patientId: invoice.patientId,
        branchId: invoice.branchId,
        amount: amount,
        paymentMethod: PaymentMethod.PAYSTACK,
        paymentReference: paymentReference,
        paystackReference: paymentReference,
        status: PaymentStatus.PENDING,
        receivedBy: session.user.id,
        paymentDate: new Date()
      };

      const payment = await Payment.create(paymentData);

      try {
        const paystackResponse = await initializePayment({
          email: patient.email,
          amount: amount,
          reference: paymentReference,
          currency: 'NGN',
          callback_url: callbackUrl || `${process.env.NEXTAUTH_URL}/billing/verify`,
          metadata: {
            invoiceId: invoice._id.toString(),
            invoiceNumber: invoice.invoiceNumber,
            patientId: patient._id.toString(),
            patientName: patient.getFullName(),
            paymentId: payment._id.toString()
          }
        });

        return NextResponse.json({
          message: 'Payment initialized successfully',
          payment: {
            _id: payment._id,
            reference: paymentReference,
            amount: amount,
            status: PaymentStatus.PENDING
          },
          authorization_url: paystackResponse.data.authorization_url,
          access_code: paystackResponse.data.access_code
        });

      } catch (paystackError: any) {
        await Payment.findByIdAndUpdate(payment._id, {
          status: PaymentStatus.FAILED
        });

        return NextResponse.json(
          { 
            error: 'Failed to initialize payment with Paystack', 
            message: paystackError.message 
          },
          { status: 500 }
        );
      }

    } catch (error: any) {
      console.error('Initialize payment error:', error);
      return NextResponse.json(
        { error: 'Failed to initialize payment', message: error.message },
        { status: 500 }
      );
    }
  });
}
