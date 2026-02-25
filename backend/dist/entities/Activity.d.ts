import { User } from './User';
export declare enum ActivityType {
    INVENTORY_CREATE = "inventory-create",
    INVENTORY_UPDATE = "inventory-update",
    INVENTORY_DELETE = "inventory-delete",
    CHECKOUT_CREATE = "checkout-create",
    CHECKOUT_RETURN = "checkout-return",
    PROJECT_CREATE = "project-create",
    PROJECT_UPDATE = "project-update",
    PROJECT_STATUS_CHANGE = "project-status-change",
    TIMESHEET_CREATE = "timesheet-create",
    MAINTENANCE_CREATE = "maintenance-create",
    MAINTENANCE_UPDATE = "maintenance-update",
    USER_LOGIN = "user-login",
    USER_CREATE = "user-create",
    BULK_IMPORT = "bulk-import",
    INVOICE_CREATE = "invoice-create",
    INVOICE_UPDATE = "invoice-update",
    INVOICE_STATUS_CHANGE = "invoice-status-change",
    INVOICE_AMOUNT_CHANGE = "invoice-amount-change"
}
export declare class Activity {
    id: string;
    type: ActivityType;
    user_id: string;
    user: User;
    description: string;
    details?: string;
    entity_type?: string;
    entity_id?: string;
    module?: string;
    created_at: Date;
    updated_at: Date;
    generateId(): void;
}
//# sourceMappingURL=Activity.d.ts.map