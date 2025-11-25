import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Pharmacy from '@/models/Pharmacy';
import { checkRole, UserRole } from '@/lib/middleware/auth';
import { ValidationError } from '@/lib/bulk-import/schemas';

interface ImportRow {
  productId: string;
  productName: string;
  genericName?: string;
  category?: string;
  manufacturer?: string;
  description?: string;
  price: number;
  offerPrice?: number;
  purchaseDate: string | Date;
  expiryDate: string | Date;
  stock: number;
  unit: string;
  minStockLevel?: number;
  batchNumber?: string;
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
            if (!row.productId || typeof row.productId !== 'string') {
              result.errors.push({
                rowNumber,
                field: 'Product ID',
                message: 'Product ID is required and must be a string',
                value: row.productId,
              });
              result.failed++;
              continue;
            }

            if (!row.productName || typeof row.productName !== 'string') {
              result.errors.push({
                rowNumber,
                field: 'Product Name',
                message: 'Product name is required and must be a string',
                value: row.productName,
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

            if (!row.purchaseDate) {
              result.errors.push({
                rowNumber,
                field: 'Purchase Date',
                message: 'Purchase date is required',
                value: row.purchaseDate,
              });
              result.failed++;
              continue;
            }

            if (!row.expiryDate) {
              result.errors.push({
                rowNumber,
                field: 'Expiry Date',
                message: 'Expiry date is required',
                value: row.expiryDate,
              });
              result.failed++;
              continue;
            }

            const purchaseDate = new Date(row.purchaseDate);
            const expiryDate = new Date(row.expiryDate);

            if (isNaN(purchaseDate.getTime())) {
              result.errors.push({
                rowNumber,
                field: 'Purchase Date',
                message: 'Invalid purchase date format. Use YYYY-MM-DD',
                value: row.purchaseDate,
              });
              result.failed++;
              continue;
            }

            if (isNaN(expiryDate.getTime())) {
              result.errors.push({
                rowNumber,
                field: 'Expiry Date',
                message: 'Invalid expiry date format. Use YYYY-MM-DD',
                value: row.expiryDate,
              });
              result.failed++;
              continue;
            }

            if (expiryDate <= purchaseDate) {
              result.errors.push({
                rowNumber,
                field: 'Expiry Date',
                message: 'Expiry date must be after purchase date',
                value: row.expiryDate,
              });
              result.failed++;
              continue;
            }

            if (
              row.stock === undefined ||
              row.stock === null ||
              typeof row.stock !== 'number' ||
              row.stock < 0
            ) {
              result.errors.push({
                rowNumber,
                field: 'Stock Quantity',
                message: 'Stock is required and must be a non-negative number',
                value: row.stock,
              });
              result.failed++;
              continue;
            }

            if (!row.unit || typeof row.unit !== 'string') {
              result.errors.push({
                rowNumber,
                field: 'Unit',
                message: 'Unit is required and must be a string',
                value: row.unit,
              });
              result.failed++;
              continue;
            }

            if (row.offerPrice !== undefined && row.offerPrice !== null) {
              if (typeof row.offerPrice !== 'number' || row.offerPrice < 0) {
                result.errors.push({
                  rowNumber,
                  field: 'Offer Price',
                  message: 'Offer price must be a positive number',
                  value: row.offerPrice,
                });
                result.failed++;
                continue;
              }
            }

            if (
              row.minStockLevel !== undefined &&
              row.minStockLevel !== null
            ) {
              if (
                typeof row.minStockLevel !== 'number' ||
                row.minStockLevel < 0
              ) {
                result.errors.push({
                  rowNumber,
                  field: 'Minimum Stock Level',
                  message: 'Minimum stock level must be a non-negative number',
                  value: row.minStockLevel,
                });
                result.failed++;
                continue;
              }
            }

            const productData: any = {
              productId: row.productId.toUpperCase().trim(),
              productName: row.productName.trim(),
              price: row.price,
              purchaseDate,
              expiryDate,
              stock: row.stock,
              unit: row.unit.trim(),
              branchId,
              createdBy: userId,
              isActive: row.isActive !== undefined ? row.isActive : true,
            };

            if (row.genericName) productData.genericName = row.genericName.trim();
            if (row.category) productData.category = row.category.trim();
            if (row.manufacturer) productData.manufacturer = row.manufacturer.trim();
            if (row.description) productData.description = row.description.trim();
            if (row.offerPrice !== undefined && row.offerPrice !== null)
              productData.offerPrice = row.offerPrice;
            if (row.minStockLevel !== undefined && row.minStockLevel !== null)
              productData.minStockLevel = row.minStockLevel;
            if (row.batchNumber) productData.batchNumber = row.batchNumber.trim();

            const existingProduct = await Pharmacy.findOne({
              productId: productData.productId,
            });

            if (existingProduct) {
              await Pharmacy.findByIdAndUpdate(
                existingProduct._id,
                productData,
                { new: true, runValidators: true }
              );
            } else {
              await Pharmacy.create(productData);
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
