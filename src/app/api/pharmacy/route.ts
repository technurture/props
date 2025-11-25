import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Pharmacy from '@/models/Pharmacy';
import { checkRole, UserRole } from '@/lib/middleware/auth';
import { 
  applyBranchFilter, 
  extractPaginationParams, 
  buildPaginationResponse 
} from '@/lib/utils/queryHelpers';

export async function POST(req: NextRequest) {
  return checkRole([UserRole.PHARMACY, UserRole.ADMIN])(
    req,
    async (req: NextRequest, session: any) => {
      try {
        await dbConnect();

        const body = await req.json();

        const requiredFields = [
          'productName',
          'price',
          'purchaseDate',
          'expiryDate',
          'stock',
          'unit',
          'branchId'
        ];

        const missingFields = requiredFields.filter(field => !body[field]);
        if (missingFields.length > 0) {
          return NextResponse.json(
            { error: `Missing required fields: ${missingFields.join(', ')}` },
            { status: 400 }
          );
        }

        const lastProduct = await Pharmacy.findOne().sort({ createdAt: -1 });
        let productId = 'PR0001';
        
        if (lastProduct && lastProduct.productId) {
          const lastNumber = parseInt(lastProduct.productId.replace('PR', ''));
          productId = `PR${String(lastNumber + 1).padStart(4, '0')}`;
        }

        const productData = {
          productId,
          productName: body.productName,
          genericName: body.genericName,
          category: body.category,
          manufacturer: body.manufacturer,
          description: body.description,
          price: body.price,
          offerPrice: body.offerPrice,
          purchaseDate: new Date(body.purchaseDate),
          expiryDate: new Date(body.expiryDate),
          stock: body.stock,
          unit: body.unit,
          minStockLevel: body.minStockLevel || 10,
          batchNumber: body.batchNumber,
          branchId: body.branchId,
          createdBy: session.user.id,
          isActive: true
        };

        const product = await Pharmacy.create(productData);
        
        const populatedProduct = await Pharmacy.findById(product._id)
          .populate('branchId', 'name code city')
          .populate('createdBy', 'firstName lastName email');

        return NextResponse.json(
          { 
            message: 'Product created successfully',
            product: populatedProduct 
          },
          { status: 201 }
        );

      } catch (error: any) {
        console.error('Create product error:', error);
        
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
          { error: 'Failed to create product', message: error.message },
          { status: 500 }
        );
      }
    }
  );
}

export async function GET(req: NextRequest) {
  return checkRole([UserRole.PHARMACY, UserRole.DOCTOR, UserRole.NURSE, UserRole.ADMIN, UserRole.BILLING])(
    req,
    async (req: NextRequest, session: any) => {
      try {
        await dbConnect();

        const { searchParams } = new URL(req.url);
        const { page, limit } = extractPaginationParams(searchParams);
        const skip = (page - 1) * limit;
        
        const search = searchParams.get('search') || '';
        const category = searchParams.get('category');
        const status = searchParams.get('status');
        const branchId = searchParams.get('branchId');

        const query: any = {};

        if (search) {
          query.$or = [
            { productName: { $regex: search, $options: 'i' } },
            { genericName: { $regex: search, $options: 'i' } },
            { productId: { $regex: search, $options: 'i' } },
            { manufacturer: { $regex: search, $options: 'i' } }
          ];
        }

        if (category) {
          query.category = category;
        }

        if (status === 'active') {
          query.isActive = true;
        } else if (status === 'inactive') {
          query.isActive = false;
        }

        if (branchId) {
          query.branchId = branchId;
        }

        const allowCrossBranch = true;
        applyBranchFilter(query, session.user, allowCrossBranch);

        const totalCount = await Pharmacy.countDocuments(query);

        const products = await Pharmacy.find(query)
          .populate('branchId', 'name code city')
          .populate('createdBy', 'firstName lastName')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit);

        const paginationInfo = buildPaginationResponse(page, limit, totalCount);

        return NextResponse.json({
          products,
          pagination: paginationInfo
        });

      } catch (error: any) {
        console.error('Get products error:', error);
        return NextResponse.json(
          { error: 'Failed to fetch products', message: error.message },
          { status: 500 }
        );
      }
    }
  );
}
