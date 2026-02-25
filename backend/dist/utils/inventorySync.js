"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.decreaseInventoryQuantity = decreaseInventoryQuantity;
exports.increaseInventoryQuantity = increaseInventoryQuantity;
exports.updateInventoryStatus = updateInventoryStatus;
exports.validateCheckoutAvailability = validateCheckoutAvailability;
exports.getInventoryItem = getInventoryItem;
const database_1 = require("../config/database");
const InventoryItem_1 = require("../entities/InventoryItem");
const n8n_service_1 = __importDefault(require("../services/n8n.service"));
/**
 * Decrease inventory quantity when item is checked out
 */
async function decreaseInventoryQuantity(itemIdentifier, // Can be ID, SKU, or barcode
quantityToDecrease, checkedOutBy // Optional: who checked out the item
) {
    const inventoryRepo = database_1.AppDataSource.getRepository(InventoryItem_1.InventoryItem);
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
        item.last_action = InventoryItem_1.InventoryLastAction.CHECKED_OUT;
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
    }
    catch (error) {
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
async function increaseInventoryQuantity(itemIdentifier, // Can be ID, SKU, or barcode
quantityToIncrease, returnedBy // Optional: who returned the item
) {
    const inventoryRepo = database_1.AppDataSource.getRepository(InventoryItem_1.InventoryItem);
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
        item.last_action = InventoryItem_1.InventoryLastAction.RETURNED;
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
    }
    catch (error) {
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
async function updateInventoryStatus(item) {
    const oldStatus = item.status;
    if (item.quantity === 0) {
        item.status = InventoryItem_1.InventoryStatus.OUT_OF_STOCK;
    }
    else if (item.quantity <= item.minimumStock) {
        item.status = InventoryItem_1.InventoryStatus.LOW_STOCK;
    }
    else {
        item.status = InventoryItem_1.InventoryStatus.AVAILABLE;
    }
    // Trigger low stock alert if status changed to LOW_STOCK
    if (oldStatus !== InventoryItem_1.InventoryStatus.LOW_STOCK && item.status === InventoryItem_1.InventoryStatus.LOW_STOCK) {
        await triggerLowStockAlert(item);
    }
    // Trigger out of stock alert if status changed to OUT_OF_STOCK
    if (oldStatus !== InventoryItem_1.InventoryStatus.OUT_OF_STOCK && item.status === InventoryItem_1.InventoryStatus.OUT_OF_STOCK) {
        console.log(`⚠️ OUT OF STOCK ALERT: ${item.title}`);
        // Could trigger additional n8n workflow for out of stock
    }
}
/**
 * Trigger low stock alert via n8n
 */
async function triggerLowStockAlert(item) {
    try {
        await n8n_service_1.default.onLowStockAlert({
            itemId: item.id,
            itemName: item.title,
            sku: item.sku,
            currentStock: item.quantity,
            minimumStock: item.minimumStock,
            status: item.status,
        });
        console.log(`📢 Low stock alert triggered for: ${item.title}`);
    }
    catch (error) {
        console.error('❌ Failed to trigger low stock alert:', error.message);
    }
}
/**
 * Validate if item can be checked out
 */
async function validateCheckoutAvailability(itemIdentifier, requestedQuantity) {
    const inventoryRepo = database_1.AppDataSource.getRepository(InventoryItem_1.InventoryItem);
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
        if (item.status === InventoryItem_1.InventoryStatus.DISCONTINUED) {
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
    }
    catch (error) {
        return {
            valid: false,
            error: error.message || 'Failed to validate checkout',
        };
    }
}
/**
 * Get inventory item by any identifier
 */
async function getInventoryItem(identifier) {
    const inventoryRepo = database_1.AppDataSource.getRepository(InventoryItem_1.InventoryItem);
    return await inventoryRepo.findOne({
        where: [
            { id: identifier },
            { sku: identifier },
            { barcode: identifier },
        ],
    });
}
//# sourceMappingURL=inventorySync.js.map