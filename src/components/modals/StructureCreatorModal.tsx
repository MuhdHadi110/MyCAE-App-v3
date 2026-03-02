import React, { useState, useEffect } from 'react';
import { X, FolderPlus, Building2 } from 'lucide-react';
import { useTeamStore } from '../../store/teamStore';
import { useCompanyStore } from '../../store/companyStore';
import { Button } from '../ui/Button';
import { toast } from 'react-hot-toast';
import { useModalFocus } from '../../hooks/useModalFocus';
import { logger } from '../../lib/logger';
import projectService from '../../services/project.service';
import type { Project } from '../../types/project.types';

interface StructureCreatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  container: Project | null;
  onStructureCreated: () => void;
}

export const StructureCreatorModal: React.FC<StructureCreatorModalProps> = ({
  isOpen,
  onClose,
  container,
  onStructureCreated,
}) => {
  const { teamMembers, fetchTeamMembers, loading: teamLoading } = useTeamStore();
  const { companies, fetchCompanies, loading: companiesLoading } = useCompanyStore();
  const { firstInputRef, closeButtonRef } = useModalFocus(isOpen);

  const [formData, setFormData] = useState({
    title: '',
    structureNumber: 1,
    leadEngineerId: '',
    managerId: '',
    plannedHours: '',
    billingType: 'hourly' as 'hourly' | 'lump_sum',
    workTypes: [] as string[],
    description: '',
  });

  const [isLoading, setIsLoading] = useState(false);
  const [structureCode, setStructureCode] = useState('');

  // Fetch data and calculate next structure number when modal opens
  useEffect(() => {
    if (isOpen && container) {
      fetchTeamMembers();
      fetchCompanies();
      
      // Calculate next structure number
      projectService.getStructures(container.id)
        .then((data) => {
          const existingStructures = data.structures || [];
          const maxNumber = existingStructures.reduce((max: number, s: any) => {
            const match = s.projectCode.match(/_(\d+)$/);
            return match ? Math.max(max, parseInt(match[1], 10)) : max;
          }, 0);
          const nextNumber = maxNumber + 1;
          
          setFormData(prev => ({
            ...prev,
            structureNumber: nextNumber,
            leadEngineerId: container.leadEngineerId || '',
            managerId: container.managerId || '',
          }));
          setStructureCode(`${container.projectCode}_${nextNumber}`);
        })
        .catch((err) => {
          logger.error('Failed to fetch structures:', err);
          setStructureCode(`${container.projectCode}_1`);
        });
    }
  }, [isOpen, container, fetchTeamMembers, fetchCompanies]);

  const workTypes = [
    'Computational Fluid Dynamics',
    'Finite Element Analysis',
    'Vibration',
    'Acoustics',
  ];

  const handleWorkTypeChange = (type: string) => {
    setFormData((prev) => {
      const workTypes = prev.workTypes.includes(type)
        ? prev.workTypes.filter((t) => t !== type)
        : [...prev.workTypes, type];
      return { ...prev, workTypes };
    });
  };

  // All staff can be lead engineers
  const leadEngineers = teamMembers;

  // Project Managers
  const projectManagers = teamMembers.filter(
    (tm) =>
      tm.role === 'senior-engineer' ||
      tm.role === 'principal-engineer' ||
      tm.role === 'manager' ||
      tm.role === 'managing-director' ||
      tm.role === 'admin'
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!container) {
      toast.error('Container project not found');
      return;
    }

    if (!formData.title) {
      toast.error('Title is required');
      return;
    }

    setIsLoading(true);
    try {
      const structureData = {
        title: formData.title,
        leadEngineerId: formData.leadEngineerId || container.leadEngineerId,
        managerId: formData.managerId || container.managerId,
        plannedHours: parseFloat(formData.plannedHours) || 0,
        billingType: formData.billingType,
        workTypes: formData.workTypes,
        description: formData.description,
      };

      const result = await projectService.createStructure(container.id, structureData);

      toast.success(`Structure ${result.structureCode} created successfully!`);
      
      // Reset form
      setFormData({
        title: '',
        structureNumber: formData.structureNumber + 1,
        leadEngineerId: container.leadEngineerId || '',
        managerId: container.managerId || '',
        plannedHours: '',
        billingType: 'hourly',
        workTypes: [],
        description: '',
      });
      setStructureCode(`${container.projectCode}_${formData.structureNumber + 1}`);
      
      onStructureCreated();
      onClose();
    } catch (error: any) {
      logger.error('Failed to create structure:', error);
      const errorMessage = error?.response?.data?.error || error?.message || 'Unknown error';
      toast.error('Failed to create structure: ' + errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen || !container) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-gray-800 dark:to-gray-700">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <FolderPlus className="w-6 h-6 text-amber-600" />
                Add Project
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Creating project for{' '}
                <span className="font-semibold text-amber-700 dark:text-amber-400">
                  {container.projectCode}
                </span>
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
            <div className="space-y-6">
              {/* Project Code Display */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Project Code
                </label>
                <div className="flex items-center gap-3">
                  <span className="text-2xl font-bold text-blue-700 dark:text-blue-400 font-mono">
                    {structureCode}
                  </span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    (auto-generated)
                  </span>
                </div>
              </div>

              {/* Title */}
              <div>
                <label
                  htmlFor="structureTitle"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  Project Title <span className="text-red-500">*</span>
                </label>
                <input
                  id="structureTitle"
                  type="text"
                  ref={firstInputRef as any}
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., YPM1180 Structure 1"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                  required
                  autoComplete="off"
                />
              </div>

              {/* Billing Type */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Billing Type <span className="text-red-500">*</span>
                </h3>
                <div className="flex gap-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="billingType"
                      value="hourly"
                      checked={formData.billingType === 'hourly'}
                      onChange={(e) =>
                        setFormData({ ...formData, billingType: e.target.value as 'hourly' | 'lump_sum' })
                      }
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Hourly Rate</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="billingType"
                      value="lump_sum"
                      checked={formData.billingType === 'lump_sum'}
                      onChange={(e) =>
                        setFormData({ ...formData, billingType: e.target.value as 'hourly' | 'lump_sum' })
                      }
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Lump Sum</span>
                  </label>
                </div>
              </div>

              {/* Lead Engineer & Manager */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Lead Engineer
                  </label>
                  <select
                    value={formData.leadEngineerId}
                    onChange={(e) => setFormData({ ...formData, leadEngineerId: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    disabled={teamLoading}
                  >
                    <option value="">
                      {teamLoading ? 'Loading...' : leadEngineers.length === 0 ? 'No engineers' : 'Select Lead Engineer'}
                    </option>
                    {leadEngineers.map((engineer) => (
                      <option key={engineer.id} value={engineer.id}>
                        {engineer.name}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Default: {container.engineerName || 'None'}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Project Manager
                  </label>
                  <select
                    value={formData.managerId}
                    onChange={(e) => setFormData({ ...formData, managerId: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    disabled={teamLoading}
                  >
                    <option value="">
                      {teamLoading ? 'Loading...' : projectManagers.length === 0 ? 'No managers' : 'Select Manager'}
                    </option>
                    {projectManagers.map((pm) => (
                      <option key={pm.id} value={pm.id}>
                        {pm.name}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Default: {container.managerName || 'None'}
                  </p>
                </div>
              </div>

              {/* Field of Work */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Field of Work
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {workTypes.map((type) => (
                    <label key={type} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData.workTypes.includes(type)}
                        onChange={() => handleWorkTypeChange(type)}
                        className="h-4 w-4 rounded border-gray-300 dark:border-gray-600 text-primary-600 focus:ring-primary-500 bg-white dark:bg-gray-700"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">{type}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Planned Hours */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Planned Hours
                </label>
                <input
                  type="number"
                  value={formData.plannedHours}
                  onChange={(e) => setFormData({ ...formData, plannedHours: e.target.value })}
                  placeholder="e.g., 120"
                  min="0"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe the structure scope..."
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
              <Button type="button" variant="outline" onClick={onClose} disabled={isLoading} ref={closeButtonRef}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" disabled={isLoading}>
                {isLoading ? 'Creating...' : 'Create Project'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
