import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/dbConnect";
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

    await dbConnect();

    const branchId = typeof session.user.branch === 'object' 
      ? session.user.branch._id 
      : session.user.branch;

    const insurances = await Insurance.find({ 
      branchId,
      isActive: true 
    })
      .populate('createdBy', 'firstName lastName')
      .sort({ name: 1 });

    return NextResponse.json(insurances);
  } catch (error: any) {
    console.error("Error fetching insurances:", error);
    return NextResponse.json(
      { error: "Failed to fetch insurances", details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    if (session.user.role !== UserRole.ADMIN) {
      return NextResponse.json(
        { error: "Only admins can create insurance providers" },
        { status: 403 }
      );
    }

    await dbConnect();

    const data = await req.json();

    const branchId = data.branchId || 
      (typeof session.user.branch === 'object' 
        ? session.user.branch._id 
        : session.user.branch);

    const insurance = await Insurance.create({
      ...data,
      branchId,
      createdBy: session.user.id
    });

    const populatedInsurance = await Insurance.findById(insurance._id)
      .populate('createdBy', 'firstName lastName');

    return NextResponse.json(populatedInsurance, { status: 201 });
  } catch (error: any) {
    console.error("Error creating insurance:", error);
    
    if (error.code === 11000) {
      return NextResponse.json(
        { error: "Insurance code already exists" },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: "Failed to create insurance", details: error.message },
      { status: 500 }
    );
  }
}
