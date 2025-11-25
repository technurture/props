import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import { checkRole, UserRole } from '@/lib/middleware/auth';
import { 
  generateInvoiceFromVisit, 
  checkExistingInvoice 
} from '@/lib/services/invoiceService';

export async function POST(req: NextRequest) {
  return checkRole([UserRole.BILLING, UserRole.FRONT_DESK, UserRole.ADMIN])(
    req,
    async (req: NextRequest, session: any) => {
      try {
        await dbConnect();

        const body = await req.json();
        console.log('[Generate Invoice] Request received:', {
          visitId: body.visitId,
          userId: session.user.id,
          force: body.force
        });

        if (!body.visitId) {
          console.error('[Generate Invoice] Missing visitId');
          return NextResponse.json(
            { error: 'Visit ID is required' },
            { status: 400 }
          );
        }

        const existingInvoice = await checkExistingInvoice(body.visitId);
        if (existingInvoice && !body.force) {
          console.log('[Generate Invoice] Invoice already exists:', existingInvoice._id);
          return NextResponse.json(
            { 
              message: 'Invoice already exists for this visit',
              invoice: existingInvoice
            },
            { status: 200 }
          );
        }

        const pricing = {
          consultation: body.consultationFee,
          labTestBase: body.labTestFee,
          pharmacyMarkup: body.pharmacyMarkup
        };

        console.log('[Generate Invoice] Generating invoice with pricing:', pricing);
        const invoice = await generateInvoiceFromVisit(
          body.visitId,
          session.user.id,
          pricing
        );

        console.log('[Generate Invoice] Invoice generated successfully:', invoice._id);
        return NextResponse.json(
          {
            message: 'Invoice generated successfully from visit',
            invoice
          },
          { status: 201 }
        );

      } catch (error: any) {
        console.error('[Generate Invoice] Error:', error);
        console.error('[Generate Invoice] Error details:', {
          message: error.message,
          stack: error.stack
        });

        if (error.message.includes('not found')) {
          return NextResponse.json(
            { error: error.message },
            { status: 404 }
          );
        }

        if (error.message.includes('cancelled')) {
          return NextResponse.json(
            { error: error.message },
            { status: 400 }
          );
        }

        if (error.message.includes('No billable items')) {
          return NextResponse.json(
            { error: error.message },
            { status: 400 }
          );
        }

        return NextResponse.json(
          { error: 'Failed to generate invoice', message: error.message },
          { status: 500 }
        );
      }
    }
  );
}

export async function GET(req: NextRequest) {
  return checkRole([UserRole.BILLING, UserRole.FRONT_DESK, UserRole.ADMIN, UserRole.ACCOUNTING])(
    req,
    async (req: NextRequest, session: any) => {
      try {
        await dbConnect();

        const { searchParams } = new URL(req.url);
        const visitId = searchParams.get('visitId');

        if (!visitId) {
          return NextResponse.json(
            { error: 'Visit ID is required' },
            { status: 400 }
          );
        }

        const invoice = await checkExistingInvoice(visitId);

        if (!invoice) {
          return NextResponse.json(
            { message: 'No invoice found for this visit', invoice: null },
            { status: 200 }
          );
        }

        return NextResponse.json({
          invoice
        });

      } catch (error: any) {
        console.error('Check invoice error:', error);
        return NextResponse.json(
          { error: 'Failed to check invoice', message: error.message },
          { status: 500 }
        );
      }
    }
  );
}
