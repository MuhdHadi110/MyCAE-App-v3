import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';
import dotenv from 'dotenv';

dotenv.config();

const execAsync = promisify(exec);

interface RestoreConfig {
  dbHost: string;
  dbPort: string;
  dbUser: string;
  dbPassword: string;
  dbName: string;
  backupDir: string;
  oneDriveDir: string;
}

const config: RestoreConfig = {
  dbHost: process.env.DB_HOST || 'localhost',
  dbPort: process.env.DB_PORT || '3306',
  dbUser: process.env.DB_USER || 'root',
  dbPassword: process.env.DB_PASSWORD || '',
  dbName: process.env.DB_NAME || 'mycaetracker_dev',
  backupDir: path.join(__dirname, '../../backups'),
  oneDriveDir: process.env.ONEDRIVE_BACKUP_PATH || '',
};

/**
 * List available backups from both local and OneDrive
 */
function listAvailableBackups(): Array<{ source: string; filename: string; path: string; size: string; date: Date }> {
  const backups: Array<{ source: string; filename: string; path: string; size: string; date: Date }> = [];

  // Check local backups
  if (fs.existsSync(config.backupDir)) {
    const localFiles = fs.readdirSync(config.backupDir);

    for (const file of localFiles) {
      if (file.startsWith('mycae_tracker_') && file.endsWith('.sql')) {
        const filePath = path.join(config.backupDir, file);
        const stats = fs.statSync(filePath);
        const sizeMB = (stats.size / 1024 / 1024).toFixed(2);

        backups.push({
          source: 'Local',
          filename: file,
          path: filePath,
          size: `${sizeMB} MB`,
          date: stats.mtime,
        });
      }
    }
  }

  // Check OneDrive backups
  if (config.oneDriveDir) {
    const oneDriveBackupPath = path.join(config.oneDriveDir, 'MycaeTracker_Backups');
    if (fs.existsSync(oneDriveBackupPath)) {
      const oneDriveFiles = fs.readdirSync(oneDriveBackupPath);

      for (const file of oneDriveFiles) {
        if (file.startsWith('mycae_tracker_') && file.endsWith('.sql')) {
          const filePath = path.join(oneDriveBackupPath, file);
          const stats = fs.statSync(filePath);
          const sizeMB = (stats.size / 1024 / 1024).toFixed(2);

          backups.push({
            source: 'OneDrive',
            filename: file,
            path: filePath,
            size: `${sizeMB} MB`,
            date: stats.mtime,
          });
        }
      }
    }
  }

  // Sort by date (newest first)
  backups.sort((a, b) => b.date.getTime() - a.date.getTime());

  return backups;
}

/**
 * Prompt user to confirm restoration
 */
async function confirmRestore(): Promise<boolean> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question('\n⚠️  WARNING: This will REPLACE ALL current data!\nType "RESTORE" to confirm: ', (answer) => {
      rl.close();
      resolve(answer.trim() === 'RESTORE');
    });
  });
}

/**
 * Prompt user to select backup
 */
async function selectBackup(backups: Array<{ source: string; filename: string; path: string; size: string; date: Date }>): Promise<string | null> {
  console.log('\n📋 Available Backups:\n');
  console.log('  #  | Source    | Date                | Size     | Filename');
  console.log('-----|-----------|---------------------|----------|------------------------------------------');

  backups.forEach((backup, index) => {
    const num = String(index + 1).padStart(3, ' ');
    const source = backup.source.padEnd(9, ' ');
    const date = backup.date.toLocaleString().padEnd(19, ' ');
    const size = backup.size.padEnd(8, ' ');

    console.log(`  ${num} | ${source} | ${date} | ${size} | ${backup.filename}`);
  });

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question('\nSelect backup number (or 0 to cancel): ', (answer) => {
      rl.close();
      const selection = parseInt(answer.trim(), 10);

      if (selection === 0) {
        resolve(null);
      } else if (selection > 0 && selection <= backups.length) {
        resolve(backups[selection - 1].path);
      } else {
        console.log('❌ Invalid selection');
        resolve(null);
      }
    });
  });
}

/**
 * Restore database from backup file
 */
async function restoreDatabase(backupFilePath: string): Promise<void> {
  console.log('\n🔄 Restoring database...');

  const restoreCommand = `mysql -h ${config.dbHost} -P ${config.dbPort} -u ${config.dbUser} ${
    config.dbPassword ? `-p${config.dbPassword}` : ''
  } ${config.dbName} < "${backupFilePath}"`;

  try {
    await execAsync(restoreCommand);
    console.log('✅ Database restored successfully');
  } catch (error: any) {
    throw new Error(`Failed to restore database: ${error.message}`);
  }
}

/**
 * Main restoration function
 */
async function performRestore(): Promise<void> {
  console.log('\n🔄 MyCAE Tracker - Database Restore');
  console.log('====================================');
  console.log(`📅 Started at: ${new Date().toLocaleString()}`);
  console.log(`🗄️  Database: ${config.dbName}`);

  try {
    // List available backups
    const backups = listAvailableBackups();

    if (backups.length === 0) {
      console.log('\n❌ No backups found!');
      console.log(`   Checked locations:`);
      console.log(`   - Local: ${config.backupDir}`);
      if (config.oneDriveDir) {
        console.log(`   - OneDrive: ${path.join(config.oneDriveDir, 'MycaeTracker_Backups')}`);
      }
      process.exit(1);
    }

    // Let user select backup
    const selectedBackup = await selectBackup(backups);

    if (!selectedBackup) {
      console.log('\n❌ Restore cancelled');
      process.exit(0);
    }

    // Confirm restore
    const confirmed = await confirmRestore();

    if (!confirmed) {
      console.log('\n❌ Restore cancelled - confirmation not received');
      process.exit(0);
    }

    // Perform restoration
    await restoreDatabase(selectedBackup);

    console.log('');
    console.log('✅ RESTORE COMPLETED SUCCESSFULLY');
    console.log(`📁 Restored from: ${selectedBackup}`);
    console.log('====================================\n');
  } catch (error: any) {
    console.error('');
    console.error('❌ RESTORE FAILED');
    console.error(`Error: ${error.message}`);
    console.error('====================================\n');
    process.exit(1);
  }
}

// Run restore
performRestore();
