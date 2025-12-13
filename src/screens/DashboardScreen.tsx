import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { TasklyDashboard } from '../components/dashboard/TasklyDashboard';

export const DashboardScreen: React.FC = () => {
  const { user } = useAuth();

  // Use Taskly dashboard for all roles for now
  return <TasklyDashboard />;
};
