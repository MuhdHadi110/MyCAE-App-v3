import 'reflect-metadata';
import { AppDataSource } from '../config/database';
import { IssuedPO, IssuedPOStatus } from '../entities/IssuedPO';
import * as XLSX from 'xlsx';
import { v4 as uuidv4 } from 'uuid';

const EXCEL_PATH = 'C:/Users/User/Desktop/For mycae app/MyCAE Outgoing PO Tracking for claude.xlsx';

/**
 * Extract project code from items description if present
 * e.g., "J22081 Vibration, Acoustic and EMF Measurement" → "J22081"
 */
function extractProjectCodeFromItems(items: string): string | null {
  if (!items) return null;

  const match = items.match(/^([A-Z]\d+[_\d]*)/);
  return match ? match[1] : null;
}

async function importIssuedPOs() {
  console.log('🚀 Starting issued PO import from Excel...\n');

  try {
    // Initialize database
    await AppDataSource.initialize();
    console.log('✅ Database connected\n');

    // Read Excel file
    const workbook = XLSX.readFile(EXCEL_PATH);
    const worksheet = workbook.Sheets['Purchase Orders'];

    if (!worksheet) {
      throw new Error('Sheet "Purchase Orders" not found');
    }

    const data: any[] = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '', raw: false });

    console.log(`📊 Found ${data.length - 1} issued PO rows in Excel\n`);

    const issuedPORepo = AppDataSource.getRepository(IssuedPO);

    // Skip header row
    let imported = 0;
    let skipped = 0;
    let errors = 0;

    for (let i = 1; i < data.length; i++) {
      const row = data[i];

      // Skip empty rows
      if (!row[0] && !row[1] && !row[2]) {
        continue;
      }

      try {
        const items = row[0] || '';
        const recipient = row[1] || '';
        const poNumber = row[2] || '';

        if (!poNumber || !items || !recipient) {
          console.log(`⚠️  Row ${i + 1}: Skipping - missing required fields`);
          skipped++;
          continue;
        }

        // Check if PO already exists
        const existing = await issuedPORepo.findOne({ where: { po_number: poNumber } });
        if (existing) {
          console.log(`⏭️  Row ${i + 1}: Issued PO ${poNumber} already exists`);
          skipped++;
          continue;
        }

        // Try to extract project code from items description
        const projectCode = extractProjectCodeFromItems(items);

        // Create issued PO
        // Note: Excel doesn't have amount or dates, so we'll set defaults
        const issuedPO = new IssuedPO();
        issuedPO.id = uuidv4();
        issuedPO.po_number = poNumber;
        issuedPO.items = items;
        issuedPO.recipient = recipient;
        issuedPO.project_code = projectCode || '';
        issuedPO.amount = 0; // Excel doesn't have amount
        issuedPO.issue_date = new Date(); // Default to current date
        issuedPO.status = IssuedPOStatus.ISSUED; // Assume issued

        await issuedPORepo.save(issuedPO);
        imported++;

        if (imported % 10 === 0) {
          console.log(`✅ Imported ${imported} issued POs...`);
        }

      } catch (error: any) {
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

    console.log(`ℹ️  Note: Excel file doesn't contain amounts or dates.`);
    console.log(`   All POs were imported with default values (amount=0, issue_date=today).`);
    console.log(`   You can update these manually later.\n`);

    await AppDataSource.destroy();

  } catch (error: any) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }
}

// Run import
importIssuedPOs();
