import { format } from 'date-fns';
import * as XLSX from 'xlsx';
import { toast } from 'react-hot-toast';

/**
 * Export utilities for finance documents
 * Supports both CSV and Excel export formats
 */

// ============================================
// CSV EXPORTS
// ============================================

/**
 * Export Received POs to CSV
 */
export function exportReceivedPOsToCSV(POs: any[]): void {
  if (!POs || POs.length === 0) {
    console.error('No Received POs to export');
    toast.error('No Received POs data to export');
    return;
  }

  const headers = [
    'PO Number',
    'Status',
    'Project Code',
    'Project Title',
    'Client Name',
    'Amount',
    'Currency',
    'Received Date',
    'Due Date',
    'Description',
  ];

  const rows = POs.map(po => [
    po.poNumber || '',
    po.status || '',
    po.projectCode || '',
    po.project?.title || '',
    po.clientName || po.project?.client?.name || '',
    po.amount || 0,
    po.currency || 'MYR',
    po.receivedDate ? format(new Date(po.receivedDate), 'yyyy-MM-dd') : '',
    po.dueDate ? format(new Date(po.dueDate), 'yyyy-MM-dd') : '',
    po.description || '',
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => JSON.stringify(cell || '')).join(',')),
  ].join('\n');

  downloadFile(csvContent, `received-pos-${format(new Date(), 'yyyy-MM-dd')}.csv`, 'text/csv');
}

/**
 * Export Invoices to CSV
 */
export function exportInvoicesToCSV(invoices: any[]): void {
  if (!invoices || invoices.length === 0) {
    console.error('No Invoices to export');
    toast.error('No Invoices data to export');
    return;
  }

  const headers = [
    'Invoice Number',
    'Status',
    'Project Code',
    'Project Title',
    'Client Name',
    'Amount',
    'Currency',
    'Percentage of Total (%)',
    'Invoice Date',
    'Due Date',
    'Remark',
  ];

  const rows = invoices.map(inv => [
    inv.invoiceNumber || '',
    inv.status || '',
    inv.projectCode || '',
    inv.projectName || '',
    inv.clientName || '',
    inv.amount || 0,
    inv.currency || 'MYR',
    inv.percentageOfTotal || inv.percentage_of_total || 0,
    inv.invoiceDate || inv.invoice_date ? format(new Date(inv.invoiceDate || inv.invoice_date), 'yyyy-MM-dd') : '',
    inv.dueDate ? format(new Date(inv.dueDate), 'yyyy-MM-dd') : '',
    inv.remark || '',
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => JSON.stringify(cell || '')).join(',')),
  ].join('\n');

  downloadFile(csvContent, `invoices-${format(new Date(), 'yyyy-MM-dd')}.csv`, 'text/csv');
}

/**
 * Export Issued POs to CSV
 */
export function exportIssuedPOsToCSV(POs: any[]): void {
  if (!POs || POs.length === 0) {
    console.error('No Issued POs to export');
    toast.error('No Issued POs data to export');
    return;
  }

  const headers = [
    'PO Number',
    'Status',
    'Project Code',
    'Project Title',
    'Recipient',
    'Amount',
    'Currency',
    'Items',
    'Issue Date',
    'Due Date',
  ];

  const rows = POs.map(po => [
    po.poNumber || po.po_number || '',
    po.status || '',
    po.projectCode || po.project_code || '',
    po.project?.title || '',
    po.recipient || po.recipient || '',
    po.amount || 0,
    po.currency || 'MYR',
    po.items || '',
    po.issueDate ? format(new Date(po.issueDate), 'yyyy-MM-dd') : '',
    po.dueDate ? format(new Date(po.dueDate), 'yyyy-MM-dd') : '',
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => JSON.stringify(cell || '')).join(',')),
  ].join('\n');

  downloadFile(csvContent, `issued-pos-${format(new Date(), 'yyyy-MM-dd')}.csv`, 'text/csv');
}

// ============================================
// EXCEL EXPORTS
// ============================================

/**
 * Export Received POs to Excel
 */
export function exportReceivedPOsToExcel(POs: any[]): void {
  if (!POs || POs.length === 0) {
    console.error('No Received POs to export');
    toast.error('No Received POs data to export');
    return;
  }

  const data = POs.map(po => ({
    'PO Number': po.poNumber || '',
    'Status': po.status || '',
    'Project Code': po.projectCode || '',
    'Project Title': po.project?.title || '',
    'Client Name': po.clientName || po.project?.client?.name || '',
    'Amount': po.amount || 0,
    'Currency': po.currency || 'MYR',
    'Received Date': po.receivedDate ? format(new Date(po.receivedDate), 'yyyy-MM-dd') : '',
    'Due Date': po.dueDate ? format(new Date(po.dueDate), 'yyyy-MM-dd') : '',
    'Description': po.description || '',
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Received POs');

  XLSX.writeFile(workbook, `received-pos-${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
}

/**
 * Export Invoices to Excel
 */
export function exportInvoicesToExcel(invoices: any[]): void {
  if (!invoices || invoices.length === 0) {
    console.error('No Invoices to export');
    toast.error('No Invoices data to export');
    return;
  }

  const data = invoices.map(inv => ({
    'Invoice Number': inv.invoiceNumber || '',
    'Status': inv.status || '',
    'Project Code': inv.projectCode || '',
    'Project Title': inv.projectName || '',
    'Client Name': inv.clientName || '',
    'Amount': inv.amount || 0,
    'Currency': inv.currency || 'MYR',
    'Percentage of Total (%)': inv.percentageOfTotal || inv.percentage_of_total || 0,
    'Invoice Date': inv.invoiceDate || inv.invoice_date ? format(new Date(inv.invoiceDate || inv.invoice_date), 'yyyy-MM-dd') : '',
    'Due Date': inv.dueDate ? format(new Date(inv.dueDate), 'yyyy-MM-dd') : '',
    'Remark': inv.remark || '',
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Invoices');

  XLSX.writeFile(workbook, `invoices-${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
}

/**
 * Export Issued POs to Excel
 */
export function exportIssuedPOsToExcel(POs: any[]): void {
  if (!POs || POs.length === 0) {
    console.error('No Issued POs to export');
    toast.error('No Issued POs data to export');
    return;
  }

  const data = POs.map(po => ({
    'PO Number': po.poNumber || po.po_number || '',
    'Status': po.status || '',
    'Project Code': po.projectCode || po.project_code || '',
    'Project Title': po.project?.title || '',
    'Recipient': po.recipient || '',
    'Amount': po.amount || 0,
    'Currency': po.currency || 'MYR',
    'Items': po.items || '',
    'Issue Date': po.issueDate ? format(new Date(po.issueDate), 'yyyy-MM-dd') : '',
    'Due Date': po.dueDate ? format(new Date(po.dueDate), 'yyyy-MM-dd') : '',
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Issued POs');

  XLSX.writeFile(workbook, `issued-pos-${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
}

/**
 * Export Received Invoices to CSV
 */
export function exportReceivedInvoicesToCSV(invoices: any[]): void {
  if (!invoices || invoices.length === 0) {
    console.error('No Received Invoices to export');
    toast.error('No Received Invoices data to export');
    return;
  }

  const headers = [
    'Invoice Number',
    'Status',
    'Vendor Name',
    'Issued PO Number',
    'Amount',
    'Currency',
    'Invoice Date',
    'Received Date',
    'Due Date',
    'Description',
  ];

  const rows = invoices.map(invoice => [
    invoice.invoiceNumber || '',
    invoice.status || '',
    invoice.vendorName || '',
    invoice.issuedPO?.po_number || invoice.issuedPoNumber || '',
    invoice.amount || 0,
    invoice.currency || 'MYR',
    invoice.invoiceDate ? format(new Date(invoice.invoiceDate), 'yyyy-MM-dd') : '',
    invoice.receivedDate ? format(new Date(invoice.receivedDate), 'yyyy-MM-dd') : '',
    invoice.dueDate ? format(new Date(invoice.dueDate), 'yyyy-MM-dd') : '',
    invoice.description || '',
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => JSON.stringify(cell || '')).join(',')),
  ].join('\n');

  downloadFile(csvContent, `received-invoices-${format(new Date(), 'yyyy-MM-dd')}.csv`, 'text/csv');
}

/**
 * Export Received Invoices to Excel
 */
export function exportReceivedInvoicesToExcel(invoices: any[]): void {
  if (!invoices || invoices.length === 0) {
    console.error('No Received Invoices to export');
    toast.error('No Received Invoices data to export');
    return;
  }

  const data = invoices.map(invoice => ({
    'Invoice Number': invoice.invoiceNumber || '',
    'Status': invoice.status || '',
    'Vendor Name': invoice.vendorName || '',
    'Issued PO Number': invoice.issuedPO?.po_number || invoice.issuedPoNumber || '',
    'Amount': invoice.amount || 0,
    'Currency': invoice.currency || 'MYR',
    'Invoice Date': invoice.invoiceDate ? format(new Date(invoice.invoiceDate), 'yyyy-MM-dd') : '',
    'Received Date': invoice.receivedDate ? format(new Date(invoice.receivedDate), 'yyyy-MM-dd') : '',
    'Due Date': invoice.dueDate ? format(new Date(invoice.dueDate), 'yyyy-MM-dd') : '',
    'Description': invoice.description || '',
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Received Invoices');

  XLSX.writeFile(workbook, `received-invoices-${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Download file helper
 */
function downloadFile(content: string, filename: string, type: string): void {
  const link = document.createElement('a');
  const blob = new Blob([content], { type });
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}
