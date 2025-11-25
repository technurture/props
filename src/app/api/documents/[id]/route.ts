import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Document from '@/models/Document';
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
          { error: 'Invalid document ID' },
          { status: 400 }
        );
      }

      const document = await Document.findById(id)
        .populate('patient', 'firstName lastName patientId phoneNumber')
        .populate('branchId', 'name')
        .populate('uploadedBy', 'firstName lastName')
        .populate('visit')
        .populate('labTest')
        .populate('prescription')
        .lean() as any;

      if (!document) {
        return NextResponse.json(
          { error: 'Document not found' },
          { status: 404 }
        );
      }

      const documentBranchId = (document.branchId as any)?._id || document.branchId;
      
      if (!canAccessResource(session.user, documentBranchId)) {
        return NextResponse.json(
          { error: 'Forbidden. You do not have access to this document.' },
          { status: 403 }
        );
      }

      return NextResponse.json({ document });

    } catch (error: any) {
      console.error('Get document error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch document', message: error.message },
        { status: 500 }
      );
    }
  });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return checkRole([UserRole.ADMIN, UserRole.DOCTOR, UserRole.NURSE])(
    req,
    async (req: NextRequest, session: any) => {
      try {
        await dbConnect();

        const { id } = await params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
          return NextResponse.json(
            { error: 'Invalid document ID' },
            { status: 400 }
          );
        }

        const existingDocument = await Document.findById(id);

        if (!existingDocument) {
          return NextResponse.json(
            { error: 'Document not found' },
            { status: 404 }
          );
        }

        const hasAccess = canAccessResource(session.user, existingDocument.branchId?.toString());
        if (!hasAccess) {
          return NextResponse.json(
            { error: 'Forbidden. You do not have access to this branch resource.' },
            { status: 403 }
          );
        }

        const body = await req.json();

        const allowedFields = ['documentName', 'documentType', 'notes', 'tags'];
        const updateData: any = {};

        allowedFields.forEach(field => {
          if (body[field] !== undefined) {
            updateData[field] = body[field];
          }
        });

        const updatedDocument = await Document.findByIdAndUpdate(
          id,
          { $set: updateData },
          { new: true, runValidators: true }
        )
          .populate('patient', 'firstName lastName patientId phoneNumber')
          .populate('branchId', 'name')
          .populate('uploadedBy', 'firstName lastName');

        return NextResponse.json({
          message: 'Document updated successfully',
          document: updatedDocument
        });

      } catch (error: any) {
        console.error('Update document error:', error);

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
          { error: 'Failed to update document', message: error.message },
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
  return checkRole([UserRole.ADMIN, UserRole.DOCTOR])(
    req,
    async (req: NextRequest, session: any) => {
      try {
        await dbConnect();

        const { id } = await params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
          return NextResponse.json(
            { error: 'Invalid document ID' },
            { status: 400 }
          );
        }

        const document = await Document.findById(id);

        if (!document) {
          return NextResponse.json(
            { error: 'Document not found' },
            { status: 404 }
          );
        }

        const hasAccess = canAccessResource(session.user, document.branchId?.toString());
        if (!hasAccess) {
          return NextResponse.json(
            { error: 'Forbidden. You do not have access to this branch resource.' },
            { status: 403 }
          );
        }

        await Document.findByIdAndUpdate(
          id,
          { $set: { isActive: false } },
          { new: true }
        );

        return NextResponse.json({
          message: 'Document deleted successfully',
          documentName: document.documentName
        });

      } catch (error: any) {
        console.error('Delete document error:', error);
        return NextResponse.json(
          { error: 'Failed to delete document', message: error.message },
          { status: 500 }
        );
      }
    }
  );
}
