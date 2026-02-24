import React, { useState, useEffect } from 'react';
import { UserPlus, UserX, Crown, Users } from 'lucide-react';
import { toast } from 'react-hot-toast';
import projectTeamService, { ProjectTeamMember } from '../../services/projectTeam.service';
import teamService from '../../services/api.service';
import type { TeamMember } from '../../types/team.types';
import { Button } from '../ui/Button';
import { Avatar } from '../ui/Avatar';

interface ProjectTeamProps {
  projectId: string;
}

export const ProjectTeam: React.FC<ProjectTeamProps> = ({ projectId }) => {
  const [teamMembers, setTeamMembers] = useState<ProjectTeamMember[]>([]);
  const [availableEngineers, setAvailableEngineers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedEngineer, setSelectedEngineer] = useState('');

  useEffect(() => {
    let isMounted = true;
    
    const loadData = async () => {
      try {
        setLoading(true);
        const [team, response] = await Promise.all([
          projectTeamService.getProjectTeam(projectId),
          teamService.getAllTeamMembers({ status: 'active' })
        ]);
        
        if (isMounted) {
          setTeamMembers(team);
          const responseData = response as any;
          const members = Array.isArray(responseData) ? responseData : responseData?.data || [];
          const validMembers = members.filter((m: any) => m && (m.name || m.user?.name));
          setAvailableEngineers(validMembers);
        }
      } catch (error) {
        if (isMounted) {
          console.error('Error loading data:', error);
          toast.error('Failed to load project team');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };
    
    loadData();
    
    return () => {
      isMounted = false;
    };
  }, [projectId]);

  // Function to reload data after changes
  const reloadData = async () => {
    try {
      const team = await projectTeamService.getProjectTeam(projectId);
      setTeamMembers(team);
    } catch (error) {
      console.error('Error reloading team members:', error);
      toast.error('Failed to reload team data');
    }
  };

  const handleAddMember = async () => {
    if (!selectedEngineer) {
      toast.error('Please select an engineer');
      return;
    }

    try {
      await projectTeamService.addTeamMember(projectId, selectedEngineer, 'engineer');
      toast.success('Team member added successfully');
      setShowAddModal(false);
      setSelectedEngineer('');
      reloadData();
    } catch (error: any) {
      console.error('Error adding team member:', error);
      toast.error(error.response?.data?.error || 'Failed to add team member');
    }
  };

  const handleRemoveMember = async (teamMemberId: string, name: string) => {
    if (!confirm(`Remove ${name} from the project team?`)) {
      return;
    }

    try {
      await projectTeamService.removeTeamMember(projectId, teamMemberId);
      toast.success('Team member removed');
      reloadData();
    } catch (error) {
      console.error('Error removing team member:', error);
      toast.error('Failed to remove team member');
    }
  };

  // Filter out already assigned engineers
  const unassignedEngineers = availableEngineers
    .map((eng: any) => ({
      ...eng,
      displayName: eng.name || eng.user?.name || eng.userName || 'Unknown',
      displayEmail: eng.email || eng.user?.email || '',
    }))
    .filter(
      (eng) => !teamMembers.some((tm) => tm.teamMemberId === eng.id)
    );

  const leadEngineer = teamMembers.find((tm) => tm.role === 'lead_engineer');
  const engineers = teamMembers.filter((tm) => tm.role === 'engineer');

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-primary-600" />
          <h3 className="text-lg font-semibold text-gray-900">
            Project Team ({teamMembers.length} members)
          </h3>
        </div>
        <Button onClick={() => setShowAddModal(true)} size="sm">
          <UserPlus className="w-4 h-4 mr-2" />
          Add Member
        </Button>
      </div>

      {/* Lead Engineer Section */}
      {leadEngineer && (
        <div className="bg-gradient-to-r from-primary-50 to-primary-100 rounded-xl p-4 border border-primary-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar
                src={leadEngineer.avatar}
                alt={leadEngineer.name}
                size="md"
              />
              <div>
                <p className="font-semibold text-gray-900">{leadEngineer.name}</p>
                <div className="flex items-center gap-1 text-sm text-primary-700">
                  <Crown className="w-4 h-4" />
                  <span>Lead Engineer</span>
                </div>
              </div>
            </div>
            <span className="text-sm text-gray-500">{leadEngineer.email}</span>
          </div>
        </div>
      )}

      {/* Engineers Section */}
      {engineers.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-700">Engineers ({engineers.length})</h4>
          <div className="grid gap-3">
            {engineers.map((engineer) => (
              <div
                key={engineer.id}
                className="flex items-center justify-between bg-white rounded-lg border border-gray-200 p-3"
              >
                <div className="flex items-center gap-3">
                  <Avatar
                    src={engineer.avatar}
                    alt={engineer.name}
                    size="sm"
                  />
                  <div>
                    <p className="font-medium text-gray-900">{engineer.name}</p>
                    <p className="text-sm text-gray-500">{engineer.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleRemoveMember(engineer.teamMemberId, engineer.name)}
                    className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Remove from team"
                  >
                    <UserX className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {teamMembers.length === 0 && (
        <div className="text-center py-8 bg-gray-50 rounded-lg">
          <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-600">No team members assigned yet</p>
          <p className="text-sm text-gray-500 mt-1">Add engineers to track project assignments</p>
        </div>
      )}

      {/* Add Member Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Add Team Member</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Engineer *
                </label>
                <select
                  value={selectedEngineer}
                  onChange={(e) => setSelectedEngineer(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">Choose an engineer...</option>
                  {unassignedEngineers.length === 0 ? (
                    <option value="" disabled>No available engineers</option>
                  ) : (
                    unassignedEngineers.map((eng) => (
                      <option key={eng.id} value={eng.id}>
                        {eng.displayName} {eng.displayEmail ? `(${eng.displayEmail})` : ''}
                      </option>
                    ))
                  )}
                </select>
                <p className="text-xs text-gray-500 mt-2">
                  Engineers will be added as team contributors. Use the "Lead Engineer" dropdown above to set the project lead.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <Button variant="outline" onClick={() => setShowAddModal(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddMember} disabled={!selectedEngineer}>
                Add to Project
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
