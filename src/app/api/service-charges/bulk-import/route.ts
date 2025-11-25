import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import ServiceCharge from '@/models/ServiceCharge';
import { checkRole, UserRole } from '@/lib/middleware/auth';
import { ValidationError } from '@/lib/bulk-import/schemas';

interface ImportRow {
  serviceName: string;
  category: string;
  price: number;
  billingType?: string;
  description?: string;
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

        const validCategories = [
          'consultation',
          'laboratory',
          'pharmacy',
          'procedure',
          'imaging',
          'emergency',
          'admission',
          'other',
        ];

        const validBillingTypes = ['flat_rate', 'per_day', 'per_hour'];

        for (let i = 0; i < data.length; i++) {
          const row: ImportRow = data[i];
          const rowNumber = i + 4;

          try {
            if (!row.serviceName || typeof row.serviceName !== 'string') {
              result.errors.push({
                rowNumber,
                field: 'Service Name',
                message: 'Service name is required and must be a string',
                value: row.serviceName,
              });
              result.failed++;
              continue;
            }

            if (!row.category || !validCategories.includes(row.category)) {
              result.errors.push({
                rowNumber,
                field: 'Category',
                message: `Category must be one of: ${validCategories.join(', ')}`,
                value: row.category,
              });
              result.failed++;
              continue;
            }

            if (
              row.price === undefined ||
              row.price === null ||
              typeof row.price !== 'number' ||
              row.price < 0
            ) {
              result.errors.push({
                rowNumber,
                field: 'Price',
                message: 'Price is required and must be a positive number',
                value: row.price,
              });
              result.failed++;
              continue;
            }

            if (row.billingType && !validBillingTypes.includes(row.billingType)) {
              result.errors.push({
                rowNumber,
                field: 'Billing Type',
                message: `Billing type must be one of: ${validBillingTypes.join(', ')}`,
                value: row.billingType,
              });
              result.failed++;
              continue;
            }

            const existingService = await ServiceCharge.findOne({
              serviceName: { $regex: new RegExp(`^${row.serviceName.trim()}$`, 'i') },
              category: row.category,
              branch: branchId,
            });

            if (existingService) {
              await ServiceCharge.findByIdAndUpdate(existingService._id, {
                price: row.price,
                billingType: row.billingType || existingService.billingType,
                description: row.description || existingService.description,
                isActive: row.isActive !== undefined ? row.isActive : existingService.isActive,
                updatedBy: userId,
              });

              result.success++;
            } else {
              await ServiceCharge.create({
                serviceName: row.serviceName.trim(),
                category: row.category,
                price: row.price,
                billingType: row.billingType || 'flat_rate',
                description: row.description || '',
                isActive: row.isActive !== undefined ? row.isActive : true,
                branch: branchId,
                createdBy: userId,
              });

              result.success++;
            }
          } catch (error: any) {
            console.error(`Error processing row ${rowNumber}:`, error);
            result.errors.push({
              rowNumber,
              field: 'General',
              message: error.message || 'Failed to process row',
              value: row.serviceName,
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
