import React, { useState, useEffect } from 'react';
import { X, Calendar, CheckCircle2, Users } from 'lucide-react';
import { toast } from 'react-hot-toast';
import type { Project, ProjectStatus } from '../../types/project.types';
import { useTeamStore } from '../../store/teamStore';

interface EditProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project | null;
  onSave: (updatedProject: Partial<Project>) => Promise<void>;
}

export const EditProjectModal: React.FC<EditProjectModalProps> = ({
  isOpen,
  onClose,
  project,
  onSave
}) => {
  const [formData, setFormData] = useState<Partial<Project>>({});
  const { teamMembers, fetchTeamMembers } = useTeamStore();

  useEffect(() => {
    fetchTeamMembers();
  }, [fetchTeamMembers]);

  useEffect(() => {
    if (project) {
      setFormData({ 
        ...project,
        dailyRate: (project as any).dailyRate || null
      });
    }
  }, [project]);

  if (!isOpen || !project) return null;

  const handleStatusChange = (newStatus: ProjectStatus) => {
    const now = new Date().toISOString();
    const updates: Partial<Project> = { status: newStatus };

    // Auto-set inquiry date when status changes to preliminary
    if (newStatus === 'pre-lim' && !formData.inquiryDate) {
      updates.inquiryDate = now;
    }

    setFormData({ ...formData, ...updates });
  };

  const handleSave = async () => {
    try {
      await onSave(formData);
      toast.success('Project updated successfully!');
      onClose();
    } catch (error: any) {
      toast.error(error?.message || 'Failed to update project');
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={onClose} />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-primary-50 to-white flex-shrink-0">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Edit Project</h2>
              <p className="text-sm text-gray-600 mt-1">{project.projectCode} - {project.title}</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto flex-1 space-y-6">
            {/* Team Assignment Section */}
            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-600" />
                Team Assignment
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Lead Engineer */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Lead Engineer
                  </label>
                  <select
                    value={formData.leadEngineerId || ''}
                    onChange={(e) => {
                      const selectedEngineer = teamMembers.find(tm => tm.id === e.target.value);
                      setFormData({
                        ...formData,
                        leadEngineerId: e.target.value,
                        engineerName: selectedEngineer?.name
                      });
                    }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="">Select Engineer</option>
                    {teamMembers
                      .filter(tm => tm.role === 'engineer' || tm.role === 'senior-engineer' || tm.role === 'principal-engineer')
                      .map(engineer => (
                        <option key={engineer.id} value={engineer.id}>
                          {engineer.name} - {engineer.role.replace('-', ' ').toUpperCase()}
                        </option>
                      ))
                    }
                  </select>
                </div>

                {/* Project Manager */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Project Manager
                  </label>
                  <select
                    value={formData.managerId || ''}
                    onChange={(e) => {
                      const selectedManager = teamMembers.find(tm => tm.id === e.target.value);
                      setFormData({
                        ...formData,
                        managerId: e.target.value,
                        managerName: selectedManager?.name
                      });
                    }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="">Select Project Manager</option>
                    {teamMembers
                      .filter(tm =>
                        tm.role === 'senior-engineer' ||
                        tm.role === 'principal-engineer' ||
                        tm.role === 'manager' ||
                        tm.role === 'managing-director'
                      )
                      .map(manager => (
                        <option key={manager.id} value={manager.id}>
                          {manager.name} - {manager.role.replace('-', ' ').toUpperCase()}
                        </option>
                      ))
                    }
                  </select>
                </div>
              </div>

              {/* Display Current Assignments */}
              {(formData.engineerName || formData.managerName) && (
                <div className="mt-4 p-3 bg-white rounded-lg border border-indigo-200">
                  <p className="text-xs font-medium text-gray-600 mb-2">Current Team:</p>
                  <div className="flex flex-wrap gap-2">
                    {formData.engineerName && (
                      <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                        🔧 {formData.engineerName}
                      </span>
                    )}
                    {formData.managerName && (
                      <span className="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 text-purple-800 text-xs font-medium rounded-full">
                        👔 {formData.managerName}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Status & Dates */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Status Dropdown */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Project Status {formData.status === 'pre-lim' && <span className="text-blue-600 text-xs">(Auto-updates on PO receipt)</span>}
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => handleStatusChange(e.target.value as ProjectStatus)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="pre-lim">Preliminary</option>
                  <option value="ongoing">Ongoing</option>
                  <option value="completed">Completed</option>
                </select>
              </div>

              {/* Inquiry Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="w-4 h-4 inline mr-1" />
                  Inquiry Date
                </label>
                <input
                  type="date"
                  value={formData.inquiryDate ? new Date(formData.inquiryDate).toISOString().split('T')[0] : ''}
                  onChange={(e) => setFormData({ ...formData, inquiryDate: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Project Details */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Planned Hours
              </label>
              <input
                type="number"
                value={formData.plannedHours || 0}
                onChange={(e) => setFormData({ ...formData, plannedHours: parseInt(e.target.value) })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            {/* Hourly Rate */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Hourly Rate (MYR)
                <span className="text-xs text-gray-500 font-normal ml-2">(Optional)</span>
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.dailyRate || ''}
                onChange={(e) => setFormData({ ...formData, dailyRate: parseFloat(e.target.value) || null })}
                placeholder="e.g., 500"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">
                Leave blank to use default RM 437.50/hr
              </p>
            </div>

            {/* Remarks */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Remarks
              </label>
              <textarea
                value={formData.remarks || ''}
                onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Add any notes or remarks about this project..."
              />
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50 flex-shrink-0">
            <button
              onClick={onClose}
              className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-6 py-2.5 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-lg hover:from-primary-600 hover:to-primary-700 transition-all font-medium flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
