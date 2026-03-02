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
exports.restoreDatabase = restoreDatabase;
const child_process_1 = require("child_process");
const util_1 = require("util");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const verify_backup_1 = require("./verify-backup");
const execAsync = (0, util_1.promisify)(child_process_1.exec);
async function getRowCounts(database, config) {
    console.log(`📊 Counting rows in database: ${database}`);
    const counts = {};
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
                const result = await execAsync(`mysql -h ${config.host} -P ${config.port} -u ${config.username} -p${config.password} ${database} -e "${countQuery}" -N`);
                const count = parseInt(result.stdout.trim());
                counts[table] = isNaN(count) ? 0 : count;
                console.log(`   ${table}: ${counts[table]} rows`);
            }
            catch (error) {
                counts[table] = -1; // Mark as error
                console.log(`   ${table}: ERROR`);
            }
        }
    }
    catch (error) {
        console.error('Error getting row counts:', error.message);
    }
    return counts;
}
async function restoreDatabase(config) {
    console.log('🔄 Starting database restore process...\n');
    console.log(`Backup file: ${path.basename(config.backupFile)}`);
    console.log(`Target database: ${config.database}`);
    console.log(`Test mode: ${config.testMode ? 'YES (will restore to test DB first)' : 'NO (direct restore)'}\n`);
    const result = {
        success: false,
        databaseRestored: '',
        rowCounts: {},
        errors: [],
        warnings: []
    };
    try {
        // Step 1: Verify backup file first
        console.log('Step 1: Verifying backup file...');
        const verification = await (0, verify_backup_1.verifyBackup)(config.backupFile);
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
        }
        else {
            console.log(`Step 2: Restoring directly to: ${targetDb}`);
            console.log('⚠️  WARNING: This will overwrite the existing database!');
        }
        // Step 3: Create/recreate target database
        console.log(`\nStep 3: Preparing database ${targetDb}...`);
        try {
            // Drop database if exists (for test mode)
            if (config.testMode) {
                await execAsync(`mysql -h ${config.host} -P ${config.port} -u ${config.username} -p${config.password} -e "DROP DATABASE IF EXISTS ${targetDb}"`);
                console.log(`   Dropped existing test database (if any)`);
            }
            // Create database
            await execAsync(`mysql -h ${config.host} -P ${config.port} -u ${config.username} -p${config.password} -e "CREATE DATABASE IF NOT EXISTS ${targetDb}"`);
            console.log(`   ✅ Database ${targetDb} ready`);
        }
        catch (error) {
            result.errors.push(`Failed to prepare database: ${error.message}`);
            console.log(`   ❌ Error: ${error.message}`);
            return result;
        }
        // Step 4: Decompress backup if needed
        console.log('\nStep 4: Preparing backup file...');
        let sqlFile = config.backupFile;
        let tempFile = null;
        if (config.backupFile.endsWith('.gz')) {
            tempFile = config.backupFile.replace('.gz', '.temp.sql');
            console.log(`   Decompressing to: ${path.basename(tempFile)}`);
            await execAsync(`gunzip -c "${config.backupFile}" > "${tempFile}"`);
            sqlFile = tempFile;
            console.log(`   ✅ Decompressed successfully`);
        }
        else {
            console.log(`   ℹ️  Backup is not compressed`);
        }
        // Step 5: Restore database
        console.log('\nStep 5: Restoring database...');
        console.log('   This may take several minutes for large databases...');
        try {
            await execAsync(`mysql -h ${config.host} -P ${config.port} -u ${config.username} -p${config.password} ${targetDb} < "${sqlFile}"`);
            console.log(`   ✅ Database restored successfully`);
            result.databaseRestored = targetDb;
        }
        catch (error) {
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
        }
        else {
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
    }
    catch (error) {
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
    const config = {
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
        }
        else {
            console.log('❌ Restore failed!');
            process.exit(1);
        }
    }
    catch (error) {
        console.error('Restore process failed:', error);
        process.exit(1);
    }
}
// Run if called directly
if (require.main === module) {
    main();
}
//# sourceMappingURL=restore-database.js.map