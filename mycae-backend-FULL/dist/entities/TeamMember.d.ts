import { User } from './User';
export declare enum EmploymentType {
    FULL_TIME = "full-time",
    PART_TIME = "part-time",
    CONTRACT = "contract",
    INTERN = "intern"
}
export declare class TeamMember {
    id: string;
    user_id: string;
    user: User;
    employee_id?: string;
    job_title?: string;
    employment_type: EmploymentType;
    department?: string;
    manager_id?: string;
    phone?: string;
    office_location?: string;
    hire_date?: Date;
    termination_date?: Date;
    status: 'active' | 'inactive' | 'on-leave' | 'terminated';
    hourly_rate?: number;
    skills?: string;
    certifications?: string;
    notes?: string;
    created_at: Date;
    updated_at: Date;
    generateId(): void;
}
//# sourceMappingURL=TeamMember.d.ts.map