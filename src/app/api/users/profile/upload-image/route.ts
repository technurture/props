import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';
import { requireAuth } from '@/lib/middleware/auth';
import { cloudinaryService } from '@/lib/services/cloudinary';

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/png', 'image/gif'];

export async function POST(req: NextRequest) {
  return requireAuth(req, async (req: NextRequest, session: any) => {
    try {
      await dbConnect();

      const formData = await req.formData();
      const file = formData.get('file') as File;

      if (!file) {
        return NextResponse.json(
          { error: 'No file provided' },
          { status: 400 }
        );
      }

      if (!ALLOWED_FILE_TYPES.includes(file.type)) {
        return NextResponse.json(
          { error: 'Invalid file type. Only JPEG, PNG, and GIF are allowed.' },
          { status: 400 }
        );
      }

      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          { error: 'File size exceeds 5MB limit' },
          { status: 400 }
        );
      }

      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      const base64File = `data:${file.type};base64,${buffer.toString('base64')}`;

      const uploadResult = await cloudinaryService.uploadFile(base64File, {
        folder: 'user-profiles',
        resource_type: 'image',
        transformation: {
          width: 500,
          height: 500,
          crop: 'limit',
          quality: 'auto:good'
        }
      });

      const updatedUser = await User.findByIdAndUpdate(
        session.user.id,
        { profileImage: uploadResult.secure_url },
        { new: true }
      ).lean() as any;

      if (!updatedUser) {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        message: 'Profile image uploaded successfully',
        profileImage: uploadResult.secure_url,
        user: {
          id: updatedUser._id,
          profileImage: updatedUser.profileImage
        }
      });

    } catch (error: any) {
      console.error('Profile image upload error:', error);
      return NextResponse.json(
        { error: 'Failed to upload profile image', message: error.message },
        { status: 500 }
      );
    }
  });
}

export async function DELETE(req: NextRequest) {
  return requireAuth(req, async (req: NextRequest, session: any) => {
    try {
      await dbConnect();

      const updatedUser = await User.findByIdAndUpdate(
        session.user.id,
        { profileImage: null },
        { new: true }
      ).lean() as any;

      if (!updatedUser) {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        message: 'Profile image removed successfully',
        user: {
          id: updatedUser._id,
          profileImage: null
        }
      });

    } catch (error: any) {
      console.error('Profile image removal error:', error);
      return NextResponse.json(
        { error: 'Failed to remove profile image', message: error.message },
        { status: 500 }
      );
    }
  });
}
