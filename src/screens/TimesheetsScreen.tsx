import React, { useEffect, useState, useCallback } from 'react';
import { Plus, Calendar, Clock, Download, Upload, Edit2, Trash2, Briefcase, FlaskConical, User, Search } from 'lucide-react';
import { useProjectStore } from '../store/projectStore';
import { useTeamStore } from '../store/teamStore';
import { useResearchStore } from '../store/researchStore';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { AddTimesheetModal } from '../components/modals/AddTimesheetModal';
import { EditTimesheetModal } from '../components/modals/EditTimesheetModal';
import { toast } from 'react-hot-toast';
import type { WorkCategory, Timesheet } from '../types/project.types';
import { logger } from '../lib/logger';

type TabType = 'projects' | 'research';

export const TimesheetsScreen: React.FC = () => {
  const { timesheets, projects, fetchTimesheets, fetchProjects, updateTimesheet, deleteTimesheet } = useProjectStore();
  const { teamMembers, fetchTeamMembers } = useTeamStore();
  const { researchTimesheets, fetchResearchProjects, fetchResearchTimesheets } = useResearchStore();
  const [activeTab, setActiveTab] = useState<TabType>('projects');
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  const [selectedEngineer, setSelectedEngineer] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingTimesheet, setEditingTimesheet] = useState<Timesheet | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    entryId?: string;
    entryType?: 'project' | 'research';
  }>({ isOpen: false });

  // Build filters and fetch timesheets
  const applyFilters = useCallback(() => {
    const filters: { engineerId?: string; startDate?: string; endDate?: string } = {};

    if (selectedEngineer) {
      filters.engineerId = selectedEngineer;
    }
    if (startDate) {
      filters.startDate = startDate;
    }
    if (endDate) {
      filters.endDate = endDate;
    }

    fetchTimesheets(Object.keys(filters).length > 0 ? filters : undefined);
  }, [selectedEngineer, startDate, endDate, fetchTimesheets]);

  useEffect(() => {
    fetchTimesheets();
    fetchProjects();
    fetchTeamMembers();
    fetchResearchProjects();
    fetchResearchTimesheets();

    // Set current month
    const now = new Date();
    setSelectedMonth(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`);
  }, []);

  // Apply filters when they change
  useEffect(() => {
    applyFilters();
  }, [selectedEngineer, startDate, endDate]);

  // Filter project timesheets by month
  const filteredTimesheets = (Array.isArray(timesheets) ? timesheets : []).filter((ts) => {
    if (!selectedMonth) return true;
    const tsDate = new Date(ts.date);
    const tsMonth = `${tsDate.getFullYear()}-${String(tsDate.getMonth() + 1).padStart(2, '0')}`;
    return tsMonth === selectedMonth;
  });

  // Filter research timesheets by month
  const filteredResearchTimesheets = (Array.isArray(researchTimesheets) ? researchTimesheets : []).filter((ts) => {
    if (!selectedMonth) return true;
    const tsDate = new Date(ts.date);
    const tsMonth = `${tsDate.getFullYear()}-${String(tsDate.getMonth() + 1).padStart(2, '0')}`;
    return tsMonth === selectedMonth;
  });

  // Calculate stats based on active tab
  const projectTotalHours = filteredTimesheets.reduce((sum, ts) => sum + parseFloat(ts.hours as any || 0), 0);
  const researchTotalHours = filteredResearchTimesheets.reduce((sum, ts) => sum + parseFloat((ts as any).hoursLogged || (ts as any).hours || 0), 0);

  // Display stats based on active tab
  const displayedEntries = activeTab === 'projects' ? filteredTimesheets : filteredResearchTimesheets;
  const displayedTotalHours = activeTab === 'projects' ? projectTotalHours : researchTotalHours;
  const displayedAvgHours = displayedEntries.length > 0 ? displayedTotalHours / displayedEntries.length : 0;

  const getWorkCategoryLabel = (category: WorkCategory) => {
    switch (category) {
      case 'engineering':
        return 'Engineering';
      case 'project-management':
        return 'Project Management (E.g.: Business/Site Discussion, Proposal Preparation or Quotations)';
      case 'measurement-site':
        return 'Measurement (Site)';
      case 'measurement-office':
        return 'Measurement (Office)';
      default:
        return category;
    }
  };

  const handleAddEntry = () => {
    setShowAddModal(true);
  };

  const handleEditEntry = (timesheet: Timesheet) => {
    setEditingTimesheet(timesheet);
    setShowEditModal(true);
  };

  const handleUpdateEntry = async (updatedTimesheet: Timesheet) => {
    try {
      await updateTimesheet(updatedTimesheet.id, {
        hours: updatedTimesheet.hours,
        workCategory: updatedTimesheet.workCategory,
        description: updatedTimesheet.description,
      });
      toast.success(`Timesheet entry updated! Hours: ${updatedTimesheet.hours}`);
      setShowEditModal(false);
      setEditingTimesheet(null);
    } catch (error: any) {
      // Extract the actual error message from backend
      const errorMessage = error?.response?.data?.error || error?.message || 'Failed to update timesheet entry';
      toast.error(errorMessage);
      logger.error('Update error:', error);
    }
  };

  const handleDeleteEntry = async (timesheetId: string) => {
    setConfirmDialog({
      isOpen: true,
      entryId: timesheetId,
      entryType: 'project',
    });
  };

  const confirmDeleteEntry = async () => {
    if (!confirmDialog.entryId || !confirmDialog.entryType) return;

    try {
      if (confirmDialog.entryType === 'project') {
        await deleteTimesheet(confirmDialog.entryId);
        toast.success('Timesheet entry deleted!');
      } else if (confirmDialog.entryType === 'research') {
        await useResearchStore.getState().deleteTimesheetEntry(confirmDialog.entryId);
        toast.success('Research timesheet entry deleted!');
      }
      setConfirmDialog({ isOpen: false });
    } catch (error) {
      toast.error('Failed to delete timesheet entry');
      logger.error('Delete error:', error);
    }
  };

  const _handleDeleteResearchEntry = async (entryId: string) => {
    setConfirmDialog({
      isOpen: true,
      entryId: entryId,
      entryType: 'research',
    });
  };

  const handleExport = () => {
    toast.success('Export to Excel - Coming Soon');
  };

  const handleImport = () => {
    toast.success('Import from Excel - Coming Soon');
  };

  // Format time from date string
  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  return (
    <div className="min-h-full bg-gray-50">
      <div className="p-4 md:p-6 space-y-6">
        {/* Header Container */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Timesheets</h1>
              <p className="text-sm text-gray-600 mt-1">
                Track work hours and activities across projects
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleImport}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Upload className="w-4 h-4" />
                <span className="hidden sm:inline">Import</span>
              </button>
              <button
                onClick={handleExport}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">Export</span>
              </button>
              <button
                onClick={handleAddEntry}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Entry
              </button>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          <div className="flex gap-4 border-b border-gray-200 dark:border-gray-700 px-6 pt-4">
            <button
              onClick={() => setActiveTab('projects')}
              className={`pb-3 px-4 font-semibold transition-all flex items-center gap-2 ${
                activeTab === 'projects'
                  ? 'border-b-2 border-primary-600 text-primary-600 dark:border-primary-400 dark:text-primary-400'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              <Briefcase className="w-4 h-4" />
              Projects
            </button>
            <button
              onClick={() => setActiveTab('research')}
              className={`pb-3 px-4 font-semibold transition-all flex items-center gap-2 ${
                activeTab === 'research'
                  ? 'border-b-2 border-purple-600 text-purple-600 dark:border-purple-400 dark:text-purple-400'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              <FlaskConical className="w-4 h-4" />
              Research
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex flex-wrap items-center gap-4">
            {/* Engineer Filter */}
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <User className="w-4 h-4" />
                Engineer:
              </label>
              <select
                value={selectedEngineer}
                onChange={(e) => setSelectedEngineer(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent min-w-[200px]"
              >
                <option value="">All Engineers</option>
                {(Array.isArray(teamMembers) ? teamMembers : []).map((member) => (
                  <option key={member.userId || member.id} value={member.userId || member.id}>
                    {member.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Start Date Filter */}
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                From:
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            {/* End Date Filter */}
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">
                To:
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            {/* Month Filter (for local filtering) */}
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Month:
              </label>
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            {/* Clear Filters Button */}
            {(selectedEngineer || startDate || endDate) && (
              <button
                onClick={() => {
                  setSelectedEngineer('');
                  setStartDate('');
                  setEndDate('');
                }}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>

      {/* Stats - Separate for Projects and Research */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm font-medium text-gray-600">
            {activeTab === 'projects' ? 'Project' : 'Research'} Entries
          </div>
          <div className="text-3xl font-bold text-gray-900 mt-2">{displayedEntries.length}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm font-medium text-gray-600">
            {activeTab === 'projects' ? 'Project' : 'Research'} Hours
          </div>
          <div className={`text-3xl font-bold mt-2 ${activeTab === 'projects' ? 'text-primary-600' : 'text-purple-600'}`}>
            {displayedTotalHours.toFixed(1)}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm font-medium text-gray-600">Avg Hours/Entry</div>
          <div className="text-3xl font-bold text-gray-900 mt-2">
            {displayedAvgHours.toFixed(1)}
          </div>
        </div>
      </div>

      {/* Timesheets Table - Excel Style */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">
            {activeTab === 'projects' ? 'Project ' : 'Research '}Timesheet Entries ({displayedEntries.length})
          </h2>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Clock className="w-4 h-4" />
            <span>Total: {displayedTotalHours.toFixed(1)} hours</span>
          </div>
        </div>

        {activeTab === 'projects' ? (
          <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">Date</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">Start time</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">End time</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">Email</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">Name</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">Project Code</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">Project Name</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">Work Category</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700">Time spent</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredTimesheets
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                .map((entry) => {
                  const project = projects.find((p) => p.id === entry.projectId);

                  // Calculate end time (start + hours)
                  const startDate = new Date(entry.date);
                  const endDate = new Date(startDate.getTime() + entry.hours * 60 * 60 * 1000);

                  // Format date for display
                  const formattedDate = new Date(entry.date).toLocaleDateString('en-GB', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric'
                  });

                  return (
                    <tr key={entry.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{formattedDate}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{formatTime(entry.date)}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{formatTime(endDate.toISOString())}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{(entry as any).engineerEmail || 'N/A'}</td>
                      <td className="px-4 py-3 text-sm text-gray-900 font-medium">{entry.engineerName || 'Unassigned'}</td>
                      <td className="px-4 py-3 text-sm font-medium text-primary-600">{(entry as any).projectCode || 'N/A'}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">{project?.title || 'N/A'}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{getWorkCategoryLabel(entry.workCategory)}</td>
                      <td className="px-4 py-3 text-sm text-right text-primary-600 font-medium">
                        <span className="inline-flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {entry.hours} hrs
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-right">
                        <div className="flex gap-2 justify-end">
                          <button
                            onClick={() => handleEditEntry(entry)}
                            className="p-2 hover:bg-blue-100 text-blue-600 rounded transition-colors"
                            title="Edit entry"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteEntry(entry.id)}
                            className="p-2 hover:bg-red-100 text-red-600 rounded transition-colors"
                            title="Delete entry"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
            {/* Total Row */}
            <tfoot className="bg-gray-50 border-t-2 border-gray-300">
              <tr>
                <td colSpan={8} className="px-4 py-3 text-right font-bold text-gray-900">
                  Total Hours:
                </td>
                <td className="px-4 py-3 text-right">
                  <span className="inline-flex items-center gap-1 font-bold text-primary-700">
                    <Clock className="w-4 h-4" />
                    {projectTotalHours.toFixed(1)} hrs
                  </span>
                </td>
                <td className="px-4 py-3"></td>
              </tr>
            </tfoot>
          </table>
        </div>
        ) : (
          /* Research Tab Content */
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">Researcher</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">Research Project</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">Category</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">Description</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700">Hours</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700">Status</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredResearchTimesheets.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-12 text-center">
                      <FlaskConical className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No research timesheet entries</h3>
                      <p className="text-gray-600">
                        No research timesheet entries found for the selected period.
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredResearchTimesheets
                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                    .map((entry: any) => {
                      const formattedDate = new Date(entry.date).toLocaleDateString('en-GB', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric'
                      });
                      const hours = entry.hoursLogged || entry.hours || 0;

                      return (
                        <tr key={entry.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">{formattedDate}</td>
                          <td className="px-4 py-3 text-sm text-gray-900">{entry.teamMemberName || entry.researcherName || 'Unknown'}</td>
                          <td className="px-4 py-3 text-sm font-medium text-primary-600">{entry.projectTitle || entry.researchProjectTitle || 'N/A'}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{entry.researchCategory || '-'}</td>
                          <td className="px-4 py-3 text-sm text-gray-600 max-w-xs truncate">{entry.description || '-'}</td>
                          <td className="px-4 py-3 text-sm text-right text-primary-600 font-medium">
                            <span className="inline-flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {hours} hrs
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-center">
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium capitalize ${
                              entry.status === 'completed'
                                ? 'bg-green-100 text-green-800'
                                : entry.status === 'in-progress'
                                ? 'bg-blue-100 text-blue-800'
                                : entry.status === 'planning'
                                ? 'bg-yellow-100 text-yellow-800'
                                : entry.status === 'on-hold'
                                ? 'bg-orange-100 text-orange-800'
                                : entry.status === 'archived'
                                ? 'bg-gray-100 text-gray-800'
                                : 'bg-gray-100 text-gray-600'
                            }`}>
                              {entry.status?.replace('-', ' ') || 'N/A'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-right">
                            <div className="flex gap-2 justify-end">
                              <button
                                onClick={() => _handleDeleteResearchEntry(entry.id)}
                                className="p-2 hover:bg-red-100 text-red-600 rounded transition-colors"
                                title="Delete entry"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                )}
              </tbody>
              {/* Total Row */}
              {filteredResearchTimesheets.length > 0 && (
                <tfoot className="bg-gray-50 border-t-2 border-gray-300">
                  <tr>
                    <td colSpan={5} className="px-4 py-3 text-right font-bold text-gray-900">
                      Total Hours:
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="inline-flex items-center gap-1 font-bold text-primary-700">
                        <Clock className="w-4 h-4" />
                        {researchTotalHours.toFixed(1)} hrs
                      </span>
                    </td>
                    <td colSpan={2} className="px-4 py-3"></td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        )}

        {/* Empty State for Projects Tab */}
        {activeTab === 'projects' && filteredTimesheets.length === 0 && (
          <div className="p-12 text-center">
            <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No timesheet entries</h3>
            <p className="text-gray-600 mb-4">
              Start tracking your time by adding your first entry
            </p>
            <button
              onClick={handleAddEntry}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Entry
            </button>
          </div>
        )}
      </div>

      {/* Add Timesheet Modal */}
      <AddTimesheetModal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          applyFilters(); // Refresh with current filters
        }}
      />

      {/* Edit Timesheet Modal */}
      <EditTimesheetModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setEditingTimesheet(null);
        }}
        timesheet={editingTimesheet}
        onUpdate={handleUpdateEntry}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog({ isOpen: false })}
        onConfirm={confirmDeleteEntry}
        title="Delete Timesheet Entry"
        message={confirmDialog.entryType === 'research' ? 'Are you sure you want to delete this research timesheet entry? This cannot be undone.' : 'Are you sure you want to delete this timesheet entry? This cannot be undone.'}
        variant="danger"
        confirmText="Delete"
        cancelText="Cancel"
      />
      </div>
    </div>
  );
};
