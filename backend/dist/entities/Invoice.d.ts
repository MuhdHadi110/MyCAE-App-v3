import { Project } from './Project';
import { User } from './User';
import { Company } from './Company';
export declare enum InvoiceStatus {
    DRAFT = "draft",
    PENDING_APPROVAL = "pending-approval",
    APPROVED = "approved",
    SENT = "sent",
    PAID = "paid",
    OVERDUE = "overdue"
}
export declare class Invoice {
    id: string;
    invoice_number: string;
    project_code: string;
    project_name: string;
    amount: number;
    currency: string;
    amount_myr: number;
    exchange_rate: number;
    invoice_date: Date;
    percentage_of_total: number;
    invoice_sequence: number;
    cumulative_percentage: number;
    remark: string;
    status: InvoiceStatus;
    file_url: string;
    created_by: string;
    approved_by: string;
    company_id: string;
    company: Company;
    approved_at: Date;
    submitted_for_approval_at: Date;
    created_at: Date;
    updated_at: Date;
    project: Project;
    creator: User;
    approver: User;
}
//# sourceMappingURL=Invoice.d.ts.map