import React, { useEffect, useMemo } from 'react';
import {
  Clock,
  Target,
  CheckCircle2,
  FolderOpen,
  Calendar,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useProjectStore } from '../../store/projectStore';
import { useClientStore } from '../../store/clientStore';
import { getRoleInfo } from '../../lib/permissions';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import type { UserRole } from '../../types/auth.types';

export const TasklyDashboard: React.FC = () => {
  const { user } = useAuth();
  const { projects, timesheets, fetchProjects, fetchTimesheets } = useProjectStore();
  const { clients, fetchClients } = useClientStore();
  const [timeFilter, setTimeFilter] = React.useState<'daily' | 'weekly' | 'monthly'>('monthly');
  const [projectStatusFilter, setProjectStatusFilter] = React.useState<string>('all');
  const [selectedYear, setSelectedYear] = React.useState<number | 'all'>(new Date().getFullYear());
  const roleInfo = getRoleInfo((user?.role || 'engineer') as UserRole);

  useEffect(() => {
    fetchProjects();
    fetchTimesheets();
    fetchClients();
  }, []);

  // Filter timesheets by selected year
  const filteredTimesheets = useMemo(() => {
    if (!user) return [];
    const myTimesheets = (Array.isArray(timesheets) ? timesheets : []).filter((ts) => ts.engineerId === user.id);

    if (selectedYear === 'all') return myTimesheets;

    return myTimesheets.filter((ts) => {
      const year = new Date(ts.date).getFullYear();
      return year === selectedYear;
    });
  }, [timesheets, user?.id, selectedYear]);

  // Calculate personal KPIs
  const kpis = useMemo(() => {
    if (!user) return { myActiveProjects: 0, myTotalProjects: 0, prelimProjects: 0, completedProjects: 0, thisMonthHours: 0, completionRate: 0 };
    const myProjects = projects.filter((p) => p.engineerId === user.id);

    const activeProjects = myProjects.filter((p) => p.status === 'ongoing').length;
    const completedProjects = myProjects.filter((p) => p.status === 'completed').length;
    const prelimProjects = myProjects.filter((p) => p.status === 'pre-lim').length;

    const thisMonthHours = filteredTimesheets.reduce((sum, ts) => sum + parseFloat(ts.hours.toString() || '0'), 0);
    const completionRate = myProjects.length > 0 ? (completedProjects / myProjects.length) * 100 : 0;

    return {
      myActiveProjects: activeProjects,
      myTotalProjects: myProjects.length,
      prelimProjects,
      completedProjects,
      thisMonthHours,
      completionRate,
    };
  }, [projects, filteredTimesheets, user?.id]);

  // Project color mapping for stacked bar chart
  const projectColors = useMemo(() => {
    const colors = [
      '#00bfb3', // Cyan (primary)
      '#4285f4', // Blue
      '#fbbc04', // Yellow
      '#ea4335', // Red
      '#34a853', // Green
      '#9333ea', // Purple
      '#f97316', // Orange
      '#ec4899', // Pink
      '#8b5cf6', // Violet
      '#14b8a6', // Teal
    ];

    const colorMap: Record<string, string> = {};
    projects.forEach((project, index) => {
      colorMap[project.id] = colors[index % colors.length];
    });

    return colorMap;
  }, [projects]);

  // Activity data for personal chart - broken down by project
  const activityData = useMemo(() => {
    if (!user) return [];
    const dataMap: Record<string, Record<string, string | number>> = {};

    filteredTimesheets.forEach((ts) => {
      const date = new Date(ts.date);
      let key: string;
      let label: string;

      if (timeFilter === 'daily') {
        key = date.toISOString().split('T')[0];
        label = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      } else if (timeFilter === 'weekly') {
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        key = weekStart.toISOString().split('T')[0];
        label = `Week ${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
      } else {
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        label = date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      }

      if (!dataMap[key]) {
        dataMap[key] = { label };
      }

      const projectId = ts.projectId;
      if (!dataMap[key][projectId]) {
        dataMap[key][projectId] = 0;
      }
      dataMap[key][projectId] = (Number(dataMap[key][projectId]) || 0) + parseFloat(ts.hours.toString() || '0');
    });

    return Object.values(dataMap).sort((a, b) => String(a.label).localeCompare(String(b.label)));
  }, [filteredTimesheets, timeFilter]);

  // Get unique projects from the data for creating Bar elements
  const uniqueProjects = useMemo(() => {
    if (!user) return [];
    const projectIds = new Set<string>();

    filteredTimesheets.forEach(ts => projectIds.add(ts.projectId));

    return Array.from(projectIds).map(id => {
      const project = projects.find(p => p.id === id);
      return {
        id,
        code: project?.projectCode || 'Unknown',
        title: project?.title || 'Unknown Project'
      };
    });
  }, [filteredTimesheets, projects]);

  // Work category distribution
  const workCategoryData = useMemo(() => {
    if (!user) return [];
    const categoryTotals: Record<string, number> = {
      engineering: 0,
      'project-management': 0,
      'measurement-site': 0,
      'measurement-office': 0,
    };

    filteredTimesheets.forEach((ts) => {
      categoryTotals[ts.workCategory] += parseFloat(ts.hours.toString() || '0');
    });

    const totalHours = Object.values(categoryTotals).reduce((sum, h) => sum + h, 0);

    return [
      {
        name: 'Engineering',
        value: categoryTotals.engineering,
        percentage: totalHours > 0 ? (categoryTotals.engineering / totalHours) * 100 : 0,
        color: '#00bfb3',
      },
      {
        name: 'Project Mgmt',
        value: categoryTotals['project-management'],
        percentage: totalHours > 0 ? (categoryTotals['project-management'] / totalHours) * 100 : 0,
        color: '#4285f4',
      },
      {
        name: 'Measurement (Site)',
        value: categoryTotals['measurement-site'],
        percentage: totalHours > 0 ? (categoryTotals['measurement-site'] / totalHours) * 100 : 0,
        color: '#fbbc04',
      },
      {
        name: 'Measurement (Office)',
        value: categoryTotals['measurement-office'],
        percentage: totalHours > 0 ? (categoryTotals['measurement-office'] / totalHours) * 100 : 0,
        color: '#ea4335',
      },
    ].filter((item) => item.value > 0);
  }, [filteredTimesheets]);

  // Filter projects for this engineer
  const filteredProjects = useMemo(() => {
    if (!user) return [];
    const myProjects = projects.filter((p) => p.engineerId === user.id);
    if (projectStatusFilter === 'all') {
      return myProjects;
    }
    return myProjects.filter((p) => p.status === projectStatusFilter);
  }, [projects, user?.id, projectStatusFilter]);

  const years = [
    new Date().getFullYear() - 2,
    new Date().getFullYear() - 1,
    new Date().getFullYear(),
  ];

  return (
    <div className="min-h-full bg-gray-50 p-4 md:p-6 space-y-6">
        {/* Header Container */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Welcome back, {user?.name}!</h1>
              <p className="text-gray-600 text-sm mt-1">Your project assignments and progress overview.</p>
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
              <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1 px-2">
                <Calendar className="w-4 h-4 text-gray-600" />
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value === 'all' ? 'all' : parseInt(e.target.value))}
                  className="px-2 py-1.5 bg-transparent border-0 rounded font-medium text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 cursor-pointer"
                >
                  {years.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                  <option value="all">All Time</option>
                </select>
              </div>
              <span className="px-4 py-2 bg-cyan-50 text-primary-600 rounded-lg text-xs font-semibold border border-cyan-200 whitespace-nowrap">
                {roleInfo.label} Dashboard
              </span>
            </div>
          </div>
        </div>

        {/* KPI Cards Grid */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* My Active Projects */}
          <div className="bg-gray-50 rounded-lg p-5 border border-gray-100 hover:border-cyan-200 hover:shadow-sm transition-all">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-gray-600 text-sm font-medium">My Active Projects</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{kpis.myActiveProjects}</p>
                <p className="text-xs text-gray-500 mt-2">of {kpis.myTotalProjects} total projects</p>
              </div>
              <div className="w-12 h-12 bg-cyan-50 rounded-lg flex items-center justify-center">
                <FolderOpen className="w-6 h-6 text-primary-600" />
              </div>
            </div>
          </div>

          {/* Hours This Month */}
          <div className="bg-gray-50 rounded-lg p-5 border border-gray-100 hover:border-cyan-200 hover:shadow-sm transition-all">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-gray-600 text-sm font-medium">Hours This Month</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{kpis.thisMonthHours}</p>
                <p className="text-xs text-gray-500 mt-2">hours tracked</p>
              </div>
              <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          {/* Completed Projects */}
          <div className="bg-gray-50 rounded-lg p-5 border border-gray-100 hover:border-cyan-200 hover:shadow-sm transition-all">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-gray-600 text-sm font-medium">Completed</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{kpis.completedProjects}</p>
                <p className="text-xs text-gray-500 mt-2">projects finished</p>
              </div>
              <div className="w-12 h-12 bg-emerald-50 rounded-lg flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-emerald-600" />
              </div>
            </div>
          </div>

          {/* Completion Rate */}
          <div className="bg-gray-50 rounded-lg p-5 border border-gray-100 hover:border-cyan-200 hover:shadow-sm transition-all">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-gray-600 text-sm font-medium">Completion Rate</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{kpis.completionRate.toFixed(1)}%</p>
                <p className="text-xs text-gray-500 mt-2">of all projects</p>
              </div>
              <div className="w-12 h-12 bg-purple-50 rounded-lg flex items-center justify-center">
                <Target className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Activity Chart */}
          <div className="lg:col-span-2 bg-white rounded-lg p-5 border border-gray-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">My Activity</h2>
                <p className="text-sm text-gray-500 mt-1">Hours logged over time</p>
              </div>
              <div className="flex gap-2 bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setTimeFilter('daily')}
                  className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
                    timeFilter === 'daily'
                      ? 'bg-white text-primary-600 shadow-sm border border-gray-200'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Daily
                </button>
                <button
                  onClick={() => setTimeFilter('weekly')}
                  className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
                    timeFilter === 'weekly'
                      ? 'bg-white text-primary-600 shadow-sm border border-gray-200'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Weekly
                </button>
                <button
                  onClick={() => setTimeFilter('monthly')}
                  className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
                    timeFilter === 'monthly'
                      ? 'bg-white text-primary-600 shadow-sm border border-gray-200'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Monthly
                </button>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={activityData} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                  }}
                  formatter={(value, name) => {
                    const project = uniqueProjects.find(p => p.id === name);
                    return [`${value} hrs`, project ? `${project.code}: ${project.title}` : 'Unknown'];
                  }}
                />
                <Legend
                  formatter={(value) => {
                    const project = uniqueProjects.find(p => p.id === value);
                    return project ? `${project.code}` : 'Unknown';
                  }}
                  wrapperStyle={{ fontSize: '12px' }}
                />
                {uniqueProjects.map((project) => (
                  <Bar
                    key={project.id}
                    dataKey={project.id}
                    stackId="hours"
                    fill={projectColors[project.id]}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Work Distribution */}
          <div className="bg-white rounded-lg p-5 border border-gray-200">
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-900">My Work Distribution</h2>
              <p className="text-sm text-gray-500 mt-1">By category</p>
            </div>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={workCategoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={4}
                  dataKey="value"
                  animationDuration={800}
                >
                  {workCategoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => `${value} hrs`} />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-2 mt-4">
              {workCategoryData.map((item, index) => (
                <div key={index} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-gray-700">{item.name}</span>
                  </div>
                  <span className="font-semibold text-gray-900">{item.percentage.toFixed(0)}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* My Projects Table */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">My Projects</h2>
                <p className="text-sm text-gray-500 mt-1">Your assigned projects</p>
              </div>
              <div className="flex flex-wrap gap-2 bg-gray-100 rounded-lg p-1">
                {['all', 'ongoing', 'completed', 'pre-lim'].map((status) => (
                  <button
                    key={status}
                    onClick={() => setProjectStatusFilter(status)}
                    className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
                      projectStatusFilter === status
                        ? 'bg-white text-primary-600 shadow-sm border border-gray-200'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    {status === 'all' ? 'All' : status === 'pre-lim' ? 'Preliminary' : status.charAt(0).toUpperCase() + status.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {filteredProjects.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <FolderOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 font-medium">No projects found with this status filter.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-6 py-3 text-left font-semibold text-gray-700">Project</th>
                    <th className="px-6 py-3 text-left font-semibold text-gray-700">Client</th>
                    <th className="px-6 py-3 text-center font-semibold text-gray-700">Progress</th>
                    <th className="px-6 py-3 text-right font-semibold text-gray-700">Hours</th>
                    <th className="px-6 py-3 text-center font-semibold text-gray-700">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredProjects.map((project) => {
                    const client = clients.find((c) => c.id === project.clientId);
                    const progress = project.plannedHours > 0 ? ((project.actualHours || 0) / project.plannedHours) * 100 : 0;

                    return (
                      <tr key={project.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div>
                            <p className="font-medium text-gray-900 truncate">{project.title}</p>
                            <span className="inline-block mt-1 px-2.5 py-1 rounded text-xs font-semibold bg-cyan-50 text-primary-600">
                              {project.projectCode}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-gray-700">{client?.name || 'Unknown Client'}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center gap-2">
                            <div className="w-16 bg-gray-200 rounded-full h-2 overflow-hidden">
                              <div
                                className="bg-primary-600 h-2 rounded-full transition-all"
                                style={{ width: `${Math.min(progress, 100)}%` }}
                              />
                            </div>
                            <span className="font-semibold text-gray-900 w-10 text-right text-xs">{progress.toFixed(0)}%</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right text-gray-700">
                          <span className="font-medium">{project.actualHours}</span>
                          <span className="text-gray-400 mx-1">/</span>
                          <span className="text-gray-500">{project.plannedHours}</span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span
                            className={`inline-flex items-center px-2.5 py-1 rounded text-xs font-semibold ${
                              project.status === 'ongoing'
                                ? 'bg-blue-50 text-blue-700'
                                : project.status === 'completed'
                                ? 'bg-emerald-50 text-emerald-700'
                                : project.status === 'pre-lim'
                                ? 'bg-amber-50 text-amber-700'
                                : 'bg-gray-100 text-gray-700'
                            }`}
                          >
                            {project.status === 'pre-lim' ? 'Preliminary' : project.status.charAt(0).toUpperCase() + project.status.slice(1)}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
    </div>
  );
};
