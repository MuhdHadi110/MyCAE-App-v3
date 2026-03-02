"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const database_1 = require("../config/database");
const Invoice_1 = require("../entities/Invoice");
const Project_1 = require("../entities/Project");
const XLSX = __importStar(require("xlsx"));
const uuid_1 = require("uuid");
const EXCEL_PATH = 'C:/Users/User/Desktop/For mycae app/MyCAE Invoice Tracking for claude input.xlsx';
/**
 * Parse date from Excel format like "3/Jan/2024" to Date
 */
function parseExcelDate(dateStr) {
    if (!dateStr)
        return new Date();
    try {
        // Handle formats like "3/Jan/2024", "24/Dec/2024"
        const parts = dateStr.split('/');
        if (parts.length === 3) {
            const day = parseInt(parts[0]);
            const monthStr = parts[1];
            const year = parseInt(parts[2]);
            // Month map
            const months = {
                'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'May': 4, 'Jun': 5,
                'Jul': 6, 'Aug': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11
            };
            const month = months[monthStr];
            if (month !== undefined) {
                return new Date(year, month, day);
            }
        }
        // Fallback: try to parse directly
        return new Date(dateStr);
    }
    catch (error) {
        console.warn(`Failed to parse date: ${dateStr}, using current date`);
        return new Date();
    }
}
/**
 * Parse amount from Excel format like " RM46,816.00 " to number
 */
function parseAmount(amountStr) {
    if (!amountStr)
        return 0;
    // Remove "RM", spaces, and commas
    const cleaned = amountStr.toString().replace(/RM/g, '').replace(/,/g, '').trim();
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? 0 : parsed;
}
/**
 * Parse percentage from Excel format like "100%", "35%", "81.08109%" to number
 */
function parsePercentage(pctStr) {
    if (!pctStr)
        return 100; // Default to 100% if not specified
    // Remove "%" and convert to number
    const cleaned = pctStr.toString().replace(/%/g, '').trim();
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? 100 : parsed;
}
/**
 * Extract project code from project string like "J22082 Micron MMP2 FAB L3 Ceiling Grid Static FEA_Tialoc"
 */
function extractProjectCode(projectStr) {
    if (!projectStr)
        return '';
    // Extract first word which is usually the project code
    const match = projectStr.match(/^([A-Z]\d+[_\d]*)/);
    if (match) {
        return match[1];
    }
    // Handle multiple codes like "J22006, J22007"
    const multiMatch = projectStr.match(/^([A-Z]\d+(?:,\s*[A-Z]\d+)*)/);
    if (multiMatch) {
        return multiMatch[1];
    }
    return projectStr.split(' ')[0] || '';
}
async function importInvoices() {
    console.log('🚀 Starting invoice import from Excel...\n');
    try {
        // Initialize database
        await database_1.AppDataSource.initialize();
        console.log('✅ Database connected\n');
        // Read Excel file
        const workbook = XLSX.readFile(EXCEL_PATH);
        const worksheet = workbook.Sheets['Invoices & Delivery Orders'];
        if (!worksheet) {
            throw new Error('Sheet "Invoices & Delivery Orders" not found');
        }
        const data = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '', raw: false });
        console.log(`📊 Found ${data.length - 1} invoice rows in Excel\n`);
        const invoiceRepo = database_1.AppDataSource.getRepository(Invoice_1.Invoice);
        const projectRepo = database_1.AppDataSource.getRepository(Project_1.Project);
        // Skip header row
        let imported = 0;
        let skipped = 0;
        let errors = 0;
        // Group invoices by project to calculate cumulative percentages
        const projectInvoices = {};
        for (let i = 1; i < data.length; i++) {
            const row = data[i];
            // Skip empty rows
            if (!row[0] && !row[1]) {
                continue;
            }
            try {
                const projectFullName = row[0] || '';
                const invoiceNumber = row[1] || '';
                const amountStr = row[2] || '0';
                const dateStr = row[3] || '';
                const percentageStr = row[4] || '100';
                const remark = row[5] || '';
                if (!invoiceNumber || !projectFullName) {
                    console.log(`⚠️  Row ${i + 1}: Skipping - missing invoice number or project`);
                    skipped++;
                    continue;
                }
                // Extract project code
                const projectCode = extractProjectCode(projectFullName);
                const amount = parseAmount(amountStr);
                const invoiceDate = parseExcelDate(dateStr);
                const percentage = parsePercentage(percentageStr);
                // Check if invoice already exists
                const existing = await invoiceRepo.findOne({ where: { invoice_number: invoiceNumber } });
                if (existing) {
                    console.log(`⏭️  Row ${i + 1}: Invoice ${invoiceNumber} already exists`);
                    skipped++;
                    continue;
                }
                // Initialize project invoice tracking
                if (!projectInvoices[projectCode]) {
                    projectInvoices[projectCode] = [];
                }
                // Calculate sequence and cumulative
                const sequence = projectInvoices[projectCode].length + 1;
                const previousTotal = projectInvoices[projectCode].reduce((sum, inv) => sum + Number(inv.percentage_of_total), 0);
                const cumulativePercentage = previousTotal + percentage;
                // Create invoice
                const invoice = new Invoice_1.Invoice();
                invoice.id = (0, uuid_1.v4)();
                invoice.invoice_number = invoiceNumber;
                invoice.project_code = projectCode;
                invoice.project_name = projectFullName;
                invoice.amount = amount;
                invoice.invoice_date = invoiceDate;
                invoice.percentage_of_total = percentage;
                invoice.invoice_sequence = sequence;
                invoice.cumulative_percentage = cumulativePercentage;
                invoice.remark = remark || '';
                invoice.status = Invoice_1.InvoiceStatus.SENT; // Assume existing invoices are sent
                await invoiceRepo.save(invoice);
                projectInvoices[projectCode].push(invoice);
                imported++;
                if (imported % 50 === 0) {
                    console.log(`✅ Imported ${imported} invoices...`);
                }
                // Check if project should be marked as completed (100% invoiced)
                if (cumulativePercentage >= 100) {
                    const primaryProjectCode = projectCode.split(',')[0].trim();
                    const project = await projectRepo.findOne({ where: { project_code: primaryProjectCode } });
                    if (project && project.status !== Project_1.ProjectStatus.COMPLETED) {
                        console.log(`  📋 Marking project ${primaryProjectCode} as completed (100% invoiced)`);
                        project.status = Project_1.ProjectStatus.COMPLETED;
                        await projectRepo.save(project);
                    }
                }
            }
            catch (error) {
                console.error(`❌ Row ${i + 1}: Error - ${error.message}`);
                errors++;
            }
        }
        console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
        console.log(`✅ Import completed!`);
        console.log(`   Imported: ${imported}`);
        console.log(`   Skipped:  ${skipped}`);
        console.log(`   Errors:   ${errors}`);
        console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
        await database_1.AppDataSource.destroy();
    }
    catch (error) {
        console.error('❌ Fatal error:', error);
        process.exit(1);
    }
}
// Run import
importInvoices();
//# sourceMappingURL=import-invoices.js.map