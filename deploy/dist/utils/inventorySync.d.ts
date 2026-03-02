import { InventoryItem } from '../entities/InventoryItem';
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
export declare function decreaseInventoryQuantity(itemIdentifier: string, // Can be ID, SKU, or barcode
quantityToDecrease: number, checkedOutBy?: string): Promise<InventoryUpdateResult>;
/**
 * Increase inventory quantity when item is returned
 */
export declare function increaseInventoryQuantity(itemIdentifier: string, // Can be ID, SKU, or barcode
quantityToIncrease: number, returnedBy?: string): Promise<InventoryUpdateResult>;
/**
 * Update inventory status based on quantity levels
 */
export declare function updateInventoryStatus(item: InventoryItem): Promise<void>;
/**
 * Validate if item can be checked out
 */
export declare function validateCheckoutAvailability(itemIdentifier: string, requestedQuantity: number): Promise<{
    valid: boolean;
    item?: InventoryItem;
    error?: string;
}>;
/**
 * Get inventory item by any identifier
 */
export declare function getInventoryItem(identifier: string): Promise<InventoryItem | null>;
export {};
//# sourceMappingURL=inventorySync.d.ts.map