import React, { useState, useEffect } from 'react';
import { X, User, Clock, FileText } from 'lucide-react';
import { useClientStore } from '../../store/clientStore';
import { useCompanyStore } from '../../store/companyStore';
import { useTeamStore } from '../../store/teamStore';
import { useProjectStore } from '../../store/projectStore';
import { useNotificationStore } from '../../store/notificationStore';
import { Button } from '../ui/Button';
import { toast } from 'react-hot-toast';
import { useModalFocus } from '../../hooks/useModalFocus';
import { logger } from '../../lib/logger';
import projectService from '../../services/project.service';

interface AddProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AddProjectModal: React.FC<AddProjectModalProps> = ({ isOpen, onClose }) => {
  const { clients, fetchClients, loading: clientsLoading } = useClientStore();
  const { companies, fetchCompanies, loading: companiesLoading } = useCompanyStore();
  const { teamMembers, fetchTeamMembers, loading: teamLoading } = useTeamStore();
  const { addProject } = useProjectStore();
  const { firstInputRef, closeButtonRef } = useModalFocus(isOpen);

  const [formData, setFormData] = useState({
    projectCode: '',
    title: '',
    companyId: '',
    contactId: '', // For contact selection
    leadEngineerId: '',
    managerId: '',
    plannedHours: '',
    hourlyRate: '',
    workTypes: [] as string[],
    description: '',
    status: 'pre-lim' as const,
    startDate: new Date().toISOString().split('T')[0],
  });

  const [latestProjectCode, setLatestProjectCode] = useState<{
    latestCode: string | null;
    nextSuggestion: string;
    yearPrefix: string;
    year: number;
  } | null>(null);
  const [fieldError, setFieldError] = useState<{
    projectCode: string | null;
  }>({ projectCode: null });
  const [isLoading, setIsLoading] = useState(false);

  // Fetch companies and team members when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchClients(); // Keep for backward compatibility
      fetchCompanies();
      fetchTeamMembers();
      // Fetch latest project code
      projectService.getNextProjectCode()
        .then(data => setLatestProjectCode(data))
        .catch(err => logger.error('Failed to fetch latest project code:', err));
    }
  }, [isOpen, fetchClients, fetchCompanies, fetchTeamMembers]);

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

  // Project Managers: Senior Engineers and above (senior-engineer, principal-engineer, manager, managing-director, admin)
  const projectManagers = teamMembers.filter(
    (tm) => tm.role === 'senior-engineer' || tm.role === 'principal-engineer' || tm.role === 'manager' || tm.role === 'managing-director' || tm.role === 'admin'
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.projectCode || !formData.title || !formData.companyId || !formData.managerId) {
      toast.error('Please fill in all required fields (Project Code, Title, Company, and Project Manager)');
      return;
    }

    // Validate project code format (J2XXXX)
    const projectCodeRegex = /^J\d{5}$/;
    if (!projectCodeRegex.test(formData.projectCode)) {
      toast.error('Project Code must be in format J2XXXX (e.g., J25001)');
      return;
    }

    setIsLoading(true);
    try {
      // Find the selected company to include company name in the payload
      const selectedCompany = companies.find(c => c.id === formData.companyId);

      const projectPayload = {
        ...formData,
        engineerId: formData.leadEngineerId,
        plannedHours: parseFloat(formData.plannedHours) || 0,
        hourlyRate: formData.hourlyRate ? parseFloat(formData.hourlyRate) : null,
        companyName: selectedCompany?.name || '', // Include company name so it's stored in the project
      };
      const result = await addProject(projectPayload);

      // Create in-app notifications for assigned team members
      const addNotification = useNotificationStore.getState().addNotification;

      // Add notification for project creation
      addNotification({
        type: 'success',
        title: 'Project Created',
        message: `${formData.title} (${formData.projectCode}) has been created successfully.`,
        category: 'project-assignment',
      });

      // Add notification for manager if assigned
      if (formData.managerId) {
        const manager = teamMembers.find(tm => tm.id === formData.managerId);
        if (manager) {
          addNotification({
            type: 'info',
            title: 'Project Assignment',
            message: `${manager.name} has been assigned as Project Manager for ${formData.title}.`,
            category: 'project-assignment',
          });
        }
      }

      // Add notification for lead engineer if assigned
      if (formData.leadEngineerId) {
        const leadEngineer = teamMembers.find(tm => tm.id === formData.leadEngineerId);
        if (leadEngineer) {
          addNotification({
            type: 'info',
            title: 'Project Assignment',
            message: `${leadEngineer.name} has been assigned as Lead Engineer for ${formData.title}.`,
            category: 'project-assignment',
          });
        }
      }

      toast.success(`Project created successfully!`);
      // Reset form and close
      setFormData({
        projectCode: '',
        title: '',
        companyId: '',
        contactId: '',
        leadEngineerId: '',
        managerId: '',
        plannedHours: '',
        hourlyRate: '',
        workTypes: [] as string[],
        description: '',
        status: 'pre-lim' as const,
        startDate: new Date().toISOString().split('T')[0],
      });
      setFieldError({ projectCode: null });
      onClose();
    } catch (error: any) {
      // Handle AxiosError specifically
      if (error?.isAxiosError) {
        logger.axiosError('Failed to create project', error);

        const errorMessage = error?.response?.data?.error || error?.response?.data?.message || error?.message || String(error);

        if (errorMessage.includes('already exists') && errorMessage.includes('Project code')) {
          setFieldError({ projectCode: 'This code already exists' });
          toast.error(
            `Project code "${formData.projectCode}" already exists. Please use a different code.`,
            {
              duration: 5000,
            }
          );
        } else {
          setFieldError({ projectCode: null });
          toast.error('Failed to create project: ' + errorMessage);
        }
      } else {
        // Non-Axios error (shouldn't happen but handle gracefully)
        logger.error('Failed to create project:', error);
        toast.error('Failed to create project: ' + (error?.message || String(error)));
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 transition-opacity" onClick={onClose} />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-primary-50 to-primary-100 dark:from-gray-800 dark:to-gray-700">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Create New Project</h2>
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
               {/* Project Code */}
               <div>
                 <label htmlFor="projectCode" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                   Project Code <span className="text-red-500">*</span>
                 </label>
                 <input
                   id="projectCode"
                   type="text"
                   ref={firstInputRef as any}
                   value={formData.projectCode}
                   onChange={(e) => {
                     setFormData({ ...formData, projectCode: e.target.value.toUpperCase() });
                     setFieldError({ projectCode: null });
                   }}
                   placeholder="e.g., J25001"
                   pattern="^J\d{5}$"
                   className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 ${
                     fieldError.projectCode
                       ? 'border-red-500 dark:border-red-500 bg-red-50 dark:bg-red-900/10'
                       : 'border-gray-300 dark:border-gray-600'
                   }`}
                   required
                   aria-describedby="projectCodeHint"
                 />
                 {fieldError.projectCode && (
                   <p className="text-red-500 text-xs mt-1">{fieldError.projectCode}</p>
                 )}
                 <p id="projectCodeHint" className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                   Format: J2XXXX (e.g., J25001)
                   {latestProjectCode && (
                     <>
                       <span className="mx-2">|</span>
                       <span className="text-gray-900 font-medium">Latest: {latestProjectCode.latestCode || 'None'}</span>
                       <span className="mx-2">|</span>
                       <span className="text-green-700 font-medium">Suggested: {latestProjectCode.nextSuggestion}</span>
                     </>
                   )}
                 </p>
               </div>

              {/* Title */}
              <div>
                <label htmlFor="projectTitle" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Project Title <span className="text-red-500">*</span>
                </label>
                <input
                  id="projectTitle"
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., Equipment Vibration Analysis"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                  required
                  autoComplete="off"
                />
              </div>

              {/* Contact, Manager, Lead Engineer */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="contact" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <User className="w-4 h-4 inline mr-1" />
                    Contact <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="contact"
                    value={formData.contactId}
                    onChange={(e) => {
                      const contactId = e.target.value;
                      // Find the company that has this contact
                      const company = companies.find(c => c.contacts.some(contact => contact.id === contactId));
                      setFormData({
                        ...formData,
                        contactId: contactId,
                        companyId: company?.id || ''
                      });
                    }}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white grouped-select"
                    disabled={companiesLoading}
                    required
                  >
                    <option value="">
                      {companiesLoading ? 'Loading contacts...' : companies.length === 0 ? 'No contacts available' : 'Select Contact'}
                    </option>
                    {companies.map((company) => (
                      <optgroup key={company.id} label={company.name}>
                        {company.contacts.map((contact) => (
                          <option key={contact.id} value={contact.id}>
                            {contact.name} {contact.position ? `(${contact.position})` : ''}
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="manager" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <User className="w-4 h-4 inline mr-1" />
                    Project Manager <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="manager"
                    value={formData.managerId}
                    onChange={(e) => setFormData({ ...formData, managerId: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    disabled={teamLoading}
                    required
                    aria-describedby="managerHint"
                  >
                    <option value="">
                      {teamLoading ? 'Loading...' : projectManagers.length === 0 ? 'No managers available' : 'Select Project Manager'}
                    </option>
                    {projectManagers.map((pm) => (
                      <option key={pm.id} value={pm.id}>
                        {pm.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="leadEngineer" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <User className="w-4 h-4 inline mr-1" />
                    Lead Engineer
                  </label>
                  <select
                    id="leadEngineer"
                    value={formData.leadEngineerId}
                    onChange={(e) => setFormData({ ...formData, leadEngineerId: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    disabled={teamLoading}
                  >
                    <option value="">
                      {teamLoading ? 'Loading...' : leadEngineers.length === 0 ? 'No engineers available' : 'Select Lead Engineer'}
                    </option>
                    {leadEngineers.map((engineer) => (
                      <option key={engineer.id} value={engineer.id}>
                        {engineer.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Field of Work Checkboxes */}
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
                <label htmlFor="plannedHours" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <Clock className="w-4 h-4 inline mr-1" />
                  Planned Hours
                </label>
                <input
                  id="plannedHours"
                  type="number"
                  value={formData.plannedHours}
                  onChange={(e) => setFormData({ ...formData, plannedHours: e.target.value })}
                  placeholder="e.g., 120"
                  min="0"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                />
              </div>

              {/* Hourly Rate */}
              <div>
                <label htmlFor="hourlyRate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Hourly Rate (MYR)
                  <span className="text-xs text-gray-500 font-normal ml-2">(Optional)</span>
                </label>
                <input
                  id="hourlyRate"
                  type="number"
                  step="0.01"
                  value={formData.hourlyRate}
                  onChange={(e) => setFormData({ ...formData, hourlyRate: e.target.value })}
                  placeholder="e.g., 500"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Leave blank to use default RM 437.50/hr
                </p>
              </div>

              {/* Description */}
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <FileText className="w-4 h-4 inline mr-1" />
                  Description
                </label>
                <textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe the project scope and objectives..."
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isLoading}
                ref={closeButtonRef}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={isLoading}
              >
                {isLoading ? 'Creating...' : 'Create Project'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};