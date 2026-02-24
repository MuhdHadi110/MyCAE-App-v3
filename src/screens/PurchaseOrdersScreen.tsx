import React, { useState, useEffect } from 'react';
import { Plus, FileText, Trash2, Edit2, X, Download, Upload } from 'lucide-react';
import { getCurrentUser } from '../lib/auth';
import { checkPermission } from '../lib/permissions';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import toast from 'react-hot-toast';
import { usePurchaseOrderStore } from '../store/purchaseOrderStore';
import { useProjectStore } from '../store/projectStore';
import { useCompanyStore } from '../store/companyStore';
import financeService from '../services/api.service';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import type { PurchaseOrder as IPurchaseOrder } from '../store/purchaseOrderStore';

export const PurchaseOrdersScreen: React.FC = () => {
  const currentUser = getCurrentUser();
  const canAccess = currentUser && checkPermission((currentUser.role || 'engineer') as any, 'canAccessFinance');
  const canUpload = currentUser && checkPermission((currentUser.role || 'engineer') as any, 'canUploadPO');

  const { purchaseOrders, fetchPurchaseOrders, createPurchaseOrder, updatePurchaseOrder, deletePurchaseOrder, loading } = usePurchaseOrderStore();

  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedPO, setSelectedPO] = useState<IPurchaseOrder | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    poId?: string;
    poNumber?: string;
  }>({ isOpen: false });

  useEffect(() => {
    fetchPurchaseOrders();
  }, []);

  const filteredPOs = purchaseOrders.filter(po =>
    statusFilter === 'all' || po.status === statusFilter
  );

  const totalByStatus = (status: string) => {
    return filteredPOs
      .filter(po => po.status === status)
      .reduce((sum, po) => sum + (po.amountMyrAdjusted || po.amountMyr || po.amount || 0), 0);
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'received': 'bg-blue-100 text-blue-800',
      'in-progress': 'bg-yellow-100 text-yellow-800',
      'invoiced': 'bg-purple-100 text-purple-800',
      'paid': 'bg-green-100 text-green-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      'received': 'Received',
      'in-progress': 'In Progress',
      'invoiced': 'Invoiced',
      'paid': 'Paid',
    };
    return labels[status] || status;
  };

  const handleCreateClick = () => {
    if (!canUpload) {
      toast.error('You do not have permission to create purchase orders');
      return;
    }
    setSelectedPO(null);
    setShowCreateModal(true);
  };

  const handleEditClick = (po: IPurchaseOrder) => {
    if (!canUpload) {
      toast.error('You do not have permission to edit purchase orders');
      return;
    }
    setSelectedPO(po);
    setShowEditModal(true);
  };

  const handleDeleteClick = (id: string, poNumber: string) => {
    if (!canUpload) {
      toast.error('You do not have permission to delete purchase orders');
      return;
    }
    setConfirmDialog({
      isOpen: true,
      poId: id,
      poNumber,
    });
  };

  const confirmDeletePO = async () => {
    if (!confirmDialog.poId) return;

    try {
      await deletePurchaseOrder(confirmDialog.poId);
      toast.success('Purchase order deleted successfully');
      setConfirmDialog({ isOpen: false });
    } catch {
      toast.error('Failed to delete purchase order');
    }
  };

  if (!canAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <X className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Restricted</h2>
          <p className="text-gray-600 mb-4">
            You do not have permission to access the Finance section.
          </p>
          <p className="text-sm text-gray-500">
            Please contact your manager if you need access to this section.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-gray-50">
      <div className="p-4 md:p-6 space-y-6">
        {/* Header Container */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Purchase Orders</h1>
              <p className="text-gray-600 mt-1">Create, track, and manage purchase orders</p>
            </div>
            {canUpload && (
              <Button
                onClick={handleCreateClick}
                icon={<Plus className="w-5 h-5" />}
              >
                Create PO
              </Button>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-600">Total POs</p>
            <p className="text-3xl font-bold text-gray-900">{purchaseOrders.length}</p>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg shadow p-4">
            <p className="text-sm text-blue-800">Received</p>
            <p className="text-3xl font-bold text-blue-900">RM {totalByStatus('received').toLocaleString()}</p>
          </div>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg shadow p-4">
            <p className="text-sm text-yellow-800">In Progress</p>
            <p className="text-3xl font-bold text-yellow-900">RM {totalByStatus('in-progress').toLocaleString()}</p>
          </div>
          <div className="bg-purple-50 border border-purple-200 rounded-lg shadow p-4">
            <p className="text-sm text-purple-800">Invoiced</p>
            <p className="text-3xl font-bold text-purple-900">RM {totalByStatus('invoiced').toLocaleString()}</p>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-lg shadow p-4">
            <p className="text-sm text-green-800">Paid</p>
            <p className="text-3xl font-bold text-green-900">RM {totalByStatus('paid').toLocaleString()}</p>
          </div>
        </div>

        {/* Filter */}
        <div className="bg-white rounded-lg shadow p-4">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
          >
            <option value="all">All Status</option>
            <option value="received">Received</option>
            <option value="in-progress">In Progress</option>
            <option value="invoiced">Invoiced</option>
            <option value="paid">Paid</option>
          </select>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        )}

        {/* Purchase Orders List */}
        {!loading && (
          <div className="space-y-3">
            {filteredPOs.length === 0 ? (
              <Card variant="bordered">
                <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                  <FileText className="w-16 h-16 mb-4 opacity-50" />
                  <p className="text-lg font-medium mb-2">No purchase orders found</p>
                  <p className="text-sm">
                    {canUpload ? 'Create a new purchase order to get started' : 'No purchase orders match the current filters'}
                  </p>
                </div>
              </Card>
            ) : (
              filteredPOs.map((po) => (
                <Card key={po.id} variant="bordered" padding="md" className="hover:shadow-md transition-shadow">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <FileText className="w-5 h-5 text-gray-400" />
                        <span className="font-semibold text-gray-900">{po.poNumber}</span>
                        <span className={`text-xs font-medium px-3 py-1 rounded-full ${getStatusColor(po.status)}`}>
                          {getStatusLabel(po.status)}
                        </span>
                        {/* Document uploaded indicator */}
                        {po.fileUrl && (
                          <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-1 bg-green-100 text-green-800 rounded-full">
                            <FileText className="w-3 h-3" />
                            Document
                          </span>
                        )}
                      </div>

                      <div className="space-y-1">
                        <p className="text-sm text-gray-600">Client: {po.clientName}</p>

                        {/* Enhanced project display */}
                        {po.projectCode ? (
                          <p className="text-sm text-gray-600">
                            Project: <span className="font-medium text-gray-900">{po.projectCode}</span>
                            {po.project?.title && (
                              <span className="text-gray-500"> - {po.project.title}</span>
                            )}
                          </p>
                        ) : (
                          <p className="text-sm text-gray-500">Project: Not linked</p>
                        )}
                      </div>

                      {po.description && (
                        <p className="text-sm text-gray-700 mt-2">{po.description}</p>
                      )}

                      <div className="flex flex-wrap gap-4 mt-3 text-xs text-gray-500">
                        <span>Received: {new Date(po.receivedDate).toLocaleDateString()}</span>
                        {po.dueDate && <span>Due: {new Date(po.dueDate).toLocaleDateString()}</span>}
                      </div>

                      {/* Document download button */}
                      {po.fileUrl && (
                        <div className="mt-3">
                          <a
                            href={po.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-primary-600 hover:text-primary-800 hover:underline"
                          >
                            <Download className="w-3 h-3" />
                            View Document
                          </a>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-3">
                      <div className="text-right">
                        <p className="text-2xl font-bold text-gray-900">RM {(po.amount || 0).toLocaleString('en-MY', { minimumFractionDigits: 2 })}</p>
                      </div>
                      {canUpload && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEditClick(po)}
                            className="p-2 text-primary-600 hover:bg-primary-50 rounded transition-colors"
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteClick(po.id, po.poNumber)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {(showCreateModal || showEditModal) && (
        <CreateEditPOModal
          isOpen={showCreateModal || showEditModal}
          po={selectedPO}
          onClose={() => {
            setShowCreateModal(false);
            setShowEditModal(false);
            setSelectedPO(null);
          }}
          onSave={async (data) => {
            try {
              if (selectedPO) {
                await updatePurchaseOrder(selectedPO.id, data);
                toast.success('Purchase order updated successfully');
              } else {
                await createPurchaseOrder(data);
                toast.success('Purchase order created successfully');
              }
              setShowCreateModal(false);
              setShowEditModal(false);
              setSelectedPO(null);
            } catch {
              // Error handled in store
            }
          }}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog({ isOpen: false })}
        onConfirm={confirmDeletePO}
        title="Delete Purchase Order"
        message={`Are you sure you want to delete PO ${confirmDialog.poNumber}? This action cannot be undone.`}
        variant="danger"
        confirmText="Delete"
        cancelText="Cancel"
      />
    </div>
  );
};

interface CreateEditPOModalProps {
  isOpen: boolean;
  po?: IPurchaseOrder | null;
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
}

const CreateEditPOModal: React.FC<CreateEditPOModalProps> = ({ isOpen, po, onClose, onSave }) => {
  const { projects, fetchProjects } = useProjectStore();
  const { companies, fetchCompanies } = useCompanyStore();

  const [formData, setFormData] = useState({
    poNumber: po?.poNumber || '',
    projectId: '',
    projectCode: po?.projectCode || '',
    clientId: '',
    clientName: po?.clientName || '',
    amount: po?.amount?.toString() || '',
    receivedDate: po?.receivedDate || '',
    dueDate: po?.dueDate || '',
    description: po?.description || '',
    status: po?.status || 'received',
    fileUrl: po?.fileUrl || '',
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchCompanies();
      fetchProjects();
    }
  }, [isOpen, fetchCompanies, fetchProjects]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      let fileUrl = formData.fileUrl;

      // Upload file if selected
      if (selectedFile) {
        const uploadFormData = new FormData();
        uploadFormData.append('file', selectedFile);
        uploadFormData.append('projectCode', formData.projectCode);

        const uploadResponse = await financeService.uploadPurchaseOrderFile(uploadFormData);
        fileUrl = uploadResponse.fileUrl;
      }

      // Prepare data for save
      const dataToSave = {
        ...formData,
        fileUrl,
      };

      await onSave(dataToSave);
      setSelectedFile(null);
    } catch (error: any) {
      toast.error(error.message || 'Failed to save purchase order');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-blue-100">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              {po ? 'Edit Purchase Order' : 'Create Purchase Order'}
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {po ? 'Update PO details' : 'Add a new purchase order'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">PO Number *</label>
              <input
                type="text"
                required
                value={formData.poNumber}
                onChange={(e) => setFormData({ ...formData, poNumber: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="PO-2025-001"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Project Code *</label>
              <select
                required
                value={formData.projectId}
                onChange={(e) => {
                  const selectedProject = projects.find(p => p.id === e.target.value);
                  setFormData({
                    ...formData,
                    projectId: e.target.value,
                    projectCode: selectedProject?.projectCode || ''
                  });
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
          </div>

          <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Company Name *</label>
              <select
                required
                value={formData.clientId}
                onChange={(e) => {
                  const selectedClient = companies.find(c => c.id === e.target.value);
                  setFormData({
                    ...formData,
                    clientId: e.target.value,
                    clientName: selectedClient?.name || ''
                  });
                }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
                <option value="">Select a company</option>
                {companies.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.name}
                  </option>
                ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Amount (RM) *</label>
              <input
                type="number"
                required
                step="0.01"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="0.00"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status *</label>
              <select
                required
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="received">Received</option>
                <option value="in-progress">In Progress</option>
                <option value="invoiced">Invoiced</option>
                <option value="paid">Paid</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Received Date *</label>
              <input
                type="date"
                required
                value={formData.receivedDate}
                onChange={(e) => setFormData({ ...formData, receivedDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Due Date</label>
              <input
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={3}
              placeholder="PO details..."
            />
          </div>

          {/* File Upload Section */}
          <div className="border-t border-gray-200 pt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              PO Document
            </label>

            {/* Show current file if exists */}
            {formData.fileUrl && (
              <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="text-sm font-medium text-blue-900">Current Document</p>
                    <p className="text-xs text-blue-700">{formData.fileUrl.split('/').pop()}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <a
                    href={formData.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 text-primary-600 hover:bg-primary-100 rounded transition-colors"
                    title="View Document"
                  >
                    <Download className="w-4 h-4" />
                  </a>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, fileUrl: '' })}
                    className="p-2 text-red-600 hover:bg-red-100 rounded transition-colors"
                    title="Remove Document"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* File upload input */}
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-blue-400 transition-colors">
              <input
                type="file"
                id="po-file-upload"
                accept=".pdf,.png,.jpg,.jpeg,.docx,.doc"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    // Validate file size (10MB)
                    if (file.size > 10 * 1024 * 1024) {
                      toast.error('File size must be less than 10MB');
                      return;
                    }
                    setSelectedFile(file);
                  }
                }}
                className="hidden"
              />
              <label
                htmlFor="po-file-upload"
                className="cursor-pointer flex flex-col items-center"
              >
                <Upload className="w-8 h-8 text-gray-400 mb-2" />
                <p className="text-sm text-gray-600">
                  {selectedFile ? selectedFile.name : 'Click to upload or drag and drop'}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  PDF, PNG, JPG, DOCX (max 10MB)
                </p>
              </label>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : po ? 'Update PO' : 'Create PO'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
