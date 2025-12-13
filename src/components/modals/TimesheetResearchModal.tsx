import React, { useState } from 'react';
import { X, Clock } from 'lucide-react';
import { Button } from '../ui/Button';
import type { TimesheetEntry } from '../../types/research.types';

interface TimesheetResearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  onSubmit: (entry: Omit<TimesheetEntry, 'id' | 'createdDate'>) => void;
}

export const TimesheetResearchModal: React.FC<TimesheetResearchModalProps> = ({
  isOpen,
  onClose,
  projectId,
  onSubmit,
}) => {
  const [formData, setFormData] = useState({
    teamMemberId: '',
    teamMemberName: '',
    date: new Date().toISOString().split('T')[0],
    hoursLogged: 0,
    description: '',
    researchCategory: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const categories = [
    'CFD Analysis',
    'FEA',
    'Vibration Analysis',
    'Thermal Analysis',
    'Research & Development',
    'Testing',
    'Documentation',
    'Other',
  ];

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.teamMemberId.trim()) newErrors.teamMemberId = 'Team member is required';
    if (!formData.date) newErrors.date = 'Date is required';
    if (formData.hoursLogged <= 0) newErrors.hoursLogged = 'Hours must be greater than 0';
    if (!formData.description.trim()) newErrors.description = 'Description is required';
    if (!formData.researchCategory) newErrors.researchCategory = 'Category is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    onSubmit({
      projectId,
      teamMemberId: formData.teamMemberId,
      teamMemberName: formData.teamMemberName,
      date: formData.date,
      hoursLogged: formData.hoursLogged,
      description: formData.description,
      researchCategory: formData.researchCategory,
      status: 'pending',
    });

    setFormData({
      teamMemberId: '',
      teamMemberName: '',
      date: new Date().toISOString().split('T')[0],
      hoursLogged: 0,
      description: '',
      researchCategory: '',
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-lg max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <Clock className="w-5 h-5 text-cyan-600" />
            <h2 className="text-lg font-semibold text-gray-900">Log Research Hours</h2>
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
          {/* Team Member */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Team Member Name
            </label>
            <input
              type="text"
              value={formData.teamMemberName}
              onChange={(e) => {
                handleInputChange('teamMemberName', e.target.value);
                handleInputChange('teamMemberId', e.target.value);
              }}
              placeholder="Enter team member name"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
            {errors.teamMemberId && <p className="text-red-500 text-xs mt-1">{errors.teamMemberId}</p>}
          </div>

          {/* Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date
            </label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => handleInputChange('date', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
            {errors.date && <p className="text-red-500 text-xs mt-1">{errors.date}</p>}
          </div>

          {/* Hours Logged */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Hours Logged
            </label>
            <input
              type="number"
              step="0.5"
              min="0"
              value={formData.hoursLogged}
              onChange={(e) => handleInputChange('hoursLogged', parseFloat(e.target.value) || 0)}
              placeholder="0"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
            {errors.hoursLogged && <p className="text-red-500 text-xs mt-1">{errors.hoursLogged}</p>}
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Research Category
            </label>
            <select
              value={formData.researchCategory}
              onChange={(e) => handleInputChange('researchCategory', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 bg-white"
            >
              <option value="">Select a category</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
            {errors.researchCategory && <p className="text-red-500 text-xs mt-1">{errors.researchCategory}</p>}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="What did you work on?"
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 resize-none"
            />
            {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description}</p>}
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <Button onClick={onClose} variant="outline" className="flex-1">
              Cancel
            </Button>
            <Button onClick={handleSubmit} className="flex-1">
              Log Hours
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
