import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';
import Branch from '@/models/Branch';
import { checkRole, UserRole } from '@/lib/middleware/auth';
import { ValidationError } from '@/lib/bulk-import/schemas';
import bcrypt from 'bcryptjs';

interface ImportRow {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  role: string;
  password?: string;
  specialization?: string;
  licenseNumber?: string;
  department?: string;
  isActive?: boolean;
}

interface ImportResult {
  success: number;
  failed: number;
  errors: ValidationError[];
  passwords?: Array<{ email: string; password: string; name: string }>;
}

function generateSecurePassword(): string {
  const length = 12;
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
  let password = '';
  const upperCase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowerCase = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const special = '!@#$%^&*';

  password += upperCase[Math.floor(Math.random() * upperCase.length)];
  password += lowerCase[Math.floor(Math.random() * lowerCase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += special[Math.floor(Math.random() * special.length)];

  for (let i = password.length; i < length; i++) {
    password += charset[Math.floor(Math.random() * charset.length)];
  }

  return password
    .split('')
    .sort(() => Math.random() - 0.5)
    .join('');
}

export async function POST(req: NextRequest) {
  return checkRole([UserRole.ADMIN, UserRole.MANAGER])(
    req,
    async (req: NextRequest, session: any) => {
      try {
        await dbConnect();

        const body = await req.json();
        const { data } = body;

        if (!data || !Array.isArray(data) || data.length === 0) {
          return NextResponse.json(
            { error: 'No data provided for import' },
            { status: 400 }
          );
        }

        if (data.length > 1000) {
          return NextResponse.json(
            { error: 'Maximum 1000 records allowed per import' },
            { status: 400 }
          );
        }

        const result: ImportResult = {
          success: 0,
          failed: 0,
          errors: [],
          passwords: [],
        };

        const branchId = session.user.branch._id;

        const validRoles = [
          'ADMIN',
          'MANAGER',
          'FRONT_DESK',
          'NURSE',
          'DOCTOR',
          'LAB',
          'PHARMACY',
          'BILLING',
          'ACCOUNTING',
        ];

        for (let i = 0; i < data.length; i++) {
          const row: ImportRow = data[i];
          const rowNumber = i + 4;

          try {
            if (!row.firstName || typeof row.firstName !== 'string') {
              result.errors.push({
                rowNumber,
                field: 'First Name',
                message: 'First name is required and must be a string',
                value: row.firstName,
              });
              result.failed++;
              continue;
            }

            if (!row.lastName || typeof row.lastName !== 'string') {
              result.errors.push({
                rowNumber,
                field: 'Last Name',
                message: 'Last name is required and must be a string',
                value: row.lastName,
              });
              result.failed++;
              continue;
            }

            if (!row.email || typeof row.email !== 'string') {
              result.errors.push({
                rowNumber,
                field: 'Email',
                message: 'Email is required and must be a string',
                value: row.email,
              });
              result.failed++;
              continue;
            }

            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(row.email)) {
              result.errors.push({
                rowNumber,
                field: 'Email',
                message: 'Invalid email format',
                value: row.email,
              });
              result.failed++;
              continue;
            }

            if (!row.phoneNumber || typeof row.phoneNumber !== 'string') {
              result.errors.push({
                rowNumber,
                field: 'Phone Number',
                message: 'Phone number is required and must be a string',
                value: row.phoneNumber,
              });
              result.failed++;
              continue;
            }

            if (!row.role || !validRoles.includes(row.role)) {
              result.errors.push({
                rowNumber,
                field: 'Role',
                message: `Role must be one of: ${validRoles.join(', ')}`,
                value: row.role,
              });
              result.failed++;
              continue;
            }

            if (row.password && 
                row.password.trim() !== '' && 
                row.password.trim() !== '[KEEP_EXISTING]' &&
                row.password.trim().length < 6) {
              result.errors.push({
                rowNumber,
                field: 'Password',
                message: 'Password must be at least 6 characters long or "[KEEP_EXISTING]" to keep existing password',
                value: row.password,
              });
              result.failed++;
              continue;
            }

            const userData: any = {
              firstName: row.firstName.trim(),
              lastName: row.lastName.trim(),
              email: row.email.toLowerCase().trim(),
              phoneNumber: row.phoneNumber.trim(),
              role: row.role as UserRole,
              branchId,
              isActive: row.isActive !== undefined ? row.isActive : true,
            };

            const shouldUpdatePassword = row.password && 
              row.password.trim() !== '' && 
              row.password.trim() !== '[KEEP_EXISTING]';

            const existingUser = await User.findOne({
              email: userData.email,
            });

            if (existingUser) {
              if (shouldUpdatePassword) {
                userData.password = row.password!.trim();
                const updatedUser = await User.findById(existingUser._id);
                Object.assign(updatedUser, userData);
                await updatedUser.save();
                
                result.passwords!.push({
                  email: userData.email,
                  password: row.password!.trim(),
                  name: `${userData.firstName} ${userData.lastName}`,
                });
              } else {
                await User.findByIdAndUpdate(
                  existingUser._id,
                  userData,
                  { new: true, runValidators: true }
                );
              }
            } else {
              const passwordToUse = shouldUpdatePassword 
                ? row.password!.trim() 
                : generateSecurePassword();
              
              userData.password = passwordToUse;

              await User.create(userData);

              result.passwords!.push({
                email: userData.email,
                password: passwordToUse,
                name: `${userData.firstName} ${userData.lastName}`,
              });
            }

            result.success++;
          } catch (error: any) {
            console.error(`Error importing row ${rowNumber}:`, error);
            result.errors.push({
              rowNumber,
              field: 'General',
              message: error.message || 'Failed to import this record',
            });
            result.failed++;
          }
        }

        return NextResponse.json(result, { status: 200 });
      } catch (error: any) {
        console.error('Error in bulk import:', error);
        return NextResponse.json(
          { error: error.message || 'Failed to import data' },
          { status: 500 }
        );
      }
    }
  );
}
