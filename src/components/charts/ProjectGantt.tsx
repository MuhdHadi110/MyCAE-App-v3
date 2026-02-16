import React, { useState, useMemo } from 'react';
import { GanttTask, AnalyticsFilter } from '../../types/analytics.types';
import { useGanttData } from '../../hooks/useChartData';
import { format, differenceInDays, addDays } from 'date-fns';
import { getStatusColor } from '../../utils/chartHelpers';
import { ChevronDown, ChevronRight } from 'lucide-react';

interface ProjectGanttProps {
  filter?: AnalyticsFilter;
  maxHeight?: number;
  zoomLevel?: 'day' | 'week' | 'month';
  onZoomChange?: (level: 'day' | 'week' | 'month') => void;
}

export const ProjectGantt: React.FC<ProjectGanttProps> = ({
  filter = {},
  maxHeight = 600,
  zoomLevel = 'week',
  onZoomChange,
}) => {
  const { tasks, loading, error } = useGanttData(filter);
  const [selectedTask, setSelectedTask] = useState<string | null>(null);

  // Calculate date range
  const dateRange = useMemo(() => {
    if (tasks.length === 0) {
      const today = new Date();
      return { start: today, end: addDays(today, 90) };
    }

    const dates = tasks.flatMap((t) => [t.start, t.end]);
    const start = new Date(Math.min(...dates.map((d) => d.getTime())));
    const end = new Date(Math.max(...dates.map((d) => d.getTime())));

    // Pad dates by 1 week before and after
    start.setDate(start.getDate() - 7);
    end.setDate(end.getDate() + 7);

    return { start, end };
  }, [tasks]);

  // Generate date headers based on zoom level
  const dateHeaders = useMemo(() => {
    const headers: Date[] = [];
    let current = new Date(dateRange.start);

    while (current <= dateRange.end) {
      headers.push(new Date(current));

      if (zoomLevel === 'day') {
        current.setDate(current.getDate() + 1);
      } else if (zoomLevel === 'week') {
        current.setDate(current.getDate() + 7);
      } else {
        current.setMonth(current.getMonth() + 1);
      }
    }

    return headers;
  }, [dateRange, zoomLevel]);

  // Calculate position and width for a task bar
  const getTaskBarStyle = (task: GanttTask) => {
    const totalDays = differenceInDays(dateRange.end, dateRange.start);
    const startDays = differenceInDays(task.start, dateRange.start);
    const durationDays = differenceInDays(task.end, task.start);

    const left = (startDays / totalDays) * 100;
    const width = (durationDays / totalDays) * 100;

    return { left: `${Math.max(0, left)}%`, width: `${Math.max(2, width)}%` };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading Gantt chart...</div>
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

  if (tasks.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">No projects to display</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Zoom controls */}
      <div className="flex gap-2">
        <button
          onClick={() => onZoomChange?.('day')}
          className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
            zoomLevel === 'day'
              ? 'bg-primary-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Day
        </button>
        <button
          onClick={() => onZoomChange?.('week')}
          className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
            zoomLevel === 'week'
              ? 'bg-primary-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Week
        </button>
        <button
          onClick={() => onZoomChange?.('month')}
          className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
            zoomLevel === 'month'
              ? 'bg-primary-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Month
        </button>
      </div>

      {/* Gantt chart container */}
      <div className="border border-gray-200 rounded-lg overflow-auto" style={{ maxHeight }}>
        <div className="flex">
          {/* Task names column */}
          <div className="w-64 flex-shrink-0 border-r border-gray-200 bg-gray-50">
            <div className="h-16 border-b border-gray-200 px-4 py-3 font-semibold text-sm text-gray-700">
              Project
            </div>
            {tasks.map((task) => (
              <div
                key={task.id}
                className={`h-14 border-b border-gray-200 px-4 py-2 flex items-center cursor-pointer hover:bg-blue-50 transition-colors ${
                  selectedTask === task.id ? 'bg-blue-50' : ''
                }`}
                onClick={() => setSelectedTask(task.id)}
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{task.name}</p>
                  <p className="text-xs text-gray-500">{task.assignee}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Timeline column */}
          <div className="flex-1 min-w-0">
            {/* Date headers */}
            <div className="h-16 border-b border-gray-200 flex bg-gray-50 sticky top-0 z-10">
              {dateHeaders.map((date, index) => (
                <div
                  key={index}
                  className="border-r border-gray-200 flex-1 px-2 py-3 text-xs font-medium text-gray-600 text-center min-w-24"
                >
                  {zoomLevel === 'day'
                    ? format(date, 'dd')
                    : zoomLevel === 'week'
                      ? format(date, 'MMM dd')
                      : format(date, 'MMM')}
                </div>
              ))}
            </div>

            {/* Task bars */}
            {tasks.map((task) => (
              <div
                key={task.id}
                className={`h-14 border-b border-gray-200 relative px-2 py-2 flex items-center ${
                  selectedTask === task.id ? 'bg-blue-50' : ''
                }`}
              >
                {/* Today indicator (vertical line) */}
                {new Date() >= dateRange.start && new Date() <= dateRange.end && (
                  <div
                    className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-5"
                    style={{
                      left: `calc(${(differenceInDays(new Date(), dateRange.start) / differenceInDays(dateRange.end, dateRange.start)) * 100}% - 1px)`,
                    }}
                  />
                )}

                {/* Task bar */}
                <div className="absolute h-8 rounded-md flex items-center justify-between px-2 group hover:shadow-md transition-shadow" style={{
                  ...getTaskBarStyle(task),
                  backgroundColor: getStatusColor(task.type),
                  opacity: 0.85,
                }}>
                  <span className="text-xs font-semibold text-white truncate">
                    {task.progress}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Legend and info */}
      <div className="grid grid-cols-3 gap-4 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-blue-400" />
          <span className="text-gray-600">Pre-lim Phase</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-amber-400" />
          <span className="text-gray-600">Ongoing Phase</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-emerald-400" />
          <span className="text-gray-600">Completed Phase</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-1 h-6 bg-red-500" />
          <span className="text-gray-600">Today</span>
        </div>
      </div>

      {/* Date range info */}
      <div className="text-xs text-gray-500 text-right">
        {format(dateRange.start, 'MMM dd, yyyy')} - {format(dateRange.end, 'MMM dd, yyyy')}
      </div>
    </div>
  );
};
