import React, { useState } from 'react';
import { ComparisonMetrics } from '../../types/analytics.types';
import { useComparisonData } from '../../hooks/useChartData';
import { formatPercentageChange, formatLargeNumber } from '../../utils/chartHelpers';
import { addDays, addWeeks, addMonths, startOfDay } from 'date-fns';
import { TrendingUp, TrendingDown, Minus, BarChart3 } from 'lucide-react';

interface ComparisonChartProps {
  comparisonType?: 'week' | 'month' | 'quarter';
  onTypeChange?: (type: 'week' | 'month' | 'quarter') => void;
}

export const ComparisonChart: React.FC<ComparisonChartProps> = ({
  comparisonType = 'week',
  onTypeChange,
}) => {
  const [comparison, setComparison] = useState<'week' | 'month' | 'quarter'>(comparisonType);

  // Calculate date ranges based on comparison type
  const getDateRange = () => {
    const today = startOfDay(new Date());

    if (comparison === 'week') {
      const weekAgo = addDays(today, -7);
      return { start: weekAgo, end: today };
    } else if (comparison === 'month') {
      const monthAgo = addMonths(today, -1);
      return { start: monthAgo, end: today };
    } else {
      const quarterAgo = addMonths(today, -3);
      return { start: quarterAgo, end: today };
    }
  };

  const dateRange = getDateRange();
  const { currentMetrics, previousMetrics, loading, error } = useComparisonData(dateRange.start, dateRange.end);

  const handleTypeChange = (type: 'week' | 'month' | 'quarter') => {
    setComparison(type);
    onTypeChange?.(type);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading comparison data...</div>
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

  if (!currentMetrics || !previousMetrics) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">No comparison data available</div>
      </div>
    );
  }

  const ComparisonCard = ({
    title,
    currentValue,
    previousValue,
    format = 'number',
    icon: Icon,
  }: {
    title: string;
    currentValue: number;
    previousValue: number;
    format?: 'number' | 'percent' | 'currency';
    icon: React.ReactNode;
  }) => {
    const change = formatPercentageChange(currentValue, previousValue);
    const isPositive = change.trend === 'up';
    const isNeutral = change.trend === 'neutral';

    const formatValue = (value: number) => {
      if (format === 'currency') return `$${formatLargeNumber(value)}`;
      if (format === 'percent') return `${Math.round(value)}%`;
      return formatLargeNumber(value);
    };

    return (
      <div className="bg-white rounded-lg border border-gray-200 p-4 hover:border-gray-300 transition-colors">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <p className="text-sm text-gray-600 font-medium mb-1">{title}</p>
            <p className="text-2xl font-bold text-gray-900">{formatValue(currentValue)}</p>
          </div>
          <div className="text-gray-400">{Icon}</div>
        </div>

        {/* Comparison row */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <div className="text-xs text-gray-500">
            vs {comparison === 'week' ? 'last week' : comparison === 'month' ? 'last month' : 'last quarter'}
          </div>
          <div className="flex items-center gap-1.5">
            {isPositive && <TrendingUp className="w-4 h-4 text-emerald-600" />}
            {!isPositive && !isNeutral && <TrendingDown className="w-4 h-4 text-red-600" />}
            {isNeutral && <Minus className="w-4 h-4 text-gray-400" />}
            <span
              className={`text-sm font-semibold ${
                isPositive ? 'text-emerald-600' : !isNeutral ? 'text-red-600' : 'text-gray-500'
              }`}
            >
              {change.value}
            </span>
          </div>
        </div>

        {/* Micro bar chart */}
        <div className="mt-3 flex items-end gap-1 h-8">
          <div
            className="flex-1 bg-gray-300 rounded-sm"
            style={{ height: `${(previousValue / Math.max(currentValue, previousValue)) * 100}%` }}
            title={`Previous: ${formatValue(previousValue)}`}
          />
          <div
            className="flex-1 bg-blue-500 rounded-sm"
            style={{ height: `${(currentValue / Math.max(currentValue, previousValue)) * 100}%` }}
            title={`Current: ${formatValue(currentValue)}`}
          />
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Period selector buttons */}
      <div className="flex gap-2">
        <button
          onClick={() => handleTypeChange('week')}
          className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
            comparison === 'week'
              ? 'bg-primary-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          This Week
        </button>
        <button
          onClick={() => handleTypeChange('month')}
          className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
            comparison === 'month'
              ? 'bg-primary-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          This Month
        </button>
        <button
          onClick={() => handleTypeChange('quarter')}
          className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
            comparison === 'quarter'
              ? 'bg-primary-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          This Quarter
        </button>
      </div>

      {/* Comparison cards grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <ComparisonCard
          title="Projects Completed"
          currentValue={currentMetrics.projectsCompleted}
          previousValue={previousMetrics.projectsCompleted}
          icon={<BarChart3 className="w-5 h-5" />}
        />
        <ComparisonCard
          title="Projects Started"
          currentValue={currentMetrics.projectsStarted}
          previousValue={previousMetrics.projectsStarted}
          icon={<BarChart3 className="w-5 h-5" />}
        />
        <ComparisonCard
          title="Hours Logged"
          currentValue={currentMetrics.hoursLogged}
          previousValue={previousMetrics.hoursLogged}
          icon={<BarChart3 className="w-5 h-5" />}
        />
        {currentMetrics.clientSatisfaction !== undefined && (
          <ComparisonCard
            title="Client Satisfaction"
            currentValue={currentMetrics.clientSatisfaction}
            previousValue={previousMetrics.clientSatisfaction || 0}
            format="percent"
            icon={<BarChart3 className="w-5 h-5" />}
          />
        )}
      </div>

      {/* Summary insights */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200 p-4">
        <p className="text-sm font-semibold text-gray-900 mb-2">Key Insights</p>
        <ul className="text-sm text-gray-700 space-y-1">
          {currentMetrics.projectsCompleted > previousMetrics.projectsCompleted && (
            <li className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              <span>
                Project completion rate improved by{' '}
                <span className="font-semibold">
                  {currentMetrics.projectsCompleted - previousMetrics.projectsCompleted} projects
                </span>
              </span>
            </li>
          )}
          {currentMetrics.hoursLogged > previousMetrics.hoursLogged && (
            <li className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              <span>
                Team logged{' '}
                <span className="font-semibold">
                  {Math.round(currentMetrics.hoursLogged - previousMetrics.hoursLogged)} more hours
                </span>
              </span>
            </li>
          )}
          {currentMetrics.projectsCompleted === 0 && previousMetrics.projectsCompleted === 0 && (
            <li className="flex items-center gap-2">
              <Minus className="w-4 h-4 text-gray-400" />
              <span>No significant changes in metrics</span>
            </li>
          )}
        </ul>
      </div>
    </div>
  );
};
