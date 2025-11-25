import * as XLSX from 'xlsx';
import { BulkImportSchema, ColumnMetadata, ValidationError } from './schemas';

export interface ParsedData {
  data: any[];
  errors: ValidationError[];
}

export const generateTemplate = (schema: BulkImportSchema, fileName: string = 'template'): void => {
  try {
    const workbook = XLSX.utils.book_new();

    const headers = schema.columns.map((col) => col.label);
    const descriptions = schema.columns.map((col) => col.description || '');
    const examples = schema.columns.map((col) => col.example !== undefined ? col.example : '');
    const required = schema.columns.map((col) => col.required ? 'Required' : 'Optional');

    const worksheetData = [
      headers,
      required,
      descriptions,
      ...schema.exampleRows.map((row) =>
        schema.columns.map((col) => row[col.key] !== undefined ? row[col.key] : '')
      ),
    ];

    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

    const headerStyle = {
      font: { bold: true, color: { rgb: 'FFFFFF' } },
      fill: { fgColor: { rgb: '4472C4' } },
      alignment: { horizontal: 'center', vertical: 'center' },
    };

    const requiredStyle = {
      font: { italic: true, color: { rgb: '666666' } },
      fill: { fgColor: { rgb: 'F2F2F2' } },
      alignment: { horizontal: 'center' },
    };

    const descStyle = {
      font: { italic: true, size: 9, color: { rgb: '666666' } },
      fill: { fgColor: { rgb: 'FFF2CC' } },
      alignment: { wrapText: true },
    };

    const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
    
    for (let C = range.s.c; C <= range.e.c; ++C) {
      const headerAddr = XLSX.utils.encode_cell({ r: 0, c: C });
      const reqAddr = XLSX.utils.encode_cell({ r: 1, c: C });
      const descAddr = XLSX.utils.encode_cell({ r: 2, c: C });

      if (!worksheet[headerAddr]) continue;
      worksheet[headerAddr].s = headerStyle;
      if (worksheet[reqAddr]) worksheet[reqAddr].s = requiredStyle;
      if (worksheet[descAddr]) worksheet[descAddr].s = descStyle;
    }

    const colWidths = schema.columns.map((col) => ({
      wch: Math.max(col.label.length, (col.description?.length || 20) / 2, 15),
    }));
    worksheet['!cols'] = colWidths;

    worksheet['!rows'] = [
      { hpt: 20 },
      { hpt: 15 },
      { hpt: 30 },
    ];

    const dataValidations: any[] = [];
    schema.columns.forEach((col, colIndex) => {
      if (col.type === 'enum' && col.enumValues && col.enumValues.length > 0) {
        const columnLetter = XLSX.utils.encode_col(colIndex);
        const sqref = `${columnLetter}4:${columnLetter}1000`;
        const formulaValues = col.enumValues.join(',');
        
        dataValidations.push({
          type: 'list',
          allowBlank: true,
          sqref: sqref,
          formulas: [`"${formulaValues}"`],
        });
      }
    });

    if (dataValidations.length > 0) {
      worksheet['!dataValidation'] = dataValidations;
    }

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');

    if (schema.enumSheets) {
      schema.enumSheets.forEach((enumSheet) => {
        const enumData = [
          [enumSheet.name],
          ['Allowed Values:'],
          ...enumSheet.values.map((val) => [val]),
        ];
        const enumWS = XLSX.utils.aoa_to_sheet(enumData);
        
        if (enumWS['A1']) {
          enumWS['A1'].s = {
            font: { bold: true, size: 12, color: { rgb: 'FFFFFF' } },
            fill: { fgColor: { rgb: '70AD47' } },
            alignment: { horizontal: 'center' },
          };
        }

        enumWS['!cols'] = [{ wch: 25 }];
        XLSX.utils.book_append_sheet(workbook, enumWS, enumSheet.name);
      });
    }

    if (schema.validationRules && schema.validationRules.length > 0) {
      const rulesData = [
        ['Validation Rules'],
        [''],
        ...schema.validationRules.map((rule, idx) => [`${idx + 1}. ${rule}`]),
      ];
      const rulesWS = XLSX.utils.aoa_to_sheet(rulesData);
      
      if (rulesWS['A1']) {
        rulesWS['A1'].s = {
          font: { bold: true, size: 12, color: { rgb: 'FFFFFF' } },
          fill: { fgColor: { rgb: 'E74C3C' } },
          alignment: { horizontal: 'center' },
        };
      }

      rulesWS['!cols'] = [{ wch: 80 }];
      XLSX.utils.book_append_sheet(workbook, rulesWS, 'Validation Rules');
    }

    XLSX.writeFile(workbook, `${fileName}.xlsx`);
  } catch (error) {
    console.error('Error generating template:', error);
    throw new Error('Failed to generate template');
  }
};

export const parseFile = async (file: File, schema: BulkImportSchema): Promise<ParsedData> => {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });

    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];

    const rawData: any[] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

    if (rawData.length < 4) {
      throw new Error('File does not contain enough data. Please use the provided template.');
    }

    const headers = rawData[0] as string[];
    
    const expectedHeaders = schema.columns.map((col) => col.label);
    const missingHeaders = expectedHeaders.filter((h) => !headers.includes(h));
    
    if (missingHeaders.length > 0) {
      throw new Error(
        `Missing required columns: ${missingHeaders.join(', ')}. Please use the provided template.`
      );
    }

    const headerIndexMap = new Map<string, number>();
    headers.forEach((header, index) => {
      const column = schema.columns.find((col) => col.label === header);
      if (column) {
        headerIndexMap.set(column.key, index);
      }
    });

    const dataRows = rawData.slice(3);
    
    const parsedData = dataRows
      .map((row: any[], rowIndex: number) => {
        const isEmptyRow = row.every((cell) => cell === undefined || cell === null || cell === '');
        if (isEmptyRow) return null;

        const dataObject: any = {};
        schema.columns.forEach((col) => {
          const cellIndex = headerIndexMap.get(col.key);
          if (cellIndex !== undefined) {
            let cellValue = row[cellIndex];

            if (cellValue !== undefined && cellValue !== null && cellValue !== '') {
              if (col.type === 'number') {
                cellValue = Number(cellValue);
              } else if (col.type === 'boolean') {
                cellValue = cellValue.toString().toLowerCase() === 'true';
              } else if (col.type === 'string') {
                cellValue = cellValue.toString().trim();
              }
            }

            dataObject[col.key] = cellValue;
          }
        });

        return dataObject;
      })
      .filter((row) => row !== null);

    return {
      data: parsedData,
      errors: [],
    };
  } catch (error: any) {
    console.error('Error parsing file:', error);
    throw error;
  }
};

export const validateData = (data: any[], schema: BulkImportSchema): ValidationError[] => {
  const errors: ValidationError[] = [];

  data.forEach((row, index) => {
    const rowNumber = index + 4;

    schema.columns.forEach((col) => {
      const value = row[col.key];

      if (col.required && (value === undefined || value === null || value === '')) {
        errors.push({
          rowNumber,
          field: col.label,
          message: `${col.label} is required`,
          value,
        });
        return;
      }

      if (value === undefined || value === null || value === '') {
        return;
      }

      if (col.type === 'enum' && col.enumValues) {
        if (!col.enumValues.includes(value)) {
          errors.push({
            rowNumber,
            field: col.label,
            message: `${col.label} must be one of: ${col.enumValues.join(', ')}`,
            value,
          });
        }
      }

      if (col.type === 'number') {
        if (isNaN(value)) {
          errors.push({
            rowNumber,
            field: col.label,
            message: `${col.label} must be a valid number`,
            value,
          });
        } else if (col.validation) {
          if (col.validation.min !== undefined && value < col.validation.min) {
            errors.push({
              rowNumber,
              field: col.label,
              message: col.validation.message || `${col.label} must be at least ${col.validation.min}`,
              value,
            });
          }
          if (col.validation.max !== undefined && value > col.validation.max) {
            errors.push({
              rowNumber,
              field: col.label,
              message: col.validation.message || `${col.label} must be at most ${col.validation.max}`,
              value,
            });
          }
        }
      }

      if (col.type === 'string' && col.validation) {
        const strValue = value.toString();
        if (col.validation.min !== undefined && strValue.length < col.validation.min) {
          errors.push({
            rowNumber,
            field: col.label,
            message: col.validation.message || `${col.label} must be at least ${col.validation.min} characters`,
            value,
          });
        }
        if (col.validation.max !== undefined && strValue.length > col.validation.max) {
          errors.push({
            rowNumber,
            field: col.label,
            message: col.validation.message || `${col.label} must be at most ${col.validation.max} characters`,
            value,
          });
        }
        if (col.validation.pattern && !col.validation.pattern.test(strValue)) {
          errors.push({
            rowNumber,
            field: col.label,
            message: col.validation.message || `${col.label} format is invalid`,
            value,
          });
        }
      }
    });
  });

  return errors;
};

export const generateErrorReport = (errors: ValidationError[], fileName: string = 'import-errors'): void => {
  try {
    const workbook = XLSX.utils.book_new();

    const errorData = [
      ['Row Number', 'Field', 'Error Message', 'Invalid Value'],
      ...errors.map((error) => [
        error.rowNumber,
        error.field,
        error.message,
        error.value !== undefined ? error.value.toString() : 'N/A',
      ]),
    ];

    const worksheet = XLSX.utils.aoa_to_sheet(errorData);

    const headerStyle = {
      font: { bold: true, color: { rgb: 'FFFFFF' } },
      fill: { fgColor: { rgb: 'E74C3C' } },
      alignment: { horizontal: 'center', vertical: 'center' },
    };

    const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
    for (let C = range.s.c; C <= range.e.c; ++C) {
      const addr = XLSX.utils.encode_cell({ r: 0, c: C });
      if (worksheet[addr]) {
        worksheet[addr].s = headerStyle;
      }
    }

    worksheet['!cols'] = [
      { wch: 12 },
      { wch: 20 },
      { wch: 50 },
      { wch: 20 },
    ];

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Errors');

    XLSX.writeFile(workbook, `${fileName}.xlsx`);
  } catch (error) {
    console.error('Error generating error report:', error);
    throw new Error('Failed to generate error report');
  }
};

export const exportData = (data: any[], schema: BulkImportSchema, fileName: string = 'export'): void => {
  try {
    const workbook = XLSX.utils.book_new();

    const headers = schema.columns.map((col) => col.label);

    const exportData = data.map((item) =>
      schema.columns.map((col) => {
        const value = item[col.key];
        
        if (value === undefined || value === null) {
          return '';
        }

        if (col.type === 'boolean') {
          return value ? 'true' : 'false';
        }

        if (col.type === 'date' && value instanceof Date) {
          return value.toISOString().split('T')[0];
        }

        return value;
      })
    );

    const worksheetData = [headers, ...exportData];

    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

    const headerStyle = {
      font: { bold: true, color: { rgb: 'FFFFFF' } },
      fill: { fgColor: { rgb: '4472C4' } },
      alignment: { horizontal: 'center', vertical: 'center' },
    };

    const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
    for (let C = range.s.c; C <= range.e.c; ++C) {
      const addr = XLSX.utils.encode_cell({ r: 0, c: C });
      if (worksheet[addr]) {
        worksheet[addr].s = headerStyle;
      }
    }

    const colWidths = schema.columns.map((col) => ({
      wch: Math.max(col.label.length, 15),
    }));
    worksheet['!cols'] = colWidths;

    const dataValidations: any[] = [];
    schema.columns.forEach((col, colIndex) => {
      if (col.type === 'enum' && col.enumValues && col.enumValues.length > 0) {
        const columnLetter = XLSX.utils.encode_col(colIndex);
        const sqref = `${columnLetter}2:${columnLetter}1000`;
        const formulaValues = col.enumValues.join(',');
        
        dataValidations.push({
          type: 'list',
          allowBlank: true,
          sqref: sqref,
          formulas: [`"${formulaValues}"`],
        });
      }
    });

    if (dataValidations.length > 0) {
      worksheet['!dataValidation'] = dataValidations;
    }

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');

    const timestamp = new Date().toISOString().split('T')[0];
    XLSX.writeFile(workbook, `${fileName}_${timestamp}.xlsx`);
  } catch (error) {
    console.error('Error exporting data:', error);
    throw new Error('Failed to export data');
  }
};

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};

export const validateFileType = (file: File): boolean => {
  const validTypes = [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel',
    'text/csv',
  ];
  const validExtensions = ['.xlsx', '.xls', '.csv'];
  
  const hasValidType = validTypes.includes(file.type);
  const hasValidExtension = validExtensions.some((ext) => file.name.toLowerCase().endsWith(ext));
  
  return hasValidType || hasValidExtension;
};

export const validateFileSize = (file: File, maxSizeMB: number = 5): boolean => {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  return file.size <= maxSizeBytes;
};
