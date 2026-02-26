import React, { useState, useEffect } from 'react';
import { X, Upload, Info, CheckCircle2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import financeService from '../../services/finance.service';
import { logger } from '../../lib/logger';
import { useProjectStore } from '../../store/projectStore';
import { useCompanyStore } from '../../store/companyStore';

interface AddInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AddInvoiceModal: React.FC<AddInvoiceModalProps> = ({ isOpen, onClose }) => {
  const { projects, fetchProjects } = useProjectStore();
  const { companies, fetchCompanies } = useCompanyStore();

  const [formData, setFormData] = useState({
    invoiceNumber: '',
    projectId: '',
    projectName: '',
    projectCode: '',
    companyId: '',
    clientName: '',
    amount: '',
    percentageOfTotal: '',
    issueDate: new Date().toISOString().split('T')[0],
    dueDate: '',
    description: '',
    remark: '',
  });

  const [projectContext, setProjectContext] = useState<any>(null);
  const [projectTotalValue, setProjectTotalValue] = useState<number>(0);
  const [lastEditedField, setLastEditedField] = useState<'amount' | 'percentage' | null>(null);
  const [loadingContext, setLoadingContext] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Check if selected project is lump sum
  const selectedProject = projects.find(p => p.id === formData.projectId);
  const isLumpSum = selectedProject?.billingType === 'lump_sum';

  // Fetch companies and projects when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchCompanies();
      fetchProjects();
    }
  }, [isOpen, fetchCompanies, fetchProjects]);

  // Load next invoice number on mount
  useEffect(() => {
    if (isOpen && !formData.invoiceNumber) {
      loadNextInvoiceNumber();
    }
  }, [isOpen]);

  // Load project context when project code changes
  useEffect(() => {
    if (formData.projectCode && formData.projectCode.trim()) {
      loadProjectContext(formData.projectCode.trim());
    } else {
      setProjectContext(null);
    }
  }, [formData.projectCode]);

  // Auto-populate client when project is selected
  useEffect(() => {
    if (formData.projectId && projects.length > 0 && companies.length > 0) {
      const selectedProject = projects.find(p => p.id === formData.projectId);
      if (selectedProject && selectedProject.companyId) {
        // Find the matching company
        const matchingCompany = companies.find(c => c.id === selectedProject.companyId);

        // Only auto-populate if company isn't already set or is different
        if (matchingCompany && formData.companyId !== selectedProject.companyId) {
          setFormData(prev => ({
            ...prev,
            companyId: selectedProject.companyId,
            clientName: matchingCompany.name || ''
          }));
        }
      }
    }
  }, [formData.projectId, projects, companies]);

  const loadNextInvoiceNumber = async () => {
    try {
      const nextNumber = await financeService.getNextInvoiceNumber();
      setFormData(prev => ({ ...prev, invoiceNumber: nextNumber }));
    } catch (error: any) {
      logger.error('Error loading next invoice number:', error);
    }
  };

  const loadProjectContext = async (projectCode: string) => {
    setLoadingContext(true);
    try {
      const context = await financeService.getInvoiceProjectContext(projectCode);
      setProjectContext(context);
      setProjectTotalValue(context.projectTotalValue || 0);
    } catch (error: any) {
      logger.error('Error loading project context:', error);
      setProjectContext(null);
      setProjectTotalValue(0);
    } finally {
      setLoadingContext(false);
    }
  };

  // Auto-calculate amount from percentage
  useEffect(() => {
    if (lastEditedField === 'percentage' && projectTotalValue > 0) {
      const percentage = parseFloat(formData.percentageOfTotal);
      if (!isNaN(percentage)) {
        const calculatedAmount = Math.round((projectTotalValue * percentage * 100)) / 10000;
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
        const calculatedPercentage = Math.round((amount / projectTotalValue) * 100 * 100) / 100;
        setFormData(prev => ({
          ...prev,
          percentageOfTotal: calculatedPercentage.toFixed(2)
        }));
      }
    }
  }, [formData.amount, lastEditedField, projectTotalValue]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const invoiceData = {
        invoice_number: formData.invoiceNumber,
        project_id: formData.projectId,
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
      };

      await financeService.createInvoice(invoiceData);
      toast.success(`Invoice ${formData.invoiceNumber} created successfully!`);

      // Reset form
      setFormData({
        invoiceNumber: '',
        projectId: '',
        projectName: '',
        projectCode: '',
        companyId: '',
        clientName: '',
        amount: '',
        percentageOfTotal: '',
        issueDate: new Date().toISOString().split('T')[0],
        dueDate: '',
        description: '',
        remark: '',
      });
      setProjectContext(null);
      onClose();
    } catch (error: any) {
      logger.error('Error creating invoice:', error);
      toast.error(error.message || 'Failed to create invoice');
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));

    // Track which field was edited for auto-calculation
    if (e.target.name === 'amount') {
      setLastEditedField('amount');
    } else if (e.target.name === 'percentageOfTotal') {
      setLastEditedField('percentage');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-primary-50 to-primary-100 dark:from-gray-800 dark:to-gray-700">
          <h2 className="text-2xl font-bold text-gray-900">Create Invoice</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Smart Context Display */}
          {projectContext && (
            <div className={`border rounded-lg p-4 space-y-2 ${isLumpSum ? 'bg-purple-50 border-purple-200' : 'bg-blue-50 border-blue-200'}`}>
              <div className="flex items-start gap-2">
                <Info className={`w-5 h-5 mt-0.5 flex-shrink-0 ${isLumpSum ? 'text-purple-600' : 'text-blue-600'}`} />
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <p className={`text-sm font-medium ${isLumpSum ? 'text-purple-900' : 'text-blue-900'}`}>
                      {isLumpSum ? 'Lump Sum Project' : 'Project Invoice History'}
                    </p>
                    {isLumpSum && (
                      <span className="text-xs px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full">
                        Fixed Amount
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className={isLumpSum ? 'text-purple-700' : 'text-blue-700'}>Previous Invoices:</span>
                      <span className={`font-semibold ml-1 ${isLumpSum ? 'text-purple-900' : 'text-blue-900'}`}>{projectContext.previousInvoices?.length || 0}</span>
                    </div>
                    <div>
                      <span className={isLumpSum ? 'text-purple-700' : 'text-blue-700'}>Total Invoiced:</span>
                      <span className={`font-semibold ml-1 ${isLumpSum ? 'text-purple-900' : 'text-blue-900'}`}>{projectContext.totalInvoiced ?? 0}%</span>
                    </div>
                    <div>
                      <span className={isLumpSum ? 'text-purple-700' : 'text-blue-700'}>Remaining:</span>
                      <span className={`font-semibold ml-1 ${isLumpSum ? 'text-purple-900' : 'text-blue-900'}`}>{projectContext.remainingPercentage ?? 100}%</span>
                    </div>
                    <div>
                      <span className={isLumpSum ? 'text-purple-700' : 'text-blue-700'}>This Invoice #:</span>
                      <span className={`font-semibold ml-1 ${isLumpSum ? 'text-purple-900' : 'text-blue-900'}`}>{projectContext.nextSequence || 1}</span>
                    </div>
                  </div>
                  {projectContext.totalInvoiced >= 100 && (
                    <div className="mt-2 flex items-center gap-1 text-green-700">
                      <CheckCircle2 className="w-4 h-4" />
                      <span className="text-xs font-medium">Project already at 100%</span>
                    </div>
                  )}
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
                placeholder="e.g., MCE1548"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">
                Auto-generated but can be edited manually
              </p>
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
                    // If clearing project, also clear client
            setFormData({
              ...formData,
              projectId: '',
              projectCode: '',
              projectName: '',
              companyId: '',
              clientName: '',
              percentageOfTotal: '',
            });
                  } else {
                    setFormData({
                      ...formData,
                      projectId: e.target.value,
                      projectCode: selectedProject?.projectCode || '',
                      projectName: selectedProject?.title || '',
                      companyId: selectedProject?.companyId || '',
                      clientName: '',
                    });
                  }
                }}
                required
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="">Select a project</option>
                {projects
                  .filter(p => p.status === 'ongoing')
                  .map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.projectCode} - {project.title}
                    </option>
                  ))}
              </select>
              {loadingContext && (
                <p className="text-xs text-gray-500 mt-1">Loading project context...</p>
              )}
            </div>

            {/* Project Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Project Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="projectName"
                value={formData.projectName}
                onChange={handleChange}
                required
                placeholder="Project title"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-gray-50"
                readOnly
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
              {projectTotalValue > 0 && (
                <p className="text-xs text-gray-500 mt-1">
                  Project Total: RM {projectTotalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  {lastEditedField === 'percentage' && <span className="text-blue-600 ml-1">Auto-calculated from percentage</span>}
                </p>
              )}
            </div>

            {/* Percentage of Total - Hidden for lump sum projects */}
            {!isLumpSum && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Percentage of Total (%) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="percentageOfTotal"
                  value={formData.percentageOfTotal}
                  onChange={handleChange}
                  required={!isLumpSum}
                  min="0"
                  max="100"
                  step="0.01"
                  placeholder="e.g., 30, 50, 100"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                {projectContext && (
                  <p className="text-xs text-gray-500 mt-1">
                    Suggested: {projectContext.remainingPercentage}% remaining
                    {lastEditedField === 'amount' && <span className="text-blue-600 ml-1">Auto-calculated from amount</span>}
                  </p>
                )}
              </div>
            )}

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
            </div>

            {/* Due Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Due Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                name="dueDate"
                value={formData.dueDate}
                onChange={handleChange}
                required
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

          {/* File Upload Note */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-2">
              <Upload className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-blue-900 mb-1">Attach Invoice Document</p>
                <p className="text-xs text-blue-700">
                  After creating the invoice, you can upload the PDF document in the invoice details view.
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
              disabled={submitting}
              className="flex-1 px-4 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Creating...' : 'Create Invoice'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
