import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Insurance from '@/models/Insurance';
import { checkRole, UserRole } from '@/lib/middleware/auth';
import { ValidationError } from '@/lib/bulk-import/schemas';

interface ImportRow {
  providerName: string;
  providerCode?: string;
  contactEmail: string;
  contactPhone: string;
  coverageType?: string;
  isActive?: boolean;
}

interface ImportResult {
  success: number;
  failed: number;
  errors: ValidationError[];
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
        };

        const branchId = session.user.branch._id;
        const userId = session.user.id;

        for (let i = 0; i < data.length; i++) {
          const row: ImportRow = data[i];
          const rowNumber = i + 4;

          try {
            if (!row.providerName || typeof row.providerName !== 'string') {
              result.errors.push({
                rowNumber,
                field: 'Provider Name',
                message: 'Provider name is required and must be a string',
                value: row.providerName,
              });
              result.failed++;
              continue;
            }

            if (!row.contactEmail || typeof row.contactEmail !== 'string') {
              result.errors.push({
                rowNumber,
                field: 'Contact Email',
                message: 'Contact email is required and must be a string',
                value: row.contactEmail,
              });
              result.failed++;
              continue;
            }

            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(row.contactEmail)) {
              result.errors.push({
                rowNumber,
                field: 'Contact Email',
                message: 'Invalid email format',
                value: row.contactEmail,
              });
              result.failed++;
              continue;
            }

            if (!row.contactPhone || typeof row.contactPhone !== 'string') {
              result.errors.push({
                rowNumber,
                field: 'Contact Phone',
                message: 'Contact phone is required and must be a string',
                value: row.contactPhone,
              });
              result.failed++;
              continue;
            }

            let insuranceCode = row.providerCode;
            if (!insuranceCode) {
              insuranceCode = row.providerName
                .toUpperCase()
                .replace(/[^A-Z0-9]/g, '')
                .substring(0, 10);
              if (!insuranceCode) {
                insuranceCode = 'INS' + Date.now().toString().substring(0, 7);
              }
            } else {
              insuranceCode = insuranceCode.toUpperCase().trim();
            }

            const insuranceData: any = {
              name: row.providerName.trim(),
              code: insuranceCode,
              type: 'Other',
              coveragePercentage: 100,
              contactEmail: row.contactEmail.toLowerCase().trim(),
              contactPhone: row.contactPhone.trim(),
              branchId,
              createdBy: userId,
              isActive: row.isActive !== undefined ? row.isActive : true,
            };

            if (row.coverageType) {
              insuranceData.description = row.coverageType.trim();
            }

            const existingInsurance = await Insurance.findOne({
              code: insuranceData.code,
              branchId,
            });

            if (existingInsurance) {
              await Insurance.findByIdAndUpdate(
                existingInsurance._id,
                insuranceData,
                { new: true, runValidators: true }
              );
            } else {
              await Insurance.create(insuranceData);
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
