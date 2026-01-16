import React, { useState, useEffect } from 'react';
import { X, FlaskConical } from 'lucide-react';
import { Button } from '../ui/Button';
import { useTeamStore } from '../../store/teamStore';
import type { ResearchProject } from '../../types/research.types';

interface EditResearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (id: string, project: Partial<ResearchProject>) => void;
  project: ResearchProject;
}

export const EditResearchModal: React.FC<EditResearchModalProps> = ({ isOpen, onClose, onSubmit, project }) => {
  const { teamMembers } = useTeamStore();

  const [formData, setFormData] = useState({
    title: project.title,
    description: project.description || '',
    status: project.status,
    plannedEndDate: project.plannedEndDate || '',
    leadResearcherId: project.leadResearcherId,
    leadResearcherName: project.leadResearcher?.name || '',
    budget: project.budget || 0,
    plannedHours: project.plannedHours || 0,
    researchCode: project.researchCode || '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Update form when project changes
  useEffect(() => {
    if (isOpen) {
      setFormData({
        title: project.title,
        description: project.description || '',
        status: project.status,
        plannedEndDate: project.plannedEndDate || '',
        leadResearcherId: project.leadResearcherId,
        leadResearcherName: project.leadResearcher?.name || '',
        budget: project.budget || 0,
        plannedHours: project.plannedHours || 0,
        researchCode: project.researchCode || '',
      });
      setErrors({});
    }
  }, [isOpen, project]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) newErrors.title = 'Project title is required';
    if (!formData.description.trim()) newErrors.description = 'Description is required';
    if (!formData.leadResearcherId) newErrors.leadResearcherId = 'Lead researcher is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    onSubmit(project.id, {
      title: formData.title,
      description: formData.description,
      status: formData.status,
      plannedEndDate: formData.plannedEndDate || undefined,
      leadResearcherId: formData.leadResearcherId,
      leadResearcherName: formData.leadResearcherName,
      budget: formData.budget || undefined,
      plannedHours: formData.plannedHours || undefined,
      researchCode: formData.researchCode,
    });

    onClose();
  };

  const handleInputChange = (field: string, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleLeadResearcherChange = (teamMemberId: string) => {
    const member = teamMembers.find(tm => tm.id === teamMemberId);
    // Use userId from team member (references users.id, not team_members.id)
    const userId = member?.userId || teamMemberId;
    handleInputChange('leadResearcherId', userId);
    if (member) {
      handleInputChange('leadResearcherName', member.name);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-lg max-w-md w-full max-h-screen overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white">
          <div className="flex items-center gap-3">
            <FlaskConical className="w-5 h-5 text-cyan-600" />
            <h2 className="text-lg font-semibold text-gray-900">Edit Research Project</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Research Code (Editable) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Research Code
            </label>
            <input
              type="text"
              value={formData.researchCode}
              onChange={(e) => handleInputChange('researchCode', e.target.value.toUpperCase())}
              placeholder="e.g., R25001"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Project Title
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              placeholder="Enter project title"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
            {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title}</p>}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Enter project description"
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 resize-none"
            />
            {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description}</p>}
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              value={formData.status}
              onChange={(e) => handleInputChange('status', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 bg-white"
            >
              <option value="planning">Planning</option>
              <option value="in-progress">In Progress</option>
              <option value="on-hold">On Hold</option>
              <option value="completed">Completed</option>
              <option value="archived">Archived</option>
            </select>
          </div>

          {/* Lead Researcher */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Lead Researcher
            </label>
            <select
              value={formData.leadResearcherId}
              onChange={(e) => handleLeadResearcherChange(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 bg-white"
            >
              <option value="">Select a team member</option>
              {teamMembers.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name}
                </option>
              ))}
            </select>
            {errors.leadResearcherId && <p className="text-red-500 text-xs mt-1">{errors.leadResearcherId}</p>}
          </div>

          {/* Planned End Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Planned End Date (Optional)
            </label>
            <input
              type="date"
              value={formData.plannedEndDate}
              onChange={(e) => handleInputChange('plannedEndDate', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>

          {/* Planned Hours */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Planned Hours (Optional)
            </label>
            <input
              type="number"
              step="0.5"
              min="0"
              value={formData.plannedHours}
              onChange={(e) => handleInputChange('plannedHours', parseFloat(e.target.value) || 0)}
              placeholder="0"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>

          {/* Budget */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Budget (Optional)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={formData.budget}
              onChange={(e) => handleInputChange('budget', parseFloat(e.target.value) || 0)}
              placeholder="0"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <Button onClick={onClose} variant="outline" className="flex-1">
              Cancel
            </Button>
            <Button onClick={handleSubmit} className="flex-1">
              Update Project
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
