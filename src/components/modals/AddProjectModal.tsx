import React, { useState, useRef, useEffect } from 'react';
import { X, Calendar, User, Clock, FileText } from 'lucide-react'; // User icon kept for Client/Manager/Lead Engineer fields
import { useClientStore } from '../../store/clientStore';
import { useTeamStore } from '../../store/teamStore';
import { useProjectStore } from '../../store/projectStore';
import { useNotificationStore } from '../../store/notificationStore';
import { Button } from '../ui/Button';
import { toast } from 'react-hot-toast';
import { useModalFocus } from '../../hooks/useModalFocus';

interface AddProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AddProjectModal: React.FC<AddProjectModalProps> = ({ isOpen, onClose }) => {
  const { clients, fetchClients, loading: clientsLoading } = useClientStore();
  const { teamMembers, fetchTeamMembers, loading: teamLoading } = useTeamStore();
  const { addProject } = useProjectStore();
  const { firstInputRef, closeButtonRef } = useModalFocus(isOpen);

  // Fetch clients and team members when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchClients();
      fetchTeamMembers();
    }
  }, [isOpen, fetchClients, fetchTeamMembers]);

  const [formData, setFormData] = useState({
    projectCode: '',
    title: '',
    clientId: '',
    leadEngineerId: '',
    managerId: '',
    plannedHours: '',
    workTypes: [] as string[],
    description: '',
    status: 'pre-lim' as const,
    startDate: new Date().toISOString().split('T')[0],
  });

  const [isLoading, setIsLoading] = useState(false);

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

  const leadEngineers = teamMembers.filter(
    (tm) => tm.role === 'senior-engineer' || tm.role === 'principal-engineer' || tm.role === 'engineer'
  );

  // Project Managers: Senior Engineers and above (senior-engineer, principal-engineer, manager, admin)
  const projectManagers = teamMembers.filter(
    (tm) => tm.role === 'senior-engineer' || tm.role === 'principal-engineer' || tm.role === 'manager' || tm.role === 'admin'
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.projectCode || !formData.title || !formData.clientId || !formData.managerId) {
      toast.error('Please fill in all required fields (Project Code, Title, Client, and Project Manager)');
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
      const projectPayload = {
        ...formData,
        engineerId: formData.leadEngineerId,
        plannedHours: parseFloat(formData.plannedHours) || 0,
      };
      console.log('Creating project with payload:', projectPayload);
      const result = await addProject(projectPayload);
      console.log('Project creation result:', result);

      // Create in-app notifications for assigned team members
      const addNotification = useNotificationStore.getState().addNotification;
      const selectedClient = clients.find(c => c.id === formData.clientId);

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
        clientId: '',
        leadEngineerId: '',
        managerId: '',
        plannedHours: '',
        workTypes: [] as string[],
        description: '',
        status: 'pre-lim' as const,
        startDate: new Date().toISOString().split('T')[0],
      });
      onClose();
    } catch (error) {
      console.error('Failed to create project:', error);
      toast.error('Failed to create project: ' + (error instanceof Error ? error.message : String(error)));
    } finally {
      setIsLoading(false);
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
            <h2 className="text-2xl font-bold text-gray-900">Create New Project</h2>
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
              {/* Project Code */}
              <div>
                <label htmlFor="projectCode" className="block text-sm font-medium text-gray-700 mb-2">
                  Project Code <span className="text-red-500">*</span>
                </label>
                <input
                  id="projectCode"
                  type="text"
                  ref={firstInputRef as any}
                  value={formData.projectCode}
                  onChange={(e) => setFormData({ ...formData, projectCode: e.target.value.toUpperCase() })}
                  placeholder="e.g., J25001"
                  pattern="^J\d{5}$"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  required
                  aria-describedby="projectCodeHint"
                />
                <p id="projectCodeHint" className="text-xs text-gray-500 mt-1">Format: J followed by 5 digits (e.g., J25001)</p>
              </div>

              {/* Title */}
              <div>
                <label htmlFor="projectTitle" className="block text-sm font-medium text-gray-700 mb-2">
                  Project Title <span className="text-red-500">*</span>
                </label>
                <input
                  id="projectTitle"
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., Equipment Vibration Analysis"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  required
                  autoComplete="off"
                />
              </div>

              {/* Client, Manager, Lead Engineer */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="client" className="block text-sm font-medium text-gray-700 mb-2">
                    <User className="w-4 h-4 inline mr-1" />
                    Client <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="client"
                    value={formData.clientId}
                    onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    disabled={clientsLoading}
                    required
                  >
                    <option value="">
                      {clientsLoading ? 'Loading clients...' : clients.length === 0 ? 'No clients available' : 'Select Client'}
                    </option>
                    {clients.map((client) => (
                      <option key={client.id} value={client.id}>
                        {client.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="manager" className="block text-sm font-medium text-gray-700 mb-2">
                    <User className="w-4 h-4 inline mr-1" />
                    Project Manager <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="manager"
                    value={formData.managerId}
                    onChange={(e) => setFormData({ ...formData, managerId: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    disabled={teamLoading}
                    required
                    aria-describedby="managerHint"
                  >
                    <option value="">
                      {teamLoading ? 'Loading...' : projectManagers.length === 0 ? 'No managers available' : 'Select Project Manager'}
                    </option>
                    {projectManagers.map((pm) => (
                      <option key={pm.id} value={pm.id}>
                        {pm.name} - {pm.role}
                      </option>
                    ))}
                  </select>
                  <p id="managerHint" className="text-xs text-gray-500 mt-1">
                    Only Senior Engineers and above can be Project Managers
                  </p>
                </div>

                <div>
                  <label htmlFor="leadEngineer" className="block text-sm font-medium text-gray-700 mb-2">
                    <User className="w-4 h-4 inline mr-1" />
                    Lead Engineer
                  </label>
                  <select
                    id="leadEngineer"
                    value={formData.leadEngineerId}
                    onChange={(e) => setFormData({ ...formData, leadEngineerId: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    disabled={teamLoading}
                  >
                    <option value="">
                      {teamLoading ? 'Loading...' : leadEngineers.length === 0 ? 'No engineers available' : 'Select Lead Engineer'}
                    </option>
                    {leadEngineers.map((engineer) => (
                      <option key={engineer.id} value={engineer.id}>
                        {engineer.name} - {engineer.position}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Field of Work Checkboxes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Field of Work
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {workTypes.map((type) => (
                    <label key={type} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData.workTypes.includes(type)}
                        onChange={() => handleWorkTypeChange(type)}
                        className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      />
                      <span className="text-sm text-gray-700">{type}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Planned Hours */}
              <div>
                <label htmlFor="plannedHours" className="block text-sm font-medium text-gray-700 mb-2">
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              {/* Description */}
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                  <FileText className="w-4 h-4 inline mr-1" />
                  Description
                </label>
                <textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe the project scope and objectives..."
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-gray-200">
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