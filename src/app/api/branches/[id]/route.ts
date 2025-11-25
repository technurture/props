import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Branch from '@/models/Branch';
import User from '@/models/User';
import { UserRole } from '@/types/emr';
import { requireAuth, checkRole } from '@/lib/middleware/auth';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return requireAuth(req, async (req: NextRequest, session: any) => {
    try {
      await dbConnect();

      const { id } = await params;

      const branch = await Branch.findById(id)
        .populate('manager', 'firstName lastName email phoneNumber')
        .lean() as any;

      if (!branch) {
        return NextResponse.json({ error: 'Branch not found' }, { status: 404 });
      }

      return NextResponse.json(branch);
    } catch (error: any) {
      console.error('Error fetching branch:', error);
      return NextResponse.json(
        { error: error.message || 'Failed to fetch branch' },
        { status: 500 }
      );
    }
  });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return checkRole([UserRole.ADMIN])(
    req,
    async (req: NextRequest, _session: any) => {
      try {
        await dbConnect();

        const { id } = await params;

        const body = await req.json();
        const { name, code, address, city, state, country, phone, email, manager, isActive } = body;

        const branch = await Branch.findById(id);
        if (!branch) {
          return NextResponse.json({ error: 'Branch not found' }, { status: 404 });
        }

        if (code && code.toUpperCase() !== branch.code) {
          const existingBranch = await Branch.findOne({ 
            code: code.toUpperCase(),
            _id: { $ne: id }
          });
          if (existingBranch) {
            return NextResponse.json(
              { error: 'Branch code already exists' },
              { status: 400 }
            );
          }
        }

        if (manager !== undefined) {
          const oldManagerId = branch.manager?.toString();
          const newManagerId = manager || null;

          if (newManagerId) {
            const newManager = await User.findById(newManagerId);
            if (!newManager) {
              return NextResponse.json(
                { error: 'Manager user not found' },
                { status: 404 }
              );
            }

            if (newManager.role !== UserRole.MANAGER) {
              return NextResponse.json(
                { error: 'Only users with MANAGER role can be assigned as branch managers' },
                { status: 400 }
              );
            }

            if (oldManagerId && oldManagerId !== newManagerId) {
              await User.findByIdAndUpdate(oldManagerId, {
                $unset: { assignedBranch: 1 }
              });
            }

            await User.findByIdAndUpdate(newManagerId, {
              assignedBranch: id
            });
          } else if (oldManagerId) {
            await User.findByIdAndUpdate(oldManagerId, {
              $unset: { assignedBranch: 1 }
            });
          }
        }

        const updateData: any = {};
        if (name !== undefined) updateData.name = name;
        if (code !== undefined) updateData.code = code.toUpperCase();
        if (address !== undefined) updateData.address = address;
        if (city !== undefined) updateData.city = city;
        if (state !== undefined) updateData.state = state;
        if (country !== undefined) updateData.country = country;
        if (phone !== undefined) updateData.phone = phone;
        if (email !== undefined) updateData.email = email;
        if (manager !== undefined) updateData.manager = manager || null;
        if (isActive !== undefined) updateData.isActive = isActive;

        const updatedBranch = await Branch.findByIdAndUpdate(
          id,
          updateData,
          { new: true, runValidators: true }
        ).populate('manager', 'firstName lastName email phoneNumber').lean() as any;

        return NextResponse.json(updatedBranch);
      } catch (error: any) {
        console.error('Error updating branch:', error);
        return NextResponse.json(
          { error: error.message || 'Failed to update branch' },
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
    async (req: NextRequest, _session: any) => {
      try {
        await dbConnect();

        const { id } = await params;

        const branch = await Branch.findByIdAndDelete(id);

        if (!branch) {
          return NextResponse.json({ error: 'Branch not found' }, { status: 404 });
        }

        return NextResponse.json({ 
          message: 'Branch deleted successfully',
          branch 
        });
      } catch (error: any) {
        console.error('Error deleting branch:', error);
        return NextResponse.json(
          { error: error.message || 'Failed to delete branch' },
          { status: 500 }
        );
      }
    }
  );
}
