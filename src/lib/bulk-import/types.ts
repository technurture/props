import { ValidationError } from './schemas';

export interface BulkImportResponse {
  success: number;
  failed: number;
  errors: ValidationError[];
}

export type BulkExportRow = Record<string, any>;
