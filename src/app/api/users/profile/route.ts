import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';
import { requireAuth } from '@/lib/middleware/auth';

export async function GET(req: NextRequest) {
  return requireAuth(req, async (req: NextRequest, session: any) => {
    try {
      await dbConnect();

      const user = await User.findById(session.user.id)
        .populate('branchId', 'name address city state country phone email')
        .lean() as any;

      if (!user) {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        user: {
          id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          phoneNumber: user.phoneNumber,
          role: user.role,
          profileImage: user.profileImage,
          hospitalName: user.hospitalName,
          addressLine1: user.addressLine1,
          addressLine2: user.addressLine2,
          pincode: user.pincode,
          country: user.country,
          state: user.state,
          city: user.city,
          branchId: user.branchId
        }
      });

    } catch (error: any) {
      console.error('Get user profile error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch user profile', message: error.message },
        { status: 500 }
      );
    }
  });
}

export async function PUT(req: NextRequest) {
  return requireAuth(req, async (req: NextRequest, session: any) => {
    try {
      await dbConnect();

      const body = await req.json();

      const updateData: any = {};
      const allowedFields = [
        'firstName',
        'lastName',
        'phoneNumber',
        'hospitalName',
        'addressLine1',
        'addressLine2',
        'pincode',
        'country',
        'state',
        'city'
      ];

      allowedFields.forEach(field => {
        if (body[field] !== undefined) {
          updateData[field] = body[field];
        }
      });

      if (body.email && body.email.toLowerCase() !== session.user.email.toLowerCase()) {
        const emailExists = await User.findOne({
          email: body.email.toLowerCase(),
          _id: { $ne: session.user.id }
        });

        if (emailExists) {
          return NextResponse.json(
            { error: 'Email already exists' },
            { status: 409 }
          );
        }

        updateData.email = body.email.toLowerCase();
      }

      const updatedUser = await User.findByIdAndUpdate(
        session.user.id,
        { $set: updateData },
        { new: true, runValidators: true }
      )
        .populate('branchId', 'name address city state country phone email')
        .lean() as any;

      if (!updatedUser) {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        message: 'Profile updated successfully',
        user: {
          id: updatedUser._id,
          email: updatedUser.email,
          firstName: updatedUser.firstName,
          lastName: updatedUser.lastName,
          phoneNumber: updatedUser.phoneNumber,
          role: updatedUser.role,
          profileImage: updatedUser.profileImage,
          hospitalName: updatedUser.hospitalName,
          addressLine1: updatedUser.addressLine1,
          addressLine2: updatedUser.addressLine2,
          pincode: updatedUser.pincode,
          country: updatedUser.country,
          state: updatedUser.state,
          city: updatedUser.city,
          branchId: updatedUser.branchId
        }
      });

    } catch (error: any) {
      console.error('Update user profile error:', error);

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
        { error: 'Failed to update user profile', message: error.message },
        { status: 500 }
      );
    }
  });
}
