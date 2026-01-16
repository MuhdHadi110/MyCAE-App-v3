import React, { useState, useMemo } from 'react';
import { ProjectMilestone } from '../../types/analytics.types';
import { AnalyticsFilter } from '../../types/analytics.types';
import { useTimelineData } from '../../hooks/useChartData';
import { format, differenceInDays } from 'date-fns';
import { getStatusColor, formatMilestoneData } from '../../utils/chartHelpers';
import { getElapsedPercentage } from '../../utils/dateCalculations';
import { ChevronRight, Calendar, CheckCircle, AlertCircle } from 'lucide-react';

interface ProjectTimelineProps {
  filter?: AnalyticsFilter;
  maxHeight?: number;
  showLegend?: boolean;
}

export const ProjectTimeline: React.FC<ProjectTimelineProps> = ({
  filter = {},
  maxHeight = 500,
  showLegend = true,
}) => {
  const { milestones, loading, error } = useTimelineData(filter);
  const [expandedMilestones, setExpandedMilestones] = useState<Set<string>>(new Set());

  const sortedMilestones = useMemo(
    () => [...milestones].sort((a, b) => a.targetDate.getTime() - b.targetDate.getTime()),
    [milestones]
  );

  const toggleExpanded = (id: string) => {
    const newExpanded = new Set(expandedMilestones);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedMilestones(newExpanded);
  };

  const getTimelineProgress = (milestone: ProjectMilestone): number => {
    if (milestone.completedDate) return 100;
    if (milestone.phase === 'completed') return 100;

    const today = new Date();
    const targetDate = milestone.targetDate;

    if (today >= targetDate) return 100;

    const startDate = new Date(targetDate);
    startDate.setMonth(startDate.getMonth() - 3); // Assume 3-month projects

    return getElapsedPercentage(startDate, targetDate);
  };

  const getDaysRemaining = (targetDate: Date): number => {
    const today = new Date();
    return differenceInDays(targetDate, today);
  };

  const getStatusBadge = (milestone: ProjectMilestone) => {
    if (milestone.completedDate) {
      return (
        <div className="flex items-center gap-1 px-2 py-1 bg-emerald-50 rounded-full">
          <CheckCircle className="w-4 h-4 text-emerald-600" />
          <span className="text-xs font-medium text-emerald-600">Completed</span>
        </div>
      );
    }

    const daysRemaining = getDaysRemaining(milestone.targetDate);
    if (daysRemaining < 0) {
      return (
        <div className="flex items-center gap-1 px-2 py-1 bg-red-50 rounded-full">
          <AlertCircle className="w-4 h-4 text-red-600" />
          <span className="text-xs font-medium text-red-600">Overdue</span>
        </div>
      );
    }

    if (daysRemaining <= 7) {
      return (
        <div className="flex items-center gap-1 px-2 py-1 bg-amber-50 rounded-full">
          <AlertCircle className="w-4 h-4 text-amber-600" />
          <span className="text-xs font-medium text-amber-600">{daysRemaining} days left</span>
        </div>
      );
    }

    return (
      <div className="flex items-center gap-1 px-2 py-1 bg-blue-50 rounded-full">
        <Calendar className="w-4 h-4 text-blue-600" />
        <span className="text-xs font-medium text-blue-600">{daysRemaining} days left</span>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading timeline data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-red-500">Error: {error}</div>
      </div>
    );
  }

  if (sortedMilestones.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">No milestones found</div>
      </div>
    );
  }

  return (
    <div className="space-y-4" style={{ maxHeight, overflow: 'auto' }}>
      {sortedMilestones.map((milestone, index) => {
        const isExpanded = expandedMilestones.has(milestone.id);
        const progress = getTimelineProgress(milestone);
        const statusColor = getStatusColor(milestone.phase);

        return (
          <div
            key={milestone.id}
            className="bg-white rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
          >
            {/* Timeline item header */}
            <div
              className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
              onClick={() => toggleExpanded(milestone.id)}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: statusColor }}
                    />
                    <h3 className="text-sm font-semibold text-gray-900">{milestone.projectCode}</h3>
                    <span className="text-xs text-gray-500">{milestone.projectTitle}</span>
                  </div>

                  {/* Progress bar */}
                  <div className="mb-3">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs text-gray-600">{milestone.milestone}</span>
                      <span className="text-xs font-medium text-gray-700">{Math.round(progress)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{
                          width: `${progress}%`,
                          backgroundColor: statusColor,
                        }}
                      />
                    </div>
                  </div>

                  {/* Status badge */}
                  <div className="flex items-center justify-between">
                    {getStatusBadge(milestone)}
                    <span className="text-xs text-gray-500">
                      {format(milestone.targetDate, 'MMM dd, yyyy')}
                    </span>
                  </div>
                </div>

                {/* Expand/collapse icon */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleExpanded(milestone.id);
                  }}
                  className={`text-gray-400 hover:text-gray-600 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                  aria-label={isExpanded ? 'Collapse details' : 'Expand details'}
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Expanded details */}
            {isExpanded && (
              <div className="border-t border-gray-200 bg-gray-50 p-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600 font-medium mb-1">Start Date</p>
                    <p className="text-gray-900">
                      {format(new Date(milestone.targetDate.getTime() - 90 * 24 * 60 * 60 * 1000), 'MMM dd, yyyy')}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600 font-medium mb-1">Target Date</p>
                    <p className="text-gray-900">{format(milestone.targetDate, 'MMM dd, yyyy')}</p>
                  </div>
                  {milestone.completedDate && (
                    <div className="col-span-2">
                      <p className="text-gray-600 font-medium mb-1">Completed</p>
                      <p className="text-emerald-600 font-medium">{format(milestone.completedDate, 'MMM dd, yyyy')}</p>
                    </div>
                  )}
                  <div className="col-span-2">
                    <p className="text-gray-600 font-medium mb-1">Phase</p>
                    <div className="flex items-center gap-2">
                      <div
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: statusColor }}
                      />
                      <span className="text-gray-900 capitalize">{milestone.phase}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })}

      {/* Legend */}
      {showLegend && (
        <div className="border-t border-gray-200 pt-4 mt-4">
          <p className="text-xs font-medium text-gray-600 mb-3">Legend</p>
          <div className="grid grid-cols-3 gap-4 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-400" />
              <span className="text-gray-600">Pre-lim</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-amber-400" />
              <span className="text-gray-600">Ongoing</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-emerald-400" />
              <span className="text-gray-600">Completed</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
