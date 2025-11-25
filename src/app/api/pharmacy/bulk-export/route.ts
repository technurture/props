import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Pharmacy from '@/models/Pharmacy';
import { checkRole, UserRole } from '@/lib/middleware/auth';

export async function GET(req: NextRequest) {
  return checkRole([
    UserRole.ADMIN,
    UserRole.MANAGER,
    UserRole.PHARMACY,
  ])(req, async (req: NextRequest, session: any) => {
    try {
      await dbConnect();

      const { searchParams } = new URL(req.url);
      const category = searchParams.get('category');
      const isActive = searchParams.get('isActive');

      const query: any = {
        branchId: session.user.branch._id,
      };

      if (category) {
        query.category = category;
      }

      if (isActive !== null && isActive !== undefined && isActive !== '') {
        query.isActive = isActive === 'true';
      }

      const products = await Pharmacy.find(query)
        .select(
          'productId productName genericName category manufacturer description price offerPrice purchaseDate expiryDate stock unit minStockLevel batchNumber isActive'
        )
        .sort({ productId: 1 })
        .lean();

      const exportData = products.map((product: any) => ({
        productId: product.productId,
        productName: product.productName,
        genericName: product.genericName || '',
        category: product.category || '',
        manufacturer: product.manufacturer || '',
        description: product.description || '',
        price: product.price,
        offerPrice: product.offerPrice || '',
        purchaseDate: product.purchaseDate
          ? new Date(product.purchaseDate).toISOString().split('T')[0]
          : '',
        expiryDate: product.expiryDate
          ? new Date(product.expiryDate).toISOString().split('T')[0]
          : '',
        stock: product.stock,
        unit: product.unit,
        minStockLevel: product.minStockLevel || '',
        batchNumber: product.batchNumber || '',
        isActive: product.isActive,
      }));

      return NextResponse.json(exportData, { status: 200 });
    } catch (error: any) {
      console.error('Error in bulk export:', error);
      return NextResponse.json(
        { error: error.message || 'Failed to export data' },
        { status: 500 }
      );
    }
  });
}
