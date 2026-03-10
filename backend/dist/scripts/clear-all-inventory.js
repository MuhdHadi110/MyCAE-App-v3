"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = require("../config/database");
const logger_1 = require("../utils/logger");
/**
 * Script to clear all inventory data
 * WARNING: This will delete ALL inventory items, checkout records, and related maintenance tickets
 */
async function clearAllInventory() {
    try {
        console.log('🗑️  Starting inventory cleanup...');
        // Initialize database connection
        await database_1.AppDataSource.initialize();
        console.log('✅ Database connected');
        // Use query runner for raw SQL to bypass TypeORM constraints
        const queryRunner = database_1.AppDataSource.createQueryRunner();
        await queryRunner.connect();
        try {
            // Get counts before deletion
            const inventoryCount = await queryRunner.query('SELECT COUNT(*) as count FROM inventory');
            const checkoutCount = await queryRunner.query('SELECT COUNT(*) as count FROM checkouts');
            const maintenanceCount = await queryRunner.query('SELECT COUNT(*) as count FROM maintenance_tickets');
            console.log(`📊 Current inventory: ${inventoryCount[0].count} items`);
            console.log(`📊 Current checkouts: ${checkoutCount[0].count} records`);
            console.log(`📊 Current maintenance tickets: ${maintenanceCount[0].count} records`);
            if (parseInt(inventoryCount[0].count) === 0 && parseInt(checkoutCount[0].count) === 0) {
                console.log('ℹ️  No inventory data to delete');
                await queryRunner.release();
                process.exit(0);
            }
            // Delete in correct order to handle foreign keys
            console.log('🗑️  Deleting maintenance tickets...');
            await queryRunner.query('DELETE FROM maintenance_tickets');
            console.log('✅ Maintenance tickets deleted');
            console.log('🗑️  Deleting checkout records...');
            await queryRunner.query('DELETE FROM checkouts');
            console.log('✅ Checkout records deleted');
            console.log('🗑️  Deleting inventory items...');
            await queryRunner.query('DELETE FROM inventory');
            console.log('✅ Inventory items deleted');
            console.log('\n🎉 All inventory data cleared successfully!');
            console.log(`   Deleted: ${maintenanceCount[0].count} maintenance tickets`);
            console.log(`   Deleted: ${checkoutCount[0].count} checkout records`);
            console.log(`   Deleted: ${inventoryCount[0].count} inventory items`);
        }
        catch (error) {
            console.error('❌ Error during deletion:', error);
            throw error;
        }
        finally {
            await queryRunner.release();
        }
        process.exit(0);
    }
    catch (error) {
        console.error('❌ Error clearing inventory:', error);
        logger_1.logger.error('Error clearing inventory', { error });
        process.exit(1);
    }
}
// Run the script
clearAllInventory();
//# sourceMappingURL=clear-all-inventory.js.map