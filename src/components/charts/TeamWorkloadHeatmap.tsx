import React, { useState, useMemo } from 'react';
import { EngineerAssignment, AnalyticsFilter } from '../../types/analytics.types';
import { useEngineerAssignments } from '../../hooks/useChartData';
import { Users, ChevronDown, ChevronRight, Calendar, Briefcase } from 'lucide-react';

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
    <div className="space-y-4">
      {/* Header Info and Toggles */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Users className="w-4 h-4" />
          <span>
            {engineerGroups.length} engineer{engineerGroups.length !== 1 ? 's' : ''} with{' '}
            {filteredAssignments.length} project assignment{filteredAssignments.length !== 1 ? 's' : ''}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-600">Lead engineers only</span>
          <button
            onClick={() => setShowLeadEngineersOnly(!showLeadEngineersOnly)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              showLeadEngineersOnly ? 'bg-purple-600' : 'bg-gray-300'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                showLeadEngineersOnly ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Assignment Table */}
      <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-gray-700 w-32">Engineer</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700 w-24">Project</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700 flex-1">Project Title</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700 w-24">Role</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700 w-24">Status</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700 w-40">Dates</th>
              </tr>
            </thead>
            <tbody>
              {engineerGroups.map((group, groupIndex) => {
                const isExpanded = expandedEngineers.has(group.id);
                const projectCount = group.assignments.length;

                return (
                  <React.Fragment key={group.id}>
                    {/* Engineer Header Row */}
                    <tr className="border-b border-gray-200 bg-gray-50 hover:bg-gray-100 transition-colors">
                      <td colSpan={6} className="px-4 py-3">
                        <button
                          onClick={() => toggleEngineerExpand(group.id)}
                          className="flex items-center gap-3 w-full text-left font-semibold text-gray-900 hover:text-gray-700"
                        >
                          {isExpanded ? (
                            <ChevronDown className="w-4 h-4 text-gray-600" />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-gray-600" />
                          )}
                          <span className="flex-1">{group.name}</span>
                          <span className="inline-flex items-center gap-2 text-xs font-normal">
                            <Briefcase className="w-3 h-3" />
                            {projectCount} project{projectCount !== 1 ? 's' : ''}
                          </span>
                        </button>
                      </td>
                    </tr>

                    {/* Project Rows */}
                    {isExpanded &&
                      group.assignments.map((assignment, assignmentIndex) => (
                        <tr
                          key={`${group.id}-${assignmentIndex}`}
                          className="border-b border-gray-100 hover:bg-blue-50 transition-colors"
                        >
                          <td className="px-4 py-3 text-gray-500 text-xs">
                            {assignmentIndex === 0 ? group.name : ''}
                          </td>
                          <td className="px-4 py-3">
                            <span className="font-mono text-xs font-semibold text-gray-700">
                              {assignment.projectCode}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-gray-700 truncate">{assignment.projectTitle}</span>
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-block px-2 py-1 rounded text-xs font-medium ${getRoleBadgeColor(
                                assignment.role,
                              )}`}
                            >
                              {getRoleLabel(assignment.role)}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-block px-2 py-1 rounded text-xs font-medium ${getStatusBadgeColor(
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
                          <td className="px-4 py-3 text-xs text-gray-600">
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

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-blue-50 rounded-lg border border-blue-200 p-4">
          <p className="text-xs font-semibold text-blue-900 mb-1">Total Engineers</p>
          <p className="text-2xl font-bold text-blue-600">{engineerGroups.length}</p>
        </div>
        <div className="bg-green-50 rounded-lg border border-green-200 p-4">
          <p className="text-xs font-semibold text-green-900 mb-1">Total Assignments</p>
          <p className="text-2xl font-bold text-green-600">{filteredAssignments.length}</p>
        </div>
        <div className="bg-purple-50 rounded-lg border border-purple-200 p-4">
          <p className="text-xs font-semibold text-purple-900 mb-1">Avg Projects/Engineer</p>
          <p className="text-2xl font-bold text-purple-600">
            {engineerGroups.length > 0 ? (filteredAssignments.length / engineerGroups.length).toFixed(1) : '0'}
          </p>
        </div>
      </div>

      {/* Info Text */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-2">Engineer-Project Assignments</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Click on engineer name to expand/collapse their project assignments</li>
          <li>• Role indicates the engineer's position on the project (Lead, Manager, or Team Member)</li>
          <li>• Status shows the current project phase</li>
          <li>• Dates display project start and completion timeline</li>
        </ul>
      </div>
    </div>
  );
};
