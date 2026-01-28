import React, { useEffect, useMemo } from 'react';
import {
  TrendingUp,
  Clock,
  Target,
  CheckCircle2,
  Activity,
  FolderOpen,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useProjectStore } from '../../store/projectStore';
import { useClientStore } from '../../store/clientStore';
import {
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

export const EngineerDashboard: React.FC = () => {
  const { user } = useAuth();
  const { projects, timesheets, fetchProjects, fetchTimesheets } = useProjectStore();
  const { clients, fetchClients } = useClientStore();
  const [timeFilter, setTimeFilter] = React.useState<'daily' | 'weekly' | 'monthly'>('monthly');
  const [projectStatusFilter, setProjectStatusFilter] = React.useState<string>('all');

  useEffect(() => {
    fetchProjects();
    fetchTimesheets();
    fetchClients();
  }, []);

  // Calculate personal KPIs
  const kpis = useMemo(() => {
    if (!user) return { myActiveProjects: 0, myTotalProjects: 0, prelimProjects: 0, completedProjects: 0, thisMonthHours: 0, completionRate: 0 };
    const myProjects = projects.filter((p) => p.engineerId === user.id);
    const myTimesheets = (Array.isArray(timesheets) ? timesheets : []).filter((ts) => ts.engineerId === user.id);

    const activeProjects = myProjects.filter((p) => p.status === 'ongoing').length;
    const completedProjects = myProjects.filter((p) => p.status === 'completed').length;
    const prelimProjects = myProjects.filter((p) => p.status === 'pre-lim').length;

    const thisMonthHours = myTimesheets.reduce((sum, ts) => sum + ts.hours, 0);
    const completionRate = myProjects.length > 0 ? (completedProjects / myProjects.length) * 100 : 0;

    return {
      myActiveProjects: activeProjects,
      myTotalProjects: myProjects.length,
      prelimProjects,
      completedProjects,
      thisMonthHours,
      completionRate,
    };
  }, [projects, timesheets, user?.id]);

  // Activity data for personal chart
  const activityData = useMemo(() => {
    if (!user) return [];
    const dataMap: Record<string, { label: string; hours: number }> = {};

    const myTimesheets = (Array.isArray(timesheets) ? timesheets : []).filter((ts) => ts.engineerId === user.id);

    myTimesheets.forEach((ts) => {
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
        dataMap[key] = { label, hours: 0 };
      }

      dataMap[key].hours += ts.hours;
    });

    return Object.values(dataMap).sort((a, b) => a.label.localeCompare(b.label));
  }, [timesheets, user?.id, timeFilter]);

  // Work category distribution
  const workCategoryData = useMemo(() => {
    if (!user) return [];
    const categoryTotals: Record<string, number> = {
      engineering: 0,
      'project-management': 0,
      'measurement-site': 0,
      'measurement-office': 0,
    };

    const myTimesheets = (Array.isArray(timesheets) ? timesheets : []).filter((ts) => ts.engineerId === user.id);

    myTimesheets.forEach((ts) => {
      categoryTotals[ts.workCategory] += ts.hours;
    });

    const totalHours = Object.values(categoryTotals).reduce((sum, h) => sum + h, 0);

    return [
      {
        name: 'Engineering',
        value: categoryTotals.engineering,
        percentage: totalHours > 0 ? (categoryTotals.engineering / totalHours) * 100 : 0,
        color: '#6366F1',
      },
      {
        name: 'Project Mgmt',
        value: categoryTotals['project-management'],
        percentage: totalHours > 0 ? (categoryTotals['project-management'] / totalHours) * 100 : 0,
        color: '#10B981',
      },
      {
        name: 'Measurement (Site)',
        value: categoryTotals['measurement-site'],
        percentage: totalHours > 0 ? (categoryTotals['measurement-site'] / totalHours) * 100 : 0,
        color: '#F59E0B',
      },
      {
        name: 'Measurement (Office)',
        value: categoryTotals['measurement-office'],
        percentage: totalHours > 0 ? (categoryTotals['measurement-office'] / totalHours) * 100 : 0,
        color: '#EF4444',
      },
    ].filter((item) => item.value > 0);
  }, [timesheets, user?.id]);

  // Filter projects for this engineer
  const filteredProjects = useMemo(() => {
    if (!user) return [];
    const myProjects = projects.filter((p) => p.engineerId === user.id);
    if (projectStatusFilter === 'all') {
      return myProjects;
    }
    return myProjects.filter((p) => p.status === projectStatusFilter);
  }, [projects, user?.id, projectStatusFilter]);

  return (
    <div className="min-h-full bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="p-4 md:p-8 max-w-[1600px] mx-auto space-y-6">
        {/* Role Badge */}
        <div className="flex justify-end mb-4">
          <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">
            Engineer Dashboard
          </span>
        </div>

        {/* Welcome Section */}
        <div className="mb-10">
          <h1 className="text-4xl font-extrabold text-gray-900 mb-2">Welcome back, {user?.name}!</h1>
          <p className="text-lg text-gray-500">Your project assignments and progress overview.</p>
        </div>

        {/* Personal KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* My Active Projects */}
          <div className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-lg transition-all border border-gray-100 hover:border-primary-200">
            <div className="flex items-center justify-between mb-5">
              <div className="w-14 h-14 bg-primary-100 rounded-xl flex items-center justify-center">
                <FolderOpen className="w-7 h-7 text-primary-600" />
              </div>
              <span className="text-sm font-semibold text-blue-600 flex items-center gap-1 bg-blue-50 px-2 py-1 rounded-lg">
                <Activity className="w-4 h-4" />
                Active
              </span>
            </div>
            <p className="text-xs text-gray-500 uppercase tracking-wider font-medium mb-2">My Active Projects</p>
            <p className="text-4xl font-bold text-gray-900">{kpis.myActiveProjects}</p>
            <p className="text-xs text-gray-500 mt-3">of {kpis.myTotalProjects} total projects</p>
          </div>

          {/* This Month Hours */}
          <div className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-lg transition-all border border-gray-100 hover:border-green-200">
            <div className="flex items-center justify-between mb-5">
              <div className="w-14 h-14 bg-green-100 rounded-xl flex items-center justify-center">
                <Clock className="w-7 h-7 text-green-600" />
              </div>
              <span className="text-sm font-semibold text-green-600 flex items-center gap-1 bg-green-50 px-2 py-1 rounded-lg">
                <TrendingUp className="w-4 h-4" />
                Logged
              </span>
            </div>
            <p className="text-xs text-gray-500 uppercase tracking-wider font-medium mb-2">Hours This Month</p>
            <p className="text-4xl font-bold text-gray-900">{kpis.thisMonthHours}</p>
            <p className="text-xs text-gray-500 mt-3">hours tracked</p>
          </div>

          {/* Completed Projects */}
          <div className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-lg transition-all border border-gray-100 hover:border-emerald-200">
            <div className="flex items-center justify-between mb-5">
              <div className="w-14 h-14 bg-emerald-100 rounded-xl flex items-center justify-center">
                <CheckCircle2 className="w-7 h-7 text-emerald-600" />
              </div>
              <span className="text-sm font-semibold text-emerald-600 flex items-center gap-1 bg-emerald-50 px-2 py-1 rounded-lg">
                <TrendingUp className="w-4 h-4" />
                Done
              </span>
            </div>
            <p className="text-xs text-gray-500 uppercase tracking-wider font-medium mb-2">Completed</p>
            <p className="text-4xl font-bold text-gray-900">{kpis.completedProjects}</p>
            <p className="text-xs text-gray-500 mt-3">projects finished</p>
          </div>

          {/* Completion Rate */}
          <div className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-lg transition-all border border-gray-100 hover:border-purple-200">
            <div className="flex items-center justify-between mb-5">
              <div className="w-14 h-14 bg-purple-100 rounded-xl flex items-center justify-center">
                <Target className="w-7 h-7 text-purple-600" />
              </div>
              <span className="text-sm font-semibold text-purple-600 flex items-center gap-1 bg-purple-50 px-2 py-1 rounded-lg">
                <TrendingUp className="w-4 h-4" />
                {kpis.completionRate.toFixed(0)}%
              </span>
            </div>
            <p className="text-xs text-gray-500 uppercase tracking-wider font-medium mb-2">Completion Rate</p>
            <div className="flex items-end gap-3">
              <p className="text-4xl font-bold text-gray-900">{kpis.completionRate.toFixed(1)}</p>
              <p className="text-sm text-gray-500 mb-1">%</p>
            </div>
            <p className="text-xs text-gray-500 mt-3">of all projects</p>
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Activity Chart */}
          <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">My Activity</h2>
                <p className="text-sm text-gray-500 mt-1">Hours logged over time</p>
              </div>
              <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setTimeFilter('daily')}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                    timeFilter === 'daily'
                      ? 'bg-white text-primary-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Daily
                </button>
                <button
                  onClick={() => setTimeFilter('weekly')}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                    timeFilter === 'weekly'
                      ? 'bg-white text-primary-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Weekly
                </button>
                <button
                  onClick={() => setTimeFilter('monthly')}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                    timeFilter === 'monthly'
                      ? 'bg-white text-primary-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Monthly
                </button>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={activityData} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                <defs>
                  <linearGradient id="colorHours" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366F1" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#6366F1" stopOpacity={0} />
                  </linearGradient>
                  <filter id="shadow">
                    <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.15" />
                  </filter>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 11, fill: '#9CA3AF', fontWeight: 500 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#9CA3AF', fontWeight: 500 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '12px',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                    padding: '12px 16px',
                  }}
                  cursor={{ strokeDasharray: '5 5', stroke: '#d1d5db', strokeWidth: 1.5 }}
                  formatter={(value) => [`${value} hrs`, 'Hours']}
                />
                <Line
                  type="monotone"
                  dataKey="hours"
                  stroke="#6366F1"
                  strokeWidth={2.5}
                  dot={{ fill: '#6366F1', r: 5, filter: 'url(#shadow)' }}
                  activeDot={{ r: 7, fill: '#4f46e5' }}
                  fill="url(#colorHours)"
                  isAnimationActive={true}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Work Distribution */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-900">My Work Distribution</h2>
              <p className="text-sm text-gray-500 mt-1">By category</p>
            </div>
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <defs>
                  <filter id="pieShadow">
                    <feDropShadow dx="0" dy="1" stdDeviation="2" floodOpacity="0.1" />
                  </filter>
                </defs>
                <Pie
                  data={workCategoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={65}
                  outerRadius={95}
                  paddingAngle={6}
                  dataKey="value"
                  animationDuration={800}
                >
                  {workCategoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} filter="url(#pieShadow)" />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '12px',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                    padding: '8px 12px',
                  }}
                  formatter={(value: number) => `${value} hrs`}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-2 mt-4">
              {workCategoryData.map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-sm text-gray-700">{item.name}</span>
                  </div>
                  <span className="text-sm font-semibold text-gray-900">{item.percentage.toFixed(0)}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* My Projects */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">My Projects</h2>
                <p className="text-sm text-gray-500 mt-1">Your assigned projects</p>
              </div>
              <div className="flex flex-wrap gap-1 bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setProjectStatusFilter('all')}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                    projectStatusFilter === 'all'
                      ? 'bg-white text-primary-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setProjectStatusFilter('ongoing')}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                    projectStatusFilter === 'ongoing'
                      ? 'bg-white text-green-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Ongoing
                </button>
                <button
                  onClick={() => setProjectStatusFilter('completed')}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                    projectStatusFilter === 'completed'
                      ? 'bg-white text-gray-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Completed
                </button>
                <button
                  onClick={() => setProjectStatusFilter('pre-lim')}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                    projectStatusFilter === 'pre-lim'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Preliminary
                </button>
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
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="px-6 py-3 text-left font-semibold text-gray-700">Project</th>
                    <th className="px-6 py-3 text-left font-semibold text-gray-700">Client</th>
                    <th className="px-6 py-3 text-center font-semibold text-gray-700">Progress</th>
                    <th className="px-6 py-3 text-right font-semibold text-gray-700">Hours</th>
                    <th className="px-6 py-3 text-center font-semibold text-gray-700">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredProjects.map((project) => {
                    const client = clients.find((c) => c.id === project.companyId);
                    const progress = project.plannedHours > 0 ? ((project.actualHours || 0) / project.plannedHours) * 100 : 0;

                    return (
                      <tr key={project.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div>
                            <p className="font-medium text-gray-900 truncate">{project.title}</p>
                            <span className="inline-block mt-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-primary-100 text-primary-700">
                              {project.projectCode}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-gray-700">{client?.name || 'Unknown Client'}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center gap-2">
                            <div className="w-16 bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-gradient-to-r from-primary-500 to-primary-600 h-2 rounded-full transition-all"
                                style={{ width: `${Math.min(progress, 100)}%` }}
                              />
                            </div>
                            <span className="font-semibold text-gray-900 w-10 text-right">{progress.toFixed(0)}%</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className="text-gray-700 font-medium">{project.actualHours}</span>
                          <span className="text-gray-400 mx-1">/</span>
                          <span className="text-gray-500">{project.plannedHours}</span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span
                            className={`inline-flex items-center px-2.5 py-1.5 rounded-lg text-xs font-semibold ${
                              project.status === 'ongoing'
                                ? 'bg-green-100 text-green-700'
                                : project.status === 'completed'
                                ? 'bg-gray-100 text-gray-700'
                                : project.status === 'pre-lim'
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-yellow-100 text-yellow-700'
                            }`}
                          >
                            {project.status === 'pre-lim'
                              ? 'Preliminary'
                              : project.status === 'ongoing'
                              ? 'Ongoing'
                              : project.status === 'completed'
                              ? 'Completed'
                              : project.status}
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
    </div>
  );
};
