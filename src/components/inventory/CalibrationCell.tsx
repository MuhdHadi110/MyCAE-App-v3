import React from 'react';
import { formatDate } from '../../lib/utils';
import type { InventoryItem } from '../../types/inventory.types';

interface CalibrationInfo {
  itemId: string;
  lastCalibrated?: string;
  nextDue?: string;
  status: 'recent' | 'due-soon' | 'overdue' | 'none';
}

interface CalibrationCellProps {
  item: InventoryItem;
  calibrationInfo?: CalibrationInfo;
}

export const CalibrationCell: React.FC<CalibrationCellProps> = ({ item, calibrationInfo }) => {
  // Prioritize database value over maintenance records
  const displayDate = item.lastCalibratedDate || calibrationInfo?.lastCalibrated;

  if (!displayDate) {
    return (
      <span className="text-gray-400 text-sm italic">
        Not calibrated
      </span>
    );
  }

  // Determine status from calibrationInfo if available, otherwise show 'none'
  const status = calibrationInfo?.status || 'none';

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

  return (
    <div className="flex flex-col gap-1">
      <span className="text-sm text-gray-900">
        {formatDate(displayDate)}
      </span>
      {status !== 'none' && (
        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium w-fit ${statusColors[status]}`}>
          {statusLabels[status]}
        </span>
      )}
    </div>
  );
};
