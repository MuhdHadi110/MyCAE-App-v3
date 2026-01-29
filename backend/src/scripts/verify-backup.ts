import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';

const execAsync = promisify(exec);

interface VerificationResult {
  valid: boolean;
  checks: {
    fileExists: boolean;
    fileSize: number;
    isCompressed: boolean;
    canDecompress: boolean;
    hasValidSql: boolean;
    tableCount: number;
    hasKeyTables: boolean;
    missingTables: string[];
  };
  errors: string[];
}

const REQUIRED_TABLES = [
  'users',
  'companies',
  'projects',
  'invoices',
  'issued_pos',
  'received_invoices',
  'purchase_orders',
  'timesheets',
  'inventory',
  'maintenance_tickets',
  'checkouts',
  'audit_logs',
  'activity'
];

async function verifyBackup(backupFile: string): Promise<VerificationResult> {
  console.log(`🔍 Verifying backup: ${path.basename(backupFile)}\n`);

  const result: VerificationResult = {
    valid: true,
    checks: {
      fileExists: false,
      fileSize: 0,
      isCompressed: false,
      canDecompress: false,
      hasValidSql: false,
      tableCount: 0,
      hasKeyTables: false,
      missingTables: []
    },
    errors: []
  };

  try {
    // 1. Check file exists
    console.log('1️⃣  Checking file exists...');
    if (!fs.existsSync(backupFile)) {
      result.errors.push(`File does not exist: ${backupFile}`);
      result.valid = false;
      console.log(`   ❌ File not found`);
      return result;
    }
    result.checks.fileExists = true;
    console.log(`   ✅ File exists`);

    // 2. Check file size
    console.log('2️⃣  Checking file size...');
    const stats = fs.statSync(backupFile);
    result.checks.fileSize = stats.size;

    if (stats.size === 0) {
      result.errors.push('Backup file is empty (0 bytes)');
      result.valid = false;
      console.log(`   ❌ File is empty`);
      return result;
    }

    const sizeMB = (stats.size / 1024 / 1024).toFixed(2);
    console.log(`   ✅ Size: ${sizeMB} MB`);

    // 3. Check if compressed
    console.log('3️⃣  Checking compression...');
    const isCompressed = backupFile.endsWith('.gz');
    result.checks.isCompressed = isCompressed;

    if (isCompressed) {
      console.log(`   ✅ File is gzip compressed`);
    } else {
      console.log(`   ℹ️  File is not compressed`);
    }

    // 4. Decompress if needed and verify SQL
    console.log('4️⃣  Verifying SQL content...');
    let sqlContent: string;
    let tempFile: string | null = null;

    try {
      if (isCompressed) {
        // Decompress to temp file for verification
        tempFile = backupFile.replace('.gz', '.temp.sql');
        console.log(`   Decompressing to temp file...`);

        await execAsync(`gunzip -c "${backupFile}" > "${tempFile}"`);
        result.checks.canDecompress = true;
        console.log(`   ✅ Successfully decompressed`);

        // Read first 100KB for verification
        const fd = fs.openSync(tempFile, 'r');
        const buffer = Buffer.alloc(100 * 1024);
        fs.readSync(fd, buffer, 0, buffer.length, 0);
        fs.closeSync(fd);
        sqlContent = buffer.toString('utf8');
      } else {
        // Read first 100KB of uncompressed file
        const fd = fs.openSync(backupFile, 'r');
        const buffer = Buffer.alloc(100 * 1024);
        fs.readSync(fd, buffer, 0, buffer.length, 0);
        fs.closeSync(fd);
        sqlContent = buffer.toString('utf8');
      }

      // Check for SQL markers
      const hasMySQLHeader = sqlContent.includes('MySQL dump') || sqlContent.includes('mysqldump');
      const hasCreateTable = sqlContent.includes('CREATE TABLE');
      const hasInsertInto = sqlContent.includes('INSERT INTO');

      if (!hasMySQLHeader) {
        result.errors.push('File does not appear to be a MySQL dump');
        result.valid = false;
        console.log(`   ❌ Not a valid MySQL dump`);
      } else if (!hasCreateTable) {
        result.errors.push('No CREATE TABLE statements found');
        result.valid = false;
        console.log(`   ❌ No table definitions found`);
      } else {
        result.checks.hasValidSql = true;
        console.log(`   ✅ Valid SQL structure detected`);
      }

      // 5. Count tables
      console.log('5️⃣  Counting tables...');
      const tableMatches = sqlContent.match(/CREATE TABLE [`'](\w+)[`']/g);
      if (tableMatches) {
        result.checks.tableCount = tableMatches.length;
        console.log(`   ✅ Found ${result.checks.tableCount} table(s) in sample`);
      } else {
        console.log(`   ⚠️  Could not count tables in sample`);
      }

      // 6. Verify key tables exist
      console.log('6️⃣  Verifying key tables...');
      const foundTables: string[] = [];
      const missingTables: string[] = [];

      // For compressed files or large files, we need to read the full content
      let fullContent: string;
      if (tempFile && fs.existsSync(tempFile)) {
        fullContent = fs.readFileSync(tempFile, 'utf8');
      } else {
        fullContent = fs.readFileSync(backupFile, 'utf8');
      }

      REQUIRED_TABLES.forEach(table => {
        const tableRegex = new RegExp(`CREATE TABLE [\`']?${table}[\`']?`, 'i');
        if (tableRegex.test(fullContent)) {
          foundTables.push(table);
        } else {
          missingTables.push(table);
        }
      });

      result.checks.missingTables = missingTables;

      if (missingTables.length === 0) {
        result.checks.hasKeyTables = true;
        console.log(`   ✅ All ${REQUIRED_TABLES.length} key tables found`);
      } else {
        result.errors.push(`Missing ${missingTables.length} key tables: ${missingTables.join(', ')}`);
        result.valid = false;
        console.log(`   ❌ Missing tables: ${missingTables.join(', ')}`);
      }

      // Clean up temp file
      if (tempFile && fs.existsSync(tempFile)) {
        fs.unlinkSync(tempFile);
      }

    } catch (error: any) {
      result.errors.push(`Error reading SQL content: ${error.message}`);
      result.valid = false;
      console.log(`   ❌ Error: ${error.message}`);

      // Clean up temp file on error
      if (tempFile && fs.existsSync(tempFile)) {
        fs.unlinkSync(tempFile);
      }
    }

  } catch (error: any) {
    result.errors.push(`Unexpected error: ${error.message}`);
    result.valid = false;
    console.log(`   ❌ Unexpected error: ${error.message}`);
  }

  // Final result
  console.log('\n' + '='.repeat(60));
  if (result.valid) {
    console.log('✅ BACKUP VERIFICATION PASSED');
    console.log('   The backup file is valid and can be restored.');
  } else {
    console.log('❌ BACKUP VERIFICATION FAILED');
    console.log('   Errors found:');
    result.errors.forEach((error, index) => {
      console.log(`   ${index + 1}. ${error}`);
    });
  }
  console.log('='.repeat(60) + '\n');

  return result;
}

// Main execution
async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.error('Usage: ts-node verify-backup.ts <backup-file>');
    console.error('Example: ts-node verify-backup.ts ../backups/mycae-backup-2026-01-29.sql.gz');
    process.exit(1);
  }

  const backupFile = args[0];

  try {
    const result = await verifyBackup(backupFile);

    if (result.valid) {
      process.exit(0);
    } else {
      process.exit(1);
    }
  } catch (error) {
    console.error('Verification process failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

export { verifyBackup };
