/**
 * Form Validation Schemas using Zod
 * Centralized validation rules for all forms in the application
 */

import { z } from 'zod';

// Common patterns and base schemas
const requiredString = z.string().min(1, 'This field is required');
const optionalString = z.string().optional().or(z.literal(''));
const email = requiredString.email('Invalid email address');
const phoneNumber = optionalString.refine(
  (val) => !val || /^[+]?[(]?[0-9]{1,3}[)]?[-\s.]?[0-9]{1,4}[-\s.]?[0-9]{1,9}$/.test(val),
  'Invalid phone number format'
);
const positiveNumber = z.number().positive('Must be a positive number');
const nonNegativeNumber = z.number().nonnegative('Must be 0 or greater');

// ==================== Inventory Forms ====================

export const inventoryItemSchema = z.object({
  title: requiredString.min(3, 'Title must be at least 3 characters'),
  sku: requiredString.regex(/^[A-Z0-9-]+$/, 'SKU must contain only uppercase letters, numbers, and hyphens'),
  barcode: optionalString,
  category: requiredString,
  quantity: z.number().int('Quantity must be an integer').nonnegative('Quantity cannot be negative'),
  minimumStock: z.number().int('Minimum stock must be an integer').nonnegative('Minimum stock cannot be negative'),
  location: requiredString.min(2, 'Location must be at least 2 characters'),
  unitOfMeasure: requiredString,
  cost: nonNegativeNumber,
  price: nonNegativeNumber,
  supplier: optionalString,
  status: z.enum(['Active', 'Inactive', 'Discontinued'] as const),
  notes: optionalString,
});

export type InventoryItemInput = z.infer<typeof inventoryItemSchema>;

export const bulkImportSchema = z.object({
  file: z.instanceof(File).refine((file) => file.type === 'text/csv', 'File must be a CSV file'),
});

// ==================== Project Forms ====================

export const projectSchema = z.object({
  name: requiredString.min(3, 'Project name must be at least 3 characters'),
  code: requiredString
    .regex(/^[A-Z0-9]{3,10}$/, 'Project code must be 3-10 uppercase letters/numbers')
    .toUpperCase(),
  description: optionalString,
  clientId: requiredString,
  leadEngineerId: requiredString,
  managerId: optionalString,
  budget: positiveNumber.optional(),
  startDate: z.string().datetime('Invalid start date'),
  endDate: z.string().datetime('Invalid end date'),
  status: z.enum(['pre-lim', 'ongoing', 'completed', 'on-hold'] as const).optional(),
}).refine(
  (data) => !data.endDate || !data.startDate || new Date(data.endDate) >= new Date(data.startDate),
  { message: 'End date must be after start date', path: ['endDate'] }
);

export type ProjectInput = z.infer<typeof projectSchema>;

// ==================== Checkout Forms ====================

export const singleCheckoutSchema = z.object({
  itemId: requiredString,
  quantity: z.number().int('Quantity must be an integer').positive('Quantity must be at least 1'),
  purpose: optionalString,
  expectedReturnDate: z.string().datetime('Invalid return date').optional(),
});

export type SingleCheckoutInput = z.infer<typeof singleCheckoutSchema>;

export const bulkCheckoutSchema = z.object({
  masterBarcode: requiredString,
  items: z.array(
    z.object({
      itemId: requiredString,
      quantity: z.number().int('Quantity must be an integer').positive('Quantity must be at least 1'),
    })
  ).min(1, 'At least one item must be selected'),
  purpose: optionalString,
  expectedReturnDate: z.string().datetime('Invalid return date').optional(),
});

export type BulkCheckoutInput = z.infer<typeof bulkCheckoutSchema>;

// ==================== Team Forms ====================

export const teamMemberSchema = z.object({
  name: requiredString.min(2, 'Name must be at least 2 characters'),
  email: email,
  role: z.enum(['engineer', 'manager', 'admin', 'technician'] as const),
  department: requiredString,
  phone: phoneNumber,
  position: optionalString,
  hourlyRate: nonNegativeNumber.optional(),
  certifications: z.array(z.string()).optional(),
});

export type TeamMemberInput = z.infer<typeof teamMemberSchema>;

// ==================== Maintenance Forms ====================

export const maintenanceTicketSchema = z.object({
  title: requiredString.min(5, 'Title must be at least 5 characters'),
  description: requiredString.min(10, 'Description must be at least 10 characters'),
  priority: z.enum(['low', 'medium', 'high', 'critical'] as const),
  category: requiredString,
  assignedTo: optionalString,
  dueDate: z.string().datetime('Invalid due date'),
  status: z.enum(['open', 'in-progress', 'resolved', 'closed'] as const).optional(),
});

export type MaintenanceTicketInput = z.infer<typeof maintenanceTicketSchema>;

// ==================== Purchase Order Forms ====================

export const purchaseOrderSchema = z.object({
  poNumber: requiredString.regex(/^[A-Z0-9-]+$/, 'PO number must contain only uppercase letters, numbers, and hyphens'),
  projectCode: requiredString,
  clientName: requiredString,
  amount: positiveNumber,
  receivedDate: z.string().datetime('Invalid received date'),
  dueDate: z.string().datetime('Invalid due date').optional(),
  description: optionalString,
  status: z.enum(['received', 'in-progress', 'invoiced', 'paid'] as const).optional(),
});

export type PurchaseOrderInput = z.infer<typeof purchaseOrderSchema>;

// ==================== Category Forms ====================

export const categorySchema = z.object({
  name: requiredString
    .min(2, 'Category name must be at least 2 characters')
    .max(50, 'Category name must not exceed 50 characters'),
  description: z.string().max(200, 'Description must not exceed 200 characters').optional(),
});

export type CategoryInput = z.infer<typeof categorySchema>;

// ==================== Client Forms ====================

export const clientSchema = z.object({
  name: requiredString.min(3, 'Client name must be at least 3 characters'),
  email: email,
  phone: phoneNumber,
  address: optionalString,
  city: optionalString,
  state: optionalString,
  zipCode: optionalString,
  website: optionalString.refine(
    (val) => !val || /^https?:\/\/.+/.test(val),
    'Website must start with http:// or https://'
  ),
  notes: optionalString,
});

export type ClientInput = z.infer<typeof clientSchema>;

// ==================== Computer/Asset Forms ====================

export const computerSchema = z.object({
  name: requiredString.min(2, 'Device name must be at least 2 characters'),
  type: requiredString,
  location: requiredString,
  notes: optionalString,
  softwareUsed: z.array(z.string()).optional(),
  status: z.enum(['active', 'inactive', 'decommissioned'] as const).optional(),
});

export type ComputerInput = z.infer<typeof computerSchema>;

// ==================== Invoice Forms ====================

export const invoiceSchema = z.object({
  invoiceNumber: requiredString.regex(/^[A-Z0-9-]+$/, 'Invoice number format is invalid'),
  projectId: requiredString,
  amount: positiveNumber,
  issueDate: z.string().datetime('Invalid issue date'),
  dueDate: z.string().datetime('Invalid due date'),
  description: optionalString,
  notes: optionalString,
});

export type InvoiceInput = z.infer<typeof invoiceSchema>;

// ==================== Utility Functions ====================

/**
 * Validate data against a schema
 * Returns either the validated data or validation errors
 */
export function validateData<T>(schema: z.ZodSchema<T>, data: unknown):
  | { success: true; data: T }
  | { success: false; errors: Record<string, string[]> } {
  const result = schema.safeParse(data);

  if (result.success) {
    return { success: true, data: result.data };
  }

  // Format Zod errors
  const errors: Record<string, string[]> = {};
  result.error.issues.forEach((err) => {
    const path = err.path.length > 0 ? err.path.join('.') : 'general';
    if (!errors[path]) {
      errors[path] = [];
    }
    errors[path].push(err.message);
  });

  return { success: false, errors };
}

/**
 * Get the first error message for a field
 */
export function getFieldError(errors: Record<string, string[]>, fieldName: string): string | null {
  return errors[fieldName]?.[0] || null;
}

/**
 * Check if form has any errors
 */
export function hasErrors(errors: Record<string, string[]>): boolean {
  return Object.keys(errors).length > 0;
}
