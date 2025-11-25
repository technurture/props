import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Patient from '@/models/Patient';
import { requireAuth, checkRole, UserRole } from '@/lib/middleware/auth';
import { uploadPatientImage } from '@/lib/services/cloudinary';
import { 
  applyBranchFilter, 
  buildPaginationResponse 
} from '@/lib/utils/queryHelpers';
import { buildRoleScopedFilters } from '@/lib/utils/roleFilters';
import { generatePatientId } from '@/lib/services/patientIdService';

export async function POST(req: NextRequest) {
  return checkRole([UserRole.FRONT_DESK, UserRole.ADMIN])(
    req,
    async (req: NextRequest, session: any) => {
      try {
        await dbConnect();

        const body = await req.json();

        const requiredFields = [
          'firstName',
          'lastName',
          'gender',
          'phoneNumber',
          'address',
          'country',
          'emergencyContact',
          'branchId'
        ];

        const missingFields = requiredFields.filter(field => !body[field]);
        if (missingFields.length > 0) {
          return NextResponse.json(
            { error: `Missing required fields: ${missingFields.join(', ')}` },
            { status: 400 }
          );
        }

        if (!body.emergencyContact.name || !body.emergencyContact.relationship || !body.emergencyContact.phoneNumber) {
          return NextResponse.json(
            { error: 'Emergency contact requires name, relationship, and phoneNumber' },
            { status: 400 }
          );
        }

        const patientId = await generatePatientId(body.branchId);

        let profileImageUrl = body.profileImage;
        if (body.profileImage && body.profileImage.startsWith('data:')) {
          try {
            const uploadResult = await uploadPatientImage(body.profileImage, patientId);
            profileImageUrl = uploadResult.secure_url;
          } catch (uploadError) {
            console.error('Image upload error:', uploadError);
          }
        }

        const patientData = {
          patientId: patientId,
          firstName: body.firstName,
          lastName: body.lastName,
          middleName: body.middleName,
          dateOfBirth: body.dateOfBirth ? new Date(body.dateOfBirth) : undefined,
          gender: body.gender,
          bloodGroup: body.bloodGroup,
          phoneNumber: body.phoneNumber,
          email: body.email,
          address: body.address,
          city: body.city,
          state: body.state,
          country: body.country,
          emergencyContact: body.emergencyContact,
          allergies: body.allergies || [],
          chronicConditions: body.chronicConditions || [],
          medications: body.medications || [],
          insurance: body.insurance,
          branchId: body.branchId,
          registeredBy: session.user.id,
          profileImage: profileImageUrl,
          isActive: true
        };

        const patient = await Patient.create(patientData);
        
        const populatedPatient = await Patient.findById(patient._id)
          .populate('branchId', 'name address city state')
          .populate('registeredBy', 'name email');

        return NextResponse.json(
          { 
            message: 'Patient created successfully',
            patient: populatedPatient 
          },
          { status: 201 }
        );

      } catch (error: any) {
        console.error('Create patient error:', error);
        
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
          { error: 'Failed to create patient', message: error.message },
          { status: 500 }
        );
      }
    }
  );
}

export async function GET(req: NextRequest) {
  return requireAuth(req, async (req: NextRequest, session: any) => {
    try {
      await dbConnect();

      const { searchParams } = new URL(req.url);
      
      const page = parseInt(searchParams.get('page') || '1');
      const limit = parseInt(searchParams.get('limit') || '20');
      const search = searchParams.get('search') || '';
      const branchId = searchParams.get('branch');
      const status = searchParams.get('status');

      const query: any = {};

      if (search) {
        query.$or = [
          { firstName: { $regex: search, $options: 'i' } },
          { lastName: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { phoneNumber: { $regex: search, $options: 'i' } },
          { patientId: { $regex: search, $options: 'i' } }
        ];
      }

      if (branchId) {
        query.branchId = branchId;
      }

      if (status === 'active') {
        query.isActive = true;
      } else if (status === 'inactive') {
        query.isActive = false;
      }

      const roleScopedFilters = buildRoleScopedFilters(session);
      if (roleScopedFilters.patientFilter) {
        Object.assign(query, roleScopedFilters.patientFilter);
      }

      const skip = (page - 1) * limit;

      const [patients, totalCount] = await Promise.all([
        Patient.find(query)
          .populate('branchId', 'name address city state')
          .populate('registeredBy', 'name email')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        Patient.countDocuments(query)
      ]);

      const pagination = buildPaginationResponse(page, totalCount, limit);

      return NextResponse.json({
        patients,
        pagination
      });

    } catch (error: any) {
      console.error('Get patients error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch patients', message: error.message },
        { status: 500 }
      );
    }
  });
}
