import { User } from './User';
import { InventoryItem } from './InventoryItem';
export declare enum CheckoutStatus {
    CHECKED_OUT = "checked-out",
    RETURNED = "returned",
    OVERDUE = "overdue",
    PARTIAL_RETURN = "partial-return",
    RECEIVED = "received"
}
export declare class Checkout {
    id: string;
    masterBarcode: string;
    item_id: string;
    item: InventoryItem;
    user_id: string;
    user: User;
    quantity: number;
    returned_quantity: number;
    checkout_date: Date;
    expected_return_date?: Date;
    actual_return_date?: Date;
    status: CheckoutStatus;
    purpose?: string;
    location?: string;
    condition?: string;
    notes?: string;
    created_at: Date;
    updated_at: Date;
    generateId(): void;
}
//# sourceMappingURL=Checkout.d.ts.map