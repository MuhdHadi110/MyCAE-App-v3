import { InventoryItem } from './InventoryItem';
import { User } from './User';
export declare enum MaintenanceType {
    CALIBRATION = "calibration",
    INSPECTION = "inspection",
    SERVICING = "servicing",
    REPLACEMENT = "replacement",
    OTHER = "other"
}
export declare enum InventoryAction {
    DEDUCT = "deduct",
    STATUS_ONLY = "status-only",
    NONE = "none"
}
export declare class ScheduledMaintenance {
    id: string;
    item_id: string;
    item: InventoryItem;
    maintenance_type: MaintenanceType;
    description?: string;
    scheduled_date: Date;
    is_completed: boolean;
    completed_date?: Date;
    completed_by?: string;
    completedByUser?: User;
    ticket_id?: string;
    reminder_14_sent: boolean;
    reminder_7_sent: boolean;
    reminder_1_sent: boolean;
    inventory_action: InventoryAction;
    quantity_affected: number;
    created_by?: string;
    createdByUser?: User;
    created_at: Date;
    updated_at: Date;
    generateId(): void;
}
//# sourceMappingURL=ScheduledMaintenance.d.ts.map