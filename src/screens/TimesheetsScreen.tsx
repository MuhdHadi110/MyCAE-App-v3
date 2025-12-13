import React, { useEffect, useState } from 'react';
import { Plus, Calendar, Clock, Download, Upload, Edit2, Trash2, Briefcase, FlaskConical } from 'lucide-react';
import { useProjectStore } from '../store/projectStore';
import { useTeamStore } from '../store/teamStore';
import { useResearchStore } from '../store/researchStore';
import { AddTimesheetModal } from '../components/modals/AddTimesheetModal';
import { EditTimesheetModal } from '../components/modals/EditTimesheetModal';
import { toast } from 'react-hot-toast';
import type { WorkCategory, Timesheet } from '../types/project.types';

type TabType = 'projects' | 'research';

export const TimesheetsScreen: React.FC = () => {
  const { timesheets, projects, fetchTimesheets, fetchProjects, updateTimesheet, deleteTimesheet } = useProjectStore();
  const { teamMembers, fetchTeamMembers } = useTeamStore();
  const { researchProjects, fetchResearchProjects } = useResearchStore();
  const [activeTab, setActiveTab] = useState<TabType>('projects');
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingTimesheet, setEditingTimesheet] = useState<Timesheet | null>(null);

  useEffect(() => {
    fetchTimesheets();
    fetchProjects();
    fetchTeamMembers();
    fetchResearchProjects();

    // Set current month
    const now = new Date();
    setSelectedMonth(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`);
  }, []);

  const filteredTimesheets = (Array.isArray(timesheets) ? timesheets : []).filter((ts) => {
    if (!selectedMonth) return true;
    const tsDate = new Date(ts.date);
    const tsMonth = `${tsDate.getFullYear()}-${String(tsDate.getMonth() + 1).padStart(2, '0')}`;
    return tsMonth === selectedMonth;
  });

  const totalHours = filteredTimesheets.reduce((sum, ts) => sum + parseFloat(ts.hours as any || 0), 0);

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
      console.error('Update error:', error);
    }
  };

  const handleDeleteEntry = async (timesheetId: string) => {
    if (confirm('Are you sure you want to delete this timesheet entry? This cannot be undone.')) {
      try {
        await deleteTimesheet(timesheetId);
        toast.success('Timesheet entry deleted!');
      } catch (error) {
        toast.error('Failed to delete timesheet entry');
        console.error('Delete error:', error);
      }
    }
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

        {/* Month Filter */}
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center gap-4">
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
        </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm font-medium text-gray-600">Total Entries</div>
          <div className="text-3xl font-bold text-gray-900 mt-2">{filteredTimesheets.length}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm font-medium text-gray-600">Total Hours</div>
          <div className="text-3xl font-bold text-primary-600 mt-2">{totalHours.toFixed(1)}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm font-medium text-gray-600">Avg Hours/Entry</div>
          <div className="text-3xl font-bold text-gray-900 mt-2">
            {filteredTimesheets.length > 0 ? (totalHours / filteredTimesheets.length).toFixed(1) : 0}
          </div>
        </div>
      </div>

      {/* Timesheets Table - Excel Style */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">
            {activeTab === 'projects' ? 'Project ' : 'Research '}Timesheet Entries ({filteredTimesheets.length})
          </h2>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Clock className="w-4 h-4" />
            <span>Total: {totalHours.toFixed(1)} hours</span>
          </div>
        </div>

        {activeTab === 'projects' ? (
          <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
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
                .map((entry, index) => {
                  const project = projects.find((p) => p.id === entry.projectId);

                  // Calculate end time (start + hours)
                  const startDate = new Date(entry.date);
                  const endDate = new Date(startDate.getTime() + entry.hours * 60 * 60 * 1000);

                  return (
                    <tr key={entry.id} className="hover:bg-gray-50 transition-colors">
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
                <td colSpan={7} className="px-4 py-3 text-right font-bold text-gray-900">
                  Total Hours:
                </td>
                <td className="px-4 py-3 text-right">
                  <span className="inline-flex items-center gap-1 font-bold text-primary-700">
                    <Clock className="w-4 h-4" />
                    {totalHours.toFixed(1)} hrs
                  </span>
                </td>
                <td className="px-4 py-3"></td>
              </tr>
            </tfoot>
          </table>
        </div>
        ) : (
          /* Research Tab Content */
          <div className="p-12 text-center">
            <FlaskConical className="w-16 h-16 text-purple-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Research Timesheet Tracking</h3>
            <p className="text-gray-600 mb-4">
              Research timesheet tracking is coming soon. This feature will allow you to log and track hours for research projects.
            </p>
            <p className="text-sm text-gray-500">
              Backend implementation required. See the Timesheet page to log hours through the toggle option (demo mode).
            </p>
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
          fetchTimesheets();
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
      </div>
    </div>
  );
};
