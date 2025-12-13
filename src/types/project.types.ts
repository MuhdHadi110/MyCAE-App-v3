/**
 * Project Management Types
 */

export type ProjectStatus = 'pre-lim' | 'ongoing' | 'on-hold' | 'open' | 'closed' | 'completed';
export type WorkCategory = 'engineering' | 'project-management' | 'measurement-site' | 'measurement-office';

export interface Project {
  id: string;
  projectCode: string;
  title: string;
  clientId: string;
  clientName?: string;
  status: ProjectStatus;
  inquiryDate?: string;
  poReceivedDate?: string;
  poFileUrl?: string;
  completionDate?: string;
  invoicedDate?: string;
  startDate: string;
  endDate?: string;
  plannedHours: number;
  actualHours?: number;
  budget?: number;
  engineerId?: string;
  engineerName?: string;
  managerId: string;
  managerName?: string;
  remarks?: string;
  description?: string;
  createdDate: string;
  lastUpdated: string;
  leadEngineerId?: string;
  workTypes?: string[];
  teamMembers?: Array<{ memberId: string; hourlyRate: string; }>;
  type?: 'engineering' | 'research';
  researchCode?: string;
}

export interface Timesheet {
  id: string;
  projectId: string;
  projectCode?: string;
  projectTitle?: string;
  engineerId: string;
  engineerName?: string;
  date: string;
  hours: number;
  workCategory: WorkCategory;
  description: string;
  createdDate: string;
}

export interface ProjectTimelineData {
  month: string;
  [engineerName: string]: number | string;
}
