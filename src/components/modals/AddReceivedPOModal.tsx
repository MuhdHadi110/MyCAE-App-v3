import React, { useState, useEffect } from 'react';
import { X, Upload } from 'lucide-react';
import { toast } from 'react-hot-toast';
import financeService from '../../services/api.service';
import { useProjectStore } from '../../store/projectStore';
import { useClientStore } from '../../store/clientStore';
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
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [exchangeRate, setExchangeRate] = useState<number>(1.0);
  const [convertedAmount, setConvertedAmount] = useState<number>(0);
  const { projects, fetchProjects } = useProjectStore();
  const { clients, fetchClients} = useClientStore();

  useEffect(() => {
    if (isOpen) {
      fetchClients();
      fetchProjects();
    }
  }, [isOpen, fetchClients, fetchProjects]);

  // Fetch exchange rate when currency or amount changes
  useEffect(() => {
    const fetchRate = async () => {
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
    };
    fetchRate();
  }, [formData.currency, formData.amount]);

  // Auto-populate client when project is selected
  useEffect(() => {
    if (formData.projectId && projects.length > 0 && clients.length > 0) {
      const selectedProject = projects.find(p => p.id === formData.projectId);
      if (selectedProject && selectedProject.clientId) {
        // Find the matching client
        const matchingClient = clients.find(c => c.id === selectedProject.clientId);

        // Only auto-populate if client isn't already set or is different
        if (matchingClient && formData.clientId !== selectedProject.clientId) {
          setFormData(prev => ({
            ...prev,
            clientId: selectedProject.clientId,
            clientName: matchingClient.name || ''
          }));
        }
      }
    }
  }, [formData.projectId, projects, clients]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.poNumber || !formData.clientId || !formData.amount || !formData.receivedDate) {
      toast.error('Please fill in all required fields');
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
      });
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
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
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

            {/* Client Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Client Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="clientName"
                value={formData.clientName}
                readOnly
                disabled
                required
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-gray-100 text-gray-700 cursor-not-allowed"
                placeholder="Auto-filled from project"
              />
              <p className="text-xs text-gray-500 mt-1">
                Client is automatically selected based on the project
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
                  const selectedProject = projects.find(p => p.id === e.target.value);

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
                    setFormData({
                      ...formData,
                      projectId: e.target.value,
                      projectCode: selectedProject?.projectCode || ''
                      // Client will be auto-populated by useEffect
                    });
                  }
                }}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="">Select a project</option>
                {projects
                  .filter(p => p.status === 'pre-lim')
                  .map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.projectCode} - {project.title}
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
                <p className="text-xs text-gray-600 mt-1">
                  ≈ RM {convertedAmount.toFixed(2)} (Rate: {exchangeRate.toFixed(6)})
                </p>
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
              placeholder="Brief description of the PO items/services..."
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
