import React, { useState } from 'react';
import { X, Calendar, Clock, FileText, Briefcase, FlaskConical } from 'lucide-react';
import { useProjectStore } from '../../store/projectStore';
import { useResearchStore } from '../../store/researchStore';
import { getCurrentUser } from '../../lib/auth';
import { toast } from 'react-hot-toast';
import { logger } from '../../lib/logger';

interface AddTimesheetModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AddTimesheetModal: React.FC<AddTimesheetModalProps> = ({ isOpen, onClose }) => {
  const { projects, addTimesheet } = useProjectStore();
  const { researchProjects } = useResearchStore();
  const currentUser = getCurrentUser();

  const [entryType, setEntryType] = useState<'project' | 'research'>('project');
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    projectId: '',
    researchId: '',
    workCategory: '',
    description: '',
    hours: 0,
  });

  // Filter projects/research based on entry type
  const availableProjects = projects; // No filter - show all projects
  // Ensure researchProjects is an array before filtering
  const projectsArray = Array.isArray(researchProjects) ? researchProjects : [];
  const availableResearch = projectsArray.filter(r => r.status === 'planning' || r.status === 'in-progress');

  const workCategories = [
    { value: 'engineering', label: 'Engineering' },
    { value: 'project-management', label: 'Project Management (E.g.: Business/Site Discussion, Proposal Preparation or Quotations)' },
    { value: 'measurement-site', label: 'Measurement (Site)' },
    { value: 'measurement-office', label: 'Measurement (Office)' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (entryType === 'project' && !formData.projectId) {
      toast.error('Please select a project');
      return;
    }

    if (entryType === 'research' && !formData.researchId) {
      toast.error('Please select a research project');
      return;
    }

    if (entryType === 'project' && !formData.workCategory) {
      toast.error('Please select a work category');
      return;
    }

    if (formData.hours <= 0) {
      toast.error('Please enter a valid number of hours');
      return;
    }

    // Get selected project details for display
    let itemCode: string = '';
    let itemType: string = '';

    if (entryType === 'project') {
      const selectedProject = projects.find(p => p.id === formData.projectId);
      itemCode = selectedProject?.projectCode || '';
      itemType = 'Project';
    } else {
      const selectedResearch = researchProjects.find(r => r.id === formData.researchId);
      itemCode = selectedResearch?.id || '';
      itemType = 'Research';
    }

    // Create timesheet entry (only for projects - research timesheets are separate)
    if (entryType === 'project') {
      const timesheetData = {
        date: formData.date,
        engineerId: currentUser?.userId || '',
        projectId: formData.projectId,
        workCategory: formData.workCategory as 'engineering' | 'project-management' | 'measurement-site' | 'measurement-office',
        description: formData.description,
        hours: formData.hours,
      };

      try {
        // Add to store - this will automatically sync with:
        // 1. Project actual hours
        // 2. Finance base cost calculations
        // 3. Timesheet list
        await addTimesheet(timesheetData);

        toast.success(
          `✅ Timesheet Entry Created!\n` +
          `${itemType}: ${itemCode}\n` +
          `Hours: ${formData.hours} hrs\n` +
          `Project hours and finance analytics updated!`
        );

        // Reset form
        setFormData({
          date: new Date().toISOString().split('T')[0],
          projectId: '',
          researchId: '',
          workCategory: '',
          description: '',
          hours: 0,
        });
        onClose();
      } catch (error) {
        toast.error('Failed to create timesheet entry');
        logger.error('Error creating timesheet:', error);
      }
    } else {
      // Research timesheet - ACTUAL IMPLEMENTATION
      const researchData = {
        projectId: formData.researchId,
        teamMemberId: currentUser?.userId || '',
        teamMemberName: currentUser?.displayName || '',
        date: formData.date,
        hoursLogged: formData.hours,
        description: formData.description,
        researchCategory: formData.workCategory || 'General',
        status: 'approved' as const,
      };

      try {
        await useResearchStore.getState().logTimesheetHours(formData.researchId, researchData);
        toast.success(
          `✅ Research Timesheet Entry Created!\n` +
          `Research: ${itemCode}\n` +
          `Hours: ${formData.hours} hrs`
        );
        // Reset form and close
        setFormData({
          date: new Date().toISOString().split('T')[0],
          projectId: '',
          researchId: '',
          workCategory: '',
          description: '',
          hours: 0,
        });
        onClose();
      } catch (error) {
        toast.error('Failed to create research timesheet entry');
        logger.error('Error:', error);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={onClose} />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-primary-50 to-primary-100">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Clock className="w-6 h-6 text-primary-600" />
                Add Timesheet Entry
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Log your work hours
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
            <div className="space-y-6">

              {/* Entry Type Selector */}
              <div className="bg-gray-50 rounded-lg p-4 border-2 border-gray-200">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  What are you working on? <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setEntryType('project');
                      setFormData(prev => ({ ...prev, researchId: '' }));
                    }}
                    className={`flex items-center justify-center gap-2 p-4 rounded-lg border-2 transition-all ${
                      entryType === 'project'
                        ? 'border-primary-500 bg-primary-50 text-primary-700'
                        : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    <Briefcase className="w-5 h-5" />
                    <span className="font-semibold">Project</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEntryType('research');
                      setFormData(prev => ({ ...prev, projectId: '' }));
                    }}
                    className={`flex items-center justify-center gap-2 p-4 rounded-lg border-2 transition-all ${
                      entryType === 'research'
                        ? 'border-purple-500 bg-purple-50 text-purple-700'
                        : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    <FlaskConical className="w-5 h-5" />
                    <span className="font-semibold">Research</span>
                  </button>
                </div>
              </div>

              {/* Date and Hours */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Calendar className="w-4 h-4 inline mr-1" />
                    Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Clock className="w-4 h-4 inline mr-1" />
                    Hours <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={formData.hours}
                    onChange={(e) => setFormData({ ...formData, hours: parseFloat(e.target.value) || 0 })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    required
                    step="0.1"
                    min="0"
                  />
                </div>
              </div>

              {/* Project OR Research Selection */}
              {entryType === 'project' ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Briefcase className="w-4 h-4 inline mr-1" />
                    Select Project <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.projectId}
                    onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    required
                  >
                    <option value="">Choose a project...</option>
                    {availableProjects.map((project) => (
                      <option key={project.id} value={project.id}>
                        {project.projectCode} - {project.title}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    Showing {availableProjects.length} active projects
                  </p>
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <FlaskConical className="w-4 h-4 inline mr-1" />
                    Select Research Project <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.researchId}
                    onChange={(e) => setFormData({ ...formData, researchId: e.target.value })}
                    className="w-full px-4 py-2 border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    required
                  >
                    <option value="">Choose a research project...</option>
                    {availableResearch.map((research) => (
                      <option key={research.id} value={research.id}>
                        {research.researchCode} - {research.title}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-purple-600 mt-1">
                    Showing {availableResearch.length} active research projects
                  </p>
                </div>
              )}

              {/* Work Category - Only show for Project timesheets */}
              {entryType === 'project' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <FileText className="w-4 h-4 inline mr-1" />
                    Work Category <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.workCategory}
                    onChange={(e) => setFormData({ ...formData, workCategory: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    required
                  >
                    <option value="">Select category...</option>
                    {workCategories.map((cat) => (
                      <option key={cat.value} value={cat.value}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <FileText className="w-4 h-4 inline mr-1" />
                  Description (Optional)
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe what you worked on..."
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              {/* Current User Info */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-primary-600 text-white rounded-full flex items-center justify-center font-bold">
                      {currentUser.displayName.charAt(0)}
                    </div>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{currentUser.displayName}</p>
                    <p className="text-xs text-gray-600">{currentUser.email}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      This entry will be logged under your account
                    </p>
                  </div>
                </div>
              </div>

              {/* Sync Info Notice */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-sm text-green-800">
                  <strong>✓ Auto-Sync Enabled:</strong> When you add a timesheet entry, it automatically updates:
                </p>
                <ul className="text-xs text-green-700 mt-2 ml-4 space-y-1 list-disc">
                  <li>Project actual hours</li>
                  <li>Finance base cost calculations</li>
                  <li>Timesheet reports</li>
                </ul>
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
              >
                Add Entry
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
