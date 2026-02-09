import React, { useState, useEffect } from 'react';
import { X, FileText, AlertCircle } from 'lucide-react';
import { useTeamStore } from '../../store/teamStore';
import { useProjectStore } from '../../store/projectStore';
import { useNotificationStore } from '../../store/notificationStore';
import { Button } from '../ui/Button';
import { toast } from 'react-hot-toast';
import { useModalFocus } from '../../hooks/useModalFocus';
import { logger } from '../../lib/logger';
import projectService from '../../services/project.service';
import type { Project } from '../../types/project.types';

interface AddVOModalProps {
  isOpen: boolean;
  onClose: () => void;
  parentProject: Project | null;
}

export const AddVOModal: React.FC<AddVOModalProps> = ({ isOpen, onClose, parentProject }) => {
  const { teamMembers, fetchTeamMembers, loading: teamLoading } = useTeamStore();
  const { fetchProjects } = useProjectStore();
  const { firstInputRef, closeButtonRef } = useModalFocus(isOpen);

  const [formData, setFormData] = useState({
    title: '',
    leadEngineerId: '',
    managerId: '',
    plannedHours: '',
    workTypes: [] as string[],
    description: '',
    status: 'pre-lim' as const,
  });

  const [suggestedVOCode, setSuggestedVOCode] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  // Fetch team members when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchTeamMembers();
    }
  }, [isOpen, fetchTeamMembers]);

  // Pre-fill from parent project when it changes
  useEffect(() => {
    if (parentProject) {
      setFormData(prev => ({
        ...prev,
        leadEngineerId: parentProject.leadEngineerId || '',
        managerId: parentProject.managerId || '',
      }));

      // Fetch existing VOs to suggest next VO number
      projectService.getVariationOrders(parentProject.id)
        .then(vos => {
          const nextNumber = vos.length + 1;
          setSuggestedVOCode(`${parentProject.projectCode}_${nextNumber}`);
        })
        .catch(err => {
          logger.error('Failed to fetch VOs:', err);
          setSuggestedVOCode(`${parentProject.projectCode}_1`);
        });
    }
  }, [parentProject]);

  const workTypes = [
    'Computational Fluid Dynamics',
    'Finite Element Analysis',
    'Vibration',
    'Acoustics',
  ];

  const handleWorkTypeChange = (type: string) => {
    setFormData(prev => {
      const workTypes = prev.workTypes.includes(type)
        ? prev.workTypes.filter(t => t !== type)
        : [...prev.workTypes, type];
      return { ...prev, workTypes };
    });
  };

  // All staff can be lead engineers
  const leadEngineers = teamMembers;

  // Project Managers: Senior Engineers and above
  const projectManagers = teamMembers.filter(
    (tm) => tm.role === 'senior-engineer' || tm.role === 'principal-engineer' ||
            tm.role === 'manager' || tm.role === 'managing-director' || tm.role === 'admin'
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!parentProject) {
      toast.error('No parent project selected');
      return;
    }

    // Validation
    if (!formData.title || !formData.managerId) {
      toast.error('Please fill in all required fields (Title and Project Manager)');
      return;
    }

    setIsLoading(true);
    try {
      const voPayload = {
        title: formData.title,
        leadEngineerId: formData.leadEngineerId || parentProject.leadEngineerId,
        managerId: formData.managerId,
        plannedHours: parseFloat(formData.plannedHours) || 0,
        workTypes: formData.workTypes.length > 0 ? formData.workTypes : parentProject.workTypes,
        description: formData.description,
        status: formData.status,
      };

      const result = await projectService.createVariationOrder(parentProject.id, voPayload);

      // Create notifications
      const addNotification = useNotificationStore.getState().addNotification;

      addNotification({
        type: 'success',
        title: 'Variation Order Created',
        message: `${result.voCode} - ${formData.title} has been created successfully.`,
        category: 'project-assignment',
      });

      // Notify manager if assigned
      if (formData.managerId) {
        const manager = teamMembers.find(tm => tm.id === formData.managerId);
        if (manager) {
          addNotification({
            type: 'info',
            title: 'VO Assignment',
            message: `${manager.name} has been assigned as Project Manager for VO ${result.voCode}.`,
            category: 'project-assignment',
          });
        }
      }

      toast.success(`Variation Order ${result.voCode} created successfully!`);

      // Refresh projects list
      await fetchProjects();

      // Reset form
      setFormData({
        title: '',
        leadEngineerId: '',
        managerId: '',
        plannedHours: '',
        workTypes: [],
        description: '',
        status: 'pre-lim',
      });

      onClose();
    } catch (error: any) {
      logger.error('Error creating variation order:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Failed to create variation order';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    // Reset form
    setFormData({
      title: '',
      leadEngineerId: '',
      managerId: '',
      plannedHours: '',
      workTypes: [],
      description: '',
      status: 'pre-lim',
    });
    onClose();
  };

  if (!isOpen || !parentProject) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black bg-opacity-50 p-4">
      <div className="relative bg-white rounded-lg shadow-xl w-full max-w-3xl my-8">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900">Create Variation Order</h2>
            <p className="mt-1 text-sm text-gray-600">
              For parent project: <span className="font-semibold text-primary-600">{parentProject.projectCode}</span> - {parentProject.title}
            </p>
          </div>
          <button
            ref={closeButtonRef}
            onClick={handleClose}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors rounded-lg hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Parent Project Info Banner */}
        <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mx-6 mt-6">
          <div className="flex items-start">
            <AlertCircle className="w-5 h-5 text-blue-400 mt-0.5 mr-3" />
            <div className="flex-1">
              <h4 className="text-sm font-medium text-blue-800">Variation Order for {parentProject.projectCode}</h4>
              <div className="mt-2 text-sm text-blue-700 space-y-1">
                <p><strong>Suggested VO Code:</strong> <span className="font-mono bg-blue-100 px-2 py-0.5 rounded">{suggestedVOCode}</span></p>
                <p><strong>Company:</strong> {parentProject.companyName}</p>
                <p><strong>Parent Status:</strong> <span className="capitalize">{parentProject.status}</span></p>
              </div>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* VO Title */}
          <div>
            <label htmlFor="vo-title" className="block text-sm font-medium text-gray-700 mb-2">
              VO Title <span className="text-red-500">*</span>
            </label>
            <input
              ref={firstInputRef}
              id="vo-title"
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="e.g., VO: Additional Deck Analysis"
              required
            />
          </div>

          {/* Team Assignment */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Lead Engineer */}
            <div>
              <label htmlFor="vo-lead-engineer" className="block text-sm font-medium text-gray-700 mb-2">
                Lead Engineer
              </label>
              <select
                id="vo-lead-engineer"
                value={formData.leadEngineerId}
                onChange={(e) => setFormData({ ...formData, leadEngineerId: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="">Inherit from parent ({parentProject.engineerName})</option>
                {leadEngineers.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.name} ({member.role})
                  </option>
                ))}
              </select>
            </div>

            {/* Project Manager */}
            <div>
              <label htmlFor="vo-manager" className="block text-sm font-medium text-gray-700 mb-2">
                Project Manager <span className="text-red-500">*</span>
              </label>
              <select
                id="vo-manager"
                value={formData.managerId}
                onChange={(e) => setFormData({ ...formData, managerId: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                required
              >
                <option value="">Select Manager</option>
                {projectManagers.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.name} ({member.role})
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-gray-500">Senior Engineers and above</p>
            </div>
          </div>

          {/* Planned Hours */}
          <div>
            <label htmlFor="vo-planned-hours" className="block text-sm font-medium text-gray-700 mb-2">
              Planned Hours
            </label>
            <input
              id="vo-planned-hours"
              type="number"
              min="0"
              step="0.5"
              value={formData.plannedHours}
              onChange={(e) => setFormData({ ...formData, plannedHours: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="0"
            />
          </div>

          {/* Work Types */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Work Types (Optional - inherits from parent if not selected)
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {workTypes.map((type) => (
                <label
                  key={type}
                  className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={formData.workTypes.includes(type)}
                    onChange={() => handleWorkTypeChange(type)}
                    className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                  />
                  <span className="text-sm text-gray-700">{type}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <label htmlFor="vo-description" className="block text-sm font-medium text-gray-700 mb-2">
              Description / Remarks
            </label>
            <textarea
              id="vo-description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Describe the scope of this variation order..."
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
            <Button
              type="button"
              variant="secondary"
              onClick={handleClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading || !formData.title || !formData.managerId}
            >
              {isLoading ? 'Creating...' : `Create VO ${suggestedVOCode}`}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
