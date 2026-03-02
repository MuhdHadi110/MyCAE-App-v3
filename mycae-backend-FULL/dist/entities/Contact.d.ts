import { Company } from './Company';
export declare class Contact {
    id: string;
    company_id: string;
    name: string;
    email: string;
    phone?: string;
    position?: string;
    company: Company;
    created_at: Date;
    updated_at: Date;
    deleted_at?: Date;
    generateId(): void;
}
//# sourceMappingURL=Contact.d.ts.map