import { User } from './User';
export declare class ResearchProject {
    id: string;
    title: string;
    researchCode: string | null;
    description: string | null;
    leadResearcherId: string | null;
    leadResearcher: User;
    status: 'planning' | 'in-progress' | 'on-hold' | 'completed' | 'archived';
    startDate: Date | null;
    plannedEndDate: Date | null;
    actualEndDate: Date | null;
    budget: string | null;
    fundingSource: string | null;
    category: string | null;
    objectives: string | null;
    methodology: string | null;
    findings: string | null;
    publications: string | null;
    teamMembers: string | null;
    collaborators: string | null;
    equipmentUsed: string | null;
    notes: string | null;
    createdAt: Date;
    updatedAt: Date;
    generateId(): void;
}
//# sourceMappingURL=ResearchProject.d.ts.map