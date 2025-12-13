import React from 'react';
import { ActivityLog } from '../../types/activity.types';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { formatDateTime } from '../../lib/utils';
import { Activity } from 'lucide-react';

interface ActivityListProps {
  activities: ActivityLog[];
  limit?: number;
}

export const ActivityList: React.FC<ActivityListProps> = ({ activities, limit = 5 }) => {
  const displayActivities = activities.slice(0, limit);

  const getActionColor = (action: ActivityLog['action']) => {
    switch (action) {
      case 'Created':
        return 'text-green-600 bg-green-50';
      case 'Updated':
        return 'text-blue-600 bg-blue-50';
      case 'Deleted':
        return 'text-red-600 bg-red-50';
      case 'Scanned':
        return 'text-purple-600 bg-purple-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  if (displayActivities.length === 0) {
    return (
      <Card variant="bordered">
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-gray-500">
            <Activity className="w-12 h-12 mb-2 opacity-50" />
            <p className="text-sm">No recent activity</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card variant="bordered">
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-3">
          {displayActivities.map((activity) => (
            <li key={activity.id} className="flex gap-3 pb-3 border-b border-gray-100 last:border-0 last:pb-0">
              <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${getActionColor(activity.action)}`}>
                <span className="text-xs font-bold">{activity.action[0]}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {activity.itemName || 'Unknown Item'}
                </p>
                <p className="text-xs text-gray-600 mt-0.5">
                  {activity.action} by {activity.user}
                </p>
                <p className="text-xs text-gray-500 mt-1">{formatDateTime(activity.timestamp)}</p>
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
};
