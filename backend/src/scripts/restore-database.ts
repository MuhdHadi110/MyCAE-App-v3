import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';
import { verifyBackup } from './verify-backup';
import { AppDataSource } from '../config/database';

const execAsync = promisify(exec);

interface RestoreConfig {
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  backupFile: string;
  testMode: boolean; // If true, restore to test database first
}

interface RestoreResult {
  success: boolean;
  databaseRestored: string;
  rowCounts: Record<string, number>;
  errors: string[];
  warnings: string[];
}

async function getRowCounts(database: string, config: RestoreConfig): Promise<Record<string, number>> {
  console.log(`📊 Counting rows in database: ${database}`);

  const counts: Record<string, number> = {};

  try {
    // Connect to the specific database
    const connectionString = `mysql://${config.username}:${config.password}@${config.host}:${config.port}/${database}`;

    const tables = [
      'users', 'companies', 'projects', 'invoices', 'issued_pos',
      'received_invoices', 'purchase_orders', 'timesheets', 'inventory',
      'maintenance_tickets', 'checkouts', 'audit_logs', 'activity'
    ];

    for (const table of tables) {
      try {
        const countQuery = `SELECT COUNT(*) as count FROM ${table}`;
        const result = await execAsync(
          `mysql -h ${config.host} -P ${config.port} -u ${config.username} -p${config.password} ${database} -e "${countQuery}" -N`
        );
        const count = parseInt(result.stdout.trim());
        counts[table] = isNaN(count) ? 0 : count;
        console.log(`   ${table}: ${counts[table]} rows`);
      } catch (error) {
        counts[table] = -1; // Mark as error
        console.log(`   ${table}: ERROR`);
      }
    }

  } catch (error: any) {
    console.error('Error getting row counts:', error.message);
  }

  return counts;
}

async function restoreDatabase(config: RestoreConfig): Promise<RestoreResult> {
  console.log('🔄 Starting database restore process...\n');
  console.log(`Backup file: ${path.basename(config.backupFile)}`);
  console.log(`Target database: ${config.database}`);
  console.log(`Test mode: ${config.testMode ? 'YES (will restore to test DB first)' : 'NO (direct restore)'}\n`);

  const result: RestoreResult = {
    success: false,
    databaseRestored: '',
    rowCounts: {},
    errors: [],
    warnings: []
  };

  try {
    // Step 1: Verify backup file first
    console.log('Step 1: Verifying backup file...');
    const verification = await verifyBackup(config.backupFile);

    if (!verification.valid) {
      result.errors.push('Backup verification failed');
      verification.errors.forEach(error => result.errors.push(`  - ${error}`));
      console.log('❌ Backup verification failed. Cannot proceed with restore.\n');
      return result;
    }
    console.log('✅ Backup verification passed\n');

    // Step 2: Determine target database
    let targetDb = config.database;
    if (config.testMode) {
      targetDb = `${config.database}_restore_test`;
      console.log(`Step 2: Using test database: ${targetDb}`);
    } else {
      console.log(`Step 2: Restoring directly to: ${targetDb}`);
      console.log('⚠️  WARNING: This will overwrite the existing database!');
    }

    // Step 3: Create/recreate target database
    console.log(`\nStep 3: Preparing database ${targetDb}...`);

    try {
      // Drop database if exists (for test mode)
      if (config.testMode) {
        await execAsync(
          `mysql -h ${config.host} -P ${config.port} -u ${config.username} -p${config.password} -e "DROP DATABASE IF EXISTS ${targetDb}"`
        );
        console.log(`   Dropped existing test database (if any)`);
      }

      // Create database
      await execAsync(
        `mysql -h ${config.host} -P ${config.port} -u ${config.username} -p${config.password} -e "CREATE DATABASE IF NOT EXISTS ${targetDb}"`
      );
      console.log(`   ✅ Database ${targetDb} ready`);

    } catch (error: any) {
      result.errors.push(`Failed to prepare database: ${error.message}`);
      console.log(`   ❌ Error: ${error.message}`);
      return result;
    }

    // Step 4: Decompress backup if needed
    console.log('\nStep 4: Preparing backup file...');
    let sqlFile = config.backupFile;
    let tempFile: string | null = null;

    if (config.backupFile.endsWith('.gz')) {
      tempFile = config.backupFile.replace('.gz', '.temp.sql');
      console.log(`   Decompressing to: ${path.basename(tempFile)}`);

      await execAsync(`gunzip -c "${config.backupFile}" > "${tempFile}"`);
      sqlFile = tempFile;
      console.log(`   ✅ Decompressed successfully`);
    } else {
      console.log(`   ℹ️  Backup is not compressed`);
    }

    // Step 5: Restore database
    console.log('\nStep 5: Restoring database...');
    console.log('   This may take several minutes for large databases...');

    try {
      await execAsync(
        `mysql -h ${config.host} -P ${config.port} -u ${config.username} -p${config.password} ${targetDb} < "${sqlFile}"`
      );
      console.log(`   ✅ Database restored successfully`);
      result.databaseRestored = targetDb;

    } catch (error: any) {
      result.errors.push(`Restore failed: ${error.message}`);
      console.log(`   ❌ Restore failed: ${error.message}`);

      // Clean up temp file
      if (tempFile && fs.existsSync(tempFile)) {
        fs.unlinkSync(tempFile);
      }

      return result;
    }

    // Clean up temp file
    if (tempFile && fs.existsSync(tempFile)) {
      fs.unlinkSync(tempFile);
      console.log(`   Cleaned up temporary files`);
    }

    // Step 6: Verify restored data
    console.log('\nStep 6: Verifying restored data...');
    result.rowCounts = await getRowCounts(targetDb, config);

    // Check for empty tables
    const emptyTables = Object.entries(result.rowCounts)
      .filter(([table, count]) => count === 0)
      .map(([table]) => table);

    if (emptyTables.length > 0) {
      result.warnings.push(`Empty tables: ${emptyTables.join(', ')}`);
      console.log(`   ⚠️  Warning: Some tables are empty: ${emptyTables.join(', ')}`);
    }

    // Check for error tables
    const errorTables = Object.entries(result.rowCounts)
      .filter(([table, count]) => count === -1)
      .map(([table]) => table);

    if (errorTables.length > 0) {
      result.errors.push(`Could not verify tables: ${errorTables.join(', ')}`);
      console.log(`   ❌ Could not verify: ${errorTables.join(', ')}`);
    }

    // Step 7: Final summary
    console.log('\n' + '='.repeat(70));
    if (result.errors.length === 0) {
      result.success = true;
      console.log('✅ DATABASE RESTORE COMPLETED SUCCESSFULLY');
      console.log(`   Database: ${targetDb}`);
      console.log(`   Total tables verified: ${Object.keys(result.rowCounts).length}`);

      if (config.testMode) {
        console.log('\nℹ️  Test Mode Results:');
        console.log('   The backup has been restored to a test database.');
        console.log('   Review the data and then you can:');
        console.log(`   1. Copy data to production: Use your DB tool or script`);
        console.log(`   2. Delete test database: DROP DATABASE ${targetDb};`);
      }
    } else {
      console.log('❌ DATABASE RESTORE FAILED');
      console.log('   Errors:');
      result.errors.forEach((error, index) => {
        console.log(`   ${index + 1}. ${error}`);
      });
    }

    if (result.warnings.length > 0) {
      console.log('\n⚠️  Warnings:');
      result.warnings.forEach((warning, index) => {
        console.log(`   ${index + 1}. ${warning}`);
      });
    }

    console.log('='.repeat(70) + '\n');

  } catch (error: any) {
    result.errors.push(`Unexpected error: ${error.message}`);
    console.error('❌ Unexpected error during restore:', error);
  }

  return result;
}

// Main execution
async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.error('Usage: ts-node restore-database.ts <backup-file> [target-database] [--test]');
    console.error('\nExamples:');
    console.error('  ts-node restore-database.ts ../backups/mycae-backup-2026-01-29.sql.gz');
    console.error('  ts-node restore-database.ts ../backups/mycae-backup-2026-01-29.sql.gz mycae_tracker');
    console.error('  ts-node restore-database.ts ../backups/mycae-backup-2026-01-29.sql.gz mycae_tracker --test');
    console.error('\nOptions:');
    console.error('  --test    Restore to test database first (recommended)');
    process.exit(1);
  }

  const backupFile = args[0];
  const targetDatabase = args[1] || process.env.DB_DATABASE || 'mycae_tracker';
  const testMode = args.includes('--test');

  const config: RestoreConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    database: targetDatabase,
    username: process.env.DB_USERNAME || 'root',
    password: process.env.DB_PASSWORD || '',
    backupFile: backupFile,
    testMode: testMode
  };

  // Confirm before restoring to production
  if (!testMode) {
    console.log('\n⚠️  WARNING: You are about to restore to the PRODUCTION database!');
    console.log(`   Database: ${config.database}`);
    console.log(`   Host: ${config.host}`);
    console.log('\n   This will OVERWRITE all existing data.');
    console.log('   Consider using --test flag to restore to a test database first.\n');

    // In a real scenario, you'd want to prompt for confirmation here
    // For automation, we'll proceed but log the warning
  }

  try {
    const result = await restoreDatabase(config);

    if (result.success) {
      console.log('✅ Restore completed successfully!');
      process.exit(0);
    } else {
      console.log('❌ Restore failed!');
      process.exit(1);
    }
  } catch (error) {
    console.error('Restore process failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

export { restoreDatabase };
