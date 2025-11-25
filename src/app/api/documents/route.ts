import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Document from '@/models/Document';
import Patient from '@/models/Patient';
import { requireAuth, checkRole, UserRole } from '@/lib/middleware/auth';
import { 
  applyBranchFilter, 
  buildPaginationResponse,
  canAccessResource
} from '@/lib/utils/queryHelpers';
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(req: NextRequest) {
  return checkRole([UserRole.ADMIN, UserRole.DOCTOR, UserRole.NURSE, UserRole.FRONT_DESK])(
    req,
    async (req: NextRequest, session: any) => {
      try {
        await dbConnect();

        const formData = await req.formData();
        
        const file = formData.get('file') as File;
        const patient = formData.get('patient') as string;
        const documentName = formData.get('documentName') as string;
        const documentType = formData.get('documentType') as string;
        const branchId = formData.get('branchId') as string;
        const visit = formData.get('visit') as string | null;
        const labTest = formData.get('labTest') as string | null;
        const prescription = formData.get('prescription') as string | null;
        const notes = formData.get('notes') as string | null;
        const tagsStr = formData.get('tags') as string | null;

        if (!file || !patient || !documentName || !documentType || !branchId) {
          return NextResponse.json(
            { error: 'Missing required fields: file, patient, documentName, documentType, branchId' },
            { status: 400 }
          );
        }

        const hasAccess = canAccessResource(session.user, branchId);
        if (!hasAccess) {
          return NextResponse.json(
            { error: 'Forbidden. You do not have access to this branch resource.' },
            { status: 403 }
          );
        }

        const patientDoc = await Patient.findById(patient);
        if (!patientDoc) {
          return NextResponse.json(
            { error: 'Patient not found' },
            { status: 404 }
          );
        }

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        
        const uploadResult = await new Promise((resolve, reject) => {
          cloudinary.uploader.upload_stream(
            {
              resource_type: 'auto',
              folder: 'patient-documents',
            },
            (error, result) => {
              if (error) reject(error);
              else resolve(result);
            }
          ).end(buffer);
        }) as any;

        const tags = tagsStr ? JSON.parse(tagsStr) : [];

        const documentData = {
          patient,
          branchId,
          documentName,
          documentType,
          fileUrl: uploadResult.secure_url,
          fileName: file.name,
          fileSize: file.size,
          mimeType: file.type,
          uploadedBy: session.user.id,
          uploadedAt: new Date(),
          visit: visit || undefined,
          labTest: labTest || undefined,
          prescription: prescription || undefined,
          notes: notes || undefined,
          tags,
          isActive: true,
        };

        const document = await Document.create(documentData);

        const populatedDocument = await Document.findById(document._id)
          .populate('patient', 'firstName lastName patientId phoneNumber')
          .populate('branchId', 'name')
          .populate('uploadedBy', 'firstName lastName');

        return NextResponse.json(
          {
            message: 'Document uploaded successfully',
            document: populatedDocument
          },
          { status: 201 }
        );

      } catch (error: any) {
        console.error('Upload document error:', error);

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
          { error: 'Failed to upload document', message: error.message },
          { status: 500 }
        );
      }
    }
  );
}

export async function GET(req: NextRequest) {
  return checkRole([UserRole.ADMIN, UserRole.DOCTOR, UserRole.NURSE, UserRole.FRONT_DESK])(req, async (req: NextRequest, session: any) => {
    try {
      await dbConnect();

      const { searchParams } = new URL(req.url);

      const page = parseInt(searchParams.get('page') || '1');
      const limit = parseInt(searchParams.get('limit') || '20');
      const search = searchParams.get('search') || '';
      const branchId = searchParams.get('branch');
      const patientId = searchParams.get('patient');
      const documentType = searchParams.get('documentType');
      const visitId = searchParams.get('visit');
      const dateFrom = searchParams.get('dateFrom');
      const dateTo = searchParams.get('dateTo');

      const query: any = { isActive: true };

      if (search) {
        query.$or = [
          { documentName: { $regex: search, $options: 'i' } },
          { fileName: { $regex: search, $options: 'i' } },
          { notes: { $regex: search, $options: 'i' } }
        ];
      }

      if (patientId) {
        query.patient = patientId;
      }

      if (documentType) {
        query.documentType = documentType;
      }

      if (visitId) {
        query.visit = visitId;
      }

      if (dateFrom || dateTo) {
        query.uploadedAt = {};
        if (dateFrom) {
          query.uploadedAt.$gte = new Date(dateFrom);
        }
        if (dateTo) {
          query.uploadedAt.$lte = new Date(dateTo);
        }
      }

      applyBranchFilter(query, session.user);
      
      if (branchId) {
        query.branchId = branchId;
      }

      const skip = (page - 1) * limit;

      const [documents, totalCount] = await Promise.all([
        Document.find(query)
          .populate('patient', 'firstName lastName patientId phoneNumber')
          .populate('branchId', 'name')
          .populate('uploadedBy', 'firstName lastName')
          .sort({ uploadedAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        Document.countDocuments(query)
      ]);

      return NextResponse.json({
        documents,
        pagination: buildPaginationResponse(page, limit, totalCount)
      });

    } catch (error: any) {
      console.error('Get documents error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch documents', message: error.message },
        { status: 500 }
      );
    }
  });
}
