import { useState, useEffect } from 'react';
import { X, User, Mail, Phone, Briefcase, AlertCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import apiService from '../../services/api.service';
import { useAuth } from '../../contexts/AuthContext';
import { useTeamStore } from '../../store/teamStore';
import { checkPermission } from '../../lib/permissions';
import type { UserRole, Department } from '../../types/team.types';

interface EditTeamMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  teamMemberId?: string;
  initialData?: {
    id: string;
    name: string;
    email: string;
    phone?: string;
    role?: UserRole;
    roles?: UserRole[];
    department: Department;
    user_id?: string;
  };
}

export const EditTeamMemberModal: React.FC<EditTeamMemberModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  teamMemberId,
  initialData,
}) => {
  const { user } = useAuth();
  const { updateTeamMember } = useTeamStore();
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    email: initialData?.email || '',
    phone: initialData?.phone || '',
    role: (initialData?.role || 'engineer') as UserRole,
    department: (initialData?.department || 'engineering') as Department,
  });
  const [loading, setLoading] = useState(false);
  const [canEdit, setCanEdit] = useState(true);
  const [permissionError, setPermissionError] = useState('');

  useEffect(() => {
    if (initialData && isOpen) {
      console.log('=== EditTeamMemberModal initializing with data ===');
      console.log('Initial Data:', initialData);
      console.log('Team Member ID:', teamMemberId);

      const newFormData = {
        name: initialData.name || '',
        email: initialData.email || '',
        phone: initialData.phone || '',
        role: initialData.role || 'engineer',
        department: initialData.department || 'engineering',
      };
      console.log('Setting form data to:', newFormData);
      setFormData(newFormData);

      // Check if user has permission to edit this team member
      const canEditTeamMember = checkPermission(user?.role || 'engineer', 'canEditTeamMember');

      if (!canEditTeamMember) {
        setCanEdit(false);
        setPermissionError('You do not have permission to edit team members');
      } else if (user?.role === 'senior-engineer' && initialData.department !== user?.department) {
        // Senior engineers can only edit members in their own department
        setCanEdit(false);
        setPermissionError('Senior Engineers can only edit team members in their own department');
      } else {
        setCanEdit(true);
        setPermissionError('');
      }
    }
  }, [initialData, user, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!canEdit) {
      toast.error(permissionError);
      return;
    }

    if (!formData.name || !formData.email || !teamMemberId) {
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);

    try {
      console.log('=== EDIT TEAM MEMBER START ===');
      console.log('Team Member ID:', teamMemberId);
      console.log('Form Data being sent:', {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        role: formData.role,
        department: formData.department,
      });

      if (!teamMemberId) {
        toast.error('Team member ID is missing');
        setLoading(false);
        return;
      }

      // Call the store method instead of API directly
      await updateTeamMember(teamMemberId, {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        role: formData.role,
        department: formData.department,
      });

      console.log('Team member updated successfully');

      toast.success('Team member updated successfully!');
      onClose();

      // Call onSuccess callback to refresh the list
      if (onSuccess) {
        console.log('Calling onSuccess callback');
        onSuccess();
      }
      console.log('=== EDIT TEAM MEMBER END ===');
    } catch (error: any) {
      console.log('=== ERROR IN EDIT TEAM MEMBER ===');
      console.error('Full error object:', error);
      console.error('Error response:', error?.response);
      console.error('Error response data:', error?.response?.data);

      const errorMessage = error?.response?.data?.error ||
                          (Array.isArray(error?.response?.data?.errors) ?
                            error.response.data.errors[0]?.msg : '') ||
                          error?.message ||
                          'Failed to update team member';
      console.error('Error updating team member:', errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={onClose} />
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full">
          <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-blue-100">
            <h2 className="text-2xl font-bold text-gray-900">Edit Team Member</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Permission Error Alert */}
          {!canEdit && (
            <div className="m-6 p-4 bg-red-50 border border-red-200 rounded-lg flex gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-red-800">{permissionError}</p>
                <p className="text-xs text-red-700 mt-1">
                  {user?.role === 'senior-engineer'
                    ? 'Senior Engineers can only edit team members within their department'
                    : 'Contact a Manager or Admin to make changes'}
                </p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="p-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <User className="w-4 h-4 inline mr-1" />
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., John Doe"
                  disabled={!canEdit || loading}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Mail className="w-4 h-4 inline mr-1" />
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="john@mycae.com.my"
                    disabled={!canEdit || loading}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Phone className="w-4 h-4 inline mr-1" />
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+60 12-345 6789"
                    disabled={!canEdit || loading}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Role
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                    disabled={!canEdit || loading}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  >
                    <option value="engineer">Engineer</option>
                    <option value="senior-engineer">Senior Engineer</option>
                    <option value="principal-engineer">Principal Engineer</option>
                    <option value="manager">Manager</option>
                    <option value="managing-director">Managing Director</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Briefcase className="w-4 h-4 inline mr-1" />
                    Department
                  </label>
                  <select
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value as Department })}
                    disabled={!canEdit || loading}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  >
                    <option value="engineering">Engineering</option>
                    <option value="project-management">Project Management</option>
                  </select>
                </div>
              </div>

            </div>

            {canEdit && (
              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>ℹ️ Info:</strong> Changes will be saved to the team member's profile.
                </p>
              </div>
            )}

            <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!canEdit || loading}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
