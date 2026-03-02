import { Contact } from './Contact';
export declare class Company {
    id: string;
    name: string;
    company_type?: string[];
    industry?: string;
    website?: string;
    address?: string;
    contacts: Contact[];
    created_at: Date;
    updated_at: Date;
    deleted_at?: Date;
    generateId(): void;
}
//# sourceMappingURL=Company.d.ts.map