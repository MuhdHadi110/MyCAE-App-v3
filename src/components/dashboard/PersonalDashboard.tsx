import React, { useEffect, useMemo, useState } from 'react';
import {
  Clock,
  FolderOpen,
  TrendingUp,
  Calendar,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useProjectStore } from '../../store/projectStore';
import { useClientStore } from '../../store/clientStore';
import { useResearchStore } from '../../store/researchStore';
import { ProjectDetailModal } from '../modals/ProjectDetailModal';
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

export const PersonalDashboard: React.FC = () => {
  const { user } = useAuth();
  const { projects, timesheets, fetchProjects, fetchTimesheets } = useProjectStore();
  const { clients, fetchClients } = useClientStore();
  const { researchProjects, researchTimesheets, fetchResearchProjects, fetchResearchTimesheets } = useResearchStore();
  const [selectedYear, setSelectedYear] = useState<number | 'all'>(new Date().getFullYear());
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  useEffect(() => {
    fetchProjects();
    fetchTimesheets();
    fetchClients();
    fetchResearchProjects();
    fetchResearchTimesheets();
  }, []);

  // Get my timesheets
  const myTimesheets = useMemo(() => {
    if (!user) return [];
    return (Array.isArray(timesheets) ? timesheets : []).filter((ts) => ts.engineerId === user.id);
  }, [timesheets, user?.id]);

  // Get my projects (where I'm the engineer)
  const myProjects = useMemo(() => {
    if (!user) return [];
    return projects.filter((p) => p.engineerId === user.id);
  }, [projects, user?.id]);

  // Filter data by selected year
  const filteredTimesheets = useMemo(() => {
    if (selectedYear === 'all') return myTimesheets;
    return myTimesheets.filter((ts) => {
      const year = new Date(ts.date).getFullYear();
      return year === selectedYear;
    });
  }, [myTimesheets, selectedYear]);

  // Get my research timesheets
  const myResearchTimesheets = useMemo(() => {
    if (!user) return [];
    return (Array.isArray(researchTimesheets) ? researchTimesheets : []).filter((ts) => ts.teamMemberId === user.id);
  }, [researchTimesheets, user?.id]);

  // Filter research timesheets by selected year
  const filteredResearchTimesheets = useMemo(() => {
    if (selectedYear === 'all') return myResearchTimesheets;
    return myResearchTimesheets.filter((ts) => {
      const year = new Date(ts.date).getFullYear();
      return year === selectedYear;
    });
  }, [myResearchTimesheets, selectedYear]);

  // Year summary statistics
  const summary = useMemo(() => {
    const totalHours = filteredTimesheets.reduce((sum, ts) => sum + parseFloat(ts.hours.toString() || '0'), 0);
    const projectsWorkedOn = new Set(filteredTimesheets.map((ts) => ts.projectId.toString())).size;
    const avgHoursPerProject = projectsWorkedOn > 0 ? totalHours / projectsWorkedOn : 0;

    return {
      totalHours,
      projectsWorkedOn,
      avgHoursPerProject,
    };
  }, [filteredTimesheets]);

  // Monthly hours breakdown by project
  const monthlyData = useMemo(() => {
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    // Initialize: { 'Jan': {}, 'Feb': {}, ... }
    const dataMap: Record<string, Record<string, number>> = {};
    monthNames.forEach((month) => {
      dataMap[month] = {};
    });

    // Aggregate hours by month and project
    filteredTimesheets.forEach((ts) => {
      const date = new Date(ts.date);
      const month = monthNames[date.getMonth()];
      const project = projects.find((p) => p.id === ts.projectId.toString());
      const projectCode = project?.projectCode || 'Unknown';

      if (!dataMap[month][projectCode]) {
        dataMap[month][projectCode] = 0;
      }
      dataMap[month][projectCode] += parseFloat(ts.hours.toString() || '0');
    });

    // Transform to array format: [{ name: 'Jan', 'PROJECT-001': 20, 'PROJECT-002': 15 }]
    return monthNames.map((month) => ({
      name: month,
      ...dataMap[month],
    }));
  }, [filteredTimesheets, projects]);

  // Get unique project codes from timesheets for the chart
  const projectsInChart = useMemo(() => {
    const projectSet = new Set<string>();
    filteredTimesheets.forEach((ts) => {
      const project = projects.find((p) => p.id === ts.projectId.toString());
      if (project) {
        projectSet.add(project.projectCode);
      }
    });
    return Array.from(projectSet);
  }, [filteredTimesheets, projects]);

  // Define colors for projects
  const projectColors: Record<string, string> = useMemo(() => {
    const colors = ['#00bfb3', '#4285f4', '#fbbc04', '#ea4335', '#9c27b0', '#34a853', '#ff6d00', '#ab47bc'];
    const colorMap: Record<string, string> = {};
    projectsInChart.forEach((projectCode, index) => {
      colorMap[projectCode] = colors[index % colors.length];
    });
    return colorMap;
  }, [projectsInChart]);

  // Work distribution by project
  const projectDistribution = useMemo(() => {
    const projectMap: Record<string, { name: string; hours: number; color: string }> = {};
    const colors = ['#00bfb3', '#4285f4', '#fbbc04', '#ea4335', '#9c27b0'];

    filteredTimesheets.forEach((ts) => {
      const project = projects.find((p) => p.id === ts.projectId.toString());
      if (project) {
        if (!projectMap[project.id]) {
          projectMap[project.id] = {
            name: project.projectCode,
            hours: 0,
            color: colors[Object.keys(projectMap).length % colors.length],
          };
        }
        projectMap[project.id].hours += parseFloat(ts.hours.toString() || '0');
      }
    });

    return Object.values(projectMap)
      .sort((a, b) => b.hours - a.hours)
      .slice(0, 5);
  }, [filteredTimesheets, projects]);

  // Monthly research hours breakdown by project
  const researchMonthlyData = useMemo(() => {
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    // Initialize: { 'Jan': {}, 'Feb': {}, ... }
    const dataMap: Record<string, Record<string, number>> = {};
    monthNames.forEach((month) => {
      dataMap[month] = {};
    });

    // Aggregate hours by month and research project
    filteredResearchTimesheets.forEach((ts) => {
      const date = new Date(ts.date);
      const month = monthNames[date.getMonth()];
      const researchProject = researchProjects.find((p) => p.id === ts.projectId.toString());
      const projectCode = researchProject?.researchCode || researchProject?.title || 'Unknown';

      if (!dataMap[month][projectCode]) {
        dataMap[month][projectCode] = 0;
      }
      dataMap[month][projectCode] += parseFloat(ts.hoursLogged.toString() || '0');
    });

    // Transform to array format: [{ name: 'Jan', 'RES-001': 20, 'RES-002': 15 }]
    return monthNames.map((month) => ({
      name: month,
      ...dataMap[month],
    }));
  }, [filteredResearchTimesheets, researchProjects]);

  // Get unique research project codes from timesheets for the chart
  const researchProjectsInChart = useMemo(() => {
    const projectSet = new Set<string>();
    filteredResearchTimesheets.forEach((ts) => {
      const researchProject = researchProjects.find((p) => p.id === ts.projectId.toString());
      if (researchProject) {
        projectSet.add(researchProject.researchCode || researchProject.title || 'Unknown');
      }
    });
    return Array.from(projectSet);
  }, [filteredResearchTimesheets, researchProjects]);

  // Define colors for research projects
  const researchProjectColors: Record<string, string> = useMemo(() => {
    const colors = ['#10b981', '#8b5cf6', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899', '#84cc16', '#f97316'];
    const colorMap: Record<string, string> = {};
    researchProjectsInChart.forEach((projectCode, index) => {
      colorMap[projectCode] = colors[index % colors.length];
    });
    return colorMap;
  }, [researchProjectsInChart]);

  // Work category distribution
  const categoryDistribution = useMemo(() => {
    const categoryTotals = {
      engineering: 0,
      'project-management': 0,
      'measurement-site': 0,
      'measurement-office': 0,
    };

    filteredTimesheets.forEach((ts) => {
      categoryTotals[ts.workCategory] += parseFloat(ts.hours.toString() || '0');
    });

    const totalHours = Object.values(categoryTotals).reduce((sum, h) => sum + h, 0);
    const categoryColors = {
      engineering: '#00bfb3',
      'project-management': '#4285f4',
      'measurement-site': '#fbbc04',
      'measurement-office': '#ea4335',
    };

    return [
      {
        name: 'Engineering',
        value: categoryTotals.engineering,
        percentage: totalHours > 0 ? (categoryTotals.engineering / totalHours) * 100 : 0,
        color: categoryColors.engineering,
      },
      {
        name: 'Project Mgmt',
        value: categoryTotals['project-management'],
        percentage: totalHours > 0 ? (categoryTotals['project-management'] / totalHours) * 100 : 0,
        color: categoryColors['project-management'],
      },
      {
        name: 'Measurement (Site)',
        value: categoryTotals['measurement-site'],
        percentage: totalHours > 0 ? (categoryTotals['measurement-site'] / totalHours) * 100 : 0,
        color: categoryColors['measurement-site'],
      },
      {
        name: 'Measurement (Office)',
        value: categoryTotals['measurement-office'],
        percentage: totalHours > 0 ? (categoryTotals['measurement-office'] / totalHours) * 100 : 0,
        color: categoryColors['measurement-office'],
      },
    ].filter((item) => item.value > 0);
  }, [filteredTimesheets]);

  // Work Fields distribution from user's projects
  const fieldDistribution = useMemo(() => {
    const fieldMap: Record<string, number> = {
      'CFD': 0,
      'FEA': 0,
      'Vibration & Acoustic': 0,
    };

    // Map work types to fields (support multiple formats)
    const workTypeToField: Record<string, string> = {
      'computational-fluid-dynamic': 'CFD',
      'Computational Fluid Dynamics': 'CFD',
      'CFD': 'CFD',
      'finite-element-analysis': 'FEA',
      'Finite Element Analysis': 'FEA',
      'FEA': 'FEA',
      'vibration-acoustic': 'Vibration & Acoustic',
      'Vibration': 'Vibration & Acoustic',
      'Vibration & Acoustic': 'Vibration & Acoustic',
      'Acoustic': 'Vibration & Acoustic',
    };

    // Get only user's projects
    myProjects.forEach((project) => {
      // Check both 'categories' and 'workTypes' for backward compatibility
      let categories = (project as any).categories || project.workTypes;

      // Parse if it's a JSON string
      if (typeof categories === 'string') {
        try {
          categories = JSON.parse(categories);
        } catch (e) {
          console.warn('Failed to parse categories:', categories);
        }
      }

      if (categories && Array.isArray(categories)) {
        categories.forEach((category) => {
          const field = workTypeToField[category];
          if (field) {
            // Weight by hours worked on this project
            const projectHours = filteredTimesheets
              .filter((ts) => ts.projectId === project.id)
              .reduce((sum, ts) => sum + ts.hours, 0);
            fieldMap[field] += projectHours;
          }
        });
      }
    });

    const colors = {
      'CFD': '#6366f1',
      'FEA': '#ec4899',
      'Vibration & Acoustic': '#f59e0b',
    };

    const totalHours = Object.values(fieldMap).reduce((sum, h) => sum + h, 0);

    return Object.entries(fieldMap)
      .map(([name, value]) => ({
        name,
        value,
        percentage: totalHours > 0 ? (value / totalHours) * 100 : 0,
        color: colors[name as keyof typeof colors],
      }))
      .filter((item) => item.value > 0);
  }, [myProjects, filteredTimesheets]);

  // My projects with hours info
  const myProjectsWithHours = useMemo(() => {
    return myProjects.map((project) => {
      const hoursWorked = filteredTimesheets
        .filter((ts) => ts.projectId === project.id)
        .reduce((sum, ts) => sum + ts.hours, 0);

      return {
        ...project,
        hoursWorked,
      };
    });
  }, [myProjects, filteredTimesheets]);

  const handleViewProject = (project: any) => {
    setSelectedProject(project);
    setShowDetailModal(true);
  };


  const years = [
    new Date().getFullYear() - 2,
    new Date().getFullYear() - 1,
    new Date().getFullYear(),
  ];

  return (
    <div className="min-h-full bg-gray-50 p-4 md:p-6">
      {/* Header */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Dashboard</h1>
            <p className="text-gray-600 text-sm mt-1">Your personal work progress and statistics</p>
          </div>
          <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
            <Calendar className="w-4 h-4 text-gray-600 ml-2" />
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value === 'all' ? 'all' : parseInt(e.target.value))}
              className="px-3 py-2 bg-transparent border-0 rounded font-medium text-gray-900 focus:ring-2 focus:ring-primary-500"
            >
              {years.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
              <option value="all">All Time</option>
            </select>
          </div>
        </div>
      </div>

        <div className="space-y-6">
          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Total Hours */}
            <div className="bg-white rounded-lg p-5 border border-gray-200 hover:border-cyan-200 hover:shadow-sm transition-all">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-gray-600 text-sm font-medium">Total Hours</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{summary.totalHours.toFixed(1)}</p>
                  <p className="text-xs text-gray-500 mt-2">hours tracked</p>
                </div>
                <div className="w-12 h-12 bg-cyan-50 rounded-lg flex items-center justify-center">
                  <Clock className="w-6 h-6 text-primary-600" />
                </div>
              </div>
            </div>

            {/* Projects Worked On */}
            <div className="bg-white rounded-lg p-5 border border-gray-200 hover:border-blue-200 hover:shadow-sm transition-all">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-gray-600 text-sm font-medium">Projects</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{summary.projectsWorkedOn}</p>
                  <p className="text-xs text-gray-500 mt-2">projects worked on</p>
                </div>
                <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
                  <FolderOpen className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>

            {/* Avg Hours Per Project */}
            <div className="bg-white rounded-lg p-5 border border-gray-200 hover:border-green-200 hover:shadow-sm transition-all">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-gray-600 text-sm font-medium">Avg Hours/Project</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{summary.avgHoursPerProject.toFixed(1)}</p>
                  <p className="text-xs text-gray-500 mt-2">hours per project</p>
                </div>
                <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Monthly Project Hours */}
            <div className="bg-white rounded-lg p-5 border border-gray-200">
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-gray-900">Monthly Project Hours</h2>
                <p className="text-sm text-gray-500 mt-1">Hours tracked each month on engineering projects</p>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={monthlyData} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 11, fill: '#9CA3AF' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: '#9CA3AF' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                    }}
                    formatter={(value: number, name: string) => [`${value} hrs`, name]}
                  />
                  <Legend
                    wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}
                    iconType="rect"
                  />
                  {/* Dynamically render a Bar component for each project */}
                  {projectsInChart.map((projectCode) => (
                    <Bar
                      key={projectCode}
                      dataKey={projectCode}
                      stackId="hours"
                      fill={projectColors[projectCode]}
                      radius={[0, 0, 0, 0]}
                    />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Work Category Distribution */}
            <div className="bg-white rounded-lg p-5 border border-gray-200">
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-gray-900">Work by Category</h2>
                <p className="text-sm text-gray-500 mt-1">Time spent on different work types</p>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={categoryDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={4}
                    dataKey="value"
                    animationDuration={800}
                  >
                    {categoryDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => `${value} hrs`} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 mt-4">
                {categoryDistribution.map((item, index) => (
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

          {/* Second Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Monthly Research Hours */}
            <div className="bg-white rounded-lg p-5 border border-gray-200">
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-gray-900">Monthly Research Hours</h2>
                <p className="text-sm text-gray-500 mt-1">Hours tracked each month on research projects</p>
              </div>
              {researchProjectsInChart.length === 0 ? (
                <div className="h-[300px] flex items-center justify-center">
                  <div className="text-center">
                    <p className="text-gray-500">No research hours tracked</p>
                    <p className="text-sm text-gray-400 mt-1">Hours will appear here when you log time on research projects</p>
                  </div>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={researchMonthlyData} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 11, fill: '#9CA3AF' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: '#9CA3AF' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#fff',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                      }}
                      formatter={(value: number, name: string) => [`${value} hrs`, name]}
                    />
                    <Legend
                      wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}
                      iconType="rect"
                    />
                    {researchProjectsInChart.map((projectCode) => (
                      <Bar
                        key={projectCode}
                        dataKey={projectCode}
                        stackId="hours"
                        fill={researchProjectColors[projectCode]}
                        radius={[0, 0, 0, 0]}
                      />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Work Fields Distribution */}
            <div className="bg-white rounded-lg p-5 border border-gray-200">
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-gray-900">Work Fields</h2>
                <p className="text-sm text-gray-500 mt-1">Time spent by engineering field</p>
              </div>
              {fieldDistribution.length === 0 ? (
                <div className="h-[300px] flex items-center justify-center">
                  <div className="text-center">
                    <p className="text-gray-500">No field data available</p>
                    <p className="text-sm text-gray-400 mt-1">Fields will appear when you work on projects with work types assigned</p>
                  </div>
                </div>
              ) : (
                <>
                  <ResponsiveContainer width="100%" height={240}>
                    <PieChart>
                      <Pie
                        data={fieldDistribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={4}
                        dataKey="value"
                        animationDuration={800}
                      >
                        {fieldDistribution.map((entry, index) => (
                          <Cell key={`cell-field-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => `${value} hrs`} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="space-y-2 mt-4">
                    {fieldDistribution.map((item, index) => (
                      <div key={index} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                          <span className="text-gray-700">{item.name}</span>
                        </div>
                        <span className="font-semibold text-gray-900">{item.percentage.toFixed(0)}%</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* My Projects Table */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">My Projects</h2>
                <p className="text-sm text-gray-500 mt-1">Projects you're assigned to</p>
              </div>
            </div>

            {myProjectsWithHours.length === 0 ? (
              <div className="px-6 py-12 text-center">
                <FolderOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 font-medium">No projects assigned yet</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left font-semibold text-gray-700">Code</th>
                      <th className="px-6 py-3 text-left font-semibold text-gray-700">Project</th>
                      <th className="px-6 py-3 text-left font-semibold text-gray-700">Client</th>
                      <th className="px-6 py-3 text-right font-semibold text-gray-700">Hours</th>
                      <th className="px-6 py-3 text-center font-semibold text-gray-700">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {myProjectsWithHours.map((project) => {
                      const client = clients.find((c) => c.id === project.companyId);
                      const progress = project.plannedHours > 0 ? ((project.actualHours || 0) / project.plannedHours) * 100 : 0;

                      return (
                        <tr
                          key={project.id}
                          onClick={() => handleViewProject(project)}
                          className="hover:bg-gray-50 transition-colors cursor-pointer"
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="inline-block px-2.5 py-1 rounded text-xs font-semibold bg-cyan-50 text-primary-600">
                              {project.projectCode}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <p className="font-medium text-gray-900 truncate">{project.title}</p>
                          </td>
                          <td className="px-6 py-4 text-gray-700">{client?.name || 'Unknown'}</td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex flex-col items-end gap-1.5">
                              <div className="font-medium">{project.hoursWorked} hrs</div>
                              <div className="text-xs text-gray-500">
                                of {project.plannedHours} planned
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2.5 max-w-[100px] shadow-inner overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all duration-300 ease-in-out shadow-sm ${
                                    (project.actualHours || 0) > project.plannedHours
                                      ? 'bg-gradient-to-r from-red-500 to-red-600'
                                      : 'bg-gradient-to-r from-green-500 to-green-600'
                                  }`}
                                  style={{
                                    width: `${Math.min(
                                      Math.max(
                                        project.plannedHours > 0
                                          ? ((project.actualHours || 0) / project.plannedHours) * 100
                                          : 0,
                                        2
                                      ),
                                      100
                                    )}%`
                                  }}
                                />
                              </div>
                            </div>
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

      {/* Project Detail Modal */}
      {showDetailModal && selectedProject && (
        <ProjectDetailModal
          project={selectedProject}
          isOpen={showDetailModal}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedProject(null);
          }}
        />
      )}
    </div>
  );
};
