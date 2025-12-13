import React, { useEffect } from 'react';
import { Card } from '../components/ui/Card';
import { ProjectOverviewDashboard } from '../components/dashboard/ProjectOverviewDashboard';
import { BarChart3, TrendingUp, Users } from 'lucide-react';
import { useProjectStore } from '../store/projectStore';

export const HomeScreen: React.FC = () => {
  const { fetchProjects } = useProjectStore();

  // Fetch projects when screen mounts
  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  return (
    <div className="min-h-full bg-gray-50">
      <div className="p-4 md:p-6 space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
              <p className="text-gray-600 mt-1">Project tracking and statistics</p>
            </div>
            <BarChart3 className="w-12 h-12 text-blue-600 opacity-20" />
          </div>
        </div>

        {/* Project Overview - No wrapper container */}
        <ProjectOverviewDashboard />

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
            <li>• View at-a-glance project statistics and KPI cards</li>
            <li>• Click on timeline items to expand and see detailed project information</li>
            <li>• Use Gantt chart zoom controls to switch between daily, weekly, and monthly views</li>
            <li>• Access Team Workload from the sidebar to view engineer assignments</li>
            <li>• Export any chart as PNG or PDF for reports and presentations</li>
          </ul>
        </div>
      </div>
    </div>
  );
};
