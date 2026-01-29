import React, { useState, useEffect } from 'react';
import { X, Upload } from 'lucide-react';
import { toast } from 'react-hot-toast';
import financeService from '../../services/api.service';
import { useProjectStore } from '../../store/projectStore';
import { useClientStore } from '../../store/clientStore';
import { useCompanyStore } from '../../store/companyStore';
import { CurrencySelector } from '../ui/CurrencySelector';
import { logger } from '../../lib/logger';

interface AddReceivedPOModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AddReceivedPOModal: React.FC<AddReceivedPOModalProps> = ({ isOpen, onClose }) => {
  const [formData, setFormData] = useState({
    poNumber: '',
    clientId: '',
    clientName: '',
    projectId: '',
    projectCode: '',
    amount: '',
    currency: 'MYR',
    receivedDate: new Date().toISOString().split('T')[0],
    dueDate: '',
    description: '',
    plannedHours: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [exchangeRate, setExchangeRate] = useState<number>(1.0);
  const [convertedAmount, setConvertedAmount] = useState<number>(0);
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [useCustomRate, setUseCustomRate] = useState(false);
  const [customRateValue, setCustomRateValue] = useState('');
  const { projects, fetchProjects } = useProjectStore();
  const { clients, fetchClients } = useClientStore();
  const { companies, fetchCompanies } = useCompanyStore();

  useEffect(() => {
    if (isOpen) {
      fetchClients();
      fetchProjects();
      fetchCompanies();
    }
  }, [isOpen, fetchClients, fetchProjects, fetchCompanies]);

  // Fetch exchange rate when currency or amount changes
  useEffect(() => {
    const fetchRate = async () => {
      if (formData.currency === 'MYR') {
        setExchangeRate(1.0);
        setConvertedAmount(parseFloat(formData.amount) || 0);
        return;
      }

      if (useCustomRate && customRateValue) {
        // Use custom rate
        const rate = parseFloat(customRateValue);
        setExchangeRate(rate);
        setConvertedAmount(parseFloat(formData.amount) * rate);
      } else if (!useCustomRate) {
        // Auto-fetch rate
        if (formData.currency !== 'MYR' && formData.amount) {
          try {
            const result = await financeService.convertCurrency(
              parseFloat(formData.amount),
              formData.currency
            );
            setExchangeRate(result.rate);
            setConvertedAmount(result.amountMYR);
          } catch (error) {
            logger.error('Failed to fetch exchange rate:', error);
            setExchangeRate(1.0);
            setConvertedAmount(parseFloat(formData.amount) || 0);
          }
        } else {
          setExchangeRate(1.0);
          setConvertedAmount(parseFloat(formData.amount) || 0);
        }
      }
    };
    fetchRate();
  }, [formData.currency, formData.amount, useCustomRate, customRateValue]);

  // Update selected project when projectId changes (for displaying current planned hours)
  useEffect(() => {
    if (formData.projectId && projects.length > 0) {
      const project = projects.find(p => p.id === formData.projectId);
      setSelectedProject(project);
    } else {
      setSelectedProject(null);
    }
  }, [formData.projectId, projects]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Debug: Log current form data
    logger.debug('Form data on submit:', {
      poNumber: formData.poNumber,
      projectCode: formData.projectCode,
      clientName: formData.clientName,
      amount: formData.amount,
      receivedDate: formData.receivedDate,
    });

    if (!formData.poNumber || !formData.amount || !formData.receivedDate || !formData.projectCode || !formData.clientName) {
      const missingFields: string[] = [];
      if (!formData.poNumber) missingFields.push('PO Number');
      if (!formData.projectCode) missingFields.push('Project Code');
      if (!formData.clientName) missingFields.push('Client Name');
      if (!formData.amount) missingFields.push('Amount');
      if (!formData.receivedDate) missingFields.push('Received Date');

      logger.error('Missing required fields:', missingFields);
      toast.error(`Please fill in all required fields. Missing: ${missingFields.join(', ')}`);
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await financeService.createPurchaseOrder({
        poNumber: formData.poNumber,
        clientName: formData.clientName,
        projectCode: formData.projectCode || '',
        amount: parseFloat(formData.amount),
        currency: formData.currency,
        receivedDate: formData.receivedDate,
        dueDate: formData.dueDate || undefined,
        description: formData.description || undefined,
        plannedHours: formData.plannedHours ? parseFloat(formData.plannedHours) : undefined,
        customExchangeRate: useCustomRate ? parseFloat(customRateValue) : undefined,
      });

      logger.debug('PO created successfully:', response);

      // Show appropriate success message
      if (response.projectStatusUpdated) {
        toast.success(
          `PO ${formData.poNumber} created successfully! Project ${formData.projectCode} status updated to 'ongoing'.`,
          { duration: 5000 }
        );
      } else {
        toast.success(`PO ${formData.poNumber} created successfully!`);
      }

      // Refresh projects to show updated status
      await fetchProjects();

      onClose();

      // Reset form
      setFormData({
        poNumber: '',
        clientId: '',
        clientName: '',
        projectId: '',
        projectCode: '',
        amount: '',
        currency: 'MYR',
        receivedDate: new Date().toISOString().split('T')[0],
        dueDate: '',
        description: '',
        plannedHours: '',
      });
      setSelectedProject(null);
    } catch (error: any) {
      logger.error('Failed to create PO:', error);
      const errorMessage = error?.response?.data?.error || 'Failed to create purchase order';
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white">
          <h2 className="text-2xl font-bold text-gray-900">Add Received PO</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* PO Number */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                PO Number <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="poNumber"
                value={formData.poNumber}
                onChange={handleChange}
                required
                placeholder="e.g., PO-2025-001"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>

            {/* Company Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Company Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="clientName"
                value={formData.clientName}
                onChange={handleChange}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Auto-filled from project or enter manually"
              />
              <p className="text-xs text-gray-500 mt-1">
                Auto-filled from project or enter manually if needed
              </p>
            </div>

            {/* Project Code */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Project Code <span className="text-red-500">*</span>
              </label>
              <select
                required
                name="projectId"
                value={formData.projectId}
                onChange={(e) => {
                  console.log('Project dropdown changed:', e.target.value);
                  const project = projects.find(p => p.id === e.target.value);
                  console.log('Found project:', project);

                  if (e.target.value === '') {
                    // If clearing project, also clear client
                    setFormData({
                      ...formData,
                      projectId: '',
                      projectCode: '',
                      clientId: '',
                      clientName: ''
                    });
                  } else {
                    // Try to find client/company in multiple places
                    // 1. Try ClientStore (legacy)
                    let matchingClient: any = project?.companyId
                      ? clients.find(c => c.id === project.companyId)
                      : null;

                    // 2. Try CompanyStore (newer system)
                    if (!matchingClient && project?.companyId) {
                      matchingClient = companies.find(c => c.id === project.companyId);
                    }

                    console.log('Matching client from stores:', matchingClient);
                    console.log('Project clientName:', project?.companyName);

                    // Use client name from: 1) matching client/company, 2) project.clientName, 3) 'Unknown Client' as fallback
                    const clientName = matchingClient?.name || project?.companyName || 'Unknown Client';

                    console.log('Final client name:', clientName);

                    setFormData({
                      ...formData,
                      projectId: e.target.value,
                      projectCode: project?.projectCode || '',
                      clientId: project?.companyId || '',
                      clientName: clientName
                    });

                    if (clientName && clientName !== 'Unknown Client') {
                      logger.debug('Auto-populated client:', clientName, 'from', matchingClient ? 'store lookup' : 'project data');
                    } else {
                      logger.warn('No client name available for project:', project?.projectCode, '- clientId:', project?.companyId);
                    }
                  }
                }}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="">Select a project</option>
                {projects
                  .filter(p => p.status === 'pre-lim' || p.status === 'ongoing')
                  .map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.projectCode} - {project.title} ({project.status === 'pre-lim' ? 'Pre-lim' : 'Ongoing'})
                    </option>
                  ))}
              </select>
            </div>

            {/* Amount and Currency */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Amount <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  name="amount"
                  value={formData.amount}
                  onChange={handleChange}
                  required
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
                <CurrencySelector
                  value={formData.currency}
                  onChange={(currency) => setFormData({ ...formData, currency })}
                />
                </div>
               {formData.currency !== 'MYR' && formData.amount && (
                 <div className="mt-2 space-y-2">
                   <label className="flex items-center gap-2">
                     <input
                       type="checkbox"
                       checked={useCustomRate}
                       onChange={(e) => setUseCustomRate(e.target.checked)}
                       className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                     />
                     <span className="text-sm font-medium text-gray-700">Use custom exchange rate</span>
                   </label>

                   {useCustomRate && (
                     <div className="flex items-center gap-2">
                       <input
                         type="number"
                         step="0.000001"
                         min="0"
                         value={customRateValue}
                         onChange={(e) => setCustomRateValue(e.target.value)}
                         placeholder="e.g., 3.45"
                         className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                       />
                       <span className="text-sm text-gray-600">→ RM {convertedAmount.toFixed(2)}</span>
                     </div>
                   )}

                   {!useCustomRate && (
                     <p className="text-xs text-gray-600">
                       Using system rate: {exchangeRate.toFixed(6)} → RM {convertedAmount.toFixed(2)}
                     </p>
                   )}
                 </div>
               )}
             </div>

            {/* Received Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Received Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                name="receivedDate"
                value={formData.receivedDate}
                onChange={handleChange}
                required
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>

            {/* Due Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Due Date
              </label>
              <input
                type="date"
                name="dueDate"
                value={formData.dueDate}
                onChange={handleChange}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Update Planned Hours (Optional) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Update Project Planned Hours
              <span className="text-xs text-gray-500 font-normal">(Optional)</span>
            </label>
            {selectedProject && selectedProject.plannedHours && (
              <p className="text-xs text-blue-600 mb-2">
                Current: {selectedProject.plannedHours} hrs
              </p>
            )}
            <div className="flex items-center gap-2">
              <input
                type="number"
                name="plannedHours"
                value={formData.plannedHours}
                onChange={handleChange}
                min="0"
                step="1"
                placeholder="Enter new planned hours (optional)"
                className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
              {formData.plannedHours && (
                <p className="text-xs text-gray-500">
                  Will overwrite current value
                </p>
              )}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              placeholder="Brief description of PO items/services..."
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
            />
          </div>

          {/* File Upload Note */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-2">
              <Upload className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-blue-900 mb-1">Attach PO Document</p>
                <p className="text-xs text-blue-700">
                  After creating the PO, you can upload documents in the PO details view.
                </p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Creating...' : 'Add Received PO'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
