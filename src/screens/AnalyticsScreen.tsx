import React, { useState, useEffect } from 'react';
import { Card } from '../components/ui/Card';
import { PageHeader } from '../components/ui/PageHeader';
import { ProjectTimeline } from '../components/charts/ProjectTimeline';
import { ProjectGantt } from '../components/charts/ProjectGantt';
import { TeamWorkloadHeatmap } from '../components/charts/TeamWorkloadHeatmap';
import { ComparisonChart } from '../components/charts/ComparisonChart';
import { ChartExportButton } from '../components/charts/ChartExportButton';
import { BarChart3, Calendar, Users, TrendingUp } from 'lucide-react';
import { useProjectStore } from '../store/projectStore';

export const AnalyticsScreen: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'timeline' | 'gantt' | 'workload'>('overview');
  const [ganttZoom, setGanttZoom] = useState<'day' | 'week' | 'month'>('week');
  const { fetchProjects } = useProjectStore();

  // Fetch projects when screen mounts
  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'timeline', label: 'Timeline', icon: Calendar },
    { id: 'gantt', label: 'Gantt Chart', icon: Calendar },
    { id: 'workload', label: 'Engineer Assignments', icon: Users },
  ];

  return (
    <div className="min-h-full bg-gray-50">
      <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <PageHeader
        title="Advanced Analytics"
        description="Project tracking, team capacity, and performance insights"
        icon={<BarChart3 className="w-6 h-6" />}
      />

      {/* Tab Navigation */}
      <div className="flex gap-2 border-b border-gray-200 bg-white rounded-t-lg">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-4 border-b-2 transition-colors font-medium ${
                isActive
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
              }`}
            >
              <Icon className="w-5 h-5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-b-lg border border-t-0 border-gray-200 p-6">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Performance comparison cards */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Period Comparison</h2>
              <ComparisonChart />
            </div>
          </div>
        )}

        {/* Timeline Tab */}
        {activeTab === 'timeline' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Project Timeline</h2>
                <p className="text-sm text-gray-600 mt-1">Track project milestones and completion progress</p>
              </div>
              <ChartExportButton
                chartId="project-timeline"
                chartTitle="Project Timeline"
                formats={['png', 'pdf']}
              />
            </div>
            <div id="project-timeline">
              <ProjectTimeline showLegend={true} />
            </div>
          </div>
        )}

        {/* Gantt Tab */}
        {activeTab === 'gantt' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Project Gantt Chart</h2>
                <p className="text-sm text-gray-600 mt-1">Visualize project schedules and dependencies</p>
              </div>
              <ChartExportButton
                chartId="project-gantt"
                chartTitle="Project Gantt Chart"
                formats={['png', 'pdf']}
              />
            </div>
            <div id="project-gantt">
              <ProjectGantt zoomLevel={ganttZoom} onZoomChange={setGanttZoom} />
            </div>
          </div>
        )}

        {/* Workload Tab */}
        {activeTab === 'workload' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Engineer Assignments</h2>
                <p className="text-sm text-gray-600 mt-1">View which engineers are assigned to which projects</p>
              </div>
              <ChartExportButton
                chartId="team-workload"
                chartTitle="Engineer Assignments"
                formats={['png', 'pdf']}
              />
            </div>
            <div id="team-workload">
              <TeamWorkloadHeatmap />
            </div>
          </div>
        )}
      </div>

      {/* Info cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card variant="default" padding="md">
          <div className="flex items-start gap-4">
            <div className="p-2.5 bg-blue-100 rounded-lg">
              <BarChart3 className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Real-time Insights</h3>
              <p className="text-sm text-gray-600 mt-1">
                Track project progress and team capacity in real-time with interactive visualizations.
              </p>
            </div>
          </div>
        </Card>

        <Card variant="default" padding="md">
          <div className="flex items-start gap-4">
            <div className="p-2.5 bg-emerald-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Performance Tracking</h3>
              <p className="text-sm text-gray-600 mt-1">
                Compare metrics across time periods to identify trends and opportunities for improvement.
              </p>
            </div>
          </div>
        </Card>

        <Card variant="default" padding="md">
          <div className="flex items-start gap-4">
            <div className="p-2.5 bg-amber-100 rounded-lg">
              <Users className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Team Management</h3>
              <p className="text-sm text-gray-600 mt-1">
                Monitor workload distribution and identify capacity bottlenecks across your team.
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Quick tips */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-2">💡 Quick Tips</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Click on timeline items to expand and see detailed project information</li>
          <li>• Use zoom controls in Gantt chart to switch between daily, weekly, and monthly views</li>
          <li>• Hover over heatmap cells to see exact hours worked and utilization details</li>
          <li>• Compare periods to track improvements in team performance and project delivery</li>
          <li>• Export charts as PNG, PDF, or CSV for reports and presentations</li>
        </ul>
      </div>
      </div>
    </div>
  );
};
