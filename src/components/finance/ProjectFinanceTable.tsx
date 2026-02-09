import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Search, Filter } from 'lucide-react';
import type { ProjectFinanceSummary } from '../../types/financeOverview.types';
import { formatFinanceAmount } from '../../hooks/useFinanceData';
import { EngineerBreakdownRow } from './EngineerBreakdownRow';

interface ProjectFinanceTableProps {
  projects: ProjectFinanceSummary[];
  showOriginalCurrency: boolean;
  loading?: boolean;
  selectedYear?: number;
  selectedMonth?: number;
}

// Only 3 valid project statuses
type ValidStatus = 'pre-lim' | 'ongoing' | 'completed';

const statusColors: Record<string, string> = {
  'pre-lim': 'bg-amber-100 text-amber-700',
  'ongoing': 'bg-blue-100 text-blue-700',
  'completed': 'bg-emerald-100 text-emerald-700',
};

const statusLabels: Record<string, string> = {
  'pre-lim': 'Pre-lim',
  'ongoing': 'Ongoing',
  'completed': 'Completed',
};

export const ProjectFinanceTable: React.FC<ProjectFinanceTableProps> = ({
  projects,
  showOriginalCurrency,
  loading = false,
  selectedYear,
  selectedMonth,
}) => {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | ValidStatus>('all');

  const toggleExpand = (projectId: string) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(projectId)) {
        next.delete(projectId);
      } else {
        next.add(projectId);
      }
      return next;
    });
  };

  // Filter projects
  const filteredProjects = projects.filter((project) => {
    // Status filter
    if (statusFilter !== 'all' && project.status !== statusFilter) {
      return false;
    }

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      return (
        project.projectCode.toLowerCase().includes(query) ||
        project.projectTitle.toLowerCase().includes(query) ||
        project.clientName.toLowerCase().includes(query)
      );
    }

    return true;
  });

  const formatCurrency = (amount: number) => {
    return `RM ${amount.toLocaleString('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100">
          <div className="h-6 bg-gray-200 rounded w-48 animate-pulse" />
        </div>
        <div className="p-6 space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-100 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-5 border-b border-gray-100">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h2 className="text-lg font-semibold text-gray-900">Project Breakdown</h2>

          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search projects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent w-full sm:w-64"
              />
            </div>

            {/* Status Filter */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as 'all' | ValidStatus)}
                className="pl-9 pr-8 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent appearance-none bg-white cursor-pointer"
              >
                <option value="all">All Status</option>
                <option value="pre-lim">Pre-lim</option>
                <option value="ongoing">Ongoing</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider w-8">
                {/* Expand column */}
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Project
              </th>
              <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                PO Received
              </th>
              <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Invoiced
              </th>
              <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Outstanding
              </th>
              <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Base Cost
              </th>
              <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Vendor POs
              </th>
              <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Vendor Invoices
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredProjects.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                  <div className="flex flex-col items-center">
                    <Search className="w-12 h-12 text-gray-300 mb-3" />
                    <p className="text-sm">No projects found</p>
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery('')}
                        className="mt-2 text-sm text-primary-600 hover:text-primary-700"
                      >
                        Clear search
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              filteredProjects.map((project) => {
                const isExpanded = expandedRows.has(project.projectId);
                const invoicedPercentage =
                  project.poReceived > 0
                    ? Math.round((project.invoiced / project.poReceived) * 100)
                    : 0;

                return (
                  <React.Fragment key={project.projectId}>
                    {/* Main Row */}
                    <tr
                      className={`hover:bg-gray-50 transition-colors cursor-pointer ${
                        isExpanded ? 'bg-gray-50' : ''
                      }`}
                      onClick={() => toggleExpand(project.projectId)}
                    >
                      <td className="px-6 py-4">
                        <button
                          className="p-1 hover:bg-gray-200 rounded transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleExpand(project.projectId);
                          }}
                        >
                          {isExpanded ? (
                            <ChevronDown className="w-4 h-4 text-gray-500" />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-gray-500" />
                          )}
                        </button>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-gray-900">
                              {project.projectCode}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                statusColors[project.status] || 'bg-gray-100 text-gray-700'
                              }`}
                            >
                              {statusLabels[project.status] || project.status}
                            </span>
                          </div>
                          <span className="text-sm text-gray-600 truncate max-w-xs">
                            {project.projectTitle}
                          </span>
                          <span className="text-xs text-gray-500">{project.clientName}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="font-medium text-gray-900">
                          {showOriginalCurrency && project.poReceivedOriginal.length > 0
                            ? formatFinanceAmount(
                                project.poReceived,
                                project.poReceivedOriginal,
                                true
                              )
                            : formatCurrency(project.poReceived)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex flex-col items-end">
                          <span className="font-medium text-gray-900">
                            {showOriginalCurrency && project.invoicedOriginal.length > 0
                              ? formatFinanceAmount(
                                  project.invoiced,
                                  project.invoicedOriginal,
                                  true
                                )
                              : formatCurrency(project.invoiced)}
                          </span>
                          {project.poReceived > 0 && (
                            <span className="text-xs text-gray-500">
                              ({invoicedPercentage}%)
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span
                          className={`font-medium ${
                            project.outstanding > 0 ? 'text-orange-600' : 'text-gray-900'
                          }`}
                        >
                          {formatCurrency(project.outstanding)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex flex-col items-end">
                          <span className="font-medium text-gray-900">
                            {formatCurrency(project.baseCost)}
                          </span>
                          {project.actualHours > 0 && (
                            <span className="text-xs text-gray-500">
                              {project.actualHours.toFixed(1)} hrs
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="font-medium text-gray-900">
                          {showOriginalCurrency && project.vendorPOsOriginal.length > 0
                            ? formatFinanceAmount(
                                project.vendorPOsIssued,
                                project.vendorPOsOriginal,
                                true
                              )
                            : formatCurrency(project.vendorPOsIssued)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="font-medium text-gray-900">
                          {showOriginalCurrency && project.vendorInvoicesOriginal.length > 0
                            ? formatFinanceAmount(
                                project.vendorInvoicesReceived,
                                project.vendorInvoicesOriginal,
                                true
                              )
                            : formatCurrency(project.vendorInvoicesReceived)}
                        </span>
                      </td>
                    </tr>

                    {/* Expanded Row - Engineer Breakdown */}
                    {isExpanded && (
                      <tr>
                        <td colSpan={8} className="px-6 py-0 bg-gray-50">
                          <EngineerBreakdownRow
                            engineers={project.engineerBreakdown}
                          />
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>
            Showing {filteredProjects.length} of {projects.length} projects
          </span>
        </div>
      </div>
    </div>
  );
};

export default ProjectFinanceTable;
