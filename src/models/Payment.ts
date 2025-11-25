import mongoose, { Document, Schema } from 'mongoose';

export enum PaymentMethod {
  CASH = 'CASH',
  CARD = 'CARD',
  INSURANCE = 'INSURANCE',
  PAYSTACK = 'PAYSTACK',
  BANK_TRANSFER = 'BANK_TRANSFER'
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  SUCCESSFUL = 'SUCCESSFUL',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED'
}

export interface IPayment extends Document {
  paymentNumber: string;
  invoiceId: mongoose.Types.ObjectId;
  patientId: mongoose.Types.ObjectId;
  branchId: mongoose.Types.ObjectId;
  amount: number;
  paymentMethod: PaymentMethod;
  paymentReference?: string;
  paystackReference?: string;
  status: PaymentStatus;
  receivedBy: mongoose.Types.ObjectId;
  paymentDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

const PaymentSchema = new Schema<IPayment>({
  paymentNumber: { 
    type: String, 
    unique: true,
    uppercase: true,
    trim: true
  },
  invoiceId: { 
    type: Schema.Types.ObjectId, 
    ref: 'Invoice', 
    required: [true, 'Invoice is required']
  },
  patientId: { 
    type: Schema.Types.ObjectId, 
    ref: 'Patient', 
    required: [true, 'Patient is required']
  },
  branchId: { 
    type: Schema.Types.ObjectId, 
    ref: 'Branch', 
    required: [true, 'Branch is required']
  },
  amount: { 
    type: Number, 
    required: [true, 'Amount is required'],
    min: [0, 'Amount cannot be negative']
  },
  paymentMethod: {
    type: String,
    enum: Object.values(PaymentMethod),
    required: [true, 'Payment method is required']
  },
  paymentReference: { 
    type: String,
    trim: true
  },
  paystackReference: { 
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: Object.values(PaymentStatus),
    default: PaymentStatus.PENDING
  },
  receivedBy: { 
    type: Schema.Types.ObjectId, 
    ref: 'User', 
    required: [true, 'Received by is required']
  },
  paymentDate: { 
    type: Date, 
    default: Date.now 
  }
}, { timestamps: true });

PaymentSchema.pre('save', async function(next) {
  if (!this.paymentNumber) {
    const count = await mongoose.model('Payment').countDocuments();
    const timestamp = Date.now().toString().slice(-6);
    this.paymentNumber = `PAY-${timestamp}-${(count + 1).toString().padStart(4, '0')}`;
  }
  next();
});

PaymentSchema.index({ invoiceId: 1 });
PaymentSchema.index({ patientId: 1 });
PaymentSchema.index({ branchId: 1 });
PaymentSchema.index({ status: 1 });
PaymentSchema.index({ paymentDate: -1 });

export default mongoose.models.Payment || mongoose.model<IPayment>('Payment', PaymentSchema);
