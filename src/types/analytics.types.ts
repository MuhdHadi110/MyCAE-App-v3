/**
 * Advanced Analytics Types
 */

export interface TimelinePhase {
  id: string;
  name: string;
  startDate: Date;
  endDate: Date;
  status: 'pending' | 'in-progress' | 'completed';
  color: string;
}

export interface ProjectMilestone {
  id: string;
  projectId: string;
  projectCode: string;
  projectTitle: string;
  milestone: string;
  targetDate: Date;
  completedDate?: Date;
  phase: 'pre-lim' | 'ongoing' | 'completed';
  percentComplete: number;
}

export interface GanttTask {
  id: string;
  name: string;
  start: Date;
  end: Date;
  progress: number;
  dependencies?: string[];
  assignee?: string;
  assigneeId?: string;
  type: 'project' | 'phase' | 'task';
  color?: string;
}

export interface WorkloadDataPoint {
  engineerId: string;
  engineerName: string;
  week: string; // YYYY-W## format
  hoursWorked: number;
  hoursTarget: number;
  utilization: number; // percentage
  projects: Array<{ projectCode: string; hours: number }>;
}

export interface ComparisonPeriod {
  label: string;
  startDate: Date;
  endDate: Date;
  metrics: ComparisonMetrics;
}

export interface ComparisonMetrics {
  projectsCompleted: number;
  projectsStarted: number;
  hoursLogged: number;
  revenueGenerated: number;
  teamUtilization: number;
  clientSatisfaction?: number;
}

export interface HeatmapCell {
  engineerId: string;
  week: string;
  value: number;
  intensity: number; // 0-1
  tooltip: string;
}

export interface ChartExportOptions {
  format: 'png' | 'pdf' | 'csv';
  filename: string;
  includeTitle: boolean;
  includeLegend: boolean;
  resolution?: 'low' | 'medium' | 'high';
}

export interface EngineerAssignment {
  engineerId: string;
  engineerName: string;
  projectId: string;
  projectCode: string;
  projectTitle: string;
  role: 'lead-engineer' | 'engineer' | 'manager' | 'team-member';
  status: 'pre-lim' | 'ongoing' | 'completed' | 'on-hold' | 'closed';
  startDate?: string;
  endDate?: string;
}

export interface AnalyticsFilter {
  startDate?: Date;
  endDate?: Date;
  projectIds?: string[];
  engineerIds?: string[];
  statuses?: string[];
}
