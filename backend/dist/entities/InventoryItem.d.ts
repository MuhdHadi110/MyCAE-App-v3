export declare enum InventoryStatus {
    AVAILABLE = "available",
    LOW_STOCK = "low-stock",
    OUT_OF_STOCK = "out-of-stock",
    IN_MAINTENANCE = "in-maintenance",
    DISCONTINUED = "discontinued"
}
export declare enum InventoryLastAction {
    ADDED = "added",
    RETURNED = "returned",
    CHECKED_OUT = "checked-out",
    UPDATED = "updated"
}
export declare class InventoryItem {
    id: string;
    title: string;
    sku: string;
    barcode?: string;
    category: string;
    quantity: number;
    minimumStock: number;
    location: string;
    unitOfMeasure: string;
    cost: number;
    price: number;
    supplier?: string;
    status: InventoryStatus;
    notes?: string;
    imageURL?: string;
    next_maintenance_date?: Date;
    last_calibrated_date?: Date;
    in_maintenance_quantity: number;
    last_action: InventoryLastAction;
    last_action_date: Date;
    last_action_by?: string;
    created_at: Date;
    updated_at: Date;
    generateId(): void;
    updateStatus(): void;
}
//# sourceMappingURL=InventoryItem.d.ts.map