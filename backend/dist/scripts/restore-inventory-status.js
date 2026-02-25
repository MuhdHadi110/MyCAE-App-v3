"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = require("../config/database");
const InventoryItem_1 = require("../entities/InventoryItem");
async function restoreInventoryQuantities() {
    try {
        console.log('Connecting to database...');
        await database_1.AppDataSource.initialize();
        const itemRepo = database_1.AppDataSource.getRepository(InventoryItem_1.InventoryItem);
        // Get all items
        const items = await itemRepo.find();
        console.log(`Found ${items.length} inventory items`);
        // Update status to available for all items
        for (const item of items) {
            // Check if quantity is above minimum stock
            if (item.quantity > item.minimumStock) {
                item.status = InventoryItem_1.InventoryStatus.AVAILABLE;
            }
            else if (item.quantity > 0) {
                item.status = InventoryItem_1.InventoryStatus.LOW_STOCK;
            }
            else {
                item.status = InventoryItem_1.InventoryStatus.OUT_OF_STOCK;
            }
        }
        await itemRepo.save(items);
        console.log('✅ All inventory items restored to proper status based on quantity!');
    }
    catch (error) {
        console.error('❌ Error restoring inventory:', error);
    }
    finally {
        await database_1.AppDataSource.destroy();
        process.exit(0);
    }
}
restoreInventoryQuantities();
//# sourceMappingURL=restore-inventory-status.js.map