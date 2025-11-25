import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import PatientVisit from '@/models/PatientVisit';
import LabTest from '@/models/LabTest';
import { requireAuth, UserRole } from '@/lib/middleware/auth';

export async function POST(req: NextRequest) {
  return requireAuth(req, async (req: NextRequest, session: any) => {
    try {
      await dbConnect();

      const body = await req.json();

      if (!body.visitId) {
        return NextResponse.json(
          { error: 'Visit ID is required' },
          { status: 400 }
        );
      }

      if (!body.labResults || !Array.isArray(body.labResults) || body.labResults.length === 0) {
        return NextResponse.json(
          { error: 'At least one lab result is required' },
          { status: 400 }
        );
      }

      const userRole = session.user.role as UserRole;

      if (userRole !== UserRole.LAB && userRole !== UserRole.ADMIN) {
        return NextResponse.json(
          { error: 'Only lab technicians can clock in and record lab results' },
          { status: 403 }
        );
      }

      const visit = await PatientVisit.findById(body.visitId)
        .populate('patient', 'patientId firstName lastName phoneNumber email');

      if (!visit) {
        return NextResponse.json(
          { error: 'Visit not found' },
          { status: 404 }
        );
      }

      if (visit.status !== 'in_progress') {
        return NextResponse.json(
          { error: 'Visit is not in progress' },
          { status: 400 }
        );
      }

      if (visit.currentStage !== 'lab') {
        return NextResponse.json(
          { 
            error: `Cannot clock in. Patient is currently at ${visit.currentStage} stage`,
            currentStage: visit.currentStage
          },
          { status: 400 }
        );
      }

      if (visit.stages.lab?.clockedInAt) {
        return NextResponse.json(
          { error: 'Lab has already clocked in for this visit' },
          { status: 400 }
        );
      }

      const updateData: any = {
        'stages.lab.clockedInBy': session.user.id,
        'stages.lab.clockedInAt': new Date(),
        'stages.lab.labResults': body.labResults
      };

      if (body.notes && body.notes.trim()) {
        updateData['stages.lab.notes'] = body.notes.trim();
      }

      const updatedVisit = await PatientVisit.findByIdAndUpdate(
        body.visitId,
        { $set: updateData },
        { new: true }
      )
        .populate('patient', 'patientId firstName lastName phoneNumber email dateOfBirth gender')
        .populate('appointment')
        .populate('branchId', 'name address city state')
        .populate('assignedDoctor', 'firstName lastName email')
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

      // Update LabTest documents with results
      for (const labResult of body.labResults) {
        if (labResult.labTestId) {
          await LabTest.findByIdAndUpdate(
            labResult.labTestId,
            {
              status: 'completed',
              result: {
                findings: labResult.result,
                normalRange: labResult.normalRange || '',
                remarks: labResult.remarks || '',
                performedBy: session.user.id,
                completedAt: new Date()
              }
            },
            { new: true }
          );
        }
      }

      return NextResponse.json(
        {
          message: 'Lab results recorded and clocked in successfully',
          visit: updatedVisit
        },
        { status: 200 }
      );

    } catch (error: any) {
      console.error('Lab clock-in error:', error);
      return NextResponse.json(
        { error: 'Failed to clock in and record lab results', message: error.message },
        { status: 500 }
      );
    }
  });
}
