import React from 'react';
import { Users } from 'lucide-react';
import { TeamWorkloadHeatmap } from '../components/charts/TeamWorkloadHeatmap';
import { ChartExportButton } from '../components/charts/ChartExportButton';

export const TeamWorkloadScreen: React.FC = () => {
  return (
    <div className="min-h-full">
      <div className="p-4 md:p-6 space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Team Workload</h1>
              <p className="text-gray-600 mt-1">Engineer assignments and project allocations</p>
            </div>
            <Users className="w-12 h-12 text-blue-600 opacity-20" />
          </div>
        </div>

        {/* Content Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
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
      </div>
    </div>
  );
};
