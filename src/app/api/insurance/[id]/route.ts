import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/dbConnect";
import Insurance from "@/models/Insurance";
import { UserRole } from "@/types/emr";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    await dbConnect();

    const { id } = await params;

    const branchId = typeof session.user.branch === 'object' 
      ? session.user.branch._id 
      : session.user.branch;

    const insurance = await Insurance.findOne({ 
      _id: id,
      branchId 
    }).populate('createdBy', 'firstName lastName');

    if (!insurance) {
      return NextResponse.json(
        { error: "Insurance not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(insurance);
  } catch (error: any) {
    console.error("Error fetching insurance:", error);
    return NextResponse.json(
      { error: "Failed to fetch insurance", details: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
        { error: "Only admins can update insurance providers" },
        { status: 403 }
      );
    }

    await dbConnect();

    const { id } = await params;

    const data = await req.json();

    const branchId = typeof session.user.branch === 'object' 
      ? session.user.branch._id 
      : session.user.branch;

    const insurance = await Insurance.findOneAndUpdate(
      { _id: id, branchId },
      { $set: data },
      { new: true, runValidators: true }
    ).populate('createdBy', 'firstName lastName');

    if (!insurance) {
      return NextResponse.json(
        { error: "Insurance not found or access denied" },
        { status: 404 }
      );
    }

    return NextResponse.json(insurance);
  } catch (error: any) {
    console.error("Error updating insurance:", error);
    
    if (error.code === 11000) {
      return NextResponse.json(
        { error: "Insurance code already exists" },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: "Failed to update insurance", details: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
        { error: "Only admins can delete insurance providers" },
        { status: 403 }
      );
    }

    await dbConnect();

    const { id } = await params;

    const branchId = typeof session.user.branch === 'object' 
      ? session.user.branch._id 
      : session.user.branch;

    const insurance = await Insurance.findOneAndUpdate(
      { _id: id, branchId },
      { $set: { isActive: false } },
      { new: true }
    );

    if (!insurance) {
      return NextResponse.json(
        { error: "Insurance not found or access denied" },
        { status: 404 }
      );
    }

    return NextResponse.json({ 
      message: "Insurance deactivated successfully",
      insurance 
    });
  } catch (error: any) {
    console.error("Error deleting insurance:", error);
    return NextResponse.json(
      { error: "Failed to delete insurance", details: error.message },
      { status: 500 }
    );
  }
}
