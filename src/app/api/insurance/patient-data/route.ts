import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/dbConnect";
import PatientVisit from "@/models/PatientVisit";
import Patient from "@/models/Patient";
import Billing from "@/models/Billing";
import { UserRole } from "@/types/emr";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const allowedRoles = [UserRole.ADMIN, UserRole.MANAGER, UserRole.ACCOUNTING, UserRole.BILLING];
    if (!allowedRoles.includes(session.user.role as UserRole)) {
      return NextResponse.json(
        { error: "You do not have permission to access this resource" },
        { status: 403 }
      );
    }

    await dbConnect();

    const { searchParams } = new URL(req.url);
    const insuranceId = searchParams.get('insuranceId');
    const search = searchParams.get('search');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    if (!insuranceId) {
      return NextResponse.json(
        { error: "Insurance ID is required" },
        { status: 400 }
      );
    }

    const branchId = typeof session.user.branch === 'object' 
      ? session.user.branch._id 
      : session.user.branch;

    const patientQuery: any = {
      'insurance.provider': insuranceId,
    };

    if (session.user.role === UserRole.MANAGER || 
        (session.user.role !== UserRole.ADMIN && branchId)) {
      patientQuery.branchId = branchId;
    }

    const patientSearchQuery: any = {};
    if (session.user.role === UserRole.MANAGER || 
        (session.user.role !== UserRole.ADMIN && branchId)) {
      patientSearchQuery.branchId = branchId;
    }

    if (search) {
      const patients = await Patient.find({
        ...patientSearchQuery,
        $or: [
          { firstName: { $regex: search, $options: 'i' } },
          { lastName: { $regex: search, $options: 'i' } },
          { patientId: { $regex: search, $options: 'i' } },
          { 'insurance.policyNumber': { $regex: search, $options: 'i' } },
        ]
      }).select('_id');
      
      const patientIds = patients.map(p => p._id);
      if (patientIds.length > 0) {
        patientQuery.patient = { $in: patientIds };
      } else {
        return NextResponse.json({ data: [] });
      }
    }

    const dateQuery: any = {};
    if (startDate) {
      dateQuery.$gte = new Date(startDate);
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      dateQuery.$lte = end;
    }
    if (startDate || endDate) {
      patientQuery.visitDate = dateQuery;
    }

    const query = patientQuery;

    const visits = await PatientVisit.find(query)
      .populate({
        path: 'patient',
        select: 'patientId firstName lastName phoneNumber insurance',
      })
      .sort({ visitDate: -1 })
      .lean();

    const visitIds = visits.map(v => v._id);
    const billingRecords = await Billing.find({
      visit: { $in: visitIds }
    }).lean();

    const billingMap = new Map();
    billingRecords.forEach(billing => {
      const visitId = billing.visit?.toString();
      if (visitId) {
        billingMap.set(visitId, billing);
      }
    });

    const patientData = visits
      .filter(visit => visit.patient && (visit.patient as any).insurance)
      .map(visit => {
        const patient = visit.patient as any;
        const billing = billingMap.get(visit._id?.toString());
        
        const services = {
          consultations: visit.stages?.doctor?.diagnosis ? [visit.stages.doctor.diagnosis] : [],
          labTests: visit.stages?.doctor?.labOrders || [],
          prescriptions: visit.stages?.doctor?.prescriptions || [],
          procedures: [],
        };

        const totalExpenses = billing?.totalAmount || 0;

        return {
          _id: visit._id,
          patient: {
            _id: patient._id,
            patientId: patient.patientId,
            firstName: patient.firstName,
            lastName: patient.lastName,
            phoneNumber: patient.phoneNumber,
          },
          visitNumber: visit.visitNumber,
          visitDate: visit.visitDate,
          visitType: visit.visitType,
          currentStage: visit.currentStage,
          status: visit.status,
          services,
          totalExpenses,
          insurance: patient.insurance,
        };
      });

    return NextResponse.json({ data: patientData });
  } catch (error: any) {
    console.error("Error fetching insurance patient data:", error);
    return NextResponse.json(
      { error: "Failed to fetch patient data", details: error.message },
      { status: 500 }
    );
  }
}
