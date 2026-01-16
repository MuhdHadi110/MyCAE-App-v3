import React, { useEffect, useMemo, useState } from 'react';
import {
  FolderOpen,
  TrendingUp,
  Clock,
  CheckCircle2,
  Search,
  BarChart3,
} from 'lucide-react';
import { useProjectStore } from '../../store/projectStore';
import { useTeamStore } from '../../store/teamStore';
import { useClientStore } from '../../store/clientStore';
import { ProjectDetailModal } from '../modals/ProjectDetailModal';
import { TeamMemberProjectsModal } from '../modals/TeamMemberProjectsModal';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

type ProjectStatus = 'pre-lim' | 'ongoing' | 'completed';

export const ProjectOverviewDashboard: React.FC = () => {
  const { projects, fetchProjects, fetchTimesheets } = useProjectStore();
  const { fetchTeamMembers } = useTeamStore();
  const { clients, fetchClients } = useClientStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | ProjectStatus>('all');
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedTeamMemberId, setSelectedTeamMemberId] = useState<string | null>(null);
  const [selectedTeamMemberName, setSelectedTeamMemberName] = useState<string | null>(null);
  const [showTeamMemberModal, setShowTeamMemberModal] = useState(false);

  useEffect(() => {
    fetchProjects();
    fetchTimesheets();
    fetchTeamMembers();
    fetchClients();
  }, []);

  // Calculate project statistics
  const stats = useMemo(() => {
    const total = projects.length;
    const active = projects.filter((p) => p.status === 'ongoing').length;
    const completed = projects.filter((p) => p.status === 'completed').length;
    const preLim = projects.filter((p) => p.status === 'pre-lim').length;

    return { total, active, completed, preLim };
  }, [projects]);

  // Project status distribution for pie chart
  const statusDistribution = useMemo(() => {
    return [
      {
        name: 'Pre-lim',
        value: stats.preLim,
        color: '#f59e0b',
      },
      {
        name: 'Ongoing',
        value: stats.active,
        color: '#3b82f6',
      },
      {
        name: 'Completed',
        value: stats.completed,
        color: '#10b981',
      },
    ].filter((item) => item.value > 0);
  }, [stats]);

  // Field of work distribution for donut chart
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

    projects.forEach((project) => {
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
            fieldMap[field]++;
          }
        });
      }
    });

    const colors = {
      'CFD': '#6366f1',
      'FEA': '#ec4899',
      'Vibration & Acoustic': '#f59e0b',
    };

    return Object.entries(fieldMap)
      .map(([name, value]) => ({
        name,
        value,
        color: colors[name as keyof typeof colors],
      }))
      .filter((item) => item.value > 0);
  }, [projects]);

  // Filter projects based on search and status
  const filteredProjects = useMemo(() => {
    let filtered = projects;

    if (statusFilter !== 'all') {
      filtered = filtered.filter((p) => p.status === statusFilter);
    }

    if (searchTerm) {
      filtered = filtered.filter(
        (p) =>
          p.projectCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.title.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return filtered;
  }, [projects, searchTerm, statusFilter]);

  const handleViewProject = (project: any) => {
    setSelectedProject(project);
    setShowDetailModal(true);
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Total Projects */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-gray-600 text-sm font-medium">Total Projects</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.total}</p>
                <p className="text-xs text-gray-500 mt-2">all statuses</p>
              </div>
              <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
                <FolderOpen className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          {/* Active Projects */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-gray-600 text-sm font-medium">Active Projects</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.active}</p>
                <p className="text-xs text-gray-500 mt-2">currently ongoing</p>
              </div>
              <div className="w-12 h-12 bg-cyan-50 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-primary-600" />
              </div>
            </div>
          </div>

          {/* Completed Projects */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-gray-600 text-sm font-medium">Completed</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.completed}</p>
                <p className="text-xs text-gray-500 mt-2">finished projects</p>
              </div>
              <div className="w-12 h-12 bg-emerald-50 rounded-lg flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-emerald-600" />
              </div>
            </div>
          </div>

          {/* Preliminary Projects */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-gray-600 text-sm font-medium">Preliminary</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.preLim}</p>
                <p className="text-xs text-gray-500 mt-2">pending projects</p>
              </div>
              <div className="w-12 h-12 bg-amber-50 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-amber-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Status Distribution */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-900">Status Distribution</h2>
              <p className="text-sm text-gray-500 mt-1">Projects by status</p>
            </div>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={statusDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={4}
                  dataKey="value"
                  animationDuration={800}
                >
                  {statusDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => `${value} projects`} />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-2 mt-4">
              {statusDistribution.map((item, index) => (
                <div key={index} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-gray-700">{item.name}</span>
                  </div>
                  <span className="font-semibold text-gray-900">{item.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Field of Work Distribution */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-900">Field of Work</h2>
              <p className="text-sm text-gray-500 mt-1">Projects by engineering field</p>
            </div>
            {fieldDistribution.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={280}>
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
                        <Cell key={`field-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => `${value} projects`} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-2 mt-4">
                  {fieldDistribution.map((item, index) => (
                    <div key={index} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                        <span className="text-gray-700">{item.name}</span>
                      </div>
                      <span className="font-semibold text-gray-900">{item.value}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-80 text-gray-400">
                <div className="text-center">
                  <BarChart3 className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">No field data available</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Active Projects Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Active Projects</h2>
                <p className="text-sm text-gray-500 mt-1">Browse and filter all projects</p>
              </div>
            </div>
          </div>

          {/* Search and Filter */}
          <div className="px-6 py-4 border-b border-gray-200 space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by project code or title..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            <div className="flex flex-wrap gap-2 bg-gray-100 rounded-lg p-1">
              {['all', 'pre-lim', 'ongoing', 'completed'].map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status as any)}
                  className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
                    statusFilter === status
                      ? 'bg-white text-primary-600 shadow-sm border border-gray-200'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {status === 'all' ? 'All' : status === 'pre-lim' ? 'Preliminary' : status.charAt(0).toUpperCase() + status.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Projects Table */}
          {filteredProjects.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <FolderOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 font-medium">No projects found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left font-semibold text-gray-700">Code</th>
                    <th className="px-6 py-3 text-left font-semibold text-gray-700">Project</th>
                    <th className="px-6 py-3 text-left font-semibold text-gray-700">Client</th>
                    <th className="px-6 py-3 text-left font-semibold text-gray-700">Engineer</th>
                    <th className="px-6 py-3 text-center font-semibold text-gray-700">Progress</th>
                    <th className="px-6 py-3 text-right font-semibold text-gray-700">Hours</th>
                    <th className="px-6 py-3 text-center font-semibold text-gray-700">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredProjects.map((project) => {
                    const client = clients.find((c) => c.id === project.clientId);
                    // Display lead engineer's name, fallback to manager's name
                    const engineerName = (project as any).leadEngineer?.name || (project as any).manager?.name || 'Unassigned';
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
                        <td className="px-6 py-4 text-gray-700">{engineerName}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center gap-2">
                            <div className="w-16 bg-gray-200 rounded-full h-2 overflow-hidden">
                              <div
                                className="bg-primary-600 h-2 rounded-full transition-all"
                                style={{ width: `${Math.min(progress, 100)}%` }}
                              />
                            </div>
                            <span className="font-semibold text-gray-900 w-8 text-right text-xs">{progress.toFixed(0)}%</span>
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

      {/* Team Member Projects Modal */}
      <TeamMemberProjectsModal
        isOpen={showTeamMemberModal}
        onClose={() => {
          setShowTeamMemberModal(false);
          setSelectedTeamMemberId(null);
          setSelectedTeamMemberName(null);
        }}
        teamMemberId={selectedTeamMemberId}
        teamMemberName={selectedTeamMemberName}
      />
    </div>
  );
};
