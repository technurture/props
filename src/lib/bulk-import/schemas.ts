import { ServiceCharge } from '@/types/emr';

export interface ColumnMetadata {
  key: string;
  label: string;
  required: boolean;
  type: 'string' | 'number' | 'enum' | 'boolean' | 'date';
  enumValues?: string[];
  validation?: {
    min?: number;
    max?: number;
    pattern?: RegExp;
    message?: string;
  };
  example?: any;
  description?: string;
}

export interface BulkImportSchema {
  columns: ColumnMetadata[];
  enumSheets?: {
    name: string;
    values: string[];
  }[];
  exampleRows: any[];
  validationRules?: string[];
}

export interface ValidationError {
  rowNumber: number;
  field: string;
  message: string;
  value?: any;
}

export const serviceChargeSchema: BulkImportSchema = {
  columns: [
    {
      key: 'serviceName',
      label: 'Service Name',
      required: true,
      type: 'string',
      validation: {
        min: 3,
        max: 200,
        message: 'Service name must be between 3 and 200 characters',
      },
      example: 'General Consultation',
      description: 'Name of the service',
    },
    {
      key: 'category',
      label: 'Category',
      required: true,
      type: 'enum',
      enumValues: [
        'consultation',
        'laboratory',
        'pharmacy',
        'procedure',
        'imaging',
        'emergency',
        'admission',
        'other',
      ],
      example: 'consultation',
      description: 'Service category (must be one of the allowed values)',
    },
    {
      key: 'price',
      label: 'Price',
      required: true,
      type: 'number',
      validation: {
        min: 0,
        message: 'Price must be a positive number',
      },
      example: 5000,
      description: 'Price in Naira',
    },
    {
      key: 'billingType',
      label: 'Billing Type',
      required: false,
      type: 'enum',
      enumValues: ['flat_rate', 'per_day', 'per_hour'],
      example: 'flat_rate',
      description: 'How the service is billed',
    },
    {
      key: 'description',
      label: 'Description',
      required: false,
      type: 'string',
      validation: {
        max: 500,
        message: 'Description cannot exceed 500 characters',
      },
      example: 'Standard medical consultation',
      description: 'Additional details about the service',
    },
    {
      key: 'isActive',
      label: 'Is Active',
      required: false,
      type: 'boolean',
      example: 'true',
      description: 'Whether the service is active (true/false)',
    },
  ],
  enumSheets: [
    {
      name: 'Category Options',
      values: [
        'consultation',
        'laboratory',
        'pharmacy',
        'procedure',
        'imaging',
        'emergency',
        'admission',
        'other',
      ],
    },
    {
      name: 'Billing Type Options',
      values: ['flat_rate', 'per_day', 'per_hour'],
    },
  ],
  exampleRows: [
    {
      serviceName: 'General Consultation',
      category: 'consultation',
      price: 5000,
      billingType: 'flat_rate',
      description: 'Standard medical consultation',
      isActive: true,
    },
    {
      serviceName: 'Full Blood Count',
      category: 'laboratory',
      price: 3000,
      billingType: 'flat_rate',
      description: 'Complete blood count test',
      isActive: true,
    },
    {
      serviceName: 'X-Ray Chest PA',
      category: 'imaging',
      price: 8000,
      billingType: 'flat_rate',
      description: 'Chest X-ray posteroanterior view',
      isActive: true,
    },
  ],
  validationRules: [
    'Service Name is required and must be unique',
    'Category must be one of: consultation, laboratory, pharmacy, procedure, imaging, emergency, admission, other',
    'Price must be a positive number',
    'Billing Type (if provided) must be one of: flat_rate, per_day, per_hour',
    'Is Active should be true or false (defaults to true if not specified)',
  ],
};

export const branchSchema: BulkImportSchema = {
  columns: [
    {
      key: 'name',
      label: 'Branch Name',
      required: true,
      type: 'string',
      validation: {
        min: 3,
        max: 100,
        message: 'Branch name must be between 3 and 100 characters',
      },
      example: 'Main Branch',
      description: 'Name of the branch',
    },
    {
      key: 'code',
      label: 'Branch Code',
      required: false,
      type: 'string',
      validation: {
        max: 20,
        message: 'Branch code cannot exceed 20 characters',
      },
      example: 'MAIN01',
      description: 'Unique identifier code',
    },
    {
      key: 'address',
      label: 'Address',
      required: true,
      type: 'string',
      example: '123 Medical Center Road',
      description: 'Street address',
    },
    {
      key: 'city',
      label: 'City',
      required: true,
      type: 'string',
      example: 'Lagos',
      description: 'City name',
    },
    {
      key: 'state',
      label: 'State',
      required: true,
      type: 'string',
      example: 'Lagos',
      description: 'State or province',
    },
    {
      key: 'country',
      label: 'Country',
      required: true,
      type: 'string',
      example: 'Nigeria',
      description: 'Country name',
    },
    {
      key: 'phone',
      label: 'Phone',
      required: true,
      type: 'string',
      example: '+234-801-234-5678',
      description: 'Contact phone number',
    },
    {
      key: 'email',
      label: 'Email',
      required: true,
      type: 'string',
      validation: {
        pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        message: 'Must be a valid email address',
      },
      example: 'main@hospital.com',
      description: 'Contact email address',
    },
    {
      key: 'isActive',
      label: 'Is Active',
      required: false,
      type: 'boolean',
      example: 'true',
      description: 'Whether the branch is active',
    },
  ],
  exampleRows: [
    {
      name: 'Main Branch',
      code: 'MAIN01',
      address: '123 Medical Center Road',
      city: 'Lagos',
      state: 'Lagos',
      country: 'Nigeria',
      phone: '+234-801-234-5678',
      email: 'main@hospital.com',
      isActive: true,
    },
  ],
  validationRules: [
    'Branch Name is required and must be unique',
    'Email must be a valid email address',
    'All contact information fields are required',
  ],
};

export const staffSchema: BulkImportSchema = {
  columns: [
    {
      key: 'firstName',
      label: 'First Name',
      required: true,
      type: 'string',
      example: 'John',
      description: 'Staff first name',
    },
    {
      key: 'lastName',
      label: 'Last Name',
      required: true,
      type: 'string',
      example: 'Doe',
      description: 'Staff last name',
    },
    {
      key: 'email',
      label: 'Email',
      required: true,
      type: 'string',
      validation: {
        pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        message: 'Must be a valid email address',
      },
      example: 'john.doe@hospital.com',
      description: 'Staff email address',
    },
    {
      key: 'phoneNumber',
      label: 'Phone Number',
      required: true,
      type: 'string',
      example: '+234-801-234-5678',
      description: 'Contact phone number',
    },
    {
      key: 'role',
      label: 'Role',
      required: true,
      type: 'enum',
      enumValues: [
        'ADMIN',
        'MANAGER',
        'FRONT_DESK',
        'NURSE',
        'DOCTOR',
        'LAB',
        'PHARMACY',
        'BILLING',
        'ACCOUNTING',
      ],
      example: 'DOCTOR',
      description: 'Staff role in the system',
    },
    {
      key: 'specialization',
      label: 'Specialization',
      required: false,
      type: 'string',
      example: 'Cardiology',
      description: 'Medical specialization (for doctors)',
    },
    {
      key: 'licenseNumber',
      label: 'License Number',
      required: false,
      type: 'string',
      example: 'MD-12345',
      description: 'Professional license number',
    },
    {
      key: 'department',
      label: 'Department',
      required: false,
      type: 'string',
      example: 'Emergency',
      description: 'Department assignment',
    },
    {
      key: 'password',
      label: 'Password',
      required: false,
      type: 'string',
      example: '[KEEP_EXISTING]',
      description: 'Password for the staff account (use [KEEP_EXISTING] to keep current password during updates)',
    },
    {
      key: 'isActive',
      label: 'Is Active',
      required: false,
      type: 'boolean',
      example: 'true',
      description: 'Whether the staff member is active',
    },
  ],
  enumSheets: [
    {
      name: 'Role Options',
      values: [
        'ADMIN',
        'MANAGER',
        'FRONT_DESK',
        'NURSE',
        'DOCTOR',
        'LAB',
        'PHARMACY',
        'BILLING',
        'ACCOUNTING',
      ],
    },
  ],
  exampleRows: [
    {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@hospital.com',
      phoneNumber: '+234-801-234-5678',
      role: 'DOCTOR',
      specialization: 'Cardiology',
      licenseNumber: 'MD-12345',
      department: 'Emergency',
      isActive: true,
    },
  ],
  validationRules: [
    'Email must be unique and valid',
    'Role must be one of the allowed values',
    'Phone number should include country code',
  ],
};

export const insuranceSchema: BulkImportSchema = {
  columns: [
    {
      key: 'providerName',
      label: 'Provider Name',
      required: true,
      type: 'string',
      example: 'National Health Insurance',
      description: 'Insurance provider name',
    },
    {
      key: 'providerCode',
      label: 'Provider Code',
      required: true,
      type: 'string',
      example: 'NHIS',
      description: 'Short code for the provider',
    },
    {
      key: 'type',
      label: 'Insurance Type',
      required: true,
      type: 'enum',
      enumValues: ['HMO', 'PPO', 'Government', 'Private', 'Corporate', 'Other'],
      example: 'Private',
      description: 'Insurance type (HMO, PPO, Government, Private, Corporate, Other)',
    },
    {
      key: 'coveragePercentage',
      label: 'Coverage Percentage',
      required: true,
      type: 'number',
      validation: {
        min: 0,
        max: 100,
        message: 'Coverage percentage must be between 0 and 100',
      },
      example: 100,
      description: 'Coverage percentage (0-100)',
    },
    {
      key: 'description',
      label: 'Description',
      required: false,
      type: 'string',
      example: 'Full medical coverage plan',
      description: 'Description of the insurance plan',
    },
    {
      key: 'contactPerson',
      label: 'Contact Person',
      required: false,
      type: 'string',
      example: 'John Doe',
      description: 'Contact person name',
    },
    {
      key: 'contactEmail',
      label: 'Contact Email',
      required: false,
      type: 'string',
      validation: {
        pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        message: 'Must be a valid email address',
      },
      example: 'contact@insurance.com',
      description: 'Provider contact email',
    },
    {
      key: 'contactPhone',
      label: 'Contact Phone',
      required: false,
      type: 'string',
      example: '+234-800-123-4567',
      description: 'Provider contact phone',
    },
    {
      key: 'address',
      label: 'Address',
      required: false,
      type: 'string',
      example: '123 Insurance Plaza, Lagos',
      description: 'Provider address',
    },
    {
      key: 'isActive',
      label: 'Is Active',
      required: false,
      type: 'boolean',
      example: 'true',
      description: 'Whether the insurance is active',
    },
  ],
  enumSheets: [
    {
      name: 'Insurance Type Options',
      values: ['HMO', 'PPO', 'Government', 'Private', 'Corporate', 'Other'],
    },
  ],
  exampleRows: [
    {
      providerName: 'National Health Insurance',
      providerCode: 'NHIS',
      type: 'Government',
      coveragePercentage: 100,
      description: 'Government health insurance scheme',
      contactPerson: 'Jane Smith',
      contactEmail: 'contact@nhis.gov.ng',
      contactPhone: '+234-800-123-4567',
      address: '123 Health Ministry Road, Abuja',
      isActive: true,
    },
    {
      providerName: 'Blue Cross Health',
      providerCode: 'BCH',
      type: 'HMO',
      coveragePercentage: 80,
      description: 'Health Maintenance Organization plan',
      contactPerson: 'Mike Johnson',
      contactEmail: 'info@bluecross.com',
      contactPhone: '+234-801-456-7890',
      address: '45 Medical Plaza, Lagos',
      isActive: true,
    },
  ],
  validationRules: [
    'Provider Name is required and should be unique',
    'Provider Code is required and must be unique',
    'Insurance Type must be one of: HMO, PPO, Government, Private, Corporate, Other',
    'Coverage Percentage is required and must be between 0 and 100',
    'Contact Email must be a valid email address if provided',
  ],
};

export const pharmacySchema: BulkImportSchema = {
  columns: [
    {
      key: 'productId',
      label: 'Product ID',
      required: true,
      type: 'string',
      validation: {
        min: 3,
        max: 50,
        message: 'Product ID must be between 3 and 50 characters',
      },
      example: 'DRUG-001',
      description: 'Unique product identifier',
    },
    {
      key: 'productName',
      label: 'Product Name',
      required: true,
      type: 'string',
      validation: {
        min: 3,
        max: 200,
        message: 'Product name must be between 3 and 200 characters',
      },
      example: 'Paracetamol 500mg Tablets',
      description: 'Name of the medication/product',
    },
    {
      key: 'genericName',
      label: 'Generic Name',
      required: false,
      type: 'string',
      example: 'Acetaminophen',
      description: 'Generic/scientific name of the drug',
    },
    {
      key: 'category',
      label: 'Category',
      required: false,
      type: 'string',
      example: 'Analgesics',
      description: 'Drug category or classification',
    },
    {
      key: 'manufacturer',
      label: 'Manufacturer',
      required: false,
      type: 'string',
      example: 'PharmaCorp Ltd',
      description: 'Manufacturer name',
    },
    {
      key: 'description',
      label: 'Description',
      required: false,
      type: 'string',
      example: 'Pain relief and fever reducer',
      description: 'Product description',
    },
    {
      key: 'price',
      label: 'Price',
      required: true,
      type: 'number',
      validation: {
        min: 0,
        message: 'Price must be greater than or equal to 0',
      },
      example: 500,
      description: 'Regular price in NGN',
    },
    {
      key: 'offerPrice',
      label: 'Offer Price',
      required: false,
      type: 'number',
      validation: {
        min: 0,
        message: 'Offer price must be greater than or equal to 0',
      },
      example: 450,
      description: 'Discounted price (optional)',
    },
    {
      key: 'purchaseDate',
      label: 'Purchase Date',
      required: true,
      type: 'date',
      example: '2025-01-15',
      description: 'Date of purchase (YYYY-MM-DD format)',
    },
    {
      key: 'expiryDate',
      label: 'Expiry Date',
      required: true,
      type: 'date',
      example: '2026-12-31',
      description: 'Expiration date (YYYY-MM-DD format)',
    },
    {
      key: 'stock',
      label: 'Stock Quantity',
      required: true,
      type: 'number',
      validation: {
        min: 0,
        message: 'Stock must be greater than or equal to 0',
      },
      example: 100,
      description: 'Current stock quantity',
    },
    {
      key: 'unit',
      label: 'Unit',
      required: true,
      type: 'enum',
      enumValues: ['mg', 'ml', 'g', 'tablets', 'capsules', 'units'],
      example: 'mg',
      description: 'Unit of measurement (mg, ml, g, tablets, capsules, units)',
    },
    {
      key: 'minStockLevel',
      label: 'Minimum Stock Level',
      required: false,
      type: 'number',
      validation: {
        min: 0,
        message: 'Minimum stock level must be greater than or equal to 0',
      },
      example: 20,
      description: 'Alert threshold for low stock',
    },
    {
      key: 'batchNumber',
      label: 'Batch Number',
      required: false,
      type: 'string',
      example: 'BATCH-2025-001',
      description: 'Manufacturing batch number',
    },
    {
      key: 'isActive',
      label: 'Is Active',
      required: false,
      type: 'boolean',
      example: 'true',
      description: 'Whether the product is active',
    },
  ],
  exampleRows: [
    {
      productId: 'DRUG-001',
      productName: 'Paracetamol 500mg Tablets',
      genericName: 'Acetaminophen',
      category: 'Analgesics',
      manufacturer: 'PharmaCorp Ltd',
      description: 'Pain relief and fever reducer',
      price: 500,
      offerPrice: 450,
      purchaseDate: '2025-01-15',
      expiryDate: '2026-12-31',
      stock: 100,
      unit: 'tablets',
      minStockLevel: 20,
      batchNumber: 'BATCH-2025-001',
      isActive: true,
    },
    {
      productId: 'DRUG-002',
      productName: 'Amoxicillin 250mg Capsules',
      genericName: 'Amoxicillin',
      category: 'Antibiotics',
      manufacturer: 'MediHealth Inc',
      description: 'Antibiotic for bacterial infections',
      price: 1200,
      offerPrice: null,
      purchaseDate: '2025-01-20',
      expiryDate: '2027-01-20',
      stock: 50,
      unit: 'capsules',
      minStockLevel: 15,
      batchNumber: 'BATCH-2025-002',
      isActive: true,
    },
  ],
  enumSheets: [
    {
      name: 'Unit Options',
      values: ['mg', 'ml', 'g', 'tablets', 'capsules', 'units'],
    },
  ],
  validationRules: [
    'Product ID must be unique',
    'Unit must be one of: mg, ml, g, tablets, capsules, units',
    'Expiry date must be after purchase date',
    'All dates must be in YYYY-MM-DD format',
    'Price and stock must be non-negative numbers',
  ],
};

export const schemas = {
  serviceCharge: serviceChargeSchema,
  branch: branchSchema,
  staff: staffSchema,
  insurance: insuranceSchema,
  pharmacy: pharmacySchema,
};
