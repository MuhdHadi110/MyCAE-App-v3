/**
 * Project Management Types
 */

import { Contact } from './company.types';

export type ProjectStatus = 'pre-lim' | 'ongoing' | 'on-hold' | 'open' | 'closed' | 'completed';
export type WorkCategory = 'engineering' | 'project-management' | 'measurement-site' | 'measurement-office';
export type BillingType = 'hourly' | 'lump_sum';

export type ProjectType = 'standard' | 'variation_order' | 'structure_container' | 'structure_child';

export interface StructureStats {
  totalStructures: number;
  ongoingCount: number;
  completedCount: number;
  prelimCount: number;
  autoStatus: string;
}

export interface Project {
  id: string;
  projectCode: string;
  title: string;
  companyId: string;
  companyName?: string;
  contactId?: string;
  contact?: Contact; // populated with company data
  status: ProjectStatus;
  billingType: BillingType;
  inquiryDate?: string;
  poReceivedDate?: string;
  poFileUrl?: string;
  completionDate?: string;
  invoicedDate?: string;
  startDate: string;
  endDate?: string;
  plannedHours: number;
  actualHours?: number;
  hourlyRate?: number | null;
  budget?: number;
  engineerId?: string;
  engineerName?: string;
  managerId: string;
  managerName?: string;
  description?: string;
  createdDate: string;
  lastUpdated: string;
  leadEngineerId?: string;
  workTypes?: string[];
  categories?: string[];
  teamMembers?: Array<{ memberId: string; hourlyRate: string; }>;
  type?: 'engineering' | 'research';
  researchCode?: string;

  // Variation Order fields
  parentProjectId?: string;
  isVariationOrder?: boolean;
  voNumber?: number;
  parentProject?: {
    id: string;
    projectCode: string;
    title: string;
  };
  variationOrders?: Project[];

  // Structure Container fields
  projectType?: ProjectType;
  structureStats?: StructureStats;
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
