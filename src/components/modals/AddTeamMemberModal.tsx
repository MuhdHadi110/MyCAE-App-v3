import { useState } from 'react';
import { X, User, Mail, Phone, Briefcase, Copy, Check } from 'lucide-react';
import { toast } from 'react-hot-toast';
import teamService from '../../services/api.service';
import type { UserRole, Department } from '../../types/team.types';
import { logger } from '../../lib/logger';

interface AddTeamMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

interface SuccessData {
  tempPassword?: string;
  name: string;
  email: string;
  message?: string;
}

export const AddTeamMemberModal: React.FC<AddTeamMemberModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'engineer' as UserRole,
    department: 'engineering' as Department,
  });
  const [loading, setLoading] = useState(false);
  const [successData, setSuccessData] = useState<SuccessData | null>(null);
  const [copiedPassword, setCopiedPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.email) {
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);

    try {
      // Create team member directly via API
      const teamMemberData = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        role: formData.role,
        department: formData.department,
        employment_type: 'full-time',
        status: 'active',
      };

      const data = await teamService.createTeamMember(teamMemberData);

      if (data) {

        // Show success with temp password if new user was created
        if (data.tempPassword) {
          setSuccessData({
            tempPassword: data.tempPassword,
            name: formData.name,
            email: formData.email,
            message: data.message,
          });
        } else {
          toast.success(`Team member ${formData.name} added successfully!`);
          setFormData({
            name: '',
            email: '',
            phone: '',
            role: 'engineer',
            department: 'engineering',
          });
          if (onSuccess) {
            onSuccess();
          }
          onClose();
        }
      }
    } catch (error: any) {
      const errorMessage = error?.response?.data?.error ||
                          (Array.isArray(error?.response?.data?.errors) ?
                            error.response.data.errors[0]?.msg : '') ||
                          error?.message ||
                          'Failed to add team member';
      logger.error('Error adding team member:', errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedPassword(true);
    setTimeout(() => setCopiedPassword(false), 2000);
  };

  const handleDoneWithSuccess = () => {
    setSuccessData(null);
    setFormData({
      name: '',
      email: '',
      phone: '',
      role: 'engineer',
      department: 'engineering',
    });
    if (onSuccess) {
      onSuccess();
    }
    onClose();
  };

  // Success screen showing temporary password
  if (successData) {
    return (
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={onClose} />
        <div className="flex min-h-full items-center justify-center p-4">
          <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-green-50 to-green-100">
              <h2 className="text-2xl font-bold text-gray-900">✅ Team Member Created</h2>
              <button onClick={handleDoneWithSuccess} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-green-800">{successData.message}</p>
              </div>

              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Team Member Name</p>
                  <p className="text-lg font-semibold text-gray-900">{successData.name}</p>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Email Address</p>
                  <p className="text-lg font-semibold text-gray-900">{successData.email}</p>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Temporary Password</p>
                  <div className="flex gap-2 items-center">
                    <input
                      type="text"
                      value={successData.tempPassword}
                      readOnly
                      className="flex-1 px-4 py-2 bg-gray-100 border border-gray-300 rounded-lg font-mono text-sm"
                    />
                    <button
                      onClick={() => copyToClipboard(successData.tempPassword!)}
                      className="p-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                      title="Copy to clipboard"
                    >
                      {copiedPassword ? (
                        <Check className="w-4 h-4" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Share this password with the team member. They must change it on first login.
                  </p>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
                <button
                  onClick={handleDoneWithSuccess}
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Form screen
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={onClose} />
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full">
          <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-primary-50 to-primary-100">
            <h2 className="text-2xl font-bold text-gray-900">Add Team Member</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="w-6 h-6" />
            </button>
          </div>

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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
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
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
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
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
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
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
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
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="engineering">Engineering</option>
                    <option value="project-management">Project Management</option>
                  </select>
                </div>
              </div>

            </div>

            <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-800">
                <strong>✅ Active:</strong> This team member will be created with a user account and saved to the database.
              </p>
            </div>

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
                disabled={loading}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Adding...' : 'Add Team Member'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
