import { AppDataSource } from '../config/database';
import { InventoryItem, InventoryStatus } from '../entities/InventoryItem';

async function restoreInventoryQuantities() {
  try {
    console.log('Connecting to database...');
    await AppDataSource.initialize();
    
    const itemRepo = AppDataSource.getRepository(InventoryItem);
    
    // Get all items
    const items = await itemRepo.find();
    
    console.log(`Found ${items.length} inventory items`);
    
    // Update status to available for all items
    for (const item of items) {
      // Check if quantity is above minimum stock
      if (item.quantity > item.minimumStock) {
        item.status = InventoryStatus.AVAILABLE;
      } else if (item.quantity > 0) {
        item.status = InventoryStatus.LOW_STOCK;
      } else {
        item.status = InventoryStatus.OUT_OF_STOCK;
      }
    }
    
    await itemRepo.save(items);
    
    console.log('✅ All inventory items restored to proper status based on quantity!');
  } catch (error) {
    console.error('❌ Error restoring inventory:', error);
  } finally {
    await AppDataSource.destroy();
    process.exit(0);
  }
}

restoreInventoryQuantities();
