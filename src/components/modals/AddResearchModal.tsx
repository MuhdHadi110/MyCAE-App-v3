import React, { useState } from 'react';
import { X, FlaskConical } from 'lucide-react';
import { Button } from '../ui/Button';
import { useTeamStore } from '../../store/teamStore';
import type { ResearchProject } from '../../types/research.types';

interface AddResearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (project: Omit<ResearchProject, 'id' | 'createdDate' | 'lastUpdated'>) => void;
}

export const AddResearchModal: React.FC<AddResearchModalProps> = ({ isOpen, onClose, onSubmit }) => {
  const { teamMembers } = useTeamStore();

  const [formData, setFormData] = useState({
    researchCode: '',
    title: '',
    description: '',
    status: 'planning' as const,
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    leadResearcherId: '',
    leadResearcherName: '',
    budget: 0,
    plannedHours: 0,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) newErrors.title = 'Project title is required';
    if (!formData.description.trim()) newErrors.description = 'Description is required';
    if (!formData.startDate) newErrors.startDate = 'Start date is required';
    if (!formData.leadResearcherId) newErrors.leadResearcherId = 'Lead researcher is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    onSubmit({
      researchCode: formData.researchCode,
      title: formData.title,
      description: formData.description,
      status: formData.status,
      startDate: formData.startDate,
      plannedEndDate: formData.endDate || undefined,
      leadResearcherId: formData.leadResearcherId,
      leadResearcherName: formData.leadResearcherName,
      budget: formData.budget || undefined,
      plannedHours: formData.plannedHours || undefined,
    });

    setFormData({
      researchCode: '',
      title: '',
      description: '',
      status: 'planning',
      startDate: new Date().toISOString().split('T')[0],
      endDate: '',
      leadResearcherId: '',
      leadResearcherName: '',
      budget: 0,
      plannedHours: 0,
    });
    setErrors({});
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
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-primary-50 to-primary-100 dark:from-gray-800 dark:to-gray-700">
          <div className="flex items-center gap-3">
            <FlaskConical className="w-5 h-5 text-cyan-600" />
            <h2 className="text-lg font-semibold text-gray-900">New Research Project</h2>
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
          {/* Research Code */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Research Code
            </label>
            <input
              type="text"
              value={formData.researchCode}
              onChange={(e) => handleInputChange('researchCode', e.target.value.toUpperCase())}
              placeholder="e.g., R26001"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 font-mono"
            />
            <p className="text-xs text-gray-500 mt-1">Format: RYYXXX (R=Research, YY=Year, XXX=Number)</p>
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Project Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              placeholder="Enter project title"
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 ${
                errors.title ? 'border-red-300 bg-red-50' : 'border-gray-300'
              }`}
            />
            {errors.title && <p className="text-red-600 text-sm mt-1 font-medium">{errors.title}</p>}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Enter project description"
              rows={3}
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 resize-none ${
                errors.description ? 'border-red-300 bg-red-50' : 'border-gray-300'
              }`}
            />
            {errors.description && <p className="text-red-600 text-sm mt-1 font-medium">{errors.description}</p>}
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
              Lead Researcher <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.leadResearcherId}
              onChange={(e) => handleLeadResearcherChange(e.target.value)}
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 bg-white ${
                errors.leadResearcherId ? 'border-red-300 bg-red-50' : 'border-gray-300'
              }`}
            >
              <option value="">Select a team member</option>
              {teamMembers.map((member) => (
                <option key={member.id} value={member.userId || member.id}>
                  {member.name}
                </option>
              ))}
            </select>
            {errors.leadResearcherId && (
              <p className="text-red-600 text-sm mt-1 font-medium">{errors.leadResearcherId}</p>
            )}
          </div>

          {/* Start Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Start Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={formData.startDate}
              onChange={(e) => handleInputChange('startDate', e.target.value)}
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 ${
                errors.startDate ? 'border-red-300 bg-red-50' : 'border-gray-300'
              }`}
            />
            {errors.startDate && <p className="text-red-600 text-sm mt-1 font-medium">{errors.startDate}</p>}
          </div>

          {/* End Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              End Date (Optional)
            </label>
            <input
              type="date"
              value={formData.endDate}
              onChange={(e) => handleInputChange('endDate', e.target.value)}
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
              Create Project
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
