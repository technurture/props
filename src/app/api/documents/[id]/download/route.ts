import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Document from '@/models/Document';
import { requireAuth } from '@/lib/middleware/auth';
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
          { error: 'Invalid document ID' },
          { status: 400 }
        );
      }

      const document = await Document.findById(id).lean() as any;

      if (!document) {
        return NextResponse.json(
          { error: 'Document not found' },
          { status: 404 }
        );
      }

      const hasAccess = canAccessResource(session.user, document.branchId?.toString());
      if (!hasAccess) {
        return NextResponse.json(
          { error: 'Forbidden. You do not have access to this document.' },
          { status: 403 }
        );
      }

      const fileResponse = await fetch(document.fileUrl);
      
      if (!fileResponse.ok) {
        return NextResponse.json(
          { error: 'Failed to fetch file from storage' },
          { status: 500 }
        );
      }

      const fileBlob = await fileResponse.blob();
      const buffer = await fileBlob.arrayBuffer();

      return new NextResponse(buffer, {
        headers: {
          'Content-Type': document.mimeType || 'application/octet-stream',
          'Content-Disposition': `attachment; filename="${document.fileName}"`,
          'Content-Length': buffer.byteLength.toString(),
        },
      });

    } catch (error: any) {
      console.error('Download document error:', error);
      return NextResponse.json(
        { error: 'Failed to download document', message: error.message },
        { status: 500 }
      );
    }
  });
}
