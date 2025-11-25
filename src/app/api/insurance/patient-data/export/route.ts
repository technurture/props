import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/dbConnect";
import PatientVisit from "@/models/PatientVisit";
import Patient from "@/models/Patient";
import Billing from "@/models/Billing";
import Insurance from "@/models/Insurance";
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

    const insurance = await Insurance.findById(insuranceId);
    if (!insurance) {
      return NextResponse.json(
        { error: "Insurance not found" },
        { status: 404 }
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
        const csv = `Insurance Provider,Patient ID,Patient Name,Policy Number,Visit Number,Visit Date,Visit Type,Services,Total Expenses,Status\n`;
        return new NextResponse(csv, {
          headers: {
            'Content-Type': 'text/csv',
            'Content-Disposition': `attachment; filename=insurance_patient_data_${insurance.code}_${new Date().toISOString().split('T')[0]}.csv`,
          },
        });
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

    let csv = `Insurance Provider,Patient ID,Patient Name,Policy Number,Visit Number,Visit Date,Visit Type,Consultations,Lab Tests,Drugs,Total Expenses,Status\n`;

    visits
      .filter(visit => visit.patient && (visit.patient as any).insurance)
      .forEach(visit => {
        const patient = visit.patient as any;
        const billing = billingMap.get(visit._id?.toString());
        
        const consultations = visit.stages?.doctor?.diagnosis ? 1 : 0;
        const labTests = visit.stages?.doctor?.labOrders?.length || 0;
        const prescriptions = visit.stages?.doctor?.prescriptions?.length || 0;
        const totalExpenses = billing?.totalAmount || 0;

        const patientName = `${patient.firstName} ${patient.lastName}`.replace(/,/g, '');
        const visitDate = new Date(visit.visitDate).toLocaleDateString();
        
        csv += `"${insurance.name}","${patient.patientId}","${patientName}","${patient.insurance?.policyNumber || 'N/A'}","${visit.visitNumber}","${visitDate}","${visit.visitType || 'outpatient'}",${consultations},${labTests},${prescriptions},"₦${totalExpenses.toLocaleString()}","${visit.status}"\n`;
      });

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename=insurance_patient_data_${insurance.code}_${new Date().toISOString().split('T')[0]}.csv`,
      },
    });
  } catch (error: any) {
    console.error("Error exporting insurance patient data:", error);
    return NextResponse.json(
      { error: "Failed to export patient data", details: error.message },
      { status: 500 }
    );
  }
}
