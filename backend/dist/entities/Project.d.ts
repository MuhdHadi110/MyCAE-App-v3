import { User } from './User';
import { Contact } from './Contact';
import { Company } from './Company';
import { ProjectTeamMember } from './ProjectTeamMember';
export declare enum ProjectStatus {
    PRE_LIM = "pre-lim",
    ONGOING = "ongoing",
    COMPLETED = "completed"
}
export declare enum BillingType {
    HOURLY = "hourly",
    LUMP_SUM = "lump_sum"
}
export declare class Project {
    id: string;
    project_code: string;
    title: string;
    company_id: string;
    contact_id?: string;
    contact?: Contact;
    company?: Company;
    parent_project_id?: string;
    is_variation_order: boolean;
    vo_number?: number;
    parentProject?: Project;
    variationOrders?: Project[];
    teamMembers?: ProjectTeamMember[];
    status: ProjectStatus;
    billing_type: BillingType;
    inquiry_date?: Date;
    po_received_date?: Date;
    po_file_url?: string;
    completion_date?: Date;
    invoiced_date?: Date;
    start_date: Date;
    planned_hours: number;
    hourly_rate: number | null;
    actual_hours: number;
    lead_engineer_id?: string;
    lead_engineer?: User;
    manager_id: string;
    manager: User;
    description?: string;
    categories?: string[];
    created_at: Date;
    updated_at: Date;
    generateId(): void;
}
//# sourceMappingURL=Project.d.ts.map