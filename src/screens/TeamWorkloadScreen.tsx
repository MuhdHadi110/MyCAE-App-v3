import React from 'react';
import { TeamWorkloadHeatmap } from '../components/charts/TeamWorkloadHeatmap';
import { ChartExportButton } from '../components/charts/ChartExportButton';

export const TeamWorkloadScreen: React.FC = () => {
  return (
    <div className="min-h-full bg-gray-50">
      <div className="p-4 md:p-6 space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Team Workload</h1>
              <p className="text-gray-600 mt-1">Engineer assignments and project allocations</p>
            </div>
            <ChartExportButton
              chartId="team-workload"
              chartTitle="Engineer Assignments"
              formats={['png', 'pdf']}
            />
          </div>
        </div>

        {/* Content */}
        <div id="team-workload">
          <TeamWorkloadHeatmap />
        </div>
      </div>
    </div>
  );
};
