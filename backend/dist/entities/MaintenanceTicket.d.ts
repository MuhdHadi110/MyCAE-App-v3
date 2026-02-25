import { User } from './User';
import { InventoryItem } from './InventoryItem';
import { ScheduledMaintenance, InventoryAction } from './ScheduledMaintenance';
export declare enum TicketPriority {
    LOW = "low",
    MEDIUM = "medium",
    HIGH = "high",
    CRITICAL = "critical"
}
export declare enum TicketStatus {
    OPEN = "open",
    IN_PROGRESS = "in-progress",
    RESOLVED = "resolved",
    CLOSED = "closed"
}
export declare class MaintenanceTicket {
    id: string;
    item_id: string;
    item: InventoryItem;
    reported_by: string;
    reporter: User;
    title: string;
    description?: string;
    priority: TicketPriority;
    status: TicketStatus;
    reported_date: Date;
    resolved_date?: Date;
    assigned_to?: string;
    assignee?: User;
    resolution_notes?: string;
    category?: string;
    scheduled_maintenance_id?: string;
    scheduledMaintenance?: ScheduledMaintenance;
    inventory_action?: InventoryAction;
    quantity_deducted: number;
    inventory_restored: boolean;
    created_at: Date;
    updated_at: Date;
    generateId(): void;
}
//# sourceMappingURL=MaintenanceTicket.d.ts.map