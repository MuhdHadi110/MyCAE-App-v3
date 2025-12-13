import React, { useEffect, useState } from 'react';
import { Plus, Search, Filter, Edit, Trash2, Eye, FolderOpen } from 'lucide-react';
import { useProjectStore } from '../store/projectStore';
import { useClientStore } from '../store/clientStore';
import { useTeamStore } from '../store/teamStore';
import { AddProjectModal } from '../components/modals/AddProjectModal';
import { EditProjectModal } from '../components/modals/EditProjectModal';
import { ProjectDetailModal } from '../components/modals/ProjectDetailModal';
import { getCurrentUser } from '../lib/auth';
import { checkPermission, getPermissionMessage } from '../lib/permissions';
import { toast } from 'react-hot-toast';
import type { ProjectStatus, Project } from '../types/project.types';

export const ProjectsScreen: React.FC = () => {
  const { projects, loading, fetchProjects } = useProjectStore();
  const { clients, fetchClients } = useClientStore();
  const { teamMembers, fetchTeamMembers } = useTeamStore();

  const currentUser = getCurrentUser();
  const canAdd = currentUser && checkPermission((currentUser.role || 'engineer') as any, 'canAddProject');

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | 'all'>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  useEffect(() => {
    fetchProjects();
    fetchClients();
    fetchTeamMembers();
  }, []);

  const handleAddProject = () => {
    if (!canAdd) {
      toast.error(getPermissionMessage('add project', 'senior-engineer'));
      return;
    }
    setShowAddModal(true);
  };

  const handleViewProject = (projectId: string, projectCode: string) => {
    const project = projects.find(p => p.id === projectId);
    if (project) {
      setSelectedProject(project);
      setShowDetailModal(true);
    }
  };

  const handleEditProject = (projectId: string, projectCode: string) => {
    if (!canAdd) {
      toast.error(getPermissionMessage('edit project', 'senior-engineer'));
      return;
    }
    const project = projects.find(p => p.id === projectId);
    if (project) {
      setSelectedProject(project);
      setShowEditModal(true);
    }
  };

  const handleSaveProject = async (updatedProject: Partial<Project>) => {
    if (!selectedProject) return;

    try {
      // Check if status changed - use separate endpoint for status updates
      if (updatedProject.status && updatedProject.status !== selectedProject.status) {
        await useProjectStore.getState().updateProject(selectedProject.id, {
          status: updatedProject.status,
          // Include related date fields if they changed
          inquiryDate: updatedProject.inquiryDate,
          poReceivedDate: updatedProject.poReceivedDate,
          completionDate: updatedProject.completionDate,
        });
      }

      // Update other allowed fields (title, planned hours, remarks, etc.)
      const allowedUpdates: Partial<Project> = {};
      if (updatedProject.title) allowedUpdates.title = updatedProject.title;
      if (updatedProject.plannedHours !== undefined) allowedUpdates.plannedHours = updatedProject.plannedHours;
      if (updatedProject.remarks !== undefined) allowedUpdates.remarks = updatedProject.remarks;
      if (updatedProject.categories !== undefined) allowedUpdates.categories = updatedProject.categories;

      // Add lead engineer and manager if changed
      if (updatedProject.leadEngineerId) allowedUpdates.leadEngineerId = updatedProject.leadEngineerId;
      if (updatedProject.managerId) allowedUpdates.managerId = updatedProject.managerId;

      if (Object.keys(allowedUpdates).length > 0) {
        await useProjectStore.getState().updateProject(selectedProject.id, allowedUpdates);
      }

      toast.success(`Project ${selectedProject.projectCode} updated successfully!`);
      fetchProjects(); // Refresh list
      setShowEditModal(false);
      setSelectedProject(null);
    } catch (error: any) {
      console.error('Failed to update project:', error);
      toast.error(error?.message || 'Failed to update project');
    }
  };

  const handleDeleteProject = async (projectId: string, projectCode: string) => {
    if (!canAdd) {
      toast.error(getPermissionMessage('delete project', 'senior-engineer'));
      return;
    }
    if (confirm(`Are you sure you want to delete Project ${projectCode}?`)) {
      try {
        await useProjectStore.getState().deleteProject(projectId);
        toast.success(`Project ${projectCode} deleted successfully`);
        fetchProjects();
      } catch (error) {
        console.error('Failed to delete project:', error);
        toast.error('Failed to delete project: ' + (error instanceof Error ? error.message : String(error)));
      }
    }
  };

  const filteredProjects = projects.filter((project) => {
    const matchesSearch =
      searchTerm === '' ||
      project.projectCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.title.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || project.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="min-h-full bg-gray-50">
      <div className="p-4 md:p-6  space-y-6">
        {/* Header Container */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Projects</h1>
              <p className="text-gray-600 mt-1">
                Manage all your engineering projects and track progress
              </p>
            </div>
            {canAdd && (
              <button
                onClick={handleAddProject} // Standardized primary button
                className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                New Project
              </button>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div className="md:col-span-2">
            <div className="relative">
              <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by project code or title..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Status Filter */}
          <div>
            <div className="relative">
              <Filter className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as ProjectStatus | 'all')}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent appearance-none"
              >
                <option value="all">All Status</option>
                <option value="pre-lim">Preliminary</option>
                <option value="ongoing">Ongoing</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards - Clickable to filter */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <button
          onClick={() => setStatusFilter('all')}
          className={`bg-white rounded-2xl shadow-sm border border-gray-100 p-6 text-left transition-all hover:shadow-md hover:scale-105 ${
            statusFilter === 'all' ? 'ring-2 ring-primary-500 ring-offset-2' : ''
          }`}
        >
          <div className="text-sm font-medium text-gray-600 mb-2">Total Projects</div>
          <div className="text-3xl font-bold text-gray-900">{projects.length}</div>
        </button>
        <button
          onClick={() => setStatusFilter('pre-lim')}
          className={`bg-white rounded-2xl shadow-sm border border-gray-100 p-6 text-left transition-all hover:shadow-md hover:scale-105 ${
            statusFilter === 'pre-lim' ? 'ring-2 ring-yellow-500 ring-offset-2' : ''
          }`}
        >
          <div className="text-sm font-medium text-gray-600 mb-2">Preliminary</div>
          <div className="text-3xl font-bold text-yellow-600">
            {projects.filter((p) => p.status === 'pre-lim').length}
          </div>
        </button>
        <button
          onClick={() => setStatusFilter('ongoing')}
          className={`bg-white rounded-2xl shadow-sm border border-gray-100 p-6 text-left transition-all hover:shadow-md hover:scale-105 ${
            statusFilter === 'ongoing' ? 'ring-2 ring-green-500 ring-offset-2' : ''
          }`}
        >
          <div className="text-sm font-medium text-gray-600 mb-2">Ongoing</div>
          <div className="text-3xl font-bold text-green-600">
            {projects.filter((p) => p.status === 'ongoing').length}
          </div>
        </button>
        <button
          onClick={() => setStatusFilter('completed')}
          className={`bg-white rounded-2xl shadow-sm border border-gray-100 p-6 text-left transition-all hover:shadow-md hover:scale-105 ${
            statusFilter === 'completed' ? 'ring-2 ring-gray-500 ring-offset-2' : ''
          }`}
        >
          <div className="text-sm font-medium text-gray-600 mb-2">Completed</div>
          <div className="text-3xl font-bold text-gray-600">
            {projects.filter((p) => p.status === 'completed').length}
          </div>
        </button>
      </div>

      {/* Projects List */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">
            {statusFilter === 'all' && `All Projects (${filteredProjects.length})`}
            {statusFilter === 'pre-lim' && `Preliminary Projects (${filteredProjects.length})`}
            {statusFilter === 'ongoing' && `Ongoing Projects (${filteredProjects.length})`}
            {statusFilter === 'completed' && `Completed Projects (${filteredProjects.length})`}
          </h2>
        </div>

        {loading ? (
          <div className="px-6 py-8">
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="animate-pulse">
                  <div className="grid grid-cols-7 gap-4">
                    <div className="h-4 bg-gray-200 rounded"></div>
                    <div className="h-4 bg-gray-200 rounded col-span-2"></div>
                    <div className="h-4 bg-gray-200 rounded"></div>
                    <div className="h-4 bg-gray-200 rounded"></div>
                    <div className="h-4 bg-gray-200 rounded"></div>
                    <div className="h-4 bg-gray-200 rounded"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <div className="text-gray-400 mb-4">
              <FolderOpen className="w-12 h-12 mx-auto opacity-50" />
            </div>
            <p className="text-lg font-medium text-gray-700 mb-2">No projects found</p>
            <p className="text-sm text-gray-500 mb-4">
              {searchTerm || statusFilter !== 'all'
                ? 'Try adjusting your search or filters'
                : 'Get started by creating your first project'}
            </p>
            {canAdd && !searchTerm && statusFilter === 'all' && (
              <button
                onClick={() => setShowAddModal(true)}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Create First Project
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Project Code
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Title
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Client
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Engineer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Hours
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredProjects.map((project, idx) => {
                const client = clients.find((c) => c.id === project.clientId);

                // DEBUG: Check team members userId field
                if (idx === 0) {
                  console.log('[RENDER] project.leadEngineerId:', project.leadEngineerId);
                  console.log('[RENDER] First teamMember:', teamMembers[0]);
                  console.log('[RENDER] Match by userId:', teamMembers.find(tm => tm.userId === project.leadEngineerId));
                }

                return (
                  <tr key={project.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-primary-600">
                      {project.projectCode}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      <div className="max-w-xs truncate" title={project.title}>
                        {project.title}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {client?.name || 'Unknown'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {project.engineerName ||
                       (project as any).leadEngineer?.name ||
                       teamMembers.find(tm => tm.userId === project.leadEngineerId)?.name ||
                       teamMembers.find(tm => tm.userId === project.engineerId)?.name ||
                       'Unassigned'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          project.status === 'pre-lim'
                            ? 'bg-blue-100 text-blue-800'
                            : project.status === 'ongoing'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {project.status === 'pre-lim' ? 'Preliminary' : project.status === 'ongoing' ? 'Ongoing' : 'Completed'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                      <div className="font-medium">{project.actualHours} hrs</div>
                      <div className="text-xs text-gray-500">
                        of {project.plannedHours} planned
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleViewProject(project.id, project.projectCode)}
                          className="p-2 text-gray-400 hover:text-primary-600 transition-colors"
                          title="View Details"
                          aria-label={`View details for project ${project.projectCode}`}
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {canAdd && (
                          <button
                            onClick={() => handleEditProject(project.id, project.projectCode)}
                            className="p-2 text-gray-400 hover:text-primary-600 transition-colors"
                            title="Edit Project"
                            aria-label={`Edit project ${project.projectCode}`}
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                        )}
                        {canAdd && (
                          <button
                            onClick={() => handleDeleteProject(project.id, project.projectCode)}
                            className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                            title="Delete Project"
                            aria-label={`Delete project ${project.projectCode}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Project Modal */}
      <AddProjectModal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          fetchProjects();
        }}
      />

      {/* Edit Project Modal */}
      <EditProjectModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedProject(null);
        }}
        project={selectedProject}
        onSave={handleSaveProject}
      />

      {/* Project Detail Modal */}
      <ProjectDetailModal
        isOpen={showDetailModal}
        onClose={() => {
          setShowDetailModal(false);
          setSelectedProject(null);
        }}
        project={selectedProject}
      />
      </div>
    </div>
  );
};