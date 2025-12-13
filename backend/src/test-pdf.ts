import 'reflect-metadata';
import { AppDataSource } from './config/database';
import { Invoice } from './entities/Invoice';
import { IssuedPO } from './entities/IssuedPO';
import { InvoicePDFService } from './services/invoice-pdf.service';
import { IssuedPOPDFService } from './services/issued-po-pdf.service';
import * as fs from 'fs';

async function testPDFGeneration() {
  console.log('🧪 Testing PDF Generation...\n');

  try {
    // Initialize database
    await AppDataSource.initialize();
    console.log('✅ Database connected\n');

    // Test Invoice PDF
    console.log('📄 Testing Invoice PDF Generation...');
    const invoiceRepo = AppDataSource.getRepository(Invoice);
    const testInvoice = await invoiceRepo.findOne({
      where: { invoice_number: 'MCE1477' }
    });

    if (testInvoice) {
      console.log(`   Invoice: ${testInvoice.invoice_number}`);
      console.log(`   Project: ${testInvoice.project_name}`);
      console.log(`   Amount: RM ${testInvoice.amount}`);

      const pdfBuffer = await InvoicePDFService.generateInvoicePDF(testInvoice);
      const filename = `test-invoice-${testInvoice.invoice_number}.pdf`;
      fs.writeFileSync(filename, pdfBuffer);

      console.log(`   ✅ PDF generated successfully: ${filename}`);
      console.log(`   📦 File size: ${(pdfBuffer.length / 1024).toFixed(2)} KB\n`);
    } else {
      console.log('   ❌ Test invoice not found\n');
    }

    // Test Issued PO PDF
    console.log('📄 Testing Issued PO PDF Generation...');
    const issuedPORepo = AppDataSource.getRepository(IssuedPO);
    const testPO = await issuedPORepo.findOne({
      where: {},
      order: { issue_date: 'DESC' }
    });

    if (testPO) {
      console.log(`   PO Number: ${testPO.po_number}`);
      console.log(`   Recipient: ${testPO.recipient}`);
      console.log(`   Items: ${testPO.items.substring(0, 50)}...`);

      const pdfBuffer = await IssuedPOPDFService.generateIssuedPOPDF(testPO);
      const filename = `test-po-${testPO.po_number}.pdf`;
      fs.writeFileSync(filename, pdfBuffer);

      console.log(`   ✅ PDF generated successfully: ${filename}`);
      console.log(`   📦 File size: ${(pdfBuffer.length / 1024).toFixed(2)} KB\n`);
    } else {
      console.log('   ❌ Test PO not found\n');
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ PDF Generation Test Complete!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    await AppDataSource.destroy();
    process.exit(0);

  } catch (error: any) {
    console.error('❌ Test failed:', error);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run test
testPDFGeneration();
