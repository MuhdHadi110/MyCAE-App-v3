import { User } from './User';
import { Project } from './Project';
export declare enum WorkCategory {
    ENGINEERING = "engineering",
    PROJECT_MANAGEMENT = "project-management",
    MEASUREMENT_SITE = "measurement-site",
    MEASUREMENT_OFFICE = "measurement-office"
}
export declare class Timesheet {
    id: string;
    project_id: string;
    project: Project;
    engineer_id: string;
    engineer: User;
    date: Date;
    hours: number;
    work_category: WorkCategory;
    description?: string;
    created_at: Date;
    updated_at: Date;
    generateId(): void;
}
//# sourceMappingURL=Timesheet.d.ts.map