import React from 'react';
import { formatDate } from '../../lib/utils';

interface CalibrationInfo {
  itemId: string;
  lastCalibrated?: string;
  nextDue?: string;
  status: 'recent' | 'due-soon' | 'overdue' | 'none';
}

interface CalibrationCellProps {
  calibrationInfo?: CalibrationInfo;
}

export const CalibrationCell: React.FC<CalibrationCellProps> = ({ calibrationInfo }) => {
  if (!calibrationInfo || calibrationInfo.status === 'none') {
    return (
      <span className="text-gray-400 text-sm italic">
        Not calibrated
      </span>
    );
  }

  const statusColors = {
    'recent': 'text-green-600 bg-green-50',
    'due-soon': 'text-yellow-600 bg-yellow-50',
    'overdue': 'text-red-600 bg-red-50',
    'none': 'text-gray-400',
  };

  const statusLabels = {
    'recent': 'Recent',
    'due-soon': 'Due Soon',
    'overdue': 'Overdue',
    'none': 'Not Calibrated',
  };

  const displayDate = calibrationInfo.lastCalibrated
    ? formatDate(calibrationInfo.lastCalibrated)
    : 'Not calibrated';

  return (
    <div className="flex flex-col gap-1">
      <span className="text-sm text-gray-900">
        {displayDate}
      </span>
      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium w-fit ${statusColors[calibrationInfo.status]}`}>
        {statusLabels[calibrationInfo.status]}
      </span>
    </div>
  );
};
