import React, { useMemo } from 'react';
import { X, Users, FolderOpen, Clock, Target } from 'lucide-react';
import { useProjectStore } from '../../store/projectStore';
import { useClientStore } from '../../store/clientStore';

interface TeamMemberProjectsModalProps {
  isOpen: boolean;
  onClose: () => void;
  teamMemberId: string | null;
  teamMemberName: string | null;
}

export const TeamMemberProjectsModal: React.FC<TeamMemberProjectsModalProps> = ({
  isOpen,
  onClose,
  teamMemberId,
  teamMemberName,
}) => {
  const { projects } = useProjectStore();
  const { clients } = useClientStore();

  // Get projects for this team member
  const memberProjects = useMemo(() => {
    if (!teamMemberId) return [];
    return projects.filter((p) => p.engineerId === teamMemberId);
  }, [teamMemberId, projects]);

  // Get active projects
  const activeProjects = useMemo(() => {
    return memberProjects.filter((p) => p.status === 'ongoing');
  }, [memberProjects]);

  // Get completed projects
  const completedProjects = useMemo(() => {
    return memberProjects.filter((p) => p.status === 'completed');
  }, [memberProjects]);

  // Get pre-lim projects
  const preLimProjects = useMemo(() => {
    return memberProjects.filter((p) => p.status === 'pre-lim');
  }, [memberProjects]);

  // Calculate statistics
  const stats = useMemo(() => {
    const totalHours = memberProjects.reduce((sum, p) => sum + (p.actualHours || 0), 0);
    const totalPlannedHours = memberProjects.reduce((sum, p) => sum + p.plannedHours, 0);
    const totalHoursUtilization = totalPlannedHours > 0 ? (totalHours / totalPlannedHours) * 100 : 0;

    return {
      totalProjects: memberProjects.length,
      activeProjects: activeProjects.length,
      completedProjects: completedProjects.length,
      totalHours,
      totalPlannedHours,
      totalHoursUtilization,
    };
  }, [memberProjects, activeProjects, completedProjects]);

  if (!isOpen) return null;

  const ProjectRow = ({
    project,
    status,
  }: {
    project: any;
    status: 'active' | 'completed' | 'preLim';
  }) => {
    const client = clients.find((c) => c.id === project.companyId);
    const progress = project.plannedHours > 0 ? (project.actualHours / project.plannedHours) * 100 : 0;

    const statusColors: Record<string, { bg: string; text: string }> = {
      active: { bg: 'bg-blue-50', text: 'text-blue-700' },
      completed: { bg: 'bg-emerald-50', text: 'text-emerald-700' },
      preLim: { bg: 'bg-amber-50', text: 'text-amber-700' },
    };

    return (
      <tr key={project.id} className="hover:bg-gray-50 transition-colors">
        <td className="px-4 py-3 whitespace-nowrap">
          <span className="inline-block px-2.5 py-1 rounded text-xs font-semibold bg-cyan-50 text-primary-600">
            {project.projectCode}
          </span>
        </td>
        <td className="px-4 py-3">
          <div>
            <p className="font-medium text-gray-900 truncate">{project.title}</p>
          </div>
        </td>
        <td className="px-4 py-3 text-gray-700 text-sm">{client?.name || 'Unknown'}</td>
        <td className="px-4 py-3">
          <div className="flex items-center justify-center gap-2">
            <div className="w-12 bg-gray-200 rounded-full h-1.5 overflow-hidden">
              <div
                className={`h-1.5 rounded-full transition-all ${
                  (project.actualHours || 0) > project.plannedHours
                    ? 'bg-red-500'
                    : 'bg-primary-600'
                }`}
                style={{ width: `${Math.min(progress, 100)}%` }}
              />
            </div>
            <span className={`font-semibold w-6 text-right text-xs ${
              (project.actualHours || 0) > project.plannedHours ? 'text-red-600' : 'text-gray-900'
            }`}>
              {progress.toFixed(0)}%
            </span>
          </div>
        </td>
        <td className="px-4 py-3 text-right whitespace-nowrap">
          <span className="font-medium text-gray-900">{project.actualHours}</span>
          <span className="text-gray-400 mx-1">/</span>
          <span className="text-gray-500">{project.plannedHours}</span>
        </td>
        <td className="px-4 py-3 text-center">
          <span className={`inline-flex items-center px-2.5 py-1 rounded text-xs font-semibold ${statusColors[status].bg} ${statusColors[status].text}`}>
            {status === 'active' ? 'Ongoing' : status === 'completed' ? 'Completed' : 'Preliminary'}
          </span>
        </td>
      </tr>
    );
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center pl-64">
        <div className="flex items-center justify-center w-full px-4 max-w-5xl">
          <div
            className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-5xl sm:w-full max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-primary-50 to-primary-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                  <Users className="w-5 h-5 text-primary-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{teamMemberName}</h3>
                  <p className="text-xs text-gray-600 mt-1">Project assignments and progress</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium text-blue-600 uppercase tracking-wide">Total Projects</p>
                      <p className="text-2xl font-bold text-blue-900 mt-2">{stats.totalProjects}</p>
                    </div>
                    <FolderOpen className="w-8 h-8 text-blue-300" />
                  </div>
                </div>

                <div className="bg-cyan-50 rounded-lg p-4 border border-cyan-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium text-cyan-600 uppercase tracking-wide">Active</p>
                      <p className="text-2xl font-bold text-cyan-900 mt-2">{stats.activeProjects}</p>
                    </div>
                    <Target className="w-8 h-8 text-cyan-300" />
                  </div>
                </div>

                <div className="bg-emerald-50 rounded-lg p-4 border border-emerald-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium text-emerald-600 uppercase tracking-wide">Completed</p>
                      <p className="text-2xl font-bold text-emerald-900 mt-2">{stats.completedProjects}</p>
                    </div>
                    <FolderOpen className="w-8 h-8 text-emerald-300" />
                  </div>
                </div>

                <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium text-purple-600 uppercase tracking-wide">Hours Logged</p>
                      <p className="text-2xl font-bold text-purple-900 mt-2">{stats.totalHours}</p>
                    </div>
                    <Clock className="w-8 h-8 text-purple-300" />
                  </div>
                </div>
              </div>

              {/* Active Projects Section */}
              {activeProjects.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                    Active Projects ({activeProjects.length})
                  </h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-200">
                          <th className="px-4 py-2 text-left font-semibold text-gray-700 text-xs">Code</th>
                          <th className="px-4 py-2 text-left font-semibold text-gray-700 text-xs">Project</th>
                          <th className="px-4 py-2 text-left font-semibold text-gray-700 text-xs">Client</th>
                          <th className="px-4 py-2 text-center font-semibold text-gray-700 text-xs">Progress</th>
                          <th className="px-4 py-2 text-right font-semibold text-gray-700 text-xs">Hours</th>
                          <th className="px-4 py-2 text-center font-semibold text-gray-700 text-xs">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {activeProjects.map((project) => (
                          <ProjectRow key={project.id} project={project} status="active" />
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Completed Projects Section */}
              {completedProjects.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
                    Completed Projects ({completedProjects.length})
                  </h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-200">
                          <th className="px-4 py-2 text-left font-semibold text-gray-700 text-xs">Code</th>
                          <th className="px-4 py-2 text-left font-semibold text-gray-700 text-xs">Project</th>
                          <th className="px-4 py-2 text-left font-semibold text-gray-700 text-xs">Client</th>
                          <th className="px-4 py-2 text-center font-semibold text-gray-700 text-xs">Progress</th>
                          <th className="px-4 py-2 text-right font-semibold text-gray-700 text-xs">Hours</th>
                          <th className="px-4 py-2 text-center font-semibold text-gray-700 text-xs">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {completedProjects.map((project) => (
                          <ProjectRow key={project.id} project={project} status="completed" />
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Pre-lim Projects Section */}
              {preLimProjects.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <span className="w-2 h-2 bg-amber-500 rounded-full"></span>
                    Preliminary Projects ({preLimProjects.length})
                  </h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-200">
                          <th className="px-4 py-2 text-left font-semibold text-gray-700 text-xs">Code</th>
                          <th className="px-4 py-2 text-left font-semibold text-gray-700 text-xs">Project</th>
                          <th className="px-4 py-2 text-left font-semibold text-gray-700 text-xs">Client</th>
                          <th className="px-4 py-2 text-center font-semibold text-gray-700 text-xs">Progress</th>
                          <th className="px-4 py-2 text-right font-semibold text-gray-700 text-xs">Hours</th>
                          <th className="px-4 py-2 text-center font-semibold text-gray-700 text-xs">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {preLimProjects.map((project) => (
                          <ProjectRow key={project.id} project={project} status="preLim" />
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Empty State */}
              {memberProjects.length === 0 && (
                <div className="text-center py-12">
                  <FolderOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 font-medium">No projects assigned</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-100 text-gray-900 rounded-lg hover:bg-gray-200 transition-colors font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
