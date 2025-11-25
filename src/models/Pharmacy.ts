import mongoose, { Document, Schema } from 'mongoose';

export interface IPharmacy extends Document {
  productId: string;
  productName: string;
  genericName?: string;
  category?: string;
  manufacturer?: string;
  description?: string;
  price: number;
  offerPrice?: number;
  purchaseDate: Date;
  expiryDate: Date;
  stock: number;
  unit: string;
  minStockLevel?: number;
  batchNumber?: string;
  branchId: mongoose.Types.ObjectId;
  isActive: boolean;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const PharmacySchema = new Schema<IPharmacy>({
  productId: {
    type: String,
    required: [true, 'Product ID is required'],
    uppercase: true,
    trim: true
  },
  productName: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true
  },
  genericName: {
    type: String,
    trim: true
  },
  category: {
    type: String,
    trim: true
  },
  manufacturer: {
    type: String,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: 0
  },
  offerPrice: {
    type: Number,
    min: 0
  },
  purchaseDate: {
    type: Date,
    required: [true, 'Purchase date is required']
  },
  expiryDate: {
    type: Date,
    required: [true, 'Expiry date is required']
  },
  stock: {
    type: Number,
    required: [true, 'Stock quantity is required'],
    min: 0,
    default: 0
  },
  unit: {
    type: String,
    required: [true, 'Unit is required'],
    trim: true
  },
  minStockLevel: {
    type: Number,
    min: 0,
    default: 10
  },
  batchNumber: {
    type: String,
    trim: true
  },
  branchId: {
    type: Schema.Types.ObjectId,
    ref: 'Branch',
    required: [true, 'Branch is required']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Creator is required']
  }
}, {
  timestamps: true
});

PharmacySchema.index({ productId: 1 }, { unique: true });
PharmacySchema.index({ branchId: 1 });
PharmacySchema.index({ expiryDate: 1 });
PharmacySchema.index({ stock: 1 });

PharmacySchema.virtual('isExpired').get(function() {
  return this.expiryDate < new Date();
});

PharmacySchema.virtual('isLowStock').get(function() {
  return this.stock <= (this.minStockLevel || 10);
});

PharmacySchema.set('toJSON', { virtuals: true });
PharmacySchema.set('toObject', { virtuals: true });

const Pharmacy = mongoose.models.Pharmacy || mongoose.model<IPharmacy>('Pharmacy', PharmacySchema);

export default Pharmacy;
