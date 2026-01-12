import React, { useState, useEffect } from 'react';
import { X, Upload, Save } from 'lucide-react';
import { useProjectStore } from '../../store/projectStore';
import { useClientStore } from '../../store/clientStore';
import financeService from '../../services/finance.service';
import projectService from '../../services/project.service';
import { logger } from '../../lib/logger';

interface EditPOModalProps {
  isOpen: boolean;
  po: any;
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
}

export const EditPOModal: React.FC<EditPOModalProps> = ({ isOpen, po, onClose, onSave }) => {
  const { projects, fetchProjects } = useProjectStore();
  const { clients, fetchClients } = useClientStore();

  const [formData, setFormData] = useState({
    poNumber: po?.po_number || '',
    projectId: '',
    projectCode: po?.project_code || '',
    clientId: '',
    clientName: po?.client_name || '',
    amount: po?.amount?.toString() || '',
    receivedDate: po?.received_date || '',
    dueDate: po?.due_date || '',
    description: po?.description || '',
    status: po?.status || 'received',
    fileUrl: po?.file_url || '',
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchClients();
      fetchProjects();
    }
  }, [isOpen, fetchClients, fetchProjects]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      let fileUrl = formData.fileUrl;

      // Upload file if selected
      if (selectedFile) {
        const uploadResponse = await projectService.uploadProjectPO(po.id, selectedFile);
        fileUrl = uploadResponse.fileUrl;
      }

      // Update PO data
      const poData = {
        po_number: formData.poNumber,
        project_id: formData.projectId,
        project_code: formData.projectCode,
        client_id: formData.clientId,
        client_name: formData.clientName,
        amount: parseFloat(formData.amount),
        received_date: formData.receivedDate,
        due_date: formData.dueDate,
        description: formData.description,
        status: formData.status,
        file_url: fileUrl,
      };

      await onSave(poData);
      onClose();
    } catch (error: any) {
      logger.error('Error updating PO:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Edit Purchase Order</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">PO Number</label>
              <input
                type="text"
                value={formData.poNumber}
                onChange={(e) => setFormData(prev => ({ ...prev, poNumber: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Project Code</label>
              <input
                type="text"
                value={formData.projectCode}
                onChange={(e) => setFormData(prev => ({ ...prev, projectCode: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Client</label>
              <select
                value={formData.clientId}
                onChange={(e) => {
                  const clientId = e.target.value;
                  const client = clients.find(c => c.id === clientId);
                  setFormData(prev => ({
                    ...prev,
                    clientId,
                    clientName: client?.name || ''
                  }));
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Select Client</option>
                {clients.map(client => (
                  <option key={client.id} value={client.id}>
                    {client.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
              <input
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Received Date</label>
              <input
                type="date"
                value={formData.receivedDate}
                onChange={(e) => setFormData(prev => ({ ...prev, receivedDate: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
              <input
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Replace File (Optional)</label>
            <div className="flex items-center gap-3">
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                className="hidden"
                id="file-upload"
              />
              <label
                htmlFor="file-upload"
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
              >
                <Upload className="w-4 h-4" />
                <span>{selectedFile ? selectedFile.name : 'Choose File'}</span>
              </label>
              {formData.fileUrl && !selectedFile && (
                <span className="text-sm text-gray-500">Current file uploaded</span>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              {isSubmitting ? 'Saving...' : 'Update PO'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};