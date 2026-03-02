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
const database_1 = require("./config/database");
const Invoice_1 = require("./entities/Invoice");
const IssuedPO_1 = require("./entities/IssuedPO");
const invoice_pdf_service_1 = require("./services/invoice-pdf.service");
const issued_po_pdf_service_1 = require("./services/issued-po-pdf.service");
const fs = __importStar(require("fs"));
async function testPDFGeneration() {
    console.log('🧪 Testing PDF Generation...\n');
    try {
        // Initialize database
        await database_1.AppDataSource.initialize();
        console.log('✅ Database connected\n');
        // Test Invoice PDF
        console.log('📄 Testing Invoice PDF Generation...');
        const invoiceRepo = database_1.AppDataSource.getRepository(Invoice_1.Invoice);
        const testInvoice = await invoiceRepo.findOne({
            where: { invoice_number: 'MCE1477' }
        });
        if (testInvoice) {
            console.log(`   Invoice: ${testInvoice.invoice_number}`);
            console.log(`   Project: ${testInvoice.project_name}`);
            console.log(`   Amount: RM ${testInvoice.amount}`);
            const pdfBuffer = await invoice_pdf_service_1.InvoicePDFService.generateInvoicePDF(testInvoice);
            const filename = `test-invoice-${testInvoice.invoice_number}.pdf`;
            fs.writeFileSync(filename, pdfBuffer);
            console.log(`   ✅ PDF generated successfully: ${filename}`);
            console.log(`   📦 File size: ${(pdfBuffer.length / 1024).toFixed(2)} KB\n`);
        }
        else {
            console.log('   ❌ Test invoice not found\n');
        }
        // Test Issued PO PDF
        console.log('📄 Testing Issued PO PDF Generation...');
        const issuedPORepo = database_1.AppDataSource.getRepository(IssuedPO_1.IssuedPO);
        const testPO = await issuedPORepo.findOne({
            where: {},
            order: { issue_date: 'DESC' }
        });
        if (testPO) {
            console.log(`   PO Number: ${testPO.po_number}`);
            console.log(`   Recipient: ${testPO.recipient}`);
            console.log(`   Items: ${testPO.items.substring(0, 50)}...`);
            const pdfBuffer = await issued_po_pdf_service_1.IssuedPOPDFService.generateIssuedPOPDF(testPO);
            const filename = `test-po-${testPO.po_number}.pdf`;
            fs.writeFileSync(filename, pdfBuffer);
            console.log(`   ✅ PDF generated successfully: ${filename}`);
            console.log(`   📦 File size: ${(pdfBuffer.length / 1024).toFixed(2)} KB\n`);
        }
        else {
            console.log('   ❌ Test PO not found\n');
        }
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('✅ PDF Generation Test Complete!');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
        await database_1.AppDataSource.destroy();
        process.exit(0);
    }
    catch (error) {
        console.error('❌ Test failed:', error);
        console.error(error.stack);
        process.exit(1);
    }
}
// Run test
testPDFGeneration();
//# sourceMappingURL=test-pdf.js.map