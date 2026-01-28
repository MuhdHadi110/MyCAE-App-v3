import React, { useState, useEffect } from 'react';
import { X, Upload, Save } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useProjectStore } from '../../store/projectStore';
import { useCompanyStore } from '../../store/companyStore';
import { logger } from '../../lib/logger';
import { getCurrentUser } from '../../lib/auth';
import { checkPermission } from '../../lib/permissions';

interface EditPOModalProps {
  isOpen: boolean;
  po: any;
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
}

export const EditPOModal: React.FC<EditPOModalProps> = ({ isOpen, po, onClose, onSave }) => {
  const { projects, fetchProjects } = useProjectStore();
  const { companies, fetchCompanies } = useCompanyStore();

  const [formData, setFormData] = useState<{
    poNumber: string;
    projectId: string;
    projectCode: string;
    companyId: string;
    companyName: string;
    amount: string;
    currency: string;
    receivedDate: string;
    dueDate: string;
    description: string;
    status: string;
    fileUrl: string;
  }>({
    poNumber: po?.po_number || '',
    projectId: '',
    projectCode: '',
    companyId: '',
    companyName: po?.company_name || '',
    amount: po?.amount?.toString() || '',
    currency: po?.currency || 'MYR',
    receivedDate: po?.received_date || '',
    dueDate: po?.due_date || '',
    description: po?.description || '',
    status: po?.status || 'received',
    fileUrl: po?.file_url || '',
  });

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [useCustomRate, setUseCustomRate] = useState(false);
  const [customRateValue, setCustomRateValue] = useState('');
  const [exchangeRate, setExchangeRate] = useState(po?.exchange_rate || 1.0);
  const [convertedAmount, setConvertedAmount] = useState(po?.amount_myr || 0);

  useEffect(() => {
    if (isOpen) {
      fetchProjects();
      fetchCompanies();
    }
  }, [isOpen, fetchProjects, fetchCompanies]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      let fileUrl = formData.fileUrl;

      if (selectedFile) {
        const uploadResponse = await projectService.uploadProjectPO(po.id, selectedFile);
        fileUrl = uploadResponse.fileUrl;
      }

      const poData = {
        po_number: formData.poNumber,
        project_id: formData.projectId,
        project_code: formData.projectCode,
        company_id: formData.companyId,
        company_name: formData.companyName,
        amount: parseFloat(formData.amount),
        currency: formData.currency,
        customExchangeRate: useCustomRate ? parseFloat(customRateValue) : undefined,
        amount_myr: useCustomRate ? (parseFloat(formData.amount) * parseFloat(customRateValue)) : convertedAmount,
        received_date: formData.receivedDate,
        due_date: formData.dueDate,
        description: formData.description,
        status: formData.status,
        file_url: fileUrl,
      };

      await onSave(poData);
      toast.success(`Purchase Order ${poData.po_number} updated successfully!`);

      setFormData({
        poNumber: '',
        projectId: '',
        projectCode: '',
        companyId: '',
        companyName: '',
        amount: '',
        currency: 'MYR',
        receivedDate: '',
        dueDate: '',
        description: '',
        status: '',
        fileUrl: '',
      });
      onClose();
    } catch (error: any) {
      logger.error('Error updating PO:', error);
      toast.error('Failed to update purchase order');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200 sticky top-0 bg-white">
          <h2 className="text-xl font-semibold text-gray-900">Edit Purchase Order</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">PO Number</label>
              <input
                type="text"
                name="poNumber"
                value={formData.poNumber}
                onChange={(e) => setFormData(prev => ({ ...prev, poNumber: e.target.value }))}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Project Code</label>
              <select
                name="projectId"
                value={formData.projectId}
                onChange={(e) => {
                  const selectedProject = projects.find(p => p.id === e.target.value);
                  const selectedCompany = companies.find(c => c.id === selectedProject?.company_id);
                  setFormData({
                    ...prev,
                    projectId: e.target.value,
                    projectCode: selectedProject?.project_code || '',
                    companyName: selectedCompany?.name || ''
                  });
                }}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">None (Non-project purchase)</option>
                {projects
                  .filter(p => p.status === 'pre-lim')
                  .map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.project_code} - {project.title}
                    </option>
                  ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Company (via Project)</label>
              <input
                type="text"
                value={formData.companyName}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                readOnly
              />
              <p className="text-xs text-gray-500 mt-1">
                Auto-filled from selected project
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  name="amount"
                  value={formData.amount}
                  onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                  className="flex-1 px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
                <CurrencySelector
                  value={formData.currency}
                  onChange={(currency) => setFormData(prev => ({ ...prev, currency: currency })}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
              <select
                name="currency"
                value={formData.currency}
                onChange={(e) => setFormData(prev => ({ ...prev, currency: e.target.value }))}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="MYR">MYR</option>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="GBP">GBP</option>
                <option value="SGD">SGD</option>
                <option value="INR">INR</option>
                <option value="CNY">CNY</option>
                <option value="JPY">JPY</option>
                <option value="KRW">KRW</option>
                <option value="HKD">HKD</option>
                <option value="TWD">TWD</option>
                <option value="AUD">AUD</option>
                <option value="NZD">NZD</option>
                <option value="CAD">CAD</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Received Date</label>
              <input
                type="date"
                name="receivedDate"
                value={formData.receivedDate}
                onChange={(e) => setFormData(prev => ({ ...prev, receivedDate: e.target.value }))}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
              <input
                type="date"
                name="dueDate"
                value={formData.dueDate}
                onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
                className="w-full px-3 py-2.5 border border-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                name="status"
                value={formData.status}
                onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="received">Received</option>
                <option value="in-progress">In Progress</option>
                <option value="invoiced">Invoiced</option>
                <option value="paid">Paid</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray- name">
                Replace File (Optional)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  id="file-upload"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  className="hidden"
                />
                <label
                  htmlFor="file-upload"
                  className="px-3 py-2 text-sm font-medium text-gray-700 cursor-pointer"
                >
                  {selectedFile ? selectedFile.name : 'Choose File'}
                </label>
                {formData.fileUrl && (
                  <p className="text-sm text-gray-600 mt-1">
                    Current file uploaded
                  </p>
                )}
              </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 cursor-not-allowed flex items-center gap-2"
              >
                {isSubmitting ? 'Saving...' : 'Update PO'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
