import { IssuedPO } from './IssuedPO';
import { User } from './User';
import { Company } from './Company';
export declare enum ReceivedInvoiceStatus {
    PENDING = "pending",
    VERIFIED = "verified",
    PAID = "paid",
    DISPUTED = "disputed"
}
export declare class ReceivedInvoice {
    id: string;
    invoiceNumber: string;
    issuedPoId: string;
    vendorName: string;
    amount: number;
    currency: string;
    amountMyr: number | null;
    exchangeRate: number | null;
    invoiceDate: Date;
    receivedDate: Date;
    dueDate: Date | null;
    description: string | null;
    status: ReceivedInvoiceStatus;
    fileUrl: string | null;
    createdBy: string | null;
    verifiedBy: string | null;
    verifiedAt: Date | null;
    paidAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
    issuedPO: IssuedPO;
    creator: User;
    verifier: User;
    companyId: string;
    company: Company;
}
//# sourceMappingURL=ReceivedInvoice.d.ts.map