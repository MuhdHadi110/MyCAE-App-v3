import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';
import { AppDataSource } from '../config/database';

const execAsync = promisify(exec);

interface BackupConfig {
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  backupDir: string;
  retentionDays: number;
}

interface IntegrityCheckResult {
  query: string;
  description: string;
  count: number;
  details?: any[];
}

async function runIntegrityChecks(): Promise<IntegrityCheckResult[]> {
  console.log('🔍 Running pre-backup integrity checks...');

  const results: IntegrityCheckResult[] = [];

  try {
    // Initialize database connection if not already connected
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }

    // 1. Find orphaned timesheets
    const orphanedTimesheets = await AppDataSource.query(`
      SELECT t.id, t.project_id, COUNT(*) as orphaned_count
      FROM timesheets t LEFT JOIN projects p ON t.project_id = p.id
      WHERE p.id IS NULL GROUP BY t.project_id
    `);
    results.push({
      query: 'orphaned_timesheets',
      description: 'Timesheets with non-existent projects',
      count: orphanedTimesheets.length,
      details: orphanedTimesheets
    });

    // 2. Find invoices with non-existent project codes
    const orphanedInvoices = await AppDataSource.query(`
      SELECT i.id, i.invoice_number, i.project_code
      FROM invoices i LEFT JOIN projects p ON i.project_code = p.project_code
      WHERE p.id IS NULL AND i.project_code IS NOT NULL
    `);
    results.push({
      query: 'orphaned_invoices',
      description: 'Invoices with invalid project codes',
      count: orphanedInvoices.length,
      details: orphanedInvoices
    });

    // 3. Find checkouts with invalid returned quantities
    const invalidCheckouts = await AppDataSource.query(`
      SELECT id, quantity, returned_quantity, (returned_quantity - quantity) as invalid_excess
      FROM checkouts WHERE returned_quantity > quantity
    `);
    results.push({
      query: 'invalid_checkout_quantities',
      description: 'Checkouts where returned > quantity',
      count: invalidCheckouts.length,
      details: invalidCheckouts
    });

    // 4. Find negative inventory quantities
    const negativeInventory = await AppDataSource.query(`
      SELECT id, title, sku, quantity, status FROM inventory WHERE quantity < 0
    `);
    results.push({
      query: 'negative_inventory',
      description: 'Inventory items with negative quantities',
      count: negativeInventory.length,
      details: negativeInventory
    });

    // 5. Find timesheets with negative or zero hours
    const invalidTimesheets = await AppDataSource.query(`
      SELECT id, project_id, engineer_id, hours, date FROM timesheets WHERE hours <= 0
    `);
    results.push({
      query: 'invalid_timesheet_hours',
      description: 'Timesheets with <= 0 hours',
      count: invalidTimesheets.length,
      details: invalidTimesheets
    });

    // 6. Find invoices exceeding 100% cumulative
    const invalidInvoices = await AppDataSource.query(`
      SELECT id, invoice_number, cumulative_percentage FROM invoices
      WHERE cumulative_percentage > 100 ORDER BY cumulative_percentage DESC
    `);
    results.push({
      query: 'invalid_invoice_percentages',
      description: 'Invoices with cumulative % > 100',
      count: invalidInvoices.length,
      details: invalidInvoices
    });

    // 7. Find orphaned maintenance tickets
    const orphanedTickets = await AppDataSource.query(`
      SELECT mt.id, mt.title, mt.item_id FROM maintenance_tickets mt
      LEFT JOIN inventory i ON mt.item_id = i.id WHERE i.id IS NULL
    `);
    results.push({
      query: 'orphaned_maintenance_tickets',
      description: 'Maintenance tickets with non-existent inventory items',
      count: orphanedTickets.length,
      details: orphanedTickets
    });

    // 8. Find projects with invalid hour tracking
    const invalidProjects = await AppDataSource.query(`
      SELECT id, project_code, planned_hours, actual_hours FROM projects
      WHERE planned_hours <= 0 OR actual_hours < 0
    `);
    results.push({
      query: 'invalid_project_hours',
      description: 'Projects with invalid hour tracking',
      count: invalidProjects.length,
      details: invalidProjects
    });

    // Log results
    let totalIssues = 0;
    results.forEach(result => {
      if (result.count > 0) {
        console.warn(`⚠️  ${result.description}: ${result.count} issues found`);
        totalIssues += result.count;
      } else {
        console.log(`✅ ${result.description}: OK`);
      }
    });

    if (totalIssues > 0) {
      console.warn(`\n⚠️  Total data integrity issues: ${totalIssues}`);
      console.warn('Backup will proceed, but these issues should be addressed.\n');
    } else {
      console.log('\n✅ All integrity checks passed!\n');
    }

  } catch (error) {
    console.error('Error running integrity checks:', error);
  }

  return results;
}

async function cleanOldBackups(dir: string, retentionDays: number): Promise<void> {
  console.log(`🧹 Cleaning backups older than ${retentionDays} days...`);

  const files = fs.readdirSync(dir);
  const cutoffDate = Date.now() - (retentionDays * 24 * 60 * 60 * 1000);
  let deletedCount = 0;

  for (const file of files) {
    if (!file.startsWith('mycae-backup-')) continue;

    const filepath = path.join(dir, file);
    const stats = fs.statSync(filepath);

    if (stats.mtimeMs < cutoffDate) {
      fs.unlinkSync(filepath);
      console.log(`   Deleted: ${file}`);
      deletedCount++;
    }
  }

  if (deletedCount === 0) {
    console.log('   No old backups to clean.');
  } else {
    console.log(`   Deleted ${deletedCount} old backup(s).`);
  }
}

async function createBackup(config: BackupConfig): Promise<string> {
  console.log('🚀 Starting database backup...\n');
  console.log(`Database: ${config.database}`);
  console.log(`Host: ${config.host}:${config.port}`);
  console.log(`Backup dir: ${config.backupDir}\n`);

  // Run integrity checks BEFORE backup
  const integrityResults = await runIntegrityChecks();

  // Create backup directory if it doesn't exist
  if (!fs.existsSync(config.backupDir)) {
    fs.mkdirSync(config.backupDir, { recursive: true });
    console.log(`Created backup directory: ${config.backupDir}\n`);
  }

  // Generate filename with timestamp
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('.')[0];
  const filename = `mycae-backup-${timestamp}.sql`;
  const filepath = path.join(config.backupDir, filename);

  console.log(`📦 Creating backup: ${filename}`);

  try {
    // Create backup using mysqldump
    // Note: Password in command line is not ideal for production, but works for local backups
    const dumpCommand = `mysqldump -h ${config.host} -P ${config.port} -u ${config.username} -p${config.password} ${config.database}`;

    const { stdout } = await execAsync(dumpCommand);
    fs.writeFileSync(filepath, stdout);

    // Verify backup file was created
    const stats = fs.statSync(filepath);
    console.log(`✅ Backup created: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);

    // Compress backup
    console.log('🗜️  Compressing backup...');
    await execAsync(`gzip -f "${filepath}"`);
    const compressedPath = `${filepath}.gz`;

    const compressedStats = fs.statSync(compressedPath);
    console.log(`✅ Compressed: ${(compressedStats.size / 1024 / 1024).toFixed(2)} MB`);

    // Verify compressed file is not empty
    if (compressedStats.size === 0) {
      throw new Error('Backup file is empty after compression');
    }

    // Save integrity check results alongside backup
    const integrityFile = path.join(config.backupDir, `mycae-backup-${timestamp}-integrity.json`);
    fs.writeFileSync(integrityFile, JSON.stringify(integrityResults, null, 2));
    console.log(`📋 Integrity report saved: ${path.basename(integrityFile)}`);

    // Clean old backups
    await cleanOldBackups(config.backupDir, config.retentionDays);

    console.log(`\n✅ Backup completed successfully!`);
    console.log(`   File: ${compressedPath}`);

    return compressedPath;

  } catch (error) {
    console.error('\n❌ Backup failed:', error);
    throw error;
  }
}

// Main execution
async function main() {
  const config: BackupConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    database: process.env.DB_DATABASE || 'mycae_tracker',
    username: process.env.DB_USERNAME || 'root',
    password: process.env.DB_PASSWORD || '',
    backupDir: path.join(__dirname, '../../backups'),
    retentionDays: 30
  };

  try {
    const backupPath = await createBackup(config);
    process.exit(0);
  } catch (error) {
    console.error('Backup process failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

export { createBackup, runIntegrityChecks };
