import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Users, Briefcase, CheckCircle, XCircle, Filter, ChevronDown, ChevronRight } from 'lucide-react';
import { useTeamStore } from '../../store/teamStore';
import { useProjectStore } from '../../store/projectStore';
import projectTeamService from '../../services/projectTeam.service';
import teamService from '../../services/api.service';
import { Avatar } from '../ui/Avatar';
import { Button } from '../ui/Button';
import type { TeamMember } from '../../types/team.types';

interface EngineerWorkload {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: string;
  department: string;
  assignedProjects: {
    projectId: string;
    projectCode: string;
    projectTitle: string;
    role: 'lead_engineer' | 'engineer';
    status: string;
  }[];
  totalAssignments: number;
  isAvailable: boolean;
}

export const TeamWorkloadHeatmap: React.FC = () => {
  const { teamMembers } = useTeamStore();
  const { projects } = useProjectStore();
  const [engineerWorkloads, setEngineerWorkloads] = useState<EngineerWorkload[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'assigned' | 'available'>('all');
  const [expandedEngineers, setExpandedEngineers] = useState<Set<string>>(new Set());

  // Main data loading function
  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Fetch team members directly from service (not through store)
      const teamResponse: any = await teamService.getAllTeamMembers({ status: 'all' });
      const allMembers = Array.isArray(teamResponse) ? teamResponse : (teamResponse?.data || []);
      
      console.log('TeamWorkload: Fetched', allMembers.length, 'team members');
      
      if (allMembers.length === 0) {
        console.log('TeamWorkload: No team members found');
        setEngineerWorkloads([]);
        setLoading(false);
        return;
      }

      // Fetch all team assignments
      let allAssignments: Record<string, any[]> = {};
      try {
        allAssignments = await projectTeamService.getAllTeamAssignments();
        console.log('TeamWorkload: Fetched assignments:', JSON.stringify(allAssignments, null, 2));
        console.log('TeamWorkload: Assignment keys:', Object.keys(allAssignments));
        console.log('TeamWorkload: Fetched assignments for', Object.keys(allAssignments).length, 'members');
        
        // Debug: Check if Hadi's ID is in assignments
        const hadiMember = allMembers.find((m: any) => m.name?.toLowerCase().includes('hadi') || m.email?.toLowerCase().includes('hadi'));
        if (hadiMember) {
          console.log('TeamWorkload: Hadi member ID:', hadiMember.id);
          console.log('TeamWorkload: Hadi assignments:', allAssignments[hadiMember.id]);
        }
      } catch (err) {
        console.error('TeamWorkload: Error fetching assignments:', err);
        // Continue without assignments - we'll just show members with no projects
      }
      
      // Build workload data
      const workloads: EngineerWorkload[] = [];
      
      for (const member of allMembers) {
        try {
          // Handle nested user data structure from backend
          const userData = member.user || {};
          const memberName = userData.name || member.name || 'Unknown';
          const memberEmail = userData.email || member.email || '';
          const memberAvatar = userData.avatar || member.avatar || 'male-01';
          const memberRole = userData.role || member.role || 'engineer';
          
          const memberAssignments = allAssignments[member.id] || [];
          
          const assignedProjects: EngineerWorkload['assignedProjects'] = memberAssignments.map((assignment: any) => ({
            projectId: assignment.projectId,
            projectCode: assignment.projectCode,
            projectTitle: assignment.projectTitle,
            role: assignment.role as 'lead_engineer' | 'engineer',
            status: assignment.status
          }));

          // Only count active (non-completed) projects for availability
          const activeAssignments = assignedProjects.filter(p => p.status !== 'completed');
          
          workloads.push({
            id: member.id,
            name: memberName,
            email: memberEmail,
            avatar: memberAvatar,
            role: memberRole,
            department: member.department || 'Engineering',
            assignedProjects,
            totalAssignments: activeAssignments.length,
            isAvailable: activeAssignments.length === 0
          });
        } catch (error) {
          console.error(`TeamWorkload: Error processing member:`, error);
        }
      }

      console.log('TeamWorkload: Built', workloads.length, 'workload entries');
      setEngineerWorkloads(workloads);
    } catch (error: any) {
      console.error('TeamWorkload: Error loading data:', error);
      setError(error.message || 'Failed to load team workload data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    
    // Safety timeout
    const timeoutId = setTimeout(() => {
      setLoading(current => {
        if (current) {
          console.warn('TeamWorkload: Loading timeout reached');
          return false;
        }
        return current;
      });
    }, 15000);
    
    return () => clearTimeout(timeoutId);
  }, [loadData]);

  // Filter engineers based on selection
  const filteredWorkloads = useMemo(() => {
    switch (filter) {
      case 'assigned':
        return engineerWorkloads.filter(e => e.totalAssignments > 0);
      case 'available':
        return engineerWorkloads.filter(e => e.totalAssignments === 0);
      default:
        return engineerWorkloads;
    }
  }, [engineerWorkloads, filter]);

  // Statistics
  const stats = useMemo(() => {
    const total = engineerWorkloads.length;
    const assigned = engineerWorkloads.filter(e => e.totalAssignments > 0).length;
    const available = engineerWorkloads.filter(e => e.totalAssignments === 0).length;
    const totalAssignments = engineerWorkloads.reduce((sum, e) => sum + e.totalAssignments, 0);
    return { total, assigned, available, totalAssignments };
  }, [engineerWorkloads]);

  const toggleExpand = (engineerId: string) => {
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
      <div className="flex flex-col items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mb-4"></div>
        <p className="text-gray-500">Loading team workload data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-500">
        <XCircle className="w-16 h-16 mb-4 text-red-400" />
        <p className="text-lg font-medium mb-2 text-red-600">Error loading data</p>
        <p className="text-sm text-gray-400 mb-4">{error}</p>
        <Button onClick={loadData} variant="outline" size="sm">
          Retry
        </Button>
      </div>
    );
  }

  if (engineerWorkloads.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-500">
        <Users className="w-16 h-16 mb-4 text-gray-300" />
        <p className="text-lg font-medium mb-2">No team members found</p>
        <p className="text-sm text-gray-400">Add team members to see workload data</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        {/* Total Engineers */}
        <div 
          onClick={() => setFilter('all')}
          className={`bg-white rounded-2xl shadow-sm border p-6 cursor-pointer transition-all ${
            filter === 'all' ? 'border-primary-500 ring-2 ring-primary-100' : 'border-gray-100 hover:shadow-md'
          }`}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            {filter === 'all' && (
              <span className="text-xs font-medium text-primary-600 bg-primary-100 px-2 py-1 rounded-full">
                Showing
              </span>
            )}
          </div>
          <div className="text-sm font-medium text-gray-600 mb-1">Total Engineers</div>
          <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
        </div>

        {/* Assigned Engineers */}
        <div 
          onClick={() => setFilter('assigned')}
          className={`bg-white rounded-2xl shadow-sm border p-6 cursor-pointer transition-all ${
            filter === 'assigned' ? 'border-green-500 ring-2 ring-green-100' : 'border-gray-100 hover:shadow-md'
          }`}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
              <Briefcase className="w-6 h-6 text-green-600" />
            </div>
            {filter === 'assigned' && (
              <span className="text-xs font-medium text-green-600 bg-green-100 px-2 py-1 rounded-full">
                Showing
              </span>
            )}
          </div>
          <div className="text-sm font-medium text-gray-600 mb-1">Assigned</div>
          <div className="text-2xl font-bold text-gray-900">{stats.assigned}</div>
          <div className="text-xs text-gray-500 mt-1">Working on projects</div>
        </div>

        {/* Available Engineers */}
        <div 
          onClick={() => setFilter('available')}
          className={`bg-white rounded-2xl shadow-sm border p-6 cursor-pointer transition-all ${
            filter === 'available' ? 'border-emerald-500 ring-2 ring-emerald-100' : 'border-gray-100 hover:shadow-md'
          }`}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-emerald-600" />
            </div>
            {filter === 'available' && (
              <span className="text-xs font-medium text-emerald-600 bg-emerald-100 px-2 py-1 rounded-full">
                Showing
              </span>
            )}
          </div>
          <div className="text-sm font-medium text-gray-600 mb-1">Available</div>
          <div className="text-2xl font-bold text-emerald-600">{stats.available}</div>
          <div className="text-xs text-gray-500 mt-1">Ready for assignment</div>
        </div>

        {/* Total Assignments */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
              <Briefcase className="w-6 h-6 text-purple-600" />
            </div>
          </div>
          <div className="text-sm font-medium text-gray-600 mb-1">Total Assignments</div>
          <div className="text-2xl font-bold text-gray-900">{stats.totalAssignments}</div>
        </div>
      </div>

      {/* Filter Indicator */}
      <div className="flex items-center gap-2 text-sm text-gray-600">
        <Filter className="w-4 h-4" />
        <span>
          Showing: <span className="font-medium capitalize">{filter === 'all' ? 'All Engineers' : filter === 'assigned' ? 'Assigned Engineers' : 'Available Engineers'}</span>
          {' '}({filteredWorkloads.length} results)
        </span>
      </div>

      {/* Engineers List */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Engineer</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Department</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Projects</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredWorkloads.map((engineer) => {
                const isExpanded = expandedEngineers.has(engineer.id);
                
                return (
                  <React.Fragment key={engineer.id}>
                    <tr className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <Avatar src={engineer.avatar} alt={engineer.name} size="sm" />
                          <div>
                            <p className="font-medium text-gray-900">{engineer.name}</p>
                            <p className="text-xs text-gray-500">{engineer.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700 capitalize">
                        {engineer.department}
                      </td>
                      <td className="px-6 py-4">
                        {engineer.isAvailable ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                            <CheckCircle className="w-3 h-3" />
                            Available
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            <Briefcase className="w-3 h-3" />
                            Assigned
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {engineer.totalAssignments > 0 ? (
                          <button
                            onClick={() => toggleExpand(engineer.id)}
                            className="flex items-center gap-2 text-sm text-primary-600 hover:text-primary-700"
                          >
                            {isExpanded ? (
                              <ChevronDown className="w-4 h-4" />
                            ) : (
                              <ChevronRight className="w-4 h-4" />
                            )}
                            <span className="font-medium">{engineer.totalAssignments} project{engineer.totalAssignments !== 1 ? 's' : ''}</span>
                          </button>
                        ) : (
                          <span className="text-sm text-gray-400">-</span>
                        )}
                      </td>
                    </tr>

                    {/* Expanded Project Details */}
                    {isExpanded && engineer.assignedProjects.filter(p => p.status !== 'completed').length > 0 && (
                      <tr className="bg-gray-50">
                        <td colSpan={4} className="px-6 py-4">
                          <div className="space-y-2">
                            <p className="text-xs font-medium text-gray-600 mb-2">Assigned Projects:</p>
                            {engineer.assignedProjects
                              .filter(p => p.status !== 'completed')
                              .map((project) => (
                              <div key={project.projectId} className="flex items-center gap-3 p-2 bg-white rounded-lg border border-gray-200">
                                <span className="font-mono text-xs font-semibold text-gray-900">{project.projectCode}</span>
                                <span className="text-sm text-gray-700 flex-1">{project.projectTitle}</span>
                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                                  project.role === 'lead_engineer' 
                                    ? 'bg-purple-100 text-purple-800' 
                                    : 'bg-green-100 text-green-800'
                                }`}>
                                  {project.role === 'lead_engineer' ? 'Lead' : 'Engineer'}
                                </span>
                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                                  project.status === 'ongoing' 
                                    ? 'bg-blue-100 text-blue-800' 
                                    : project.status === 'pre-lim' 
                                      ? 'bg-yellow-100 text-yellow-800'
                                      : 'bg-gray-100 text-gray-800'
                                }`}>
                                  {project.status}
                                </span>
                              </div>
                            ))}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredWorkloads.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>No engineers found matching the selected filter</p>
          </div>
        )}
      </div>
    </div>
  );
};
