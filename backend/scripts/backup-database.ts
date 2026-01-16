import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const execAsync = promisify(exec);

interface BackupConfig {
  dbHost: string;
  dbPort: string;
  dbUser: string;
  dbPassword: string;
  dbName: string;
  backupDir: string;
  oneDriveDir: string;
}

const config: BackupConfig = {
  dbHost: process.env.DB_HOST || 'localhost',
  dbPort: process.env.DB_PORT || '3306',
  dbUser: process.env.DB_USER || 'root',
  dbPassword: process.env.DB_PASSWORD || '',
  dbName: process.env.DB_NAME || 'mycaetracker_dev',
  backupDir: path.join(__dirname, '../../backups'),
  oneDriveDir: process.env.ONEDRIVE_BACKUP_PATH || '', // Set in .env
};

/**
 * Generate timestamped backup filename
 */
function getBackupFilename(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hour = String(now.getHours()).padStart(2, '0');
  const minute = String(now.getMinutes()).padStart(2, '0');

  return `mycae_tracker_${year}-${month}-${day}_${hour}-${minute}.sql`;
}

/**
 * Create local backup directory if it doesn't exist
 */
function ensureBackupDirectory(): void {
  if (!fs.existsSync(config.backupDir)) {
    fs.mkdirSync(config.backupDir, { recursive: true });
    console.log(`✅ Created backup directory: ${config.backupDir}`);
  }
}

/**
 * Create MySQL database dump
 */
async function createDatabaseDump(outputPath: string): Promise<void> {
  console.log('📦 Creating database dump...');

  const dumpCommand = `mysqldump -h ${config.dbHost} -P ${config.dbPort} -u ${config.dbUser} ${
    config.dbPassword ? `-p${config.dbPassword}` : ''
  } ${config.dbName} --result-file="${outputPath}" --single-transaction --routines --triggers --events`;

  try {
    await execAsync(dumpCommand);

    // Verify file was created and has content
    const stats = fs.statSync(outputPath);
    if (stats.size === 0) {
      throw new Error('Backup file is empty');
    }

    const sizeMB = (stats.size / 1024 / 1024).toFixed(2);
    console.log(`✅ Database dump created successfully (${sizeMB} MB)`);
  } catch (error: any) {
    throw new Error(`Failed to create database dump: ${error.message}`);
  }
}

/**
 * Copy backup to OneDrive
 */
async function copyToOneDrive(localPath: string, filename: string): Promise<void> {
  if (!config.oneDriveDir) {
    console.log('⚠️  OneDrive path not configured. Skipping cloud backup.');
    console.log('   Set ONEDRIVE_BACKUP_PATH in backend/.env to enable OneDrive sync');
    return;
  }

  console.log('☁️  Copying to OneDrive...');

  try {
    // Create OneDrive backup directory if it doesn't exist
    const oneDriveBackupPath = path.join(config.oneDriveDir, 'MycaeTracker_Backups');
    if (!fs.existsSync(oneDriveBackupPath)) {
      fs.mkdirSync(oneDriveBackupPath, { recursive: true });
      console.log(`✅ Created OneDrive backup directory: ${oneDriveBackupPath}`);
    }

    // Copy file to OneDrive
    const oneDriveFilePath = path.join(oneDriveBackupPath, filename);
    fs.copyFileSync(localPath, oneDriveFilePath);

    const stats = fs.statSync(oneDriveFilePath);
    const sizeMB = (stats.size / 1024 / 1024).toFixed(2);
    console.log(`✅ Backup copied to OneDrive (${sizeMB} MB)`);
    console.log(`   Location: ${oneDriveFilePath}`);
  } catch (error: any) {
    console.error(`❌ Failed to copy to OneDrive: ${error.message}`);
    throw error;
  }
}

/**
 * Clean up old backups (retention policy)
 */
async function cleanupOldBackups(): Promise<void> {
  console.log('🧹 Cleaning up old backups...');

  const retentionDays = 30; // Keep backups for 30 days
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

  try {
    // Clean local backups
    const localFiles = fs.readdirSync(config.backupDir);
    let localDeleted = 0;

    for (const file of localFiles) {
      if (file.startsWith('mycae_tracker_') && file.endsWith('.sql')) {
        const filePath = path.join(config.backupDir, file);
        const stats = fs.statSync(filePath);

        if (stats.mtime < cutoffDate) {
          fs.unlinkSync(filePath);
          localDeleted++;
        }
      }
    }

    if (localDeleted > 0) {
      console.log(`✅ Deleted ${localDeleted} old local backup(s)`);
    }

    // Clean OneDrive backups
    if (config.oneDriveDir) {
      const oneDriveBackupPath = path.join(config.oneDriveDir, 'MycaeTracker_Backups');
      if (fs.existsSync(oneDriveBackupPath)) {
        const oneDriveFiles = fs.readdirSync(oneDriveBackupPath);
        let oneDriveDeleted = 0;

        for (const file of oneDriveFiles) {
          if (file.startsWith('mycae_tracker_') && file.endsWith('.sql')) {
            const filePath = path.join(oneDriveBackupPath, file);
            const stats = fs.statSync(filePath);

            if (stats.mtime < cutoffDate) {
              fs.unlinkSync(filePath);
              oneDriveDeleted++;
            }
          }
        }

        if (oneDriveDeleted > 0) {
          console.log(`✅ Deleted ${oneDriveDeleted} old OneDrive backup(s)`);
        }
      }
    }
  } catch (error: any) {
    console.error(`⚠️  Warning: Failed to cleanup old backups: ${error.message}`);
    // Don't throw - cleanup failure shouldn't stop backup process
  }
}

/**
 * Main backup function
 */
async function performBackup(): Promise<void> {
  console.log('\n🚀 MyCAE Tracker - Database Backup');
  console.log('=====================================');
  console.log(`📅 Started at: ${new Date().toLocaleString()}`);
  console.log(`🗄️  Database: ${config.dbName}`);
  console.log('');

  try {
    // Ensure backup directory exists
    ensureBackupDirectory();

    // Generate filename and paths
    const filename = getBackupFilename();
    const localBackupPath = path.join(config.backupDir, filename);

    // Create database dump
    await createDatabaseDump(localBackupPath);

    // Copy to OneDrive
    await copyToOneDrive(localBackupPath, filename);

    // Clean up old backups
    await cleanupOldBackups();

    console.log('');
    console.log('✅ BACKUP COMPLETED SUCCESSFULLY');
    console.log(`📁 Local backup: ${localBackupPath}`);
    console.log('=====================================\n');
  } catch (error: any) {
    console.error('');
    console.error('❌ BACKUP FAILED');
    console.error(`Error: ${error.message}`);
    console.error('=====================================\n');
    process.exit(1);
  }
}

// Run backup
performBackup();
