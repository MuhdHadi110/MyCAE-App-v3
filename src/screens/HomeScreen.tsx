import React, { useEffect } from 'react';
import { ProjectOverviewDashboard } from '../components/dashboard/ProjectOverviewDashboard';
import { BarChart3 } from 'lucide-react';
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
      </div>
    </div>
  );
};
