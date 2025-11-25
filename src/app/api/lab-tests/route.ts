import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import LabTest from '@/models/LabTest';
import Patient from '@/models/Patient';
import { requireAuth, checkRole, UserRole } from '@/lib/middleware/auth';
import { 
  applyBranchFilter, 
  buildPaginationResponse 
} from '@/lib/utils/queryHelpers';

export async function POST(req: NextRequest) {
  return checkRole([UserRole.LAB, UserRole.ADMIN])(
    req,
    async (req: NextRequest, session: any) => {
      try {
        await dbConnect();

        const body = await req.json();

        const requiredFields = [
          'patient',
          'doctor',
          'visit',
          'branchId',
          'testName',
          'testCategory'
        ];

        const missingFields = requiredFields.filter(field => !body[field]);
        if (missingFields.length > 0) {
          return NextResponse.json(
            { error: `Missing required fields: ${missingFields.join(', ')}` },
            { status: 400 }
          );
        }

        const patient = await Patient.findById(body.patient);
        if (!patient) {
          return NextResponse.json(
            { error: 'Patient not found' },
            { status: 404 }
          );
        }

        const testCount = await LabTest.countDocuments();
        const testNumber = `TE${String(testCount + 1).padStart(6, '0')}`;

        const labTestData = {
          testNumber,
          patient: body.patient,
          doctor: body.doctor,
          visit: body.visit,
          branchId: body.branchId || body.branch,
          testName: body.testName,
          testCategory: body.testCategory,
          description: body.description,
          priority: body.priority || 'routine',
          requestedBy: session.user.id,
          requestedAt: new Date()
        };

        const labTest = await LabTest.create(labTestData);

        const PatientVisit = (await import('@/models/PatientVisit')).default;
        const visit = await PatientVisit.findById(body.visit);
        
        if (visit && visit.status === 'in_progress' && visit.currentStage !== 'lab') {
          visit.currentStage = 'lab';
          await visit.save();
        }

        const populatedLabTest = await LabTest.findById(labTest._id)
          .populate('patient', 'firstName lastName patientId phoneNumber')
          .populate('doctor', 'firstName lastName')
          .populate('branchId', 'name')
          .populate('requestedBy', 'firstName lastName');

        return NextResponse.json(
          {
            message: 'Lab test created successfully',
            labTest: populatedLabTest
          },
          { status: 201 }
        );

      } catch (error: any) {
        console.error('Create lab test error:', error);

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
          { error: 'Failed to create lab test', message: error.message },
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
      const patientId = searchParams.get('patient');
      const doctorId = searchParams.get('doctor');
      const visitId = searchParams.get('visit');
      const status = searchParams.get('status');
      const priority = searchParams.get('priority');
      const category = searchParams.get('category');

      const query: any = {};

      if (search) {
        query.$or = [
          { testNumber: { $regex: search, $options: 'i' } },
          { testName: { $regex: search, $options: 'i' } },
          { testCategory: { $regex: search, $options: 'i' } }
        ];
      }

      if (branchId) {
        query.branchId = branchId;
      }

      if (patientId) {
        query.patient = patientId;
      }

      if (doctorId) {
        query.doctor = doctorId;
      }

      if (visitId) {
        query.visit = visitId;
      }

      if (status && ['pending', 'in_progress', 'completed', 'cancelled'].includes(status)) {
        query.status = status;
      }

      if (priority && ['routine', 'urgent', 'stat'].includes(priority)) {
        query.priority = priority;
      }

      if (category) {
        query.testCategory = { $regex: category, $options: 'i' };
      }

      const allowCrossBranch = true;
      applyBranchFilter(query, session.user, allowCrossBranch);

      const skip = (page - 1) * limit;

      const [labTests, totalLabTestsCount] = await Promise.all([
        LabTest.find(query)
          .populate('patient', 'firstName lastName patientId phoneNumber gender profileImage')
          .populate('doctor', 'firstName lastName profileImage')
          .populate('branchId', 'name')
          .populate('requestedBy', 'firstName lastName')
          .populate('result.performedBy', 'firstName lastName')
          .sort({ requestedAt: -1 })
          .lean(),
        LabTest.countDocuments(query)
      ]);

      const PatientVisit = (await import('@/models/PatientVisit')).default;
      
      const branchFilterForVisits: any = {};
      const userBranchId = session.user.branch?._id || session.user.branch;
      if (userBranchId) {
        branchFilterForVisits.branchId = userBranchId;
      }

      const labQueueQuery: any = {
        ...branchFilterForVisits,
        status: 'in_progress',
        currentStage: 'lab'
      };

      if (patientId) {
        labQueueQuery.patient = patientId;
      }

      const visitsInQueue = await PatientVisit.find(labQueueQuery)
        .populate('patient', 'firstName lastName patientId phoneNumber gender profileImage')
        .populate('assignedDoctor', 'firstName lastName profileImage')
        .populate('branchId', 'name')
        .sort({ visitDate: 1 })
        .lean();

      const visitLabTestIds = new Set(labTests.map((test: any) => test.visit?.toString()));
      const visitsWithoutLabTests = visitsInQueue.filter(
        (visit: any) => !visitLabTestIds.has(visit._id.toString())
      );

      const formattedVisits = visitsWithoutLabTests.map((visit: any) => ({
        _id: visit._id,
        testNumber: `QUEUE-${visit.visitNumber || visit._id.toString().slice(-6)}`,
        patient: visit.patient,
        doctor: visit.assignedDoctor,
        visit: visit._id,
        branchId: visit.branchId,
        testName: 'Lab Test Required',
        testCategory: 'General',
        description: 'Patient in lab queue - test not yet created',
        priority: 'routine',
        status: 'pending',
        requestedAt: visit.visitDate || new Date(),
        requestedBy: null,
        result: null,
        isQueuedVisit: true
      }));

      const combinedResults = [...labTests, ...formattedVisits];
      const totalCount = totalLabTestsCount + visitsWithoutLabTests.length;

      const paginatedResults = combinedResults
        .sort((a: any, b: any) => {
          const dateA = new Date(a.requestedAt || a.visitDate || 0).getTime();
          const dateB = new Date(b.requestedAt || b.visitDate || 0).getTime();
          return dateB - dateA;
        })
        .slice(skip, skip + limit);

      const pagination = buildPaginationResponse(page, totalCount, limit);

      return NextResponse.json({
        labTests: paginatedResults,
        pagination
      });

    } catch (error: any) {
      console.error('Get lab tests error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch lab tests', message: error.message },
        { status: 500 }
      );
    }
  });
}
