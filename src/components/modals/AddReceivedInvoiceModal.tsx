import React, { useState, useEffect } from 'react';
import { X, FileText } from 'lucide-react';
import { toast } from 'react-hot-toast';
import financeService from '../../services/finance.service';
import { logger } from '../../lib/logger';

interface AddReceivedInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editingInvoice?: any; // For edit mode
}

export const AddReceivedInvoiceModal: React.FC<AddReceivedInvoiceModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  editingInvoice,
}) => {
  const [issuedPOs, setIssuedPOs] = useState<any[]>([]);
  const [loadingPOs, setLoadingPOs] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    invoiceNumber: '',
    issuedPoId: '',
    amount: '',
    currency: 'MYR',
    invoiceDate: new Date().toISOString().split('T')[0],
    receivedDate: new Date().toISOString().split('T')[0],
    dueDate: '',
    description: '',
  });

  const isEditMode = !!editingInvoice;

  // Load Issued POs when modal opens
  useEffect(() => {
    if (isOpen) {
      loadIssuedPOs();
    }
  }, [isOpen]);

  // Populate form when editing
  useEffect(() => {
    if (isOpen && editingInvoice) {
      setFormData({
        invoiceNumber: editingInvoice.invoiceNumber || '',
        issuedPoId: editingInvoice.issuedPoId || '',
        amount: editingInvoice.amount?.toString() || '',
        currency: editingInvoice.currency || 'MYR',
        invoiceDate: editingInvoice.invoiceDate
          ? new Date(editingInvoice.invoiceDate).toISOString().split('T')[0]
          : new Date().toISOString().split('T')[0],
        receivedDate: editingInvoice.receivedDate
          ? new Date(editingInvoice.receivedDate).toISOString().split('T')[0]
          : new Date().toISOString().split('T')[0],
        dueDate: editingInvoice.dueDate
          ? new Date(editingInvoice.dueDate).toISOString().split('T')[0]
          : '',
        description: editingInvoice.description || '',
      });
    } else if (isOpen && !editingInvoice) {
      // Reset form for new invoice
      setFormData({
        invoiceNumber: '',
        issuedPoId: '',
        amount: '',
        currency: 'MYR',
        invoiceDate: new Date().toISOString().split('T')[0],
        receivedDate: new Date().toISOString().split('T')[0],
        dueDate: '',
        description: '',
      });
    }
  }, [isOpen, editingInvoice]);

  const loadIssuedPOs = async () => {
    setLoadingPOs(true);
    try {
      const pos = await financeService.getAllIssuedPOs();
      // Filter to show only ISSUED or RECEIVED POs (not COMPLETED)
      const availablePOs = pos.filter((po: any) => po.status !== 'completed');
      setIssuedPOs(availablePOs);
    } catch (error: any) {
      logger.error('Error loading Issued POs:', error);
      toast.error('Failed to load Issued POs');
    } finally {
      setLoadingPOs(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.invoiceNumber.trim()) {
      toast.error('Invoice number is required');
      return;
    }
    if (!formData.issuedPoId) {
      toast.error('Please select an Issued PO');
      return;
    }
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        invoiceNumber: formData.invoiceNumber.trim(),
        issuedPoId: formData.issuedPoId,
        amount: parseFloat(formData.amount),
        currency: formData.currency,
        invoiceDate: formData.invoiceDate,
        receivedDate: formData.receivedDate,
        dueDate: formData.dueDate || null,
        description: formData.description || null,
      };

      if (isEditMode) {
        await financeService.updateReceivedInvoice(editingInvoice.id, payload);
        toast.success('Received invoice updated successfully');
      } else {
        await financeService.createReceivedInvoice(payload);
        toast.success('Received invoice created successfully');
      }

      onSuccess();
      onClose();
    } catch (error: any) {
      logger.error('Error saving received invoice:', error);
      toast.error(error.response?.data?.error || 'Failed to save received invoice');
    } finally {
      setSubmitting(false);
    }
  };

  // Get selected PO info
  const selectedPO = issuedPOs.find(po => po.id === formData.issuedPoId);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="fixed inset-0 bg-black/50" onClick={onClose} />

        <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary-100 rounded-lg">
                <FileText className="w-5 h-5 text-primary-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900">
                {isEditMode ? 'Edit Received Invoice' : 'Add Received Invoice'}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {/* Issued PO Selector */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Linked Issued PO <span className="text-red-500">*</span>
              </label>
              <select
                name="issuedPoId"
                value={formData.issuedPoId}
                onChange={handleChange}
                disabled={isEditMode}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-100"
              >
                <option value="">Select an Issued PO...</option>
                {loadingPOs ? (
                  <option disabled>Loading...</option>
                ) : (
                  issuedPOs.map(po => (
                    <option key={po.id} value={po.id}>
                      {po.poNumber} - {po.recipient} ({po.currency} {po.amount?.toLocaleString()})
                    </option>
                  ))
                )}
              </select>
              {isEditMode && (
                <p className="text-xs text-gray-500 mt-1">Linked PO cannot be changed after creation</p>
              )}
            </div>

            {/* Show selected PO info */}
            {selectedPO && (
              <div className="bg-gray-50 rounded-lg p-3 text-sm">
                <p className="font-medium text-gray-900">{selectedPO.recipient}</p>
                <p className="text-gray-600">{selectedPO.items}</p>
                {selectedPO.projectCode && (
                  <p className="text-primary-600 text-xs mt-1">Project: {selectedPO.projectCode}</p>
                )}
              </div>
            )}

            {/* Invoice Number */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Vendor Invoice Number <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="invoiceNumber"
                value={formData.invoiceNumber}
                onChange={handleChange}
                placeholder="Enter vendor's invoice number"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            {/* Amount and Currency */}
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Amount <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="amount"
                  value={formData.amount}
                  onChange={handleChange}
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Currency
                </label>
                <select
                  name="currency"
                  value={formData.currency}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="MYR">MYR</option>
                  <option value="USD">USD</option>
                  <option value="SGD">SGD</option>
                  <option value="EUR">EUR</option>
                </select>
              </div>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Invoice Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  name="invoiceDate"
                  value={formData.invoiceDate}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Received Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  name="receivedDate"
                  value={formData.receivedDate}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Due Date
                </label>
                <input
                  type="date"
                  name="dueDate"
                  value={formData.dueDate}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={3}
                placeholder="Optional notes about this invoice"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 px-4 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium disabled:opacity-50"
              >
                {submitting ? 'Saving...' : isEditMode ? 'Update Invoice' : 'Create Invoice'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
