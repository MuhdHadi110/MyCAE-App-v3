import { AppDataSource } from '../config/database';
import { InventoryItem, InventoryStatus, InventoryLastAction } from '../entities/InventoryItem';
import n8nService from '../services/n8n.service';

/**
 * Inventory Synchronization Utilities
 *
 * These functions handle automatic inventory quantity updates
 * when items are checked out or returned.
 */

interface InventoryUpdateResult {
  success: boolean;
  item?: InventoryItem;
  error?: string;
}

/**
 * Decrease inventory quantity when item is checked out
 */
export async function decreaseInventoryQuantity(
  itemIdentifier: string, // Can be ID, SKU, or barcode
  quantityToDecrease: number,
  checkedOutBy?: string // Optional: who checked out the item
): Promise<InventoryUpdateResult> {
  const inventoryRepo = AppDataSource.getRepository(InventoryItem);

  try {
    // Find item by ID, SKU, or barcode
    let item = await inventoryRepo.findOne({
      where: [
        { id: itemIdentifier },
        { sku: itemIdentifier },
        { barcode: itemIdentifier },
      ],
    });

    if (!item) {
      return {
        success: false,
        error: `Item not found: ${itemIdentifier}`,
      };
    }

    // Check if sufficient quantity available
    if (item.quantity < quantityToDecrease) {
      return {
        success: false,
        error: `Insufficient quantity. Available: ${item.quantity}, Requested: ${quantityToDecrease}`,
      };
    }

    // Decrease quantity
    item.quantity -= quantityToDecrease;

    // Update last_action to CHECKED_OUT
    item.last_action = InventoryLastAction.CHECKED_OUT;
    item.last_action_date = new Date();
    if (checkedOutBy) {
      item.last_action_by = checkedOutBy;
    }

    // Update status based on new quantity
    await updateInventoryStatus(item);

    // Save changes
    await inventoryRepo.save(item);

    console.log(`✅ Inventory decreased: ${item.title} | Qty: ${item.quantity + quantityToDecrease} → ${item.quantity}`);

    return {
      success: true,
      item,
    };
  } catch (error: any) {
    console.error('❌ Error decreasing inventory:', error);
    return {
      success: false,
      error: error.message || 'Failed to decrease inventory',
    };
  }
}

/**
 * Increase inventory quantity when item is returned
 */
export async function increaseInventoryQuantity(
  itemIdentifier: string, // Can be ID, SKU, or barcode
  quantityToIncrease: number,
  returnedBy?: string // Optional: who returned the item
): Promise<InventoryUpdateResult> {
  const inventoryRepo = AppDataSource.getRepository(InventoryItem);

  try {
    // Find item by ID, SKU, or barcode
    let item = await inventoryRepo.findOne({
      where: [
        { id: itemIdentifier },
        { sku: itemIdentifier },
        { barcode: itemIdentifier },
      ],
    });

    if (!item) {
      return {
        success: false,
        error: `Item not found: ${itemIdentifier}`,
      };
    }

    // Increase quantity
    item.quantity += quantityToIncrease;

    // Update last_action to RETURNED
    item.last_action = InventoryLastAction.RETURNED;
    item.last_action_date = new Date();
    if (returnedBy) {
      item.last_action_by = returnedBy;
    }

    // Update status based on new quantity
    await updateInventoryStatus(item);

    // Save changes
    await inventoryRepo.save(item);

    console.log(`✅ Inventory increased: ${item.title} | Qty: ${item.quantity - quantityToIncrease} → ${item.quantity}`);

    return {
      success: true,
      item,
    };
  } catch (error: any) {
    console.error('❌ Error increasing inventory:', error);
    return {
      success: false,
      error: error.message || 'Failed to increase inventory',
    };
  }
}

/**
 * Update inventory status based on quantity levels
 */
export async function updateInventoryStatus(item: InventoryItem): Promise<void> {
  const oldStatus = item.status;

  if (item.quantity === 0) {
    item.status = InventoryStatus.OUT_OF_STOCK;
  } else if (item.quantity <= item.minimumStock) {
    item.status = InventoryStatus.LOW_STOCK;
  } else {
    item.status = InventoryStatus.AVAILABLE;
  }

  // Trigger low stock alert if status changed to LOW_STOCK
  if (oldStatus !== InventoryStatus.LOW_STOCK && item.status === InventoryStatus.LOW_STOCK) {
    await triggerLowStockAlert(item);
  }

  // Trigger out of stock alert if status changed to OUT_OF_STOCK
  if (oldStatus !== InventoryStatus.OUT_OF_STOCK && item.status === InventoryStatus.OUT_OF_STOCK) {
    console.log(`⚠️ OUT OF STOCK ALERT: ${item.title}`);
    // Could trigger additional n8n workflow for out of stock
  }
}

/**
 * Trigger low stock alert via n8n
 */
async function triggerLowStockAlert(item: InventoryItem): Promise<void> {
  try {
    await n8nService.onLowStockAlert({
      itemId: item.id,
      itemName: item.title,
      sku: item.sku,
      currentStock: item.quantity,
      minimumStock: item.minimumStock,
      status: item.status,
    });

    console.log(`📢 Low stock alert triggered for: ${item.title}`);
  } catch (error: any) {
    console.error('❌ Failed to trigger low stock alert:', error.message);
  }
}

/**
 * Validate if item can be checked out
 */
export async function validateCheckoutAvailability(
  itemIdentifier: string,
  requestedQuantity: number
): Promise<{ valid: boolean; item?: InventoryItem; error?: string }> {
  const inventoryRepo = AppDataSource.getRepository(InventoryItem);

  try {
    // Find item
    const item = await inventoryRepo.findOne({
      where: [
        { id: itemIdentifier },
        { sku: itemIdentifier },
        { barcode: itemIdentifier },
      ],
    });

    if (!item) {
      return {
        valid: false,
        error: `Item not found: ${itemIdentifier}`,
      };
    }

    // Check if item is discontinued
    if (item.status === InventoryStatus.DISCONTINUED) {
      return {
        valid: false,
        error: `Item ${item.title} is discontinued and cannot be checked out`,
      };
    }

    // Check quantity
    if (item.quantity < requestedQuantity) {
      return {
        valid: false,
        error: `Insufficient quantity for ${item.title}. Available: ${item.quantity}, Requested: ${requestedQuantity}`,
      };
    }

    return {
      valid: true,
      item,
    };
  } catch (error: any) {
    return {
      valid: false,
      error: error.message || 'Failed to validate checkout',
    };
  }
}

/**
 * Get inventory item by any identifier
 */
export async function getInventoryItem(identifier: string): Promise<InventoryItem | null> {
  const inventoryRepo = AppDataSource.getRepository(InventoryItem);

  return await inventoryRepo.findOne({
    where: [
      { id: identifier },
      { sku: identifier },
      { barcode: identifier },
    ],
  });
}
