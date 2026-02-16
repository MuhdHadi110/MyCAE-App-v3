import type { InventoryItem, BulkImportResult } from '../types/inventory.types';
import { getCurrentUser } from '../lib/auth';

export function parseCSV(csvText: string): string[][] {
  const lines = csvText.split('\n').filter(line => line.trim());
  return lines.map(line => {
    // Simple CSV parser (handles basic cases)
    const values: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim());
    return values;
  });
}

export function validateInventoryRow(
  row: string[],
  headers: string[]
): { valid: boolean; error?: string } {
  const rowObj: any = {};
  headers.forEach((header, index) => {
    rowObj[header] = row[index];
  });

  // Required fields
  if (!rowObj.title || !rowObj.sku) {
    return { valid: false, error: 'Missing required fields: title or sku' };
  }

  // Validate quantity
  const quantity = parseInt(rowObj.quantity);
  if (isNaN(quantity) || quantity < 0) {
    return { valid: false, error: 'Invalid quantity value' };
  }

  // Validate minimumStock
  const minimumStock = parseInt(rowObj.minimumStock);
  if (isNaN(minimumStock) || minimumStock < 0) {
    return { valid: false, error: 'Invalid minimumStock value' };
  }

  // Validate cost and price
  const cost = parseFloat(rowObj.cost || '0');
  const price = parseFloat(rowObj.price || '0');
  if (isNaN(cost) || isNaN(price)) {
    return { valid: false, error: 'Invalid cost or price value' };
  }

  return { valid: true };
}

export function csvRowToInventoryItem(
  row: string[],
  headers: string[]
): Omit<InventoryItem, 'id'> {
  const rowObj: any = {};
  headers.forEach((header, index) => {
    rowObj[header] = row[index];
  });

  const currentUser = getCurrentUser();

  return {
    title: rowObj.title,
    sku: rowObj.sku,
    barcode: rowObj.barcode || '',
    category: rowObj.category || 'Uncategorized',
    quantity: parseInt(rowObj.quantity) || 0,
    minimumStock: parseInt(rowObj.minimumStock) || 0,
    location: rowObj.location || '',
    unitOfMeasure: rowObj.unitOfMeasure || 'Unit',
    cost: parseFloat(rowObj.cost) || 0,
    price: parseFloat(rowObj.price) || 0,
    supplier: rowObj.supplier || '',
    status: (rowObj.status as 'Active' | 'Inactive' | 'Discontinued') || 'Active',
    notes: rowObj.notes || '',
    lastCalibratedDate: rowObj.lastCalibratedDate || undefined,
    lastUpdated: new Date().toISOString(),
    createdBy: currentUser.displayName,
  };
}

export async function processBulkImport(
  file: File
): Promise<BulkImportResult> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const csvText = e.target?.result as string;
        const rows = parseCSV(csvText);

        if (rows.length < 2) {
          resolve({
            success: false,
            imported: 0,
            failed: 0,
            errors: [{ row: 0, error: 'CSV file is empty or has no data rows' }],
          });
          return;
        }

        const headers = rows[0];
        const dataRows = rows.slice(1);
        const errors: Array<{ row: number; error: string }> = [];
        const validItems: Array<Omit<InventoryItem, 'id'>> = [];

        dataRows.forEach((row, index) => {
          const validation = validateInventoryRow(row, headers);

          if (!validation.valid) {
            errors.push({
              row: index + 2, // +2 because: +1 for header, +1 for 1-based indexing
              error: validation.error || 'Unknown error',
            });
          } else {
            try {
              const item = csvRowToInventoryItem(row, headers);
              validItems.push(item);
            } catch (error) {
              errors.push({
                row: index + 2,
                error: `Failed to parse row: ${error}`,
              });
            }
          }
        });

        resolve({
          success: validItems.length > 0,
          imported: validItems.length,
          failed: errors.length,
          errors: errors.length > 0 ? errors : undefined,
        });

      } catch (error) {
        reject(new Error(`Failed to process CSV file: ${error}`));
      }
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };

    reader.readAsText(file);
  });
}

export function generateMasterBarcode(): string {
  // Generate a unique master barcode for bulk checkout
  // Format: MCO-YYYYMMDD-XXXXX (Master CheckOut)
  const date = new Date();
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
  const randomStr = Math.random().toString(36).substring(2, 7).toUpperCase();
  return `MCO-${dateStr}-${randomStr}`;
}
