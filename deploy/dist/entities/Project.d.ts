import { User } from './User';
import { Contact } from './Contact';
import { Company } from './Company';
export declare enum ProjectStatus {
    PRE_LIM = "pre-lim",
    ONGOING = "ongoing",
    COMPLETED = "completed"
}
export declare class Project {
    id: string;
    project_code: string;
    title: string;
    company_id: string;
    contact_id?: string;
    contact?: Contact;
    company?: Company;
    status: ProjectStatus;
    inquiry_date?: Date;
    po_received_date?: Date;
    po_file_url?: string;
    completion_date?: Date;
    invoiced_date?: Date;
    start_date: Date;
    planned_hours: number;
    daily_rate: number | null;
    actual_hours: number;
    lead_engineer_id?: string;
    lead_engineer?: User;
    manager_id: string;
    manager: User;
    remarks?: string;
    categories?: string[];
    created_at: Date;
    updated_at: Date;
    generateId(): void;
}
//# sourceMappingURL=Project.d.ts.map