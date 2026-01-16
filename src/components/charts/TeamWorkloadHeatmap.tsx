import React, { useState, useMemo } from 'react';
import { EngineerAssignment, AnalyticsFilter } from '../../types/analytics.types';
import { useEngineerAssignments } from '../../hooks/useChartData';
import { Users, ChevronDown, ChevronRight, Calendar, Briefcase, ClipboardList, TrendingUp } from 'lucide-react';

interface TeamWorkloadHeatmapProps {
  filter?: AnalyticsFilter;
}

type RoleType = 'lead-engineer' | 'manager' | 'engineer' | 'team-member';
type StatusType = 'pre-lim' | 'ongoing' | 'completed' | 'on-hold' | 'closed';

const getRoleBadgeColor = (role: RoleType): string => {
  switch (role) {
    case 'lead-engineer':
      return 'bg-purple-100 text-purple-800';
    case 'manager':
      return 'bg-blue-100 text-blue-800';
    case 'engineer':
      return 'bg-green-100 text-green-800';
    case 'team-member':
      return 'bg-gray-100 text-gray-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const getStatusBadgeColor = (status: StatusType): string => {
  switch (status) {
    case 'pre-lim':
      return 'bg-blue-100 text-blue-800';
    case 'ongoing':
      return 'bg-emerald-100 text-emerald-800';
    case 'completed':
      return 'bg-gray-100 text-gray-800';
    case 'on-hold':
      return 'bg-amber-100 text-amber-800';
    case 'closed':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const getRoleLabel = (role: RoleType): string => {
  switch (role) {
    case 'lead-engineer':
      return 'Lead Engineer';
    case 'manager':
      return 'Manager';
    case 'engineer':
      return 'Engineer';
    case 'team-member':
      return 'Team Member';
    default:
      return role;
  }
};

export const TeamWorkloadHeatmap: React.FC<TeamWorkloadHeatmapProps> = ({ filter = {} }) => {
  const { assignments, loading, error } = useEngineerAssignments(filter);
  const [expandedEngineers, setExpandedEngineers] = useState<Set<string>>(new Set());
  const [showLeadEngineersOnly, setShowLeadEngineersOnly] = useState(false);

  // Filter assignments based on toggles
  const filteredAssignments = useMemo(() => {
    let result = assignments;

    // Always filter to show only ongoing projects
    result = result.filter((assignment) => assignment.status === 'ongoing');

    if (showLeadEngineersOnly) {
      result = result.filter((assignment) => assignment.role === 'lead-engineer');
    }

    return result;
  }, [assignments, showLeadEngineersOnly]);

  // Group assignments by engineer
  const engineerGroups = useMemo(() => {
    const groups: Record<string, { name: string; assignments: EngineerAssignment[] }> = {};

    filteredAssignments.forEach((assignment) => {
      if (!groups[assignment.engineerId]) {
        groups[assignment.engineerId] = {
          name: assignment.engineerName,
          assignments: [],
        };
      }
      groups[assignment.engineerId].assignments.push(assignment);
    });

    // Sort by engineer name
    return Object.entries(groups)
      .map(([id, data]) => ({ id, ...data }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [filteredAssignments]);

  // Count unique lead engineers from ongoing projects
  const leadEngineerCount = useMemo(() => {
    const leadEngineerIds = new Set<string>();

    assignments
      .filter((assignment) =>
        assignment.status === 'ongoing' &&
        assignment.role === 'lead-engineer'
      )
      .forEach((assignment) => {
        leadEngineerIds.add(assignment.engineerId);
      });

    return leadEngineerIds.size;
  }, [assignments]);

  const toggleEngineerExpand = (engineerId: string) => {
    const newExpanded = new Set(expandedEngineers);
    if (newExpanded.has(engineerId)) {
      newExpanded.delete(engineerId);
    } else {
      newExpanded.add(engineerId);
    }
    setExpandedEngineers(newExpanded);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading engineer assignments...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-red-500">Error: {error}</div>
      </div>
    );
  }

  if (assignments.length === 0 || engineerGroups.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">No engineer assignments found</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <div className="text-sm font-medium text-gray-600 mb-1">Total Engineers</div>
          <div className="text-2xl font-bold text-gray-900">{engineerGroups.length}</div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
              <ClipboardList className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <div className="text-sm font-medium text-gray-600 mb-1">Total Assignments</div>
          <div className="text-2xl font-bold text-gray-900">{filteredAssignments.length}</div>
        </div>

        {/* Card 3: Lead Engineers - Clickable to toggle filter */}
        <button
          onClick={() => setShowLeadEngineersOnly(!showLeadEngineersOnly)}
          className={`w-full bg-white rounded-2xl shadow-sm border p-6 transition-all text-left ${
            showLeadEngineersOnly
              ? 'border-purple-500 shadow-md ring-2 ring-purple-100'
              : 'border-gray-100 hover:shadow-md hover:border-purple-200'
          }`}
        >
          <div className="flex items-center justify-between mb-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
              showLeadEngineersOnly
                ? 'bg-purple-600'
                : 'bg-purple-100'
            }`}>
              <TrendingUp className={`w-6 h-6 ${
                showLeadEngineersOnly
                  ? 'text-white'
                  : 'text-purple-600'
              }`} />
            </div>
            {showLeadEngineersOnly && (
              <div className="text-xs font-medium text-purple-600 bg-purple-100 px-2 py-1 rounded-full">
                Active Filter
              </div>
            )}
          </div>
          <div className="text-sm font-medium text-gray-600 mb-1">Lead Engineers</div>
          <div className="text-2xl font-bold text-gray-900">{leadEngineerCount}</div>
          <div className="text-xs text-gray-500 mt-2">
            {showLeadEngineersOnly ? 'Click to show all engineers' : 'Click to filter'}
          </div>
        </button>
      </div>

      {/* Assignment Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider w-32">Engineer</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider w-24">Project</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Project Title</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider w-28">Role</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider w-24">Status</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider w-40">Dates</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {engineerGroups.map((group) => {
                const isExpanded = expandedEngineers.has(group.id);
                const projectCount = group.assignments.length;

                return (
                  <React.Fragment key={group.id}>
                    {/* Engineer Header Row */}
                    <tr className="bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer" onClick={() => toggleEngineerExpand(group.id)}>
                      <td colSpan={6} className="px-6 py-4">
                        <div className="flex items-center gap-3 w-full text-left">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleEngineerExpand(group.id);
                            }}
                            className="p-1 hover:bg-gray-200 rounded transition-colors"
                            aria-label={isExpanded ? 'Collapse projects' : 'Expand projects'}
                          >
                            {isExpanded ? (
                              <ChevronDown className="w-4 h-4 text-gray-500" />
                            ) : (
                              <ChevronRight className="w-4 h-4 text-gray-500" />
                            )}
                          </button>
                          <span className="font-semibold text-gray-900 flex-1">{group.name}</span>
                          <span className="inline-flex items-center gap-2 text-xs text-gray-500 font-normal">
                            <Briefcase className="w-3 h-3" />
                            {projectCount} project{projectCount !== 1 ? 's' : ''}
                          </span>
                        </div>
                      </td>
                    </tr>

                    {/* Project Rows */}
                    {isExpanded &&
                      group.assignments.map((assignment, assignmentIndex) => (
                        <tr
                          key={`${group.id}-${assignmentIndex}`}
                          className="hover:bg-gray-50 transition-colors"
                        >
                          <td className="px-6 py-4 text-gray-500 text-xs">
                            {assignmentIndex === 0 ? group.name : ''}
                          </td>
                          <td className="px-6 py-4">
                            <span className="font-mono text-xs font-semibold text-gray-900">
                              {assignment.projectCode}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-gray-700">{assignment.projectTitle}</span>
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getRoleBadgeColor(
                                assignment.role,
                              )}`}
                            >
                              {getRoleLabel(assignment.role)}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeColor(
                                assignment.status,
                              )}`}
                            >
                              {assignment.status === 'pre-lim'
                                ? 'Pre-lim'
                                : assignment.status === 'on-hold'
                                  ? 'On Hold'
                                  : assignment.status.charAt(0).toUpperCase() + assignment.status.slice(1)}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-xs text-gray-600">
                            {assignment.startDate || assignment.endDate ? (
                              <div className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                <span>
                                  {assignment.startDate} {assignment.endDate ? `to ${assignment.endDate}` : ''}
                                </span>
                              </div>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                        </tr>
                      ))}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
