import React, { useEffect, useState } from 'react';
import { Plus, Search, Mail, Phone, Award, Briefcase, Edit2, Trash2 } from 'lucide-react';
import { useTeamStore } from '../store/teamStore';
import { getCurrentUser } from '../lib/auth';
import { getPermissions } from '../lib/permissions';
import { AddTeamMemberModal } from '../components/modals/AddTeamMemberModal';
import { EditTeamMemberModal } from '../components/modals/EditTeamMemberModal';
import { toast } from 'react-hot-toast';
import type { UserRole, Department } from '../types/team.types';

const formatRole = (role: UserRole): string => {
  const roleMap: Record<UserRole, string> = {
    'engineer': 'Engineer',
    'senior-engineer': 'Senior Engineer',
    'principal-engineer': 'Principal Engineer',
    'manager': 'Manager',
    'managing-director': 'Managing Director',
    'admin': 'Admin',
  };
  return roleMap[role] || role;
};

export const TeamScreen: React.FC = () => {
  const { teamMembers, fetchTeamMembers, deleteTeamMember } = useTeamStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<UserRole | 'all'>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState<any | null>(null);

  const currentUser = getCurrentUser();
  const userRole = (currentUser?.role || 'engineer') as UserRole;
  const permissions = getPermissions(userRole);

  useEffect(() => {
    fetchTeamMembers();
  }, [fetchTeamMembers]);

  const handleAddTeamMember = () => {
    if (!permissions.canAddTeamMember) {
      toast.error('You need Principal Engineer level or higher to add team members');
      return;
    }
    setShowAddModal(true);
  };

  const handleEditTeamMember = (member: any) => {
    if (!permissions.canEditTeamMember) {
      toast.error('You do not have permission to edit team members');
      return;
    }

    // Check if senior engineer is trying to edit someone from another department
    if (userRole === 'senior-engineer' && currentUser?.department && member?.department && currentUser.department !== member.department) {
      toast.error('Senior Engineers can only edit team members in their own department');
      return;
    }

    setSelectedMember(member);
    setShowEditModal(true);
  };

  const handleDeleteTeamMember = async (member: any) => {
    if (!permissions.canDeleteTeamMember) {
      toast.error('You do not have permission to delete team members');
      return;
    }

    // Check if senior engineer is trying to delete someone from another department
    if (userRole === 'senior-engineer' && currentUser?.department && member?.department && currentUser.department !== member.department) {
      toast.error('Senior Engineers can only delete team members in their own department');
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to deactivate ${member?.name || 'this team member'}? This will mark them as inactive.`
    );

    if (!confirmed) return;

    try {
      await deleteTeamMember(member.id);
      toast.success(`${member?.name || 'Team member'} has been deactivated successfully`);
      fetchTeamMembers();
    } catch (error) {
      toast.error('Failed to deactivate team member');
    }
  };

  const filteredMembers = teamMembers.filter((member) => {
    const matchesSearch =
      searchTerm === '' ||
      (member.name && member.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (member.department && member.department.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesRole = roleFilter === 'all' || member.role === roleFilter;

    return matchesSearch && matchesRole;
  });

  const getRoleBadgeColor = (role: UserRole) => {
    switch (role) {
      case 'engineer':
        return 'bg-blue-100 text-blue-800';
      case 'senior-engineer':
        return 'bg-indigo-100 text-indigo-800';
      case 'principal-engineer':
        return 'bg-purple-100 text-purple-800';
      case 'manager':
        return 'bg-green-100 text-green-800';
      case 'managing-director':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-full bg-gray-50">
      <div className="p-4 md:p-6  space-y-6">
        {/* Header Container */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Team</h1>
              <p className="text-sm text-gray-600 mt-1">
                Manage your team members and track their workload
              </p>
            </div>
            {permissions.canAddTeamMember && (
              <button
                onClick={handleAddTeamMember}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Team Member
              </button>
            )}
          </div>
        </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name or department..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          {/* Role Filter */}
          <div>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as UserRole | 'all')}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="all">All Roles</option>
              <option value="engineer">Engineers</option>
              <option value="senior-engineer">Senior Engineers</option>
              <option value="principal-engineer">Principal Engineers</option>
              <option value="manager">Managers</option>
              <option value="managing-director">Managing Directors</option>
            </select>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="text-sm font-medium text-gray-600">Total</div>
          <div className="text-3xl font-bold text-gray-900 mt-2">{teamMembers.length}</div>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="text-sm font-medium text-gray-600">Engineers</div>
          <div className="text-3xl font-bold text-blue-600 mt-2">
            {teamMembers.filter((m) => m.role === 'engineer').length}
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="text-sm font-medium text-gray-600">Senior Eng</div>
          <div className="text-3xl font-bold text-indigo-600 mt-2">
            {teamMembers.filter((m) => m.role === 'senior-engineer').length}
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="text-sm font-medium text-gray-600">Principal Eng</div>
          <div className="text-3xl font-bold text-purple-600 mt-2">
            {teamMembers.filter((m) => m.role === 'principal-engineer').length}
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="text-sm font-medium text-gray-600">Managers</div>
          <div className="text-3xl font-bold text-green-600 mt-2">
            {teamMembers.filter((m) => m.role === 'manager').length}
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="text-sm font-medium text-gray-600">Man. Directors</div>
          <div className="text-3xl font-bold text-red-600 mt-2">
            {teamMembers.filter((m) => m.role === 'managing-director').length}
          </div>
        </div>
      </div>

      {/* Team Members Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredMembers.map((member) => (
          <div key={member.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-lg transition-shadow">
            <div className="p-6">
              {/* Avatar and Role */}
              <div className="flex items-start gap-4 mb-4">
                <img
                  src={member.avatar}
                  alt={member.name}
                  className="w-16 h-16 rounded-full"
                />
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900">{member.name}</h3>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeColor(
                      member.role
                    )} mt-1`}
                  >
                    {formatRole(member.role)}
                  </span>
                </div>
              </div>

              {/* Department */}
              <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
                <Briefcase className="w-4 h-4" />
                <span>{member.department}</span>
              </div>

              {/* Contact Info */}
              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Mail className="w-4 h-4" />
                  <a
                    href={`mailto:${member.email}`}
                    className="hover:text-primary-600 transition-colors truncate"
                  >
                    {member.email}
                  </a>
                </div>
                {member.phone && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Phone className="w-4 h-4" />
                    <a
                      href={`tel:${member.phone}`}
                      className="hover:text-primary-600 transition-colors"
                    >
                      {member.phone}
                    </a>
                  </div>
                )}
              </div>

              {/* Certifications */}
              {member.certifications && member.certifications.length > 0 && (
                <div className="mb-4">
                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                    <Award className="w-4 h-4" />
                    <span className="font-medium">Certifications</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {member.certifications.slice(0, 2).map((cert, index) => (
                      <span
                        key={index}
                        className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded"
                        title={cert}
                      >
                        {cert.length > 25 ? cert.substring(0, 25) + '...' : cert}
                      </span>
                    ))}
                    {member.certifications.length > 2 && (
                      <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                        +{member.certifications.length - 2} more
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Stats */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary-600">{member.activeProjects}</div>
                  <div className="text-xs text-gray-600">Active Projects</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-600">
                    {member.totalHoursThisMonth}
                  </div>
                  <div className="text-xs text-gray-600">Hours This Month</div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-4 flex gap-2">
                {permissions.canEditTeamMember && (
                  <button
                    onClick={() => handleEditTeamMember(member)}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm font-medium"
                  >
                    <Edit2 className="w-4 h-4" />
                    Edit
                  </button>
                )}
                {permissions.canDeleteTeamMember && (
                  <button
                    onClick={() => handleDeleteTeamMember(member)}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-sm font-medium"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add Team Member Modal */}
      <AddTeamMemberModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={() => {
          // Refresh the team members list
          fetchTeamMembers();
          setShowAddModal(false);
        }}
      />

      {/* Edit Team Member Modal */}
      {selectedMember && (
        <EditTeamMemberModal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setSelectedMember(null);
          }}
          teamMemberId={selectedMember.id}
          initialData={{
            id: selectedMember.id,
            name: selectedMember.name,
            email: selectedMember.email,
            phone: selectedMember.phone,
            role: selectedMember.role,
            department: selectedMember.department,
          }}
          onSuccess={() => {
            // Refresh the team members list
            fetchTeamMembers();
            setShowEditModal(false);
            setSelectedMember(null);
          }}
        />
      )}
      </div>
    </div>
  );
};
