import { z } from 'zod';

/**
 * Common validation schemas for reuse across forms
 */

// Basic field validations
export const emailSchema = z
  .string()
  .min(1, 'Email is required')
  .email('Please enter a valid email address');

export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number');

export const simplePasswordSchema = z
  .string()
  .min(6, 'Password must be at least 6 characters');

export const phoneSchema = z
  .string()
  .regex(/^[+]?[(]?[0-9]{1,4}[)]?[-\s./0-9]*$/, 'Please enter a valid phone number')
  .optional()
  .or(z.literal(''));

export const urlSchema = z
  .string()
  .url('Please enter a valid URL')
  .optional()
  .or(z.literal(''));

export const dateSchema = z.string().refine(
  (val) => !val || !isNaN(Date.parse(val)),
  'Please enter a valid date'
);

export const positiveNumberSchema = z
  .number()
  .positive('Value must be greater than 0');

export const nonNegativeNumberSchema = z
  .number()
  .min(0, 'Value cannot be negative');

export const currencySchema = z
  .number()
  .min(0, 'Amount cannot be negative')
  .multipleOf(0.01, 'Please enter a valid currency amount');

// Entity schemas
export const projectSchema = z.object({
  title: z.string().min(1, 'Project title is required').max(200, 'Title is too long'),
  projectCode: z.string().min(1, 'Project code is required').max(50, 'Code is too long'),
  companyId: z.string().min(1, 'Please select a company'),
  managerId: z.string().optional(),
  leadEngineerId: z.string().optional(),
  status: z.enum(['planning', 'active', 'on-hold', 'completed', 'cancelled']),
  startDate: dateSchema,
  endDate: dateSchema.optional(),
  description: z.string().max(2000, 'Description is too long').optional(),
  estimatedHours: nonNegativeNumberSchema.optional(),
  budget: currencySchema.optional(),
});

export const clientSchema = z.object({
  name: z.string().min(1, 'Client name is required').max(200, 'Name is too long'),
  email: emailSchema.optional().or(z.literal('')),
  phone: phoneSchema,
  address: z.string().max(500, 'Address is too long').optional(),
  website: urlSchema,
  notes: z.string().max(2000, 'Notes are too long').optional(),
});

export const teamMemberSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name is too long'),
  email: emailSchema,
  role: z.enum(['admin', 'manager', 'engineer', 'technician', 'viewer']),
  department: z.string().optional(),
  phone: phoneSchema,
});

export const timesheetSchema = z.object({
  date: z.string().min(1, 'Date is required'),
  projectId: z.string().min(1, 'Please select a project'),
  workCategory: z.enum(['engineering', 'project-management', 'measurement-site', 'measurement-office']),
  hours: z.number().min(0.1, 'Hours must be at least 0.1').max(24, 'Hours cannot exceed 24'),
  description: z.string().max(1000, 'Description is too long').optional(),
});

export const inventoryItemSchema = z.object({
  title: z.string().min(1, 'Item title is required').max(200, 'Title is too long'),
  sku: z.string().min(1, 'SKU is required').max(50, 'SKU is too long'),
  barcode: z.string().max(100, 'Barcode is too long').optional(),
  category: z.string().min(1, 'Category is required'),
  quantity: z.number().int('Quantity must be a whole number').min(0, 'Quantity cannot be negative'),
  minimumStock: z.number().int().min(0).optional(),
  location: z.string().max(200, 'Location is too long').optional(),
  unitOfMeasure: z.string().optional(),
  cost: currencySchema.optional(),
  price: currencySchema.optional(),
  supplier: z.string().max(200, 'Supplier name is too long').optional(),
  notes: z.string().max(1000, 'Notes are too long').optional(),
});

export const purchaseOrderSchema = z.object({
  poNumber: z.string().min(1, 'PO number is required').max(50, 'PO number is too long'),
  projectCode: z.string().min(1, 'Project code is required'),
  vendor: z.string().min(1, 'Vendor is required').max(200, 'Vendor name is too long'),
  amount: currencySchema,
  currency: z.enum(['MYR', 'USD', 'EUR', 'GBP', 'SGD']),
  status: z.enum(['pending', 'approved', 'rejected', 'completed']),
  issueDate: z.string().min(1, 'Issue date is required'),
  dueDate: z.string().optional(),
  description: z.string().max(2000, 'Description is too long').optional(),
});

export const invoiceSchema = z.object({
  invoiceNumber: z.string().min(1, 'Invoice number is required').max(50, 'Invoice number is too long'),
  projectCode: z.string().min(1, 'Project code is required'),
  amount: currencySchema.refine((val) => val > 0, 'Amount must be greater than 0'),
  currency: z.enum(['MYR', 'USD', 'EUR', 'GBP', 'SGD']),
  status: z.enum(['draft', 'pending', 'paid', 'overdue', 'cancelled']),
  issueDate: z.string().min(1, 'Issue date is required'),
  dueDate: z.string().optional(),
  notes: z.string().max(2000, 'Notes are too long').optional(),
});

// Type exports
export type ProjectFormData = z.infer<typeof projectSchema>;
export type ClientFormData = z.infer<typeof clientSchema>;
export type TeamMemberFormData = z.infer<typeof teamMemberSchema>;
export type TimesheetFormData = z.infer<typeof timesheetSchema>;
export type InventoryItemFormData = z.infer<typeof inventoryItemSchema>;
export type PurchaseOrderFormData = z.infer<typeof purchaseOrderSchema>;
export type InvoiceFormData = z.infer<typeof invoiceSchema>;

/**
 * Utility function to validate form data
 * Returns either the validated data or an object with field errors
 */
export function validateForm<T extends z.ZodSchema>(
  schema: T,
  data: unknown
): { success: true; data: z.infer<T> } | { success: false; errors: Record<string, string> } {
  const result = schema.safeParse(data);

  if (result.success) {
    return { success: true, data: result.data };
  }

  const errors: Record<string, string> = {};
  for (const error of result.error.issues) {
    const path = error.path.join('.');
    if (!errors[path]) {
      errors[path] = error.message;
    }
  }

  return { success: false, errors };
}

/**
 * Get the first error message for a field
 */
export function getFieldError(
  errors: z.ZodError | undefined | null,
  fieldName: string
): string | undefined {
  if (!errors) return undefined;

  const fieldError = errors.issues.find(
    (err) => err.path.join('.') === fieldName
  );

  return fieldError?.message;
}

/**
 * Convert zod errors to a flat object
 */
export function flattenErrors(errors: z.ZodError): Record<string, string> {
  const flatErrors: Record<string, string> = {};

  for (const error of errors.issues) {
    const path = error.path.join('.');
    if (!flatErrors[path]) {
      flatErrors[path] = error.message;
    }
  }

  return flatErrors;
}
