import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { Plus, Search, Filter, Edit, Trash2, Eye, FolderOpen, ChevronUp, ChevronDown, ChevronsUpDown, ChevronRight, FolderKanban, FolderTree, PlusCircle } from 'lucide-react';
import { useProjectStore } from '../store/projectStore';
import { useClientStore } from '../store/clientStore';
import { useCompanyStore } from '../store/companyStore';
import { useTeamStore } from '../store/teamStore';
import { AddProjectModal } from '../components/modals/AddProjectModal';
import { AddVOModal } from '../components/modals/AddVOModal';
import { EditProjectModal } from '../components/modals/EditProjectModal';
import { ProjectDetailModal } from '../components/modals/ProjectDetailModal';
import { StructureCreatorModal } from '../components/modals/StructureCreatorModal';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { Card, StatCard, PageHeader } from '../components/ui/Card';
import { getPermissionMessage } from '../lib/permissions';
import { toast } from 'react-hot-toast';
import type { ProjectStatus, Project } from '../types/project.types';
import { logger } from '../lib/logger';
import { usePermissions } from '../hooks/usePermissions';

export const ProjectsScreen: React.FC = () => {
  const { projects, loading, fetchProjects } = useProjectStore();
  const { clients, fetchClients } = useClientStore();
  const { companies, fetchCompanies } = useCompanyStore();
  const { teamMembers, fetchTeamMembers } = useTeamStore();

  const { canAddProject: canAdd } = usePermissions();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | 'all'>('all');
  const [sortColumn, setSortColumn] = useState<string>('projectCode');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [showAddVOModal, setShowAddVOModal] = useState(false);
  const [selectedParentProject, setSelectedParentProject] = useState<Project | null>(null);
  const [showStructureModal, setShowStructureModal] = useState(false);
  const [selectedContainer, setSelectedContainer] = useState<Project | null>(null);
  const [collapsedProjects, setCollapsedProjects] = useState<Set<string>>(new Set());
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    projectId?: string;
    projectCode?: string;
  }>({ isOpen: false });

  useEffect(() => {
    fetchProjects();
    fetchClients();
    fetchCompanies();
    fetchTeamMembers();
  }, []);

  const handleAddProject = useCallback(() => {
    if (!canAdd) {
      toast.error(getPermissionMessage('add project', 'senior-engineer'));
      return;
    }
    setShowAddModal(true);
  }, [canAdd]);

  const handleViewProject = useCallback((projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    if (project) {
      setSelectedProject(project);
      setShowDetailModal(true);
    }
  }, [projects]);

  const handleEditProject = useCallback((projectId: string) => {
    if (!canAdd) {
      toast.error(getPermissionMessage('edit project', 'senior-engineer'));
      return;
    }
    const project = projects.find(p => p.id === projectId);
    if (project) {
      setSelectedProject(project);
      setShowEditModal(true);
    }
  }, [canAdd, projects]);

  const handleSort = useCallback((column: string) => {
    if (sortColumn === column) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  }, [sortColumn]);

  const getSortIcon = (column: string) => {
    if (sortColumn !== column) {
      return <ChevronsUpDown className="w-4 h-4 ml-1 inline-block" />;
    }
    return sortDirection === 'asc'
      ? <ChevronUp className="w-4 h-4 ml-1 inline-block" />
      : <ChevronDown className="w-4 h-4 ml-1 inline-block" />;
  };

  const handleSaveProject = async (updatedProject: Partial<Project>) => {
    if (!selectedProject) {
      toast.error('No project selected');
      return;
    }

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

      // Update other allowed fields (title, planned hours, etc.)
      const allowedUpdates: Partial<Project> = {};
      if (updatedProject.title) allowedUpdates.title = updatedProject.title;
      if (updatedProject.plannedHours !== undefined) allowedUpdates.plannedHours = updatedProject.plannedHours;
      if (updatedProject.categories !== undefined) allowedUpdates.categories = updatedProject.categories;

      // Add lead engineer and manager if changed
      if (updatedProject.leadEngineerId) allowedUpdates.leadEngineerId = updatedProject.leadEngineerId;
      if (updatedProject.managerId) allowedUpdates.managerId = updatedProject.managerId;

      if (Object.keys(allowedUpdates).length > 0) {
        await useProjectStore.getState().updateProject(selectedProject.id, allowedUpdates);
      }

      toast.success(`Project ${selectedProject.projectCode} updated successfully!`);
      fetchProjects(true); // Refresh list with force flag
      setShowEditModal(false);
      setSelectedProject(null);
    } catch (error: any) {
      logger.error('Failed to update project:', error);
      toast.error(error?.message || 'Failed to update project');
      throw error; // Re-throw so EditProjectModal can catch it
    }
  };

  const handleDeleteProject = useCallback((projectId: string, projectCode: string) => {
    if (!canAdd) {
      toast.error(getPermissionMessage('delete project', 'senior-engineer'));
      return;
    }
    // Show confirmation dialog
    setConfirmDialog({
      isOpen: true,
      projectId,
      projectCode,
    });
  }, [canAdd]);

  const confirmDeleteProject = useCallback(async () => {
    if (!confirmDialog.projectId || !confirmDialog.projectCode) return;

    try {
      await useProjectStore.getState().deleteProject(confirmDialog.projectId);
      toast.success(`Project ${confirmDialog.projectCode} deleted successfully`);
      fetchProjects();
      setConfirmDialog({ isOpen: false });
    } catch (error) {
      logger.error('Failed to delete project:', error);
      toast.error('Failed to delete project: ' + (error instanceof Error ? error.message : String(error)));
    }
  }, [confirmDialog.projectId, confirmDialog.projectCode, fetchProjects]);

  // Memoize filtered projects to avoid recalculating on every render
  const filteredProjects = useMemo(() => {
    return projects.filter((project) => {
      const matchesSearch =
        searchTerm === '' ||
        project.projectCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.title.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter === 'all' || project.status === statusFilter;

      return matchesSearch && matchesStatus;
    }).sort((a, b) => {
      const getSortValue = (project: Project) => {
        switch (sortColumn) {
          case 'projectCode':
            return project.projectCode.toLowerCase();
          case 'title':
            return project.title.toLowerCase();
          case 'client':
            const client = clients.find((c) => c.id === project.companyId);
            return (client?.name || '').toLowerCase();
          case 'engineer':
            return (
              project.engineerName ||
              (project as any).leadEngineer?.name ||
              teamMembers.find((tm) => tm.userId === project.leadEngineerId)?.name ||
              teamMembers.find((tm) => tm.userId === project.engineerId)?.name ||
              ''
            ).toLowerCase();
          case 'status':
            return project.status;
          case 'hours':
            return project.actualHours || 0;
          default:
            return project.projectCode.toLowerCase();
        }
      };

      const aValue = getSortValue(a);
      const bValue = getSortValue(b);

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection === 'asc'
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      } else {
        return sortDirection === 'asc'
          ? (aValue as number) - (bValue as number)
          : (bValue as number) - (aValue as number);
      }
    });
  }, [projects, searchTerm, statusFilter, sortColumn, sortDirection, clients, teamMembers]);

  // Memoize project hierarchy for parent-VO relationships
  const projectHierarchy = useMemo(() => {
    const parents = filteredProjects.filter(p => !p.isVariationOrder);
    const vosByParent = filteredProjects
      .filter(p => p.isVariationOrder)
      .reduce((acc, vo) => {
        const parentId = vo.parentProjectId || '';
        if (!acc[parentId]) acc[parentId] = [];
        acc[parentId].push(vo);
        return acc;
      }, {} as Record<string, Project[]>);

    return { parents, vosByParent };
  }, [filteredProjects]);

  // Memoize status counts to avoid recalculating on every render
  const statusCounts = useMemo(() => ({
    total: projects.length,
    preLim: projects.filter((p) => p.status === 'pre-lim').length,
    ongoing: projects.filter((p) => p.status === 'ongoing').length,
    completed: projects.filter((p) => p.status === 'completed').length,
  }), [projects]);

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
                onClick={handleAddProject}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                New Project
              </button>
            )}
          </div>
        </div>

        {/* Filters */}
        <Card variant="stat" padding="sm">
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
        </Card>

        {/* Stats Cards - Clickable to filter */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Projects"
            value={statusCounts.total}
            color="gray"
            onClick={() => setStatusFilter('all')}
            active={statusFilter === 'all'}
          />
          <StatCard
            title="Preliminary"
            value={statusCounts.preLim}
            color="yellow"
            onClick={() => setStatusFilter('pre-lim')}
            active={statusFilter === 'pre-lim'}
          />
          <StatCard
            title="Ongoing"
            value={statusCounts.ongoing}
            color="green"
            onClick={() => setStatusFilter('ongoing')}
            active={statusFilter === 'ongoing'}
          />
          <StatCard
            title="Completed"
            value={statusCounts.completed}
            color="gray"
            onClick={() => setStatusFilter('completed')}
            active={statusFilter === 'completed'}
          />
        </div>

        {/* Projects List */}
        <Card variant="stat" padding="none" className="overflow-hidden">
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
                    <th
                      onClick={() => handleSort('projectCode')}
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                    >
                      Project Code {getSortIcon('projectCode')}
                    </th>
                    <th
                      onClick={() => handleSort('title')}
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                    >
                      Title {getSortIcon('title')}
                    </th>
                    <th
                      onClick={() => handleSort('client')}
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                    >
                      Company {getSortIcon('client')}
                    </th>
                    <th
                      onClick={() => handleSort('engineer')}
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                    >
                      Engineer {getSortIcon('engineer')}
                    </th>
                    <th
                      onClick={() => handleSort('status')}
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                    >
                      Status {getSortIcon('status')}
                    </th>
                    <th
                      onClick={() => handleSort('hours')}
                      className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                    >
                      Hours {getSortIcon('hours')}
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {projectHierarchy.parents.map((project) => {
                // Try to find company in both CompanyStore and ClientStore
                let company: any = companies.find((c) => c.id === project.companyId);
                if (!company && project.companyId) {
                  company = clients.find((c) => c.id === project.companyId);
                }

                const vos = projectHierarchy.vosByParent[project.id] || [];
                const hasVOs = vos.length > 0;
                const isCollapsed = collapsedProjects.has(project.id);

                return (
                  <React.Fragment key={project.id}>
                    {/* Parent Project Row */}
                    <tr className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center gap-2">
                          {hasVOs && (
                            <button
                              onClick={() => {
                                const newCollapsed = new Set(collapsedProjects);
                                if (isCollapsed) {
                                  newCollapsed.delete(project.id);
                                } else {
                                  newCollapsed.add(project.id);
                                }
                                setCollapsedProjects(newCollapsed);
                              }}
                              className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                              title={isCollapsed ? 'Expand VOs' : 'Collapse VOs'}
                            >
                              <ChevronRight className={`w-4 h-4 transition-transform ${!isCollapsed ? 'rotate-90' : ''}`} />
                            </button>
                          )}
                          {/* Project Type Icon */}
                          {project.projectType === 'structure_container' && (
                            <span title="Structure Container">
                              <FolderKanban className="w-4 h-4 text-amber-600" />
                            </span>
                          )}
                          {project.projectType === 'structure_child' && (
                            <span title="Structure">
                              <FolderTree className="w-4 h-4 text-orange-600" />
                            </span>
                          )}
                          {project.isVariationOrder && (
                            <span className="text-blue-400 text-sm">↳</span>
                          )}
                          {!project.projectType && !project.isVariationOrder && (
                            <span title="Project">
                              <FolderOpen className="w-4 h-4 text-gray-400" />
                            </span>
                          )}
                          
                          <button
                            onClick={() => handleViewProject(project.id)}
                            className="text-primary-600 hover:text-primary-700 hover:underline transition-colors cursor-pointer"
                            title={`View details for project ${project.projectCode}`}
                            aria-label={`View details for project ${project.projectCode}`}
                          >
                            {project.projectCode}
                          </button>
                          
                          {/* Badges */}
                          {hasVOs && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {vos.length} VO{vos.length > 1 ? 's' : ''}
                            </span>
                          )}
                          {project.projectType === 'structure_container' && project.structureStats && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                              {project.structureStats.totalStructures} structure{project.structureStats.totalStructures !== 1 ? 's' : ''}
                            </span>
                          )}
                          {project.projectType === 'structure_child' && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                              Structure
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        <div className="max-w-xs truncate" title={project.title}>
                          {project.title}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {company?.name || project.companyName || 'Unknown'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {project.engineerName ||
                         (project as any).leadEngineer?.name ||
                         teamMembers.find(tm => tm.userId === project.leadEngineerId)?.name ||
                         teamMembers.find(tm => tm.userId === project.engineerId)?.name ||
                         'Unassigned'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col gap-1">
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
                          {project.projectType === 'structure_container' && project.structureStats && (
                            <span className="text-xs text-gray-500">
                              Auto: {project.structureStats.ongoingCount + project.structureStats.completedCount} of {project.structureStats.totalStructures}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                        <div className="flex flex-col items-end gap-1.5">
                          <div className="font-medium">{project.actualHours || 0} hrs</div>
                          <div className="text-xs text-gray-500">
                            of {project.plannedHours} planned
                          </div>

                          {/* Progress bar */}
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
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                        <div className="flex items-center justify-end gap-2">
                          {canAdd && project.projectType === 'structure_container' && (
                            <button
                              onClick={() => {
                                setSelectedContainer(project);
                                setShowStructureModal(true);
                              }}
                              className="p-2 text-gray-400 hover:text-amber-600 transition-colors"
                              title="Add Structure"
                              aria-label={`Add structure to ${project.projectCode}`}
                            >
                              <PlusCircle className="w-4 h-4" />
                            </button>
                          )}
                          {canAdd && !project.projectType && (
                            <button
                              onClick={() => {
                                setSelectedParentProject(project);
                                setShowAddVOModal(true);
                              }}
                              className="p-2 text-gray-400 hover:text-green-600 transition-colors"
                              title="Create Variation Order"
                              aria-label={`Create VO for ${project.projectCode}`}
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => handleViewProject(project.id)}
                            className="p-2 text-gray-400 hover:text-primary-600 transition-colors"
                            title="View Details"
                            aria-label={`View details for project ${project.projectCode}`}
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {canAdd && (
                            <button
                              onClick={() => handleEditProject(project.id)}
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

                    {/* Variation Orders (VOs) under parent */}
                    {!isCollapsed && vos.map((vo) => {
                      let voCompany: any = companies.find((c) => c.id === vo.companyId);
                      if (!voCompany && vo.companyId) {
                        voCompany = clients.find((c) => c.id === vo.companyId);
                      }

                      return (
                        <tr key={vo.id} className="bg-blue-50 hover:bg-blue-100 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex items-center gap-2 pl-8">
                              <span className="text-blue-400">↳</span>
                              <button
                                onClick={() => handleViewProject(vo.id)}
                                className="text-primary-600 hover:text-primary-700 hover:underline transition-colors cursor-pointer"
                                title={`View details for VO ${vo.projectCode}`}
                                aria-label={`View details for VO ${vo.projectCode}`}
                              >
                                {vo.projectCode}
                              </button>
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-200 text-blue-800">
                                VO
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900">
                            <div className="max-w-xs truncate" title={vo.title}>
                              {vo.title}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {voCompany?.name || vo.companyName || 'Unknown'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {vo.engineerName ||
                             (vo as any).leadEngineer?.name ||
                             teamMembers.find(tm => tm.userId === vo.leadEngineerId)?.name ||
                             teamMembers.find(tm => tm.userId === vo.engineerId)?.name ||
                             'Unassigned'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                vo.status === 'pre-lim'
                                  ? 'bg-blue-100 text-blue-800'
                                  : vo.status === 'ongoing'
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-gray-100 text-gray-800'
                              }`}
                            >
                              {vo.status === 'pre-lim' ? 'Preliminary' : vo.status === 'ongoing' ? 'Ongoing' : 'Completed'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                            <div className="flex flex-col items-end gap-1.5">
                              <div className="font-medium">{vo.actualHours || 0} hrs</div>
                              <div className="text-xs text-gray-500">
                                of {vo.plannedHours} planned
                              </div>

                              {/* Progress bar */}
                              <div className="w-full bg-gray-200 rounded-full h-2.5 max-w-[100px] shadow-inner overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all duration-300 ease-in-out shadow-sm ${
                                    (vo.actualHours || 0) > vo.plannedHours
                                      ? 'bg-gradient-to-r from-red-500 to-red-600'
                                      : 'bg-gradient-to-r from-green-500 to-green-600'
                                  }`}
                                  style={{
                                    width: `${Math.min(
                                      Math.max(
                                        vo.plannedHours > 0
                                          ? ((vo.actualHours || 0) / vo.plannedHours) * 100
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
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => handleViewProject(vo.id)}
                                className="p-2 text-gray-400 hover:text-primary-600 transition-colors"
                                title="View Details"
                                aria-label={`View details for VO ${vo.projectCode}`}
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              {canAdd && (
                                <button
                                  onClick={() => handleEditProject(vo.id)}
                                  className="p-2 text-gray-400 hover:text-primary-600 transition-colors"
                                  title="Edit VO"
                                  aria-label={`Edit VO ${vo.projectCode}`}
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                              )}
                              {canAdd && (
                                <button
                                  onClick={() => handleDeleteProject(vo.id, vo.projectCode)}
                                  className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                                  title="Delete VO"
                                  aria-label={`Delete VO ${vo.projectCode}`}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </React.Fragment>
                );
              })}
              </tbody>
            </table>
          </div>
        )}
        </Card>

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

      {/* Add Variation Order Modal */}
      <AddVOModal
        isOpen={showAddVOModal}
        onClose={() => {
          setShowAddVOModal(false);
          setSelectedParentProject(null);
          fetchProjects();
        }}
        parentProject={selectedParentProject}
      />

      {/* Structure Creator Modal */}
      <StructureCreatorModal
        isOpen={showStructureModal}
        onClose={() => {
          setShowStructureModal(false);
          setSelectedContainer(null);
        }}
        container={selectedContainer}
        onStructureCreated={() => {
          fetchProjects();
        }}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog({ isOpen: false })}
        onConfirm={confirmDeleteProject}
        title="Delete Project"
        message={`Are you sure you want to delete Project ${confirmDialog.projectCode}? This action cannot be undone.`}
        variant="danger"
        confirmText="Delete Project"
        cancelText="Cancel"
      />
      </div>
    </div>
  );
};