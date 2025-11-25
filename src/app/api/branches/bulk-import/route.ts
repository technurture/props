import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Branch from '@/models/Branch';
import User from '@/models/User';
import { checkRole, UserRole } from '@/lib/middleware/auth';
import { ValidationError } from '@/lib/bulk-import/schemas';

interface ImportRow {
  name: string;
  code?: string;
  address: string;
  city: string;
  state: string;
  country: string;
  phone: string;
  email: string;
  isActive?: boolean;
}

interface ImportResult {
  success: number;
  failed: number;
  errors: ValidationError[];
}

export async function POST(req: NextRequest) {
  return checkRole([UserRole.ADMIN])(
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
        };

        for (let i = 0; i < data.length; i++) {
          const row: ImportRow = data[i];
          const rowNumber = i + 4;

          try {
            if (!row.name || typeof row.name !== 'string') {
              result.errors.push({
                rowNumber,
                field: 'Branch Name',
                message: 'Branch name is required and must be a string',
                value: row.name,
              });
              result.failed++;
              continue;
            }

            if (!row.address || typeof row.address !== 'string') {
              result.errors.push({
                rowNumber,
                field: 'Address',
                message: 'Address is required and must be a string',
                value: row.address,
              });
              result.failed++;
              continue;
            }

            if (!row.city || typeof row.city !== 'string') {
              result.errors.push({
                rowNumber,
                field: 'City',
                message: 'City is required and must be a string',
                value: row.city,
              });
              result.failed++;
              continue;
            }

            if (!row.state || typeof row.state !== 'string') {
              result.errors.push({
                rowNumber,
                field: 'State',
                message: 'State is required and must be a string',
                value: row.state,
              });
              result.failed++;
              continue;
            }

            if (!row.country || typeof row.country !== 'string') {
              result.errors.push({
                rowNumber,
                field: 'Country',
                message: 'Country is required and must be a string',
                value: row.country,
              });
              result.failed++;
              continue;
            }

            if (!row.phone || typeof row.phone !== 'string') {
              result.errors.push({
                rowNumber,
                field: 'Phone',
                message: 'Phone is required and must be a string',
                value: row.phone,
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

            let branchCode = row.code;
            if (!branchCode) {
              branchCode = row.name
                .toUpperCase()
                .replace(/[^A-Z0-9]/g, '')
                .substring(0, 10);
              if (!branchCode) {
                branchCode = 'BR' + Date.now().toString().substring(0, 8);
              }
            } else {
              branchCode = branchCode.toUpperCase().trim();
            }

            const branchData: any = {
              name: row.name.trim(),
              code: branchCode,
              address: row.address.trim(),
              city: row.city.trim(),
              state: row.state.trim(),
              country: row.country.trim(),
              phone: row.phone.trim(),
              email: row.email.toLowerCase().trim(),
              isActive: row.isActive !== undefined ? row.isActive : true,
            };

            const existingBranch = await Branch.findOne({
              code: branchData.code,
            });

            if (existingBranch) {
              await Branch.findByIdAndUpdate(
                existingBranch._id,
                branchData,
                { new: true, runValidators: true }
              );
            } else {
              await Branch.create(branchData);
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
