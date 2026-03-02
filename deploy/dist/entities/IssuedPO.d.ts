import { Project } from './Project';
import { ReceivedInvoice } from './ReceivedInvoice';
import { Company } from './Company';
export declare enum IssuedPOStatus {
    ISSUED = "issued",
    RECEIVED = "received",
    COMPLETED = "completed"
}
export declare class IssuedPO {
    id: string;
    po_number: string;
    items: string;
    recipient: string;
    project_code: string;
    amount: number;
    currency: string;
    amount_myr: number;
    exchange_rate: number;
    issue_date: Date;
    due_date?: Date;
    status: IssuedPOStatus;
    file_url: string;
    company_id: string;
    company: Company;
    created_at: Date;
    updated_at: Date;
    project: Project;
    receivedInvoices: ReceivedInvoice[];
}
//# sourceMappingURL=IssuedPO.d.ts.map