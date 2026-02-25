import { Project } from './Project';
import { TeamMember } from './TeamMember';
export declare enum ProjectTeamRole {
    LEAD_ENGINEER = "lead_engineer",
    ENGINEER = "engineer"
}
export declare class ProjectTeamMember {
    id: string;
    project_id: string;
    project: Project;
    team_member_id: string;
    teamMember: TeamMember;
    role: ProjectTeamRole;
    created_at: Date;
    generateId(): void;
}
//# sourceMappingURL=ProjectTeamMember.d.ts.map