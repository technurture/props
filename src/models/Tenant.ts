import mongoose, { Document, Schema } from 'mongoose';

export type PlanType = 'starter' | 'professional' | 'enterprise' | 'trial';

export interface TenantSettings {
  logo?: string;
  primaryColor?: string;
  secondaryColor?: string;
  companyName?: string;
  supportEmail?: string;
  timezone?: string;
  dateFormat?: string;
  currency?: string;
}

export interface TenantLimits {
  maxUsers: number;
  maxBranches: number;
  maxPatientsPerMonth: number;
  maxStorageMB: number;
  telemedicineEnabled: boolean;
  apiAccessEnabled: boolean;
  whitelabelEnabled: boolean;
  advancedAnalytics: boolean;
}

export interface ITenant extends Document {
  name: string;
  slug: string;
  plan: PlanType;
  ownerId: mongoose.Types.ObjectId;
  customDomains: string[];
  settings: TenantSettings;
  limits: TenantLimits;
  billingStatus: 'active' | 'past_due' | 'cancelled' | 'trial';
  trialEndsAt?: Date;
  subscriptionId?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const TenantSettingsSchema = new Schema<TenantSettings>({
  logo: { type: String },
  primaryColor: { type: String, default: '#0D9488' },
  secondaryColor: { type: String, default: '#1E3A5F' },
  companyName: { type: String },
  supportEmail: { type: String },
  timezone: { type: String, default: 'Africa/Lagos' },
  dateFormat: { type: String, default: 'DD/MM/YYYY' },
  currency: { type: String, default: 'NGN' },
}, { _id: false });

const PlanLimits: Record<PlanType, TenantLimits> = {
  trial: {
    maxUsers: 5,
    maxBranches: 1,
    maxPatientsPerMonth: 50,
    maxStorageMB: 500,
    telemedicineEnabled: false,
    apiAccessEnabled: false,
    whitelabelEnabled: false,
    advancedAnalytics: false,
  },
  starter: {
    maxUsers: 10,
    maxBranches: 1,
    maxPatientsPerMonth: 500,
    maxStorageMB: 2000,
    telemedicineEnabled: false,
    apiAccessEnabled: false,
    whitelabelEnabled: false,
    advancedAnalytics: false,
  },
  professional: {
    maxUsers: 50,
    maxBranches: 5,
    maxPatientsPerMonth: 2000,
    maxStorageMB: 10000,
    telemedicineEnabled: true,
    apiAccessEnabled: false,
    whitelabelEnabled: false,
    advancedAnalytics: true,
  },
  enterprise: {
    maxUsers: -1,
    maxBranches: -1,
    maxPatientsPerMonth: -1,
    maxStorageMB: 50000,
    telemedicineEnabled: true,
    apiAccessEnabled: true,
    whitelabelEnabled: true,
    advancedAnalytics: true,
  },
};

const TenantLimitsSchema = new Schema<TenantLimits>({
  maxUsers: { type: Number, default: 10 },
  maxBranches: { type: Number, default: 1 },
  maxPatientsPerMonth: { type: Number, default: 500 },
  maxStorageMB: { type: Number, default: 2000 },
  telemedicineEnabled: { type: Boolean, default: false },
  apiAccessEnabled: { type: Boolean, default: false },
  whitelabelEnabled: { type: Boolean, default: false },
  advancedAnalytics: { type: Boolean, default: false },
}, { _id: false });

const TenantSchema = new Schema<ITenant>({
  name: {
    type: String,
    required: [true, 'Organization name is required'],
    trim: true,
    maxlength: [100, 'Organization name cannot exceed 100 characters'],
  },
  slug: {
    type: String,
    required: [true, 'Slug is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens'],
    maxlength: [50, 'Slug cannot exceed 50 characters'],
  },
  plan: {
    type: String,
    enum: ['starter', 'professional', 'enterprise', 'trial'],
    default: 'trial',
  },
  ownerId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Owner is required'],
  },
  customDomains: [{
    type: String,
    lowercase: true,
    trim: true,
  }],
  settings: {
    type: TenantSettingsSchema,
    default: () => ({}),
  },
  limits: {
    type: TenantLimitsSchema,
    default: () => PlanLimits.trial,
  },
  billingStatus: {
    type: String,
    enum: ['active', 'past_due', 'cancelled', 'trial'],
    default: 'trial',
  },
  trialEndsAt: {
    type: Date,
  },
  subscriptionId: {
    type: String,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
}, { timestamps: true });

TenantSchema.index({ ownerId: 1 });
TenantSchema.index({ customDomains: 1 });
TenantSchema.index({ isActive: 1 });
TenantSchema.index({ billingStatus: 1 });

TenantSchema.pre('save', function(next) {
  if (this.isModified('plan')) {
    this.limits = PlanLimits[this.plan];
  }
  
  if (this.isNew && this.plan === 'trial' && !this.trialEndsAt) {
    const trialDays = 14;
    this.trialEndsAt = new Date(Date.now() + trialDays * 24 * 60 * 60 * 1000);
  }
  
  next();
});

TenantSchema.statics.findBySlug = function(slug: string) {
  return this.findOne({ slug: slug.toLowerCase(), isActive: true });
};

TenantSchema.statics.findByDomain = function(domain: string) {
  return this.findOne({ 
    customDomains: domain.toLowerCase(), 
    isActive: true 
  });
};

export const getPlanLimits = (plan: PlanType): TenantLimits => PlanLimits[plan];

export default mongoose.models.Tenant || mongoose.model<ITenant>('Tenant', TenantSchema);
