import React, { useEffect, useState } from 'react';
import { Plus, Search, Filter, Trash2, FlaskConical, Eye, Edit } from 'lucide-react';
import { useResearchStore } from '../store/researchStore';
import { useTeamStore } from '../store/teamStore';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { AddResearchModal } from '../components/modals/AddResearchModal';
import { EditResearchModal } from '../components/modals/EditResearchModal';
import { getCurrentUser } from '../lib/auth';
import { checkPermission, getPermissionMessage } from '../lib/permissions';
import { toast } from 'react-hot-toast';
import type { ResearchStatus, ResearchProject } from '../types/research.types';
import { logger } from '../lib/logger';

export const ResearchScreen: React.FC = () => {
  const { researchProjects, loading, fetchResearchProjects, deleteResearchProject, updateResearchProject } = useResearchStore();
  const { teamMembers, fetchTeamMembers } = useTeamStore();

  const currentUser = getCurrentUser();
  const canAdd = currentUser && checkPermission((currentUser.role || 'engineer') as any, 'canAddProject');

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<ResearchStatus | 'all'>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState<ResearchProject | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    projectId?: string;
    title?: string;
  }>({ isOpen: false });

  useEffect(() => {
    fetchResearchProjects();
    fetchTeamMembers();
  }, []);

  const handleAddResearch = () => {
    if (!canAdd) {
      toast.error(getPermissionMessage('add research project', 'senior-engineer'));
      return;
    }
    setShowAddModal(true);
  };

  const handleViewProject = (project: ResearchProject) => {
    setSelectedProject(project);
    setShowViewModal(true);
  };

  const handleEditProject = (project: ResearchProject) => {
    setSelectedProject(project);
    setShowEditModal(true);
  };

  const handleDeleteResearch = async (projectId: string, title: string) => {
    if (!canAdd) {
      toast.error(getPermissionMessage('delete research project', 'senior-engineer'));
      return;
    }
    setConfirmDialog({
      isOpen: true,
      projectId,
      title,
    });
  };

  const confirmDeleteResearch = async () => {
    if (!confirmDialog.projectId) return;

    try {
      await deleteResearchProject(confirmDialog.projectId);
      toast.success('Research project deleted successfully');
      fetchResearchProjects();
      setConfirmDialog({ isOpen: false });
    } catch (error) {
      logger.error('Failed to delete research project:', error);
      toast.error('Failed to delete research project');
    }
  };

  const filteredProjects = researchProjects.filter((project) => {
    const matchesSearch =
      searchTerm === '' ||
      project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.description?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || project.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const getStatusBadgeColor = (status: ResearchStatus): string => {
    switch (status) {
      case 'planning':
        return 'bg-blue-100 text-blue-800';
      case 'in-progress':
        return 'bg-green-100 text-green-800';
      case 'on-hold':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-gray-100 text-gray-800';
      case 'archived':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: ResearchStatus): string => {
    switch (status) {
      case 'planning':
        return 'Planning';
      case 'in-progress':
        return 'In Progress';
      case 'on-hold':
        return 'On Hold';
      case 'completed':
        return 'Completed';
      case 'archived':
        return 'Archived';
      default:
        return status;
    }
  };

  return (
    <div className="min-h-full bg-gray-50">
      <div className="p-4 md:p-6 space-y-6">
        {/* Header Container */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-3">
              <FlaskConical className="w-6 h-6 text-primary-600" />
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Research Projects</h1>
                <p className="text-gray-600 mt-1">Manage and track research initiatives and timesheet hours</p>
              </div>
            </div>
            {canAdd && (
              <button
                onClick={handleAddResearch}
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
                  placeholder="Search research projects..."
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
                  onChange={(e) => setStatusFilter(e.target.value as ResearchStatus | 'all')}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent appearance-none bg-white"
                >
                  <option value="all">All Status</option>
                  <option value="planning">Planning</option>
                  <option value="in-progress">In Progress</option>
                  <option value="on-hold">On Hold</option>
                  <option value="completed">Completed</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <button
            onClick={() => setStatusFilter('all')}
            className={`bg-white rounded-2xl shadow-sm border border-gray-100 p-6 text-left transition-all hover:shadow-md hover:scale-105 ${
              statusFilter === 'all' ? 'ring-2 ring-primary-500 ring-offset-2' : ''
            }`}
          >
            <div className="text-sm font-medium text-gray-600 mb-2">Total Projects</div>
            <div className="text-3xl font-bold text-gray-900">{researchProjects.length}</div>
          </button>
          <button
            onClick={() => setStatusFilter('planning')}
            className={`bg-white rounded-2xl shadow-sm border border-gray-100 p-6 text-left transition-all hover:shadow-md hover:scale-105 ${
              statusFilter === 'planning' ? 'ring-2 ring-blue-500 ring-offset-2' : ''
            }`}
          >
            <div className="text-sm font-medium text-gray-600 mb-2">Planning</div>
            <div className="text-3xl font-bold text-blue-600">
              {researchProjects.filter((p) => p.status === 'planning').length}
            </div>
          </button>
          <button
            onClick={() => setStatusFilter('in-progress')}
            className={`bg-white rounded-2xl shadow-sm border border-gray-100 p-6 text-left transition-all hover:shadow-md hover:scale-105 ${
              statusFilter === 'in-progress' ? 'ring-2 ring-green-500 ring-offset-2' : ''
            }`}
          >
            <div className="text-sm font-medium text-gray-600 mb-2">In Progress</div>
            <div className="text-3xl font-bold text-green-600">
              {researchProjects.filter((p) => p.status === 'in-progress').length}
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
              {researchProjects.filter((p) => p.status === 'completed').length}
            </div>
          </button>
          <button
            onClick={() => setStatusFilter('on-hold')}
            className={`bg-white rounded-2xl shadow-sm border border-gray-100 p-6 text-left transition-all hover:shadow-md hover:scale-105 ${
              statusFilter === 'on-hold' ? 'ring-2 ring-yellow-500 ring-offset-2' : ''
            }`}
          >
            <div className="text-sm font-medium text-gray-600 mb-2">On Hold</div>
            <div className="text-3xl font-bold text-yellow-600">
              {researchProjects.filter((p) => p.status === 'on-hold').length}
            </div>
          </button>
        </div>

        {/* Projects Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-gray-200 border-t-primary-600 rounded-full animate-spin"></div>
              </div>
              <p className="text-gray-600 mt-4">Loading research projects...</p>
            </div>
          ) : filteredProjects.length === 0 ? (
            <div className="text-center py-12">
              <FlaskConical className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">No research projects found</p>
              <p className="text-gray-400 text-sm mt-2">Create a new project to get started</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Code
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Title
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Lead Researcher
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Hours
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Start Date
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredProjects.map((project) => (
                    <tr key={project.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-primary-600">
                        {project.researchCode || 'N/A'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        <div className="max-w-xs truncate" title={project.title}>
                          {project.title}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {project.leadResearcherName || 'TBD'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeColor(project.status)}`}>
                          {getStatusLabel(project.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 text-right">
                        {project.totalHoursLogged?.toFixed(1) || '0.0'} hrs
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {new Date(project.startDate).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleViewProject(project)}
                            className="p-2 text-gray-400 hover:text-primary-600 transition-colors"
                            title="View details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleEditProject(project)}
                            className="p-2 text-gray-400 hover:text-primary-600 transition-colors"
                            title="Edit project"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteResearch(project.id, project.title)}
                            className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                            title="Delete project"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {showAddModal && (
        <AddResearchModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          onSubmit={async (data) => {
            try {
              await useResearchStore.getState().addResearchProject(data);
              toast.success('Research project created successfully');
              setShowAddModal(false);
              fetchResearchProjects();
            } catch (error) {
              toast.error('Failed to create research project');
            }
          }}
        />
      )}

      {/* View Modal - Placeholder for future implementation */}
      {showViewModal && selectedProject && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={() => {
            setShowViewModal(false);
            setSelectedProject(null);
          }} />
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full p-6">
              <h2 className="text-2xl font-bold mb-4">{selectedProject.title}</h2>
              <p className="text-gray-600 mb-4">{selectedProject.description}</p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Status</p>
                  <p className="text-lg">{getStatusLabel(selectedProject.status)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Total Hours</p>
                  <p className="text-lg">{selectedProject.totalHoursLogged?.toFixed(1) || '0.0'} hrs</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Start Date</p>
                  <p className="text-lg">{new Date(selectedProject.startDate).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Lead Researcher</p>
                  <p className="text-lg">{selectedProject.leadResearcherName || 'TBD'}</p>
                </div>
              </div>
              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => {
                    setShowViewModal(false);
                    setSelectedProject(null);
                  }}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedProject && (
        <EditResearchModal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setSelectedProject(null);
          }}
          project={selectedProject}
          onSubmit={async (id, updates) => {
            try {
              await updateResearchProject(id, updates);
              toast.success('Research project updated successfully!');
              setShowEditModal(false);
              setSelectedProject(null);
              fetchResearchProjects();
            } catch (error) {
              toast.error('Failed to update research project');
              logger.error('Update error:', error);
            }
          }}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog({ isOpen: false })}
        onConfirm={confirmDeleteResearch}
        title="Delete Research Project"
        message={`Are you sure you want to delete "${confirmDialog.title}"? This action cannot be undone.`}
        variant="danger"
        confirmText="Delete"
        cancelText="Cancel"
      />
    </div>
  );
};
