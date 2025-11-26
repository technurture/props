import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Tenant from '@/models/Tenant';
import User from '@/models/User';
import Branch from '@/models/Branch';
import { generateSlug, isSlugAvailable } from '@/lib/tenant';
import { UserRole } from '@/types/emr';

export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const body = await request.json();
    const { organizationName, firstName, lastName, email, password, phoneNumber } = body;

    if (!organizationName || !firstName || !lastName || !email || !password || !phoneNumber) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters' },
        { status: 400 }
      );
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 400 }
      );
    }

    let slug = generateSlug(organizationName);
    let slugCounter = 1;
    
    while (!(await isSlugAvailable(slug))) {
      slug = `${generateSlug(organizationName)}-${slugCounter}`;
      slugCounter++;
    }

    const tenant = new Tenant({
      name: organizationName,
      slug,
      plan: 'trial',
      settings: {
        companyName: organizationName,
      },
    });

    const defaultBranch = new Branch({
      name: 'Main Branch',
      code: 'MAIN',
      address: '',
      city: '',
      state: '',
      country: 'Nigeria',
      phoneNumber: phoneNumber,
      email: email,
      isActive: true,
      tenantId: tenant._id,
    });

    await defaultBranch.save();

    const adminUser = new User({
      email: email.toLowerCase(),
      password,
      firstName,
      lastName,
      phoneNumber,
      role: UserRole.ADMIN,
      branchId: defaultBranch._id,
      isActive: true,
      tenantId: tenant._id,
    });

    await adminUser.save();

    tenant.ownerId = adminUser._id;
    await tenant.save();

    return NextResponse.json({
      success: true,
      message: 'Account created successfully',
      tenant: {
        id: tenant._id,
        name: tenant.name,
        slug: tenant.slug,
      },
    });
  } catch (error: any) {
    console.error('Signup error:', error);
    
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern || {})[0];
      return NextResponse.json(
        { error: `This ${field} is already in use` },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error.message || 'Failed to create account' },
      { status: 500 }
    );
  }
}
