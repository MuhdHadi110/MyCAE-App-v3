import { useState, useEffect } from 'react';
import { useScheduledMaintenanceStore } from '../store/scheduledMaintenanceStore';
import type { CalibrationInfo } from '../types/inventory.types';

export function useCalibrationData(itemIds: string[]) {
  const [calibrationData, setCalibrationData] = useState<Map<string, CalibrationInfo>>(new Map());
  const { fetchSchedulesForItem } = useScheduledMaintenanceStore();

  useEffect(() => {
    const fetchCalibrationData = async () => {
      if (itemIds.length === 0) return;

      const newData = new Map<string, CalibrationInfo>();

      for (const itemId of itemIds) {
        try {
          const schedules = await fetchSchedulesForItem(itemId);
          
          // Filter for completed calibrations
          const calibrations = schedules.filter(
            s => s.maintenance_type === 'calibration' && s.is_completed
          );

          if (calibrations.length === 0) {
            newData.set(itemId, {
              itemId,
              status: 'none',
            });
            continue;
          }

          // Sort by completed_date descending (most recent first)
          const sortedCalibrations = calibrations.sort((a, b) => 
            new Date(b.completed_date!).getTime() - new Date(a.completed_date!).getTime()
          );

          const lastCalibration = sortedCalibrations[0];
          const lastCalibratedDate = new Date(lastCalibration.completed_date!);
          const today = new Date();
          const diffTime = today.getTime() - lastCalibratedDate.getTime();
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

          // Find next scheduled calibration
          const upcomingCalibrations = schedules.filter(
            s => s.maintenance_type === 'calibration' && !s.is_completed
          );
          
          let nextDue: string | undefined;
          let status: CalibrationInfo['status'] = 'recent';

          if (upcomingCalibrations.length > 0) {
            const nextCalibration = upcomingCalibrations.sort((a, b) =>
              new Date(a.scheduled_date).getTime() - new Date(b.scheduled_date).getTime()
            )[0];
            nextDue = nextCalibration.scheduled_date;

            const scheduledDate = new Date(nextCalibration.scheduled_date);
            const daysUntilScheduled = Math.ceil(
              (scheduledDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
            );

            if (daysUntilScheduled < 0) {
              status = 'overdue'; // 1+ days past scheduled
            } else if (daysUntilScheduled <= 1) {
              status = 'due-soon'; // Today or tomorrow
            }
          }

          newData.set(itemId, {
            itemId,
            lastCalibrated: lastCalibration.completed_date,
            nextDue,
            status,
          });
        } catch (error) {
          console.error(`Failed to fetch calibration data for item ${itemId}:`, error);
          newData.set(itemId, {
            itemId,
            status: 'none',
          });
        }
      }

      setCalibrationData(newData);
    };

    fetchCalibrationData();
  }, [itemIds, fetchSchedulesForItem]);

  return calibrationData;
}
