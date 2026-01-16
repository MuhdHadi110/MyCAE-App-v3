import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { Plus, Calendar, Clock, Download, Edit2, Trash2, Briefcase, FlaskConical, User, FileSpreadsheet, FileText, ChevronDown, Filter, X, ChevronUp, ChevronsUpDown } from 'lucide-react';
import * as XLSX from 'xlsx';
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
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [projectSortColumn, setProjectSortColumn] = useState<string>('date');
  const [projectSortDirection, setProjectSortDirection] = useState<'asc' | 'desc'>('desc');
  const [researchSortColumn, setResearchSortColumn] = useState<string>('date');
  const [researchSortDirection, setResearchSortDirection] = useState<'asc' | 'desc'>('desc');
  const exportMenuRef = useRef<HTMLDivElement>(null);

  // Count active filters
  const activeFilterCount = [selectedEngineer, startDate, endDate, selectedMonth].filter(Boolean).length;

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

  // Close export menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
        setShowExportMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter project timesheets by month
  const filteredTimesheets = useMemo(() => {
    return (Array.isArray(timesheets) ? timesheets : []).filter((ts) => {
      if (!selectedMonth) return true;
      const tsDate = new Date(ts.date);
      const tsMonth = `${tsDate.getFullYear()}-${String(tsDate.getMonth() + 1).padStart(2, '0')}`;
      return tsMonth === selectedMonth;
    }).sort((a, b) => {
      const getSortValue = (entry: Timesheet) => {
        switch (projectSortColumn) {
          case 'date':
            return new Date(entry.date).getTime();
          case 'engineer':
            return (entry.engineerName || '').toLowerCase();
          case 'projectCode':
            return ((entry as any).projectCode || '').toLowerCase();
          case 'projectName':
            const project = projects.find(p => p.id === entry.projectId);
            return (project?.title || (entry as any).projectTitle || '').toLowerCase();
          case 'category':
            return getWorkCategoryLabel(entry.workCategory).toLowerCase();
          case 'hours':
            return entry.hours || 0;
          default:
            return new Date(entry.date).getTime();
        }
      };

      const aValue = getSortValue(a);
      const bValue = getSortValue(b);

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return projectSortDirection === 'asc'
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      } else {
        return projectSortDirection === 'asc'
          ? aValue - bValue
          : bValue - aValue;
      }
    });
  }, [timesheets, selectedMonth, projects, projectSortColumn, projectSortDirection]);

  // Filter research timesheets by month
  const filteredResearchTimesheets = useMemo(() => {
    return (Array.isArray(researchTimesheets) ? researchTimesheets : []).filter((ts) => {
      if (!selectedMonth) return true;
      const tsDate = new Date(ts.date);
      const tsMonth = `${tsDate.getFullYear()}-${String(tsDate.getMonth() + 1).padStart(2, '0')}`;
      return tsMonth === selectedMonth;
    }).sort((a, b) => {
      const getSortValue = (entry: any) => {
        switch (researchSortColumn) {
          case 'date':
            return new Date(entry.date).getTime();
          case 'researcher':
            return (entry.teamMemberName || entry.researcherName || '').toLowerCase();
          case 'project':
            return (entry.projectTitle || entry.researchProjectTitle || '').toLowerCase();
          case 'category':
            return (entry.researchCategory || '').toLowerCase();
          case 'hours':
            return entry.hoursLogged || entry.hours || 0;
          case 'status':
            const statusOrder = { 'completed': 0, 'in-progress': 1, 'planning': 2, 'on-hold': 3, 'archived': 4 };
            return statusOrder[entry.status] ?? 5;
          default:
            return new Date(entry.date).getTime();
        }
      };

      const aValue = getSortValue(a);
      const bValue = getSortValue(b);

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return researchSortDirection === 'asc'
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      } else {
        return researchSortDirection === 'asc'
          ? aValue - bValue
          : bValue - aValue;
      }
    });
  }, [researchTimesheets, selectedMonth, researchSortColumn, researchSortDirection]);

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
        return 'Project Management';
      case 'measurement-site':
        return 'Measurement (Site)';
      case 'measurement-office':
        return 'Measurement (Office)';
      default:
        return category;
    }
  };

  // Sort handlers for projects tab
  const handleProjectSort = useCallback((column: string) => {
    if (projectSortColumn === column) {
      setProjectSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setProjectSortColumn(column);
      setProjectSortDirection('asc');
    }
  }, [projectSortColumn]);

  const getProjectSortIcon = (column: string) => {
    if (projectSortColumn !== column) {
      return <ChevronsUpDown className="w-4 h-4 ml-1 inline-block" />;
    }
    return projectSortDirection === 'asc'
      ? <ChevronUp className="w-4 h-4 ml-1 inline-block" />
      : <ChevronDown className="w-4 h-4 ml-1 inline-block" />;
  };

  // Sort handlers for research tab
  const handleResearchSort = useCallback((column: string) => {
    if (researchSortColumn === column) {
      setResearchSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setResearchSortColumn(column);
      setResearchSortDirection('asc');
    }
  }, [researchSortColumn]);

  const getResearchSortIcon = (column: string) => {
    if (researchSortColumn !== column) {
      return <ChevronsUpDown className="w-4 h-4 ml-1 inline-block" />;
    }
    return researchSortDirection === 'asc'
      ? <ChevronUp className="w-4 h-4 ml-1 inline-block" />
      : <ChevronDown className="w-4 h-4 ml-1 inline-block" />;
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

  // Generate filename based on active filters
  const getExportFilename = (extension: string) => {
    let suffix = 'all';
    if (selectedMonth) {
      suffix = selectedMonth;
    } else if (startDate && endDate) {
      suffix = `${startDate}-to-${endDate}`;
    } else if (startDate) {
      suffix = `from-${startDate}`;
    } else if (endDate) {
      suffix = `until-${endDate}`;
    }
    const type = activeTab === 'projects' ? 'project' : 'research';
    return `timesheets-${type}-${suffix}.${extension}`;
  };

  // Prepare export data from filtered timesheets
  const prepareExportData = () => {
    if (activeTab === 'projects') {
      return filteredTimesheets.map((entry) => {
        const project = projects.find((p) => p.id === entry.projectId);
        const formattedDate = new Date(entry.date).toLocaleDateString('en-GB', {
          day: '2-digit',
          month: 'short',
          year: 'numeric'
        });
        return {
          'Date': formattedDate,
          'Engineer Name': entry.engineerName || 'Unassigned',
          'Project Code': (entry as any).projectCode || 'N/A',
          'Project Name': project?.title || (entry as any).projectTitle || 'N/A',
          'Type': 'Project',
          'Work Category': getWorkCategoryLabel(entry.workCategory),
          'Hours': entry.hours,
          'Description': entry.description || ''
        };
      });
    } else {
      return filteredResearchTimesheets.map((entry: any) => {
        const formattedDate = new Date(entry.date).toLocaleDateString('en-GB', {
          day: '2-digit',
          month: 'short',
          year: 'numeric'
        });
        const hours = entry.hoursLogged || entry.hours || 0;
        return {
          'Date': formattedDate,
          'Researcher': entry.teamMemberName || entry.researcherName || 'Unknown',
          'Research Project': entry.projectTitle || entry.researchProjectTitle || 'N/A',
          'Type': 'Research',
          'Category': entry.researchCategory || '-',
          'Hours': hours,
          'Status': entry.status?.replace('-', ' ') || 'N/A',
          'Description': entry.description || ''
        };
      });
    }
  };

  // Export to Excel
  const handleExportExcel = () => {
    const data = prepareExportData();
    if (data.length === 0) {
      toast.error('No data to export');
      setShowExportMenu(false);
      return;
    }

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Timesheets');

    // Auto-size columns
    const colWidths = Object.keys(data[0]).map(key => ({
      wch: Math.max(key.length, ...data.map(row => String((row as any)[key] || '').length))
    }));
    worksheet['!cols'] = colWidths;

    XLSX.writeFile(workbook, getExportFilename('xlsx'));
    toast.success(`Exported ${data.length} entries to Excel`);
    setShowExportMenu(false);
  };

  // Export to CSV
  const handleExportCSV = () => {
    const data = prepareExportData();
    if (data.length === 0) {
      toast.error('No data to export');
      setShowExportMenu(false);
      return;
    }

    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row =>
        headers.map(header => {
          const value = (row as any)[header];
          // Escape quotes and wrap in quotes if contains comma or newline
          const stringValue = String(value || '');
          if (stringValue.includes(',') || stringValue.includes('\n') || stringValue.includes('"')) {
            return `"${stringValue.replace(/"/g, '""')}"`;
          }
          return stringValue;
        }).join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = getExportFilename('csv');
    link.click();
    URL.revokeObjectURL(link.href);

    toast.success(`Exported ${data.length} entries to CSV`);
    setShowExportMenu(false);
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
      <div className="p-4 md:p-6 space-y-4">
        {/* Header Container - Standardized */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Timesheets</h1>
              <p className="text-gray-600 mt-1">Track and manage time entries for projects and research</p>
            </div>
            <div className="flex gap-2">
              {/* Filters Toggle */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`inline-flex items-center justify-center gap-2 px-3 py-2 border rounded-lg transition-colors ${
                  showFilters || activeFilterCount > 0
                    ? 'bg-primary-50 border-primary-300 text-primary-700'
                    : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Filter className="w-4 h-4" />
                <span className="hidden sm:inline">Filters</span>
                {activeFilterCount > 0 && (
                  <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-medium bg-primary-600 text-white rounded-full">
                    {activeFilterCount}
                  </span>
                )}
              </button>
              {/* Export Dropdown */}
              <div className="relative" ref={exportMenuRef}>
                <button
                  onClick={() => setShowExportMenu(!showExportMenu)}
                  className="inline-flex items-center justify-center gap-2 px-3 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  <span className="hidden sm:inline">Export</span>
                  <ChevronDown className={`w-4 h-4 transition-transform ${showExportMenu ? 'rotate-180' : ''}`} />
                </button>
                {showExportMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                    <button
                      onClick={handleExportExcel}
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                    >
                      <FileSpreadsheet className="w-4 h-4 text-green-600" />
                      Export to Excel
                    </button>
                    <button
                      onClick={handleExportCSV}
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                    >
                      <FileText className="w-4 h-4 text-blue-600" />
                      Export to CSV
                    </button>
                  </div>
                )}
              </div>
              <button
                onClick={handleAddEntry}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Add Entry</span>
              </button>
            </div>
          </div>
        </div>

        {/* Tab Navigation + Inline Stats */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex gap-4">
            <button
              onClick={() => setActiveTab('projects')}
              className={`pb-2 font-medium transition-all flex items-center gap-2 ${
                activeTab === 'projects'
                  ? 'border-b-2 border-primary-600 text-primary-600'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              <Briefcase className="w-4 h-4" />
              Projects
            </button>
            <button
              onClick={() => setActiveTab('research')}
              className={`pb-2 font-medium transition-all flex items-center gap-2 ${
                activeTab === 'research'
                  ? 'border-b-2 border-purple-600 text-purple-600'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              <FlaskConical className="w-4 h-4" />
              Research
            </button>
          </div>
          {/* Inline Stats */}
          <div className="flex items-center gap-4 text-sm">
            <span className="text-gray-600">
              <span className="font-semibold text-gray-900">{displayedEntries.length}</span> entries
            </span>
            <span className="text-gray-300">•</span>
            <span className={activeTab === 'projects' ? 'text-primary-600' : 'text-purple-600'}>
              <span className="font-semibold">{displayedTotalHours.toFixed(1)}</span> hrs
            </span>
          </div>
          </div>

          {/* Collapsible Filters */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex flex-wrap items-center gap-3">
              {/* Engineer Filter */}
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-600">Engineer:</label>
                <select
                  value={selectedEngineer}
                  onChange={(e) => setSelectedEngineer(e.target.value)}
                  className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="">All</option>
                  {(Array.isArray(teamMembers) ? teamMembers : []).map((member) => (
                    <option key={member.userId || member.id} value={member.userId || member.id}>
                      {member.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Date Range */}
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-600">From:</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-600">To:</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              {/* Month Filter */}
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-600">Month:</label>
                <input
                  type="month"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              {/* Clear Filters */}
              {activeFilterCount > 0 && (
                <button
                  onClick={() => {
                    setSelectedEngineer('');
                    setStartDate('');
                    setEndDate('');
                    setSelectedMonth('');
                  }}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-3 h-3" />
                  Clear all
                </button>
              )}
            </div>
            </div>
          )}
        </div>

        {/* Timesheets Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {activeTab === 'projects' ? (
          <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th onClick={() => handleProjectSort('date')} className="px-3 py-2 text-left text-xs font-semibold text-gray-700 cursor-pointer hover:bg-gray-100 transition-colors">Date {getProjectSortIcon('date')}</th>
                <th onClick={() => handleProjectSort('engineer')} className="px-3 py-2 text-left text-xs font-semibold text-gray-700 cursor-pointer hover:bg-gray-100 transition-colors">Name {getProjectSortIcon('engineer')}</th>
                <th onClick={() => handleProjectSort('projectCode')} className="px-3 py-2 text-left text-xs font-semibold text-gray-700 cursor-pointer hover:bg-gray-100 transition-colors">Project Code {getProjectSortIcon('projectCode')}</th>
                <th onClick={() => handleProjectSort('projectName')} className="px-3 py-2 text-left text-xs font-semibold text-gray-700 cursor-pointer hover:bg-gray-100 transition-colors">Project Name {getProjectSortIcon('projectName')}</th>
                <th onClick={() => handleProjectSort('category')} className="px-3 py-2 text-left text-xs font-semibold text-gray-700 cursor-pointer hover:bg-gray-100 transition-colors">Work Category {getProjectSortIcon('category')}</th>
                <th onClick={() => handleProjectSort('hours')} className="px-3 py-2 text-right text-xs font-semibold text-gray-700 cursor-pointer hover:bg-gray-100 transition-colors">Hours {getProjectSortIcon('hours')}</th>
                <th className="px-3 py-2 text-right text-xs font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {filteredTimesheets.map((entry) => {
                  const project = projects.find((p) => p.id === entry.projectId);

                  // Format date for display
                  const formattedDate = new Date(entry.date).toLocaleDateString('en-GB', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric'
                  });

                  return (
                    <tr key={entry.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-3 py-2 text-sm text-gray-900">{formattedDate}</td>
                      <td className="px-3 py-2 text-sm font-medium text-gray-900">{entry.engineerName || 'Unassigned'}</td>
                      <td className="px-3 py-2 text-sm font-medium text-primary-600">{(entry as any).projectCode || 'N/A'}</td>
                      <td className="px-3 py-2 text-sm text-gray-700">{project?.title || 'N/A'}</td>
                      <td className="px-3 py-2 text-sm text-gray-600">{getWorkCategoryLabel(entry.workCategory)}</td>
                      <td className="px-3 py-2 text-sm text-right font-medium text-primary-600">{entry.hours} hrs</td>
                      <td className="px-3 py-2 text-sm text-right">
                        <div className="flex gap-1 justify-end">
                          <button
                            onClick={() => handleEditEntry(entry)}
                            className="p-1.5 hover:bg-blue-100 text-blue-600 rounded transition-colors"
                            title="Edit entry"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteEntry(entry.id)}
                            className="p-1.5 hover:bg-red-100 text-red-600 rounded transition-colors"
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
            <tfoot className="bg-gray-50 border-t border-gray-200">
              <tr>
                <td colSpan={5} className="px-3 py-2 text-right text-sm font-medium text-gray-700">
                  Total:
                </td>
                <td className="px-3 py-2 text-right text-sm font-bold text-primary-700">
                  {projectTotalHours.toFixed(1)} hrs
                </td>
                <td className="px-3 py-2"></td>
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
                  <th onClick={() => handleResearchSort('date')} className="px-3 py-2 text-left text-xs font-semibold text-gray-700 cursor-pointer hover:bg-gray-100 transition-colors">Date {getResearchSortIcon('date')}</th>
                  <th onClick={() => handleResearchSort('researcher')} className="px-3 py-2 text-left text-xs font-semibold text-gray-700 cursor-pointer hover:bg-gray-100 transition-colors">Researcher {getResearchSortIcon('researcher')}</th>
                  <th onClick={() => handleResearchSort('project')} className="px-3 py-2 text-left text-xs font-semibold text-gray-700 cursor-pointer hover:bg-gray-100 transition-colors">Research Project {getResearchSortIcon('project')}</th>
                  <th onClick={() => handleResearchSort('category')} className="px-3 py-2 text-left text-xs font-semibold text-gray-700 cursor-pointer hover:bg-gray-100 transition-colors">Category {getResearchSortIcon('category')}</th>
                  <th onClick={() => handleResearchSort('hours')} className="px-3 py-2 text-right text-xs font-semibold text-gray-700 cursor-pointer hover:bg-gray-100 transition-colors">Hours {getResearchSortIcon('hours')}</th>
                  <th onClick={() => handleResearchSort('status')} className="px-3 py-2 text-center text-xs font-semibold text-gray-700 cursor-pointer hover:bg-gray-100 transition-colors">Status {getResearchSortIcon('status')}</th>
                  <th className="px-3 py-2 text-right text-xs font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {filteredResearchTimesheets.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-3 py-12 text-center">
                      <FlaskConical className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No research timesheet entries</h3>
                      <p className="text-gray-600">
                        No research timesheet entries found for the selected period.
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredResearchTimesheets
                    .map((entry: any) => {
                      const formattedDate = new Date(entry.date).toLocaleDateString('en-GB', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric'
                      });
                      const hours = entry.hoursLogged || entry.hours || 0;

                      return (
                        <tr key={entry.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-3 py-2 text-sm text-gray-900">{formattedDate}</td>
                          <td className="px-3 py-2 text-sm font-medium text-gray-900">{entry.teamMemberName || entry.researcherName || 'Unknown'}</td>
                          <td className="px-3 py-2 text-sm font-medium text-purple-600">{entry.projectTitle || entry.researchProjectTitle || 'N/A'}</td>
                          <td className="px-3 py-2 text-sm text-gray-600">{entry.researchCategory || '-'}</td>
                          <td className="px-3 py-2 text-sm text-right font-medium text-purple-600">{hours} hrs</td>
                          <td className="px-3 py-2 text-sm text-center">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize ${
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
                          <td className="px-3 py-2 text-sm text-right">
                            <div className="flex gap-1 justify-end">
                              <button
                                onClick={() => _handleDeleteResearchEntry(entry.id)}
                                className="p-1.5 hover:bg-red-100 text-red-600 rounded transition-colors"
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
                <tfoot className="bg-gray-50 border-t border-gray-200">
                  <tr>
                    <td colSpan={4} className="px-3 py-2 text-right text-sm font-medium text-gray-700">
                      Total:
                    </td>
                    <td className="px-3 py-2 text-right text-sm font-bold text-purple-700">
                      {researchTotalHours.toFixed(1)} hrs
                    </td>
                    <td colSpan={2} className="px-3 py-2"></td>
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
