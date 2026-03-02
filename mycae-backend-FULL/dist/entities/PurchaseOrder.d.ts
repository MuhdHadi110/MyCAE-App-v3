import { Project } from './Project';
import { User } from './User';
import { Company } from './Company';
export declare enum POStatus {
    RECEIVED = "received",
    IN_PROGRESS = "in-progress",
    INVOICED = "invoiced",
    PAID = "paid"
}
export declare class PurchaseOrder {
    id: string;
    po_number: string;
    project_code: string;
    project?: Project;
    client_name: string;
    amount: number;
    currency: string;
    amount_myr: number;
    exchange_rate: number;
    exchange_rate_source: 'auto' | 'manual' | null;
    received_date: Date;
    due_date?: Date;
    description?: string;
    status: POStatus;
    file_url?: string;
    revision_number: number;
    is_active: boolean;
    superseded_by: string | null;
    supersedes: string | null;
    revision_date: Date;
    revision_reason: string | null;
    amount_myr_adjusted: number | null;
    adjustment_reason: string | null;
    adjusted_by: string | null;
    adjusted_at: Date | null;
    po_number_base: string;
    previousRevision?: PurchaseOrder;
    nextRevision?: PurchaseOrder;
    adjustedByUser?: User;
    company_id: string;
    company: Company;
    created_at: Date;
    updated_at: Date;
    get effective_amount_myr(): number;
    generateId(): void;
}
//# sourceMappingURL=PurchaseOrder.d.ts.map