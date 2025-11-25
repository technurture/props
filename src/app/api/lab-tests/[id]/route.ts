import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import LabTest from '@/models/LabTest';
import { requireAuth, checkRole, UserRole } from '@/lib/middleware/auth';
import { canAccessResource } from '@/lib/utils/queryHelpers';
import mongoose from 'mongoose';
import { LabTestLean, getBranchId } from '@/types/db';

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
          { error: 'Invalid lab test ID' },
          { status: 400 }
        );
      }

      const labTest = await LabTest.findById(id)
        .populate('patient', 'firstName lastName patientId phoneNumber email gender profileImage')
        .populate('doctor', 'firstName lastName profileImage')
        .populate('branch', 'name address city state')
        .populate('visit')
        .populate('requestedBy', 'firstName lastName')
        .populate('result.performedBy', 'firstName lastName')
        .lean<LabTestLean>();

      if (!labTest) {
        return NextResponse.json(
          { error: 'Lab test not found' },
          { status: 404 }
        );
      }

      const testBranchId = getBranchId(labTest.branch);
      
      if (!canAccessResource(session.user, testBranchId)) {
        return NextResponse.json(
          { error: 'Forbidden. You do not have access to this lab test.' },
          { status: 403 }
        );
      }

      return NextResponse.json({ labTest });

    } catch (error: any) {
      console.error('Get lab test error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch lab test', message: error.message },
        { status: 500 }
      );
    }
  });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return checkRole([UserRole.LAB, UserRole.ADMIN])(
    req,
    async (req: NextRequest, session: any) => {
      try {
        await dbConnect();

        const { id } = await params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
          return NextResponse.json(
            { error: 'Invalid lab test ID' },
            { status: 400 }
          );
        }

        const existingLabTest = await LabTest.findById(id);

        if (!existingLabTest) {
          return NextResponse.json(
            { error: 'Lab test not found' },
            { status: 404 }
          );
        }

        const hasAccess = canAccessResource(session.user, existingLabTest.branch?.toString());
        if (!hasAccess) {
          return NextResponse.json(
            { error: 'Forbidden. You do not have access to this branch resource.' },
            { status: 403 }
          );
        }

        const body = await req.json();

        const updateData: any = {};

        const allowedFields = [
          'testName',
          'testCategory',
          'description',
          'priority',
          'status'
        ];

        allowedFields.forEach(field => {
          if (body[field] !== undefined) {
            updateData[field] = body[field];
          }
        });

        if (body.result) {
          updateData.result = {
            findings: body.result.findings,
            normalRange: body.result.normalRange,
            remarks: body.result.remarks,
            attachments: body.result.attachments || [],
            performedBy: session.user.id,
            completedAt: new Date()
          };

          if (!updateData.status) {
            updateData.status = 'completed';
          }
        }

        const updatedLabTest = await LabTest.findByIdAndUpdate(
          id,
          { $set: updateData },
          { new: true, runValidators: true }
        )
          .populate('patient', 'firstName lastName patientId gender profileImage')
          .populate('doctor', 'firstName lastName profileImage')
          .populate('branch', 'name')
          .populate('requestedBy', 'firstName lastName')
          .populate('result.performedBy', 'firstName lastName');

        return NextResponse.json({
          message: 'Lab test updated successfully',
          labTest: updatedLabTest
        });

      } catch (error: any) {
        console.error('Update lab test error:', error);

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
          { error: 'Failed to update lab test', message: error.message },
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
            { error: 'Invalid lab test ID' },
            { status: 400 }
          );
        }

        const labTest = await LabTest.findById(id);

        if (!labTest) {
          return NextResponse.json(
            { error: 'Lab test not found' },
            { status: 404 }
          );
        }

        const hasAccess = canAccessResource(session.user, labTest.branch?.toString());
        if (!hasAccess) {
          return NextResponse.json(
            { error: 'Forbidden. You do not have access to this branch resource.' },
            { status: 403 }
          );
        }

        await LabTest.findByIdAndUpdate(
          id,
          { $set: { status: 'cancelled' } },
          { new: true }
        );

        return NextResponse.json({
          message: 'Lab test cancelled successfully',
          testNumber: labTest.testNumber
        });

      } catch (error: any) {
        console.error('Cancel lab test error:', error);
        return NextResponse.json(
          { error: 'Failed to cancel lab test', message: error.message },
          { status: 500 }
        );
      }
    }
  );
}
