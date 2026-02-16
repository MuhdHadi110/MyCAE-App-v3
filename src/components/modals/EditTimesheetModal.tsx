import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { toast } from 'react-hot-toast';
import type { Timesheet, WorkCategory } from '../../types/project.types';
import { useProjectStore } from '../../store/projectStore';

interface EditTimesheetModalProps {
  isOpen: boolean;
  onClose: () => void;
  timesheet: Timesheet | null;
  onUpdate?: (timesheet: Timesheet) => void;
}

export const EditTimesheetModal: React.FC<EditTimesheetModalProps> = ({
  isOpen,
  onClose,
  timesheet,
  onUpdate,
}) => {
  const { projects } = useProjectStore();
  const [formData, setFormData] = useState({
    hours: 0,
    workCategory: 'engineering' as WorkCategory,
    description: '',
  });

  useEffect(() => {
    if (timesheet) {
      setFormData({
        hours: timesheet.hours,
        workCategory: timesheet.workCategory,
        description: timesheet.description || '',
      });
    }
  }, [timesheet, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.hours || formData.hours <= 0) {
      toast.error('Hours must be greater than 0');
      return;
    }

    if (formData.hours > 24) {
      toast.error('Hours cannot exceed 24 per day');
      return;
    }

    if (!formData.description.trim()) {
      toast.error('Description is required');
      return;
    }

    if (timesheet) {
      const updatedTimesheet: Timesheet = {
        ...timesheet,
        hours: formData.hours,
        workCategory: formData.workCategory,
        description: formData.description,
      };

      if (onUpdate) {
        onUpdate(updatedTimesheet);
      }

      toast.success('Timesheet updated successfully!');
      onClose();
    }
  };

  if (!isOpen || !timesheet) return null;

  const workCategories = [
    { value: 'engineering' as WorkCategory, label: 'Engineering' },
    { value: 'project-management' as WorkCategory, label: 'Project Management' },
    { value: 'measurement-site' as WorkCategory, label: 'Measurement (Site)' },
    { value: 'measurement-office' as WorkCategory, label: 'Measurement (Office)' },
  ];

  const project = projects.find((p) => p.id === timesheet.projectId);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-primary-50 to-primary-100 dark:from-gray-800 dark:to-gray-700">
          <h2 className="text-xl font-bold text-gray-900">Edit Timesheet Entry</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Project Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-600 uppercase font-semibold">Project</p>
                <p className="text-sm font-medium text-gray-900 mt-1">
                  {project?.projectCode} - {project?.title || 'Unknown'}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-600 uppercase font-semibold">Date</p>
                <p className="text-sm font-medium text-gray-900 mt-1">
                  {new Date(timesheet.date).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Hours */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Hours Worked *
              </label>
              <input
                type="number"
                step="0.5"
                min="0.5"
                max="24"
                value={formData.hours}
                onChange={(e) =>
                  setFormData({ ...formData, hours: parseFloat(e.target.value) })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="8"
              />
              <p className="text-xs text-gray-500 mt-1">Must be between 0.5 and 24 hours</p>
            </div>

            {/* Work Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Work Category *
              </label>
              <select
                value={formData.workCategory}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    workCategory: e.target.value as WorkCategory,
                  })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                {workCategories.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description *
              </label>
              <textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Describe what work was done..."
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
              >
                Update Entry
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
