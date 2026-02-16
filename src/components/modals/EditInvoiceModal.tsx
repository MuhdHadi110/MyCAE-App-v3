import React, { useState, useEffect } from 'react';
import { X, Edit2, Save, AlertTriangle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import type { InvoiceStatus } from '../../constants/invoiceStatus';
import financeService from '../../services/finance.service';
import { logger } from '../../lib/logger';
import { useProjectStore } from '../../store/projectStore';
import { useClientStore } from '../../store/clientStore';
import { getCurrentUser } from '../../lib/auth';
import { checkPermission } from '../../lib/permissions';

interface EditInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: any;
  onSave: (updatedInvoice: any) => void;
}

export const EditInvoiceModal: React.FC<EditInvoiceModalProps> = ({ isOpen, onClose, invoice, onSave }) => {
  const { projects, fetchProjects } = useProjectStore();
  const { clients, fetchClients } = useClientStore();
  const currentUser = getCurrentUser();

  const [formData, setFormData] = useState({
    invoiceNumber: '',
    projectId: '',
    projectName: '',
    projectCode: '',
    companyId: '',
    clientName: '',
    amount: '',
    percentageOfTotal: '',
    issueDate: '',
    dueDate: '',
    description: '',
    remark: '',
    status: 'sent' as InvoiceStatus,
  });

  const [projectContext, setProjectContext] = useState<any>(null);
  const [projectTotalValue, setProjectTotalValue] = useState<number>(0);
  const [lastEditedField, setLastEditedField] = useState<'amount' | 'percentage' | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Permissions
  const canEditInvoice = currentUser && checkPermission(currentUser.roles as any, 'canEditInvoices');

  // Fetch clients and projects when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchClients();
      fetchProjects();
    }
  }, [isOpen, fetchClients, fetchProjects]);

  // Initialize form with invoice data
  useEffect(() => {
    if (invoice) {
      setFormData({
        invoiceNumber: invoice.invoiceNumber,
        projectId: invoice.companyId || '',
        projectName: invoice.projectName || '',
        projectCode: invoice.projectCode || '',
        companyId: invoice.companyId || '',
        clientName: invoice.clientName || '',
        amount: invoice.amount?.toString() || '',
        percentageOfTotal: invoice.percentage_of_total?.toString() || '',
        issueDate: invoice.invoice_date ? new Date(invoice.invoice_date).toISOString().split('T')[0] : '',
        dueDate: invoice.due_date ? new Date(invoice.due_date).toISOString().split('T')[0] : '',
        description: invoice.description || '',
        remark: invoice.remark || '',
        status: (invoice.status as InvoiceStatus) || 'sent',
      });
    }
  }, [invoice]);

  // Load project context when project code changes
  useEffect(() => {
    if (formData.projectCode && formData.projectCode.trim()) {
      const loadProjectContext = async (projectCode: string) => {
        try {
          const context = await financeService.getInvoiceProjectContext(projectCode);
          setProjectContext(context);
          setProjectTotalValue(context.projectTotalValue || 0);
        } catch (error: any) {
          logger.error('Error loading project context:', error);
          setProjectContext(null);
          setProjectTotalValue(0);
        }
      };
      loadProjectContext(formData.projectCode.trim());
    } else {
      setProjectContext(null);
      setProjectTotalValue(0);
    }
  }, [formData.projectCode]);

  // Auto-populate client when project is selected
  useEffect(() => {
    if (formData.projectId && projects.length > 0 && clients.length > 0) {
      const selectedProject = projects.find(p => p.id === formData.projectId);
      if (selectedProject && selectedProject.companyId) {
        const matchingClient = clients.find(c => c.id === selectedProject.companyId);
        if (matchingClient && formData.companyId !== selectedProject.companyId) {
          setFormData(prevFormData => ({
            ...formData,
            companyId: selectedProject.companyId,
            clientName: matchingClient.name || ''
          }));
        }
      }
    }
  }, [formData.projectId, projects, clients]);

  // Auto-calculate amount from percentage
  useEffect(() => {
    if (lastEditedField === 'percentage' && projectTotalValue > 0) {
      const percentage = parseFloat(formData.percentageOfTotal);
      if (!isNaN(percentage)) {
        const calculatedAmount = (projectTotalValue * percentage) / 100;
        setFormData(prev => ({
          ...prev,
          amount: calculatedAmount.toFixed(2)
        }));
      }
    }
  }, [formData.percentageOfTotal, lastEditedField, projectTotalValue]);

  // Auto-calculate percentage from amount
  useEffect(() => {
    if (lastEditedField === 'amount' && projectTotalValue > 0) {
      const amount = parseFloat(formData.amount);
      if (!isNaN(amount)) {
        const calculatedPercentage = (amount / projectTotalValue) * 100;
        setFormData(prev => ({
          ...prev,
          percentageOfTotal: calculatedPercentage.toFixed(2)
        }));
      }
    }
  }, [formData.amount, lastEditedField, projectTotalValue]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.invoiceNumber.trim()) {
      newErrors.invoiceNumber = 'Invoice number is required';
    }
    if (!formData.projectCode.trim()) {
      newErrors.projectCode = 'Project is required';
    }
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      newErrors.amount = 'Valid amount is required';
    }
    if (!formData.percentageOfTotal || parseFloat(formData.percentageOfTotal) <= 0) {
      newErrors.percentageOfTotal = 'Valid percentage is required';
    }
    if (!formData.issueDate) {
      newErrors.issueDate = 'Issue date is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!canEditInvoice) {
      toast.error('You do not have permission to edit invoices');
      return;
    }

    if (!validateForm()) return;

    // Confirmation for critical changes
    if (invoice.status === 'paid') {
      const confirmPaid = window.confirm('This invoice is marked as PAID. Are you sure you want to edit it?');
      if (!confirmPaid) return;
    }

    if (formData.status === 'paid' && invoice.status !== 'paid') {
      const confirmStatus = window.confirm('Are you sure you want to mark this invoice as PAID? This action cannot be easily undone.');
      if (!confirmStatus) return;
    }

    setSubmitting(true);

    try {
      const invoiceData = {
        invoiceNumber: formData.invoiceNumber,
        project_name: formData.projectName,
        project_code: formData.projectCode,
        company_id: formData.companyId,
        client_name: formData.clientName,
        amount: parseFloat(formData.amount),
        percentage_of_total: parseFloat(formData.percentageOfTotal),
        issue_date: formData.issueDate,
        due_date: formData.dueDate,
        description: formData.description,
        remark: formData.remark,
        status: formData.status,
      };

      await financeService.updateInvoice(invoice.id, invoiceData);
      toast.success(`Invoice ${formData.invoiceNumber} updated successfully!`);
      
      onSave(invoiceData);
      onClose();
    } catch (error: any) {
      logger.error('Error updating invoice:', error);
      toast.error(error.message || 'Failed to update invoice');
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      setFormData(prev => ({
        ...prev,
        projectId: '',
        projectCode: '',
        projectName: '',
        companyId: '',
        clientName: '',
        amount: '',
        percentageOfTotal: '',
        issueDate: '',
        dueDate: '',
        description: '',
        remark: '',
        status: 'sent' as InvoiceStatus,
      }));

    // Track which field was edited for auto-calculation
    if (e.target.name === 'amount') {
      setLastEditedField('amount');
    } else if (e.target.name === 'percentageOfTotal') {
      setLastEditedField('percentage');
    }
  };

  if (!isOpen) return null;

  if (!canEditInvoice) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
          <div className="flex items-center gap-3 text-red-600 mb-4">
            <AlertTriangle className="w-6 h-6" />
            <h3 className="text-lg font-semibold">Access Denied</h3>
          </div>
          <p className="text-gray-600 mb-6">
            You don't have permission to edit invoices. Please contact your manager if you need access.
          </p>
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-primary-50 to-primary-100 dark:from-gray-800 dark:to-gray-700">
          <div className="flex items-center gap-3">
            <Edit2 className="w-5 h-5 text-primary-600" />
            <h2 className="text-xl font-semibold text-gray-900">Edit Invoice</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Invoice Status Warning */}
          {invoice.status === 'paid' && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-yellow-900">Paid Invoice Warning</p>
                  <p className="text-xs text-yellow-700 mt-1">
                    This invoice is marked as paid. Editing paid invoices should be done with caution.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Smart Context Display */}
          {projectContext && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
              <div className="flex items-start gap-2">
                <div className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0">ℹ️</div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-blue-900 mb-2">Project Invoice History</p>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-blue-700">Previous Invoices:</span>
                      <span className="font-semibold text-blue-900 ml-1">{projectContext.previousInvoices?.length || 0}</span>
                    </div>
                    <div>
                      <span className="text-blue-700">Total Invoiced:</span>
                      <span className="font-semibold text-blue-900 ml-1">{projectContext.totalInvoiced ?? 0}%</span>
                    </div>
                    <div>
                      <span className="text-blue-700">Remaining:</span>
                      <span className="font-semibold text-blue-900 ml-1">{projectContext.remainingPercentage ?? 100}%</span>
                    </div>
                    <div>
                      <span className="text-blue-700">This Invoice #:</span>
                      <span className="font-semibold text-blue-900 ml-1">{projectContext.nextSequence || 1}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Invoice Number */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Invoice Number <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="invoiceNumber"
                value={formData.invoiceNumber}
                onChange={handleChange}
                required
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
              {errors.invoiceNumber && (
                <p className="text-red-500 text-xs mt-1">{errors.invoiceNumber}</p>
              )}
              <p className="text-xs text-gray-500 mt-1">
                Can be edited manually
              </p>
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status <span className="text-red-500">*</span>
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="draft">Draft</option>
                <option value="sent">Sent</option>
                <option value="paid">Paid</option>
                <option value="overdue">Overdue</option>
              </select>
            </div>

            {/* Project Code */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Project Code <span className="text-red-500">*</span>
              </label>
              <select
                name="projectId"
                value={formData.projectId}
                onChange={(e) => {
                  const selectedProject = projects.find(p => p.id === e.target.value);
                  if (e.target.value === '') {
                    setFormData({
                      ...formData,
                      projectId: '',
                      projectCode: '',
                      projectName: '',
                      companyId: '',
                      clientName: '',
                    });
                  }
                }}
                required
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="">Select a project</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.projectCode} - {project.title}
                  </option>
                ))}
              </select>
              {errors.projectCode && (
                <p className="text-red-500 text-xs mt-1">{errors.projectCode}</p>
              )}
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

            {/* Amount */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Amount (RM) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="amount"
                value={formData.amount}
                onChange={handleChange}
                required
                min="0"
                step="0.01"
                placeholder="0.00"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
              {errors.amount && (
                <p className="text-red-500 text-xs mt-1">{errors.amount}</p>
              )}
              {projectTotalValue > 0 && (
                <p className="text-xs text-gray-500 mt-1">
                  Project Total: RM {projectTotalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  {lastEditedField === 'percentage' && <span className="text-blue-600 ml-1">Auto-calculated from percentage</span>}
                </p>
              )}
            </div>

            {/* Percentage of Total */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Percentage of Total (%) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="percentageOfTotal"
                value={formData.percentageOfTotal}
                onChange={handleChange}
                required
                min="0"
                max="100"
                step="0.01"
                placeholder="e.g., 30, 50, 100"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
              {errors.percentageOfTotal && (
                <p className="text-red-500 text-xs mt-1">{errors.percentageOfTotal}</p>
              )}
              {projectContext && (
                <p className="text-xs text-gray-500 mt-1">
                  Suggested: {projectContext.remainingPercentage}% remaining
                  {lastEditedField === 'amount' && <span className="text-blue-600 ml-1">Auto-calculated from amount</span>}
                </p>
              )}
            </div>

            {/* Issue Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Issue Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                name="issueDate"
                value={formData.issueDate}
                onChange={handleChange}
                required
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
              {errors.issueDate && (
                <p className="text-red-500 text-xs mt-1">{errors.issueDate}</p>
              )}
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
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description / Items
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={2}
              placeholder="Invoice line items and description..."
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
            />
          </div>

          {/* Remark */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Remarks / Notes
            </label>
            <textarea
              name="remark"
              value={formData.remark}
              onChange={handleChange}
              rows={2}
              placeholder="Additional notes or remarks..."
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
            />
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
              disabled={submitting}
              className="flex-1 px-4 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4" />
              {submitting ? 'Updating...' : 'Update Invoice'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};