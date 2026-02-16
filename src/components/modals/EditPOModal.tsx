import React, { useState, useEffect } from 'react';
import { X, Upload } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { logger } from '../../lib/logger';
import projectService from '../../services/project.service';
import { CurrencySelector } from '../ui/CurrencySelector';

interface EditPOModalProps {
  isOpen: boolean;
  po: any;
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
}

export const EditPOModal: React.FC<EditPOModalProps> = ({ isOpen, po, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    poNumber: '',
    projectCode: '',
    companyName: '',
    amount: '',
    currency: 'MYR',
    receivedDate: '',
    dueDate: '',
    description: '',
    status: 'received',
    fileUrl: '',
  });

  const [exchangeRate, setExchangeRate] = useState(1.0);
  const [rateDate, setRateDate] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize form data when modal opens
  useEffect(() => {
    if (isOpen && po) {
      setFormData({
        poNumber: po.po_number || '',
        projectCode: po.project_code || po.project?.project_code || '',
        companyName: po.company_name || po.company?.name || '',
        amount: po.amount?.toString() || '',
        currency: po.currency || 'MYR',
        receivedDate: po.received_date || '',
        dueDate: po.due_date || '',
        description: po.description || '',
        status: po.status || 'received',
        fileUrl: po.file_url || '',
      });
      setExchangeRate(po.exchange_rate || 1.0);
      setRateDate(po.received_date || '');
    }
  }, [isOpen, po]);

  // Calculate converted amount
  const convertedAmount = parseFloat(formData.amount || '0') * exchangeRate;

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
        amount: parseFloat(formData.amount),
        currency: formData.currency,
        exchange_rate: exchangeRate,
        amount_myr: convertedAmount,
        received_date: formData.receivedDate,
        due_date: formData.dueDate,
        description: formData.description,
        status: formData.status,
        file_url: fileUrl,
      };

      await onSave(poData);
      toast.success(`Purchase Order ${poData.po_number} updated successfully!`);
      onClose();
    } catch (error: any) {
      logger.error('Error updating PO:', error);
      toast.error('Failed to update purchase order');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200 bg-gradient-to-r from-primary-50 to-primary-100 dark:from-gray-800 dark:to-gray-700">
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
            {/* PO Number */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">PO Number</label>
              <input
                type="text"
                value={formData.poNumber}
                onChange={(e) => setFormData(prev => ({ ...prev, poNumber: e.target.value }))}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            {/* Project Code - Read Only */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Project Code</label>
              <input
                type="text"
                value={formData.projectCode}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
                readOnly
              />
            </div>

            {/* Company Name - Read Only */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
              <input
                type="text"
                value={formData.companyName}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
                readOnly
              />
            </div>

            {/* Amount & Currency */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={formData.amount}
                  onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                  className="flex-1 px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
                <CurrencySelector
                  value={formData.currency}
                  onChange={(currency) => setFormData(prev => ({ ...prev, currency }))}
                />
              </div>
            </div>

            {/* Exchange Rate - Only show for non-MYR */}
            {formData.currency !== 'MYR' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Exchange Rate (to MYR)
                  </label>
                  <input
                    type="number"
                    step="0.000001"
                    value={exchangeRate}
                    onChange={(e) => setExchangeRate(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Rate Date
                  </label>
                  <input
                    type="date"
                    value={rateDate}
                    onChange={(e) => setRateDate(e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Converted Amount (MYR)
                  </label>
                  <input
                    type="text"
                    value={`RM ${convertedAmount.toLocaleString('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
                    readOnly
                  />
                </div>
              </>
            )}

            {/* Received Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Received Date</label>
              <input
                type="date"
                value={formData.receivedDate}
                onChange={(e) => {
                  setFormData(prev => ({ ...prev, receivedDate: e.target.value }));
                  if (!rateDate) setRateDate(e.target.value);
                }}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            {/* Due Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
              <input
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
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

            {/* Description */}
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* File Upload */}
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
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
                  className="px-4 py-2 text-sm font-medium text-blue-600 border border-blue-600 rounded-lg cursor-pointer hover:bg-blue-50"
                >
                  {selectedFile ? selectedFile.name : 'Choose File'}
                </label>
                {formData.fileUrl && !selectedFile && (
                  <span className="text-sm text-gray-600">Current file exists</span>
                )}
              </div>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200">
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
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {isSubmitting ? 'Saving...' : 'Update PO'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
