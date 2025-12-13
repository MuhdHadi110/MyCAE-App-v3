import { useState, useEffect, useCallback } from 'react';
import { ProjectMilestone, GanttTask, WorkloadDataPoint, ComparisonMetrics, AnalyticsFilter, EngineerAssignment } from '../types/analytics.types';
import { useProjectStore } from '../store/projectStore';
import { useTeamStore } from '../store/teamStore';

/**
 * Hook for fetching and processing timeline data
 */
export const useTimelineData = (filter: AnalyticsFilter) => {
  const [milestones, setMilestones] = useState<ProjectMilestone[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { projects } = useProjectStore();

  useEffect(() => {
    const loadTimelines = async () => {
      setLoading(true);
      setError(null);

      try {
        // Transform projects to milestones
        const transformed = projects
          .filter((project) => {
            if (filter.projectIds && !filter.projectIds.includes(project.id)) return false;
            if (filter.statuses && !filter.statuses.includes(project.status)) return false;
            return true;
          })
          .map((project): ProjectMilestone => {
            const completionDate = project.completionDate ? new Date(project.completionDate) : undefined;
            return {
              id: project.id,
              projectId: project.id,
              projectCode: project.projectCode,
              projectTitle: project.title,
              milestone: project.title,
              targetDate: completionDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
              completedDate: completionDate,
              phase: project.status as 'pre-lim' | 'ongoing' | 'completed',
              percentComplete: project.status === 'completed' ? 100 : project.status === 'ongoing' ? 50 : 0,
            };
          });

        setMilestones(transformed);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load timeline data');
      } finally {
        setLoading(false);
      }
    };

    loadTimelines();
  }, [projects, filter]);

  return { milestones, loading, error };
};

/**
 * Hook for fetching and processing Gantt chart data
 */
export const useGanttData = (filter: AnalyticsFilter) => {
  const [tasks, setTasks] = useState<GanttTask[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { projects } = useProjectStore();

  useEffect(() => {
    const loadGanttData = async () => {
      setLoading(true);
      setError(null);

      try {
        const transformed = projects
          .filter((project) => {
            if (filter.projectIds && !filter.projectIds.includes(project.id)) return false;
            if (filter.statuses && !filter.statuses.includes(project.status)) return false;
            return true;
          })
          .map((project): GanttTask => {
            const startDate = project.startDate ? new Date(project.startDate) : new Date();
            const completionDate = project.completionDate ? new Date(project.completionDate) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
            return {
              id: project.id,
              name: project.projectCode + ' - ' + project.title,
              start: startDate,
              end: completionDate,
              progress: project.status === 'completed' ? 100 : project.status === 'ongoing' ? 50 : 0,
              type: 'project',
              assigneeId: project.leadEngineerId,
              assignee: (project as any).leadEngineer?.name || 'Unassigned',
            };
          });

        setTasks(transformed);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load Gantt data');
      } finally {
        setLoading(false);
      }
    };

    loadGanttData();
  }, [projects, filter]);

  return { tasks, loading, error };
};

/**
 * Hook for fetching workload data
 */
export const useWorkloadData = (filter: AnalyticsFilter) => {
  const [workloadData, setWorkloadData] = useState<WorkloadDataPoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { teamMembers } = useTeamStore();

  useEffect(() => {
    const loadWorkloadData = async () => {
      setLoading(true);
      setError(null);

      try {
        // Generate mock workload data
        const mockData: WorkloadDataPoint[] = teamMembers
          .filter((member) => !filter.engineerIds || filter.engineerIds.includes(member.id))
          .flatMap((member) => {
            const weeks: WorkloadDataPoint[] = [];
            const now = new Date();

            // Create data for last 8 weeks
            for (let i = 7; i >= 0; i--) {
              const weekDate = new Date(now);
              weekDate.setDate(weekDate.getDate() - i * 7);
              const week = `${weekDate.getFullYear()}-W${String(Math.ceil((weekDate.getDate() + new Date(weekDate.getFullYear(), 0, 1).getDay()) / 7)).padStart(2, '0')}`;

              weeks.push({
                engineerId: member.id,
                engineerName: member.name,
                week,
                hoursWorked: Math.random() * 40 + 20, // 20-60 hours
                hoursTarget: 40,
                utilization: Math.random() * 100,
                projects: [],
              });
            }

            return weeks;
          });

        setWorkloadData(mockData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load workload data');
      } finally {
        setLoading(false);
      }
    };

    loadWorkloadData();
  }, [teamMembers, filter]);

  return { workloadData, loading, error };
};

/**
 * Hook for fetching comparison data
 */
export const useComparisonData = (currentStart: Date, currentEnd: Date) => {
  const [currentMetrics, setCurrentMetrics] = useState<ComparisonMetrics | null>(null);
  const [previousMetrics, setPreviousMetrics] = useState<ComparisonMetrics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { projects } = useProjectStore();

  useEffect(() => {
    const loadComparisonData = async () => {
      setLoading(true);
      setError(null);

      try {
        // Calculate period duration
        const duration = currentEnd.getTime() - currentStart.getTime();
        const previousStart = new Date(currentStart.getTime() - duration);
        const previousEnd = currentStart;

        // Filter projects for current period
        const currentProjects = projects.filter((p) => {
          const startDate = p.startDate || new Date();
          return startDate >= currentStart && startDate <= currentEnd;
        });

        // Filter projects for previous period
        const previousProjects = projects.filter((p) => {
          const startDate = p.startDate || new Date();
          return startDate >= previousStart && startDate <= previousEnd;
        });

        const currentMetricsData: ComparisonMetrics = {
          projectsCompleted: currentProjects.filter((p) => p.status === 'completed').length,
          projectsStarted: currentProjects.length,
          hoursLogged: currentProjects.reduce((sum, p) => sum + (p.actualHours || 0), 0),
          revenueGenerated: currentProjects.length * 5000, // Mock calculation
          teamUtilization: 75, // Mock
        };

        const previousMetricsData: ComparisonMetrics = {
          projectsCompleted: previousProjects.filter((p) => p.status === 'completed').length,
          projectsStarted: previousProjects.length,
          hoursLogged: previousProjects.reduce((sum, p) => sum + (p.actualHours || 0), 0),
          revenueGenerated: previousProjects.length * 5000,
          teamUtilization: 70,
        };

        setCurrentMetrics(currentMetricsData);
        setPreviousMetrics(previousMetricsData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load comparison data');
      } finally {
        setLoading(false);
      }
    };

    loadComparisonData();
  }, [projects, currentStart, currentEnd]);

  return { currentMetrics, previousMetrics, loading, error };
};

/**
 * Hook for fetching engineer-to-project assignments
 */
export const useEngineerAssignments = (filter?: AnalyticsFilter) => {
  const [assignments, setAssignments] = useState<EngineerAssignment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { projects } = useProjectStore();

  useEffect(() => {
    const loadAssignments = async () => {
      setLoading(true);
      setError(null);

      try {
        const engineerAssignments: EngineerAssignment[] = [];

        // Process each project to create engineer assignments
        projects.forEach((project: any) => {
          // Skip if project doesn't match filter
          if (filter?.projectIds && !filter.projectIds.includes(project.id)) return;
          if (filter?.statuses && !filter.statuses.includes(project.status)) return;

          // Lead Engineer - try multiple name properties for compatibility
          if (project.leadEngineerId) {
            const engineerName = project.leadEngineer?.name || project.leadEngineerName || 'Unknown Engineer';
            engineerAssignments.push({
              engineerId: project.leadEngineerId,
              engineerName: engineerName,
              projectId: project.id,
              projectCode: project.projectCode,
              projectTitle: project.title,
              role: 'lead-engineer',
              status: project.status as 'pre-lim' | 'ongoing' | 'completed' | 'on-hold' | 'closed',
              startDate: project.startDate ? new Date(project.startDate).toLocaleDateString() : undefined,
              endDate: project.completionDate ? new Date(project.completionDate).toLocaleDateString() : undefined,
            });
          }

          // Project Manager
          if (project.managerId && project.managerId !== project.leadEngineerId) {
            const managerName = project.manager?.name || project.managerName || 'Unknown Manager';
            engineerAssignments.push({
              engineerId: project.managerId,
              engineerName: managerName,
              projectId: project.id,
              projectCode: project.projectCode,
              projectTitle: project.title,
              role: 'manager',
              status: project.status as 'pre-lim' | 'ongoing' | 'completed' | 'on-hold' | 'closed',
              startDate: project.startDate ? new Date(project.startDate).toLocaleDateString() : undefined,
              endDate: project.completionDate ? new Date(project.completionDate).toLocaleDateString() : undefined,
            });
          }

          // Team Engineer
          if (project.engineerId && project.engineerId !== project.leadEngineerId) {
            const engineerName = project.engineer?.name || project.engineerName || 'Unknown Engineer';
            engineerAssignments.push({
              engineerId: project.engineerId,
              engineerName: engineerName,
              projectId: project.id,
              projectCode: project.projectCode,
              projectTitle: project.title,
              role: 'engineer',
              status: project.status as 'pre-lim' | 'ongoing' | 'completed' | 'on-hold' | 'closed',
              startDate: project.startDate ? new Date(project.startDate).toLocaleDateString() : undefined,
              endDate: project.completionDate ? new Date(project.completionDate).toLocaleDateString() : undefined,
            });
          }
        });

        setAssignments(engineerAssignments);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load engineer assignments');
      } finally {
        setLoading(false);
      }
    };

    loadAssignments();
  }, [projects, filter?.projectIds, filter?.statuses]);

  return { assignments, loading, error };
};
