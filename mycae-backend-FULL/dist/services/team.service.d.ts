import { EmploymentType } from '../entities/TeamMember';
import { UserRole } from '../entities/User';
export interface TeamMemberFilters {
    status?: string;
    department?: string;
    search?: string;
    limit?: number;
    offset?: number;
}
export interface CreateTeamMemberData {
    name: string;
    email: string;
    phone?: string;
    role?: string;
    department?: string;
    employment_type?: EmploymentType;
    userId?: string;
    [key: string]: any;
}
export interface UpdateTeamMemberData {
    role?: UserRole | UserRole[];
    roles?: UserRole[];
    name?: string;
    email?: string;
    phone?: string;
    department?: string;
    avatar?: string;
    [key: string]: any;
}
export interface WorkloadData {
    activeProjects: number;
    totalHoursThisMonth: number;
}
export declare class TeamService {
    private teamRepo;
    private userRepo;
    /**
     * Calculate workload data for team members
     */
    calculateWorkloadData(userIds: string[]): Promise<Record<string, WorkloadData>>;
    /**
     * Get all team members with filters
     */
    getTeamMembers(filters?: TeamMemberFilters): Promise<{
        data: {
            activeProjects: number;
            totalHoursThisMonth: number;
            user: {
                id: string;
                name: string;
                email: string;
                role: UserRole;
                roles: UserRole[];
                department: string | undefined;
                position: string | undefined;
                avatar: string | undefined;
            } | null;
            id: string;
            user_id: string;
            employee_id?: string;
            job_title?: string;
            employment_type: EmploymentType;
            department?: string;
            manager_id?: string;
            phone?: string;
            office_location?: string;
            hire_date?: Date;
            termination_date?: Date;
            status: "active" | "inactive" | "on-leave" | "terminated";
            hourly_rate?: number;
            skills?: string;
            certifications?: string;
            notes?: string;
            created_at: Date;
            updated_at: Date;
        }[];
        total: number;
        limit: number;
        offset: number;
    }>;
    /**
     * Get single team member
     */
    getTeamMemberById(id: string): Promise<{
        user: {
            id: string;
            name: string;
            email: string;
            role: UserRole;
            department: string | undefined;
            position: string | undefined;
            avatar: string | undefined;
        } | null;
        id: string;
        user_id: string;
        employee_id?: string;
        job_title?: string;
        employment_type: EmploymentType;
        department?: string;
        manager_id?: string;
        phone?: string;
        office_location?: string;
        hire_date?: Date;
        termination_date?: Date;
        status: "active" | "inactive" | "on-leave" | "terminated";
        hourly_rate?: number;
        skills?: string;
        certifications?: string;
        notes?: string;
        created_at: Date;
        updated_at: Date;
    }>;
    /**
     * Create new team member
     */
    createTeamMember(data: CreateTeamMemberData): Promise<any>;
    /**
     * Update team member
     */
    updateTeamMember(id: string, data: UpdateTeamMemberData, currentUserId?: string, currentUserRole?: string): Promise<{
        user: {
            id: string;
            name: string;
            email: string;
            role: UserRole;
            roles: UserRole[];
            department: string | undefined;
            position: string | undefined;
            avatar: string | undefined;
        } | null;
        id: string;
        user_id: string;
        employee_id?: string;
        job_title?: string;
        employment_type: EmploymentType;
        department?: string;
        manager_id?: string;
        phone?: string;
        office_location?: string;
        hire_date?: Date;
        termination_date?: Date;
        status: "active" | "inactive" | "on-leave" | "terminated";
        hourly_rate?: number;
        skills?: string;
        certifications?: string;
        notes?: string;
        created_at: Date;
        updated_at: Date;
    }>;
    /**
     * Deactivate team member (soft delete)
     */
    deactivateTeamMember(id: string): Promise<{
        message: string;
    }>;
    /**
     * Reactivate team member
     */
    reactivateTeamMember(id: string): Promise<{
        message: string;
        data: {
            user: {
                id: string;
                name: string;
                email: string;
                role: UserRole;
                roles: UserRole[];
                department: string | undefined;
                position: string | undefined;
                avatar: string | undefined;
            } | null;
            id: string;
            user_id: string;
            employee_id?: string;
            job_title?: string;
            employment_type: EmploymentType;
            department?: string;
            manager_id?: string;
            phone?: string;
            office_location?: string;
            hire_date?: Date;
            termination_date?: Date;
            status: "active" | "inactive" | "on-leave" | "terminated";
            hourly_rate?: number;
            skills?: string;
            certifications?: string;
            notes?: string;
            created_at: Date;
            updated_at: Date;
        };
    }>;
    /**
     * Get team members by department
     */
    getTeamMembersByDepartment(department: string, filters?: {
        limit?: number;
        offset?: number;
    }): Promise<{
        data: {
            activeProjects: number;
            totalHoursThisMonth: number;
            user: {
                id: string;
                name: string;
                email: string;
                role: UserRole;
                roles: UserRole[];
                department: string | undefined;
                position: string | undefined;
                avatar: string | undefined;
            } | null;
            id: string;
            user_id: string;
            employee_id?: string;
            job_title?: string;
            employment_type: EmploymentType;
            department?: string;
            manager_id?: string;
            phone?: string;
            office_location?: string;
            hire_date?: Date;
            termination_date?: Date;
            status: "active" | "inactive" | "on-leave" | "terminated";
            hourly_rate?: number;
            skills?: string;
            certifications?: string;
            notes?: string;
            created_at: Date;
            updated_at: Date;
        }[];
        total: number;
        limit: number;
        offset: number;
    }>;
}
declare const _default: TeamService;
export default _default;
//# sourceMappingURL=team.service.d.ts.map