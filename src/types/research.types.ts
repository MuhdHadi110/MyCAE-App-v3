export type ResearchStatus = 'planning' | 'in-progress' | 'on-hold' | 'completed' | 'archived';

export interface ResearchProject {
  id: string;
  title: string;
  description?: string;
  status: ResearchStatus;
  startDate: string;
  plannedEndDate?: string;
  actualEndDate?: string;
  leadResearcherId: string;
  leadResearcherName?: string;
  budget?: number | string;
  fundingSource?: string;
  category?: string;
  objectives?: string;
  methodology?: string;
  findings?: string;
  publications?: string;
  teamMembers?: string;
  collaborators?: string;
  equipmentUsed?: string;
  notes?: string;
  plannedHours?: number;
  totalHoursLogged?: number;
  researchCode?: string;
  createdAt?: string;
  updatedAt?: string;
  timesheetEntries?: TimesheetEntry[];
}

export type TimesheetStatus = 'pending' | 'approved' | 'rejected';

export interface TimesheetEntry {
  id: string;
  projectId: string;
  teamMemberId: string;
  teamMemberName: string;
  date: string;
  hoursLogged: number;
  description: string;
  researchCategory: string;
  status: TimesheetStatus;
  createdDate?: string;
  approvedBy?: string;
  approvalDate?: string;
}

export interface Milestone {
  id: string;
  projectId: string;
  title: string;
  description?: string;
  dueDate: string;
  status: 'pending' | 'completed';
  createdDate?: string;
}

export interface Publication {
  id: string;
  projectId: string;
  title: string;
  authors: string[];
  publicationDate: string;
  journal?: string;
  doi?: string;
  createdDate?: string;
}
