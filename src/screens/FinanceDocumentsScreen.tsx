import { useState, useEffect } from 'react';
import { Plus, XCircle, X, Search } from 'lucide-react';
import { FinanceDocumentTabs, type FinanceTab } from '../components/FinanceDocumentTabs';
import { FileUploadZone } from '../components/FileUploadZone';
import { AddReceivedPOModal } from '../components/modals/AddReceivedPOModal';
import { AddInvoiceModal } from '../components/modals/AddInvoiceModal';
import { EditInvoiceModal } from '../components/modals/EditInvoiceModal';
import { AddIssuedPOModal } from '../components/modals/AddIssuedPOModal';
import { AddReceivedInvoiceModal } from '../components/modals/AddReceivedInvoiceModal';
import { EditPOModal } from '../components/modals/EditPOModal';
import { ViewPODetailsModal } from '../components/modals/ViewPODetailsModal';
import { ReceivedPOsTab } from '../components/finance/ReceivedPOsTab';
import { InvoicesTab } from '../components/finance/InvoicesTab';
import { IssuedPOsTab } from '../components/finance/IssuedPOsTab';
import { ReceivedInvoicesTab } from '../components/finance/ReceivedInvoicesTab';
import { getCurrentUser } from '../lib/auth';
import { checkPermission, getPermissionMessage } from '../lib/permissions';
import { toast } from 'react-hot-toast';
import financeService from '../services/finance.service';
import type { FileAttachment } from '../types/fileAttachment.types';
import { logger } from '../lib/logger';
import {
  exportReceivedPOsToCSV,
  exportReceivedPOsToExcel,
  exportInvoicesToCSV,
  exportInvoicesToExcel,
  exportIssuedPOsToCSV,
  exportIssuedPOsToExcel,
  exportReceivedInvoicesToCSV,
  exportReceivedInvoicesToExcel,
} from '../utils/financeExport';
import { FinanceExportButton } from '../components/ui/FinanceExportButton';

export const FinanceDocumentsScreen = () => {
  const currentUser = getCurrentUser();
  const userRoles = (currentUser?.roles || [currentUser?.role || 'engineer']) as any[];
  const canAccess = currentUser && checkPermission(userRoles, 'canAccessFinance');
  const canUpload = currentUser && checkPermission(userRoles, 'canUploadPO');
  const canDeletePO = currentUser && checkPermission(userRoles, 'canDeletePO');
  const canDeleteInvoice = currentUser && checkPermission(userRoles, 'canDeleteInvoices');
  const canApprove = currentUser && checkPermission(userRoles, 'canApproveInvoices');



  const [activeTab, setActiveTab] = useState<FinanceTab>('received-pos');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<{ type: string; id: string } | string | null>(null);
  const [showAddReceivedPOModal, setShowAddReceivedPOModal] = useState(false);
  const [showAddInvoiceModal, setShowAddInvoiceModal] = useState(false);
  const [showEditInvoiceModal, setShowEditInvoiceModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [showAddIssuedPOModal, setShowAddIssuedPOModal] = useState(false);
  const [showAddReceivedInvoiceModal, setShowAddReceivedInvoiceModal] = useState(false);
  const [editingReceivedInvoice, setEditingReceivedInvoice] = useState<any | null>(null);
  const [showEditPOModal, setShowEditPOModal] = useState(false);
  const [selectedPO, setSelectedPO] = useState<any | null>(null);
  const [showViewDetailsModal, setShowViewDetailsModal] = useState(false);

  // Real data from API
  const [receivedPOs, setReceivedPOs] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [issuedPOs, setIssuedPOs] = useState<any[]>([]);
  const [receivedInvoices, setReceivedInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Export handler
  const handleExport = (format: 'csv' | 'excel') => {
    switch (activeTab) {
      case 'received-pos':
        format === 'csv'
          ? exportReceivedPOsToCSV(receivedPOs)
          : exportReceivedPOsToExcel(receivedPOs);
        break;
      case 'invoices':
        format === 'csv'
          ? exportInvoicesToCSV(invoices)
          : exportInvoicesToExcel(invoices);
        break;
      case 'issued-pos':
        format === 'csv'
          ? exportIssuedPOsToCSV(issuedPOs)
          : exportIssuedPOsToExcel(issuedPOs);
        break;
      case 'received-invoices':
        format === 'csv'
          ? exportReceivedInvoicesToCSV(receivedInvoices)
          : exportReceivedInvoicesToExcel(receivedInvoices);
        break;
    }
  };

  // Load data on mount and when tab changes
  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'received-pos') {
        const response = await financeService.getAllPurchaseOrders();
        // API returns { data, total, limit, offset }, extract data array
        const data = Array.isArray(response) ? response : response.data || [];
        setReceivedPOs(data);
      } else if (activeTab === 'invoices') {
        const data = await financeService.getAllInvoices();
        setInvoices(data || []);
      } else if (activeTab === 'issued-pos') {
        const data = await financeService.getAllIssuedPOs();
        setIssuedPOs(data || []);
      } else if (activeTab === 'received-invoices') {
        const data = await financeService.getAllReceivedInvoices();
        setReceivedInvoices(data || []);
      }
    } catch (error: any) {
      logger.error('Error loading data:', error);
      toast.error(error.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  // Access check
  if (!canAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <XCircle className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Restricted</h2>
          <p className="text-gray-600 mb-4">
            {getPermissionMessage('access finance', 'senior' as any)}
          </p>
        </div>
      </div>
    );
  }

  const handleCreateNew = () => {
    if (!canUpload) {
      toast.error(getPermissionMessage('upload PO', 'senior' as any));
      return;
    }

    switch (activeTab) {
      case 'received-pos':
        setShowAddReceivedPOModal(true);
        break;
      case 'invoices':
        setShowAddInvoiceModal(true);
        break;
      case 'issued-pos':
        setShowAddIssuedPOModal(true);
        break;
      case 'received-invoices':
        setShowAddReceivedInvoiceModal(true);
        break;
    }
  };

  const handleFileUpload = async (documentId: string, files: FileAttachment[]) => {
    if (files.length === 0) return;

    const file = files[0];
    const formData = new FormData();
    formData.append('file', file.file);

    try {
      toast.loading('Uploading document...');
      const token = localStorage.getItem('auth_token');
      if (!token) {
        toast.error('Authentication required');
        return;
      }

      // Determine endpoint based on selected document type
      const documentType = (selectedDocument as any)?.type || 'invoice';
      const endpoint = documentType === 'invoice'
        ? `/api/invoices/${documentId}/upload`
        : `/api/issued-pos/${documentId}/upload`;

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Upload failed');
      }

      toast.dismiss();
      toast.success('Document uploaded successfully!');
      setShowUploadModal(false);
      setSelectedDocument(null);

      // Refresh data
      loadData();
    } catch (error: any) {
      toast.dismiss();
      logger.error('Error uploading document:', error);
      toast.error(error.message || 'Failed to upload document');
    }
  };

  const handleFileRemove = (_documentId: string, _fileId: string) => {
    toast.success('File removed successfully');
  };

  const handleViewInvoicePDF = async (invoiceId: string) => {
    try {
      toast.loading('Opening invoice PDF...');
      const token = localStorage.getItem('auth_token');
      if (!token) {
        toast.error('Authentication required');
        return;
      }

      // Fetch PDF with authentication header, then open in new tab
      const pdfUrl = `/api/invoices/${invoiceId}/pdf`;
      fetch(pdfUrl, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      .then(response => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.blob();
      })
      .then(blob => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.target = '_blank';
        a.click();
        window.URL.revokeObjectURL(url);
        toast.dismiss();
        toast.success('Opening invoice PDF');
      })
      .catch(error => {
        toast.dismiss();
        logger.error('Error opening PDF:', error);
        toast.error('Failed to open PDF: ' + error.message);
      });
    } catch (error: any) {
      toast.dismiss();
      logger.error('Error opening invoice PDF:', error);
      toast.error('Failed to open PDF');
    }
  };

  const handleUploadInvoiceDocument = (invoice: any) => {
    setSelectedDocument({ type: 'invoice', id: invoice.id });
    setShowUploadModal(true);
  };

  const handleEditInvoice = (invoice: any) => {
    setSelectedInvoice(invoice);
    setShowEditInvoiceModal(true);
  };

  const handleDeletePO = async (po: any) => {
    if (!window.confirm(`Are you sure you want to delete PO ${po.po_number || po.poNumber}?`)) {
      return;
    }

    try {
      toast.loading('Deleting PO...');
      const isIssued = activeTab === 'issued-pos';
      if (isIssued) {
        await financeService.deleteIssuedPO(po.id);
      } else {
        await financeService.deletePurchaseOrder(po.id);
      }
      toast.success('PO deleted successfully');
      loadData();
    } catch (error: any) {
      logger.error('Error deleting PO:', error);
      toast.error(error.message || 'Failed to delete PO');
    }
  };

  const handleDeleteInvoice = async (invoice: any) => {
    if (!window.confirm(`Are you sure you want to delete invoice ${invoice.invoiceNumber}?`)) {
      return;
    }

    try {
      toast.loading('Deleting invoice...');
      await financeService.deleteInvoice(invoice.id);
      toast.success('Invoice deleted successfully');
      loadData();
    } catch (error: any) {
      logger.error('Error deleting invoice:', error);
      toast.error(error.message || 'Failed to delete invoice');
    }
  };

  const handleUploadIssuedPODocument = (po: any) => {
    setSelectedDocument({ type: 'issued-po', id: po.id });
    setShowUploadModal(true);
  };

  const handleViewIssuedPOPDF = async (poId: string) => {
    try {
      toast.loading('Opening issued PO PDF...');
      const token = localStorage.getItem('auth_token');
      if (!token) {
        toast.error('Authentication required');
        return;
      }

      // Fetch PDF with authentication header, then open in new tab
      const pdfUrl = `/api/issued-pos/${poId}/pdf`;
      fetch(pdfUrl, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      .then(response => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.blob();
      })
      .then(blob => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.target = '_blank';
        a.click();
        window.URL.revokeObjectURL(url);
        toast.dismiss();
        toast.success('Opening issued PO PDF');
      })
      .catch(error => {
        toast.dismiss();
        logger.error('Error opening PDF:', error);
        toast.error('Failed to open PDF: ' + error.message);
      });
    } catch (error: any) {
      toast.dismiss();
      logger.error('Error opening PO PDF:', error);
      toast.error('Failed to open PDF');
    }
  };

  const handleViewDocument = (po: any) => {
    if (po.file_url) {
      window.open(po.file_url, '_blank');
      toast.success('Opening document in new tab');
    } else {
      toast.error('No document available');
    }
  };

  const handleAttachDocument = (poId: string) => {
    setSelectedDocument(poId);
    setShowUploadModal(true);
  };

  const handleEditPO = (po: any) => {
    setSelectedPO(po);
    setShowEditPOModal(true);
  };

  const handleViewDetails = (po: any) => {
    setSelectedPO(po);
    setShowViewDetailsModal(true);
  };

  // Invoice Approval Handlers
  const handleSubmitForApproval = async (invoiceId: string) => {
    try {
      await financeService.submitInvoiceForApproval(invoiceId);
      toast.success('Invoice submitted for approval');
      loadData();
    } catch (error: any) {
      logger.error('Error submitting invoice:', error);
      toast.error(error.message || 'Failed to submit invoice for approval');
    }
  };

  const handleApproveInvoice = async (invoiceId: string) => {
    try {
      await financeService.approveInvoice(invoiceId);
      toast.success('Invoice approved successfully');
      loadData();
    } catch (error: any) {
      logger.error('Error approving invoice:', error);
      toast.error(error.message || 'Failed to approve invoice');
    }
  };

  const handleWithdrawInvoice = async (invoiceId: string) => {
    try {
      await financeService.withdrawInvoice(invoiceId);
      toast.success('Invoice withdrawn from approval');
      loadData();
    } catch (error: any) {
      logger.error('Error withdrawing invoice:', error);
      toast.error(error.message || 'Failed to withdraw invoice');
    }
  };

  const handleMarkAsSent = async (invoiceId: string) => {
    try {
      await financeService.markInvoiceAsSent(invoiceId);
      toast.success('Invoice marked as sent');
      loadData();
    } catch (error: any) {
      logger.error('Error marking invoice as sent:', error);
      toast.error(error.message || 'Failed to mark invoice as sent');
    }
  };

  const handleMarkAsPaid = async (invoiceId: string) => {
    try {
      await financeService.markInvoiceAsPaid(invoiceId);
      toast.success('Invoice marked as paid');
      loadData();
    } catch (error: any) {
      logger.error('Error marking invoice as paid:', error);
      toast.error(error.message || 'Failed to mark invoice as paid');
    }
  };

  const handleEditReceivedInvoice = (invoice: any) => {
    setEditingReceivedInvoice(invoice);
    setShowAddReceivedInvoiceModal(true);
  };

  const handleDeleteReceivedInvoice = async (invoiceId: string) => {
    if (!window.confirm('Are you sure you want to delete this received invoice?')) {
      return;
    }
    try {
      toast.loading('Deleting received invoice...');
      await financeService.deleteReceivedInvoice(invoiceId);
      toast.success('Received invoice deleted successfully');
      loadData();
    } catch (error: any) {
      logger.error('Error deleting received invoice:', error);
      toast.error(error.message || 'Failed to delete received invoice');
    }
  };

  const handleVerifyReceivedInvoice = async (invoiceId: string) => {
    try {
      toast.loading('Verifying received invoice...');
      await financeService.verifyReceivedInvoice(invoiceId);
      toast.success('Received invoice verified successfully');
      loadData();
    } catch (error: any) {
      logger.error('Error verifying received invoice:', error);
      toast.error(error.message || 'Failed to verify received invoice');
    }
  };

  const handleMarkReceivedInvoiceAsPaid = async (invoiceId: string) => {
    try {
      toast.loading('Marking received invoice as paid...');
      await financeService.markReceivedInvoiceAsPaid(invoiceId);
      toast.success('Received invoice marked as paid');
      loadData();
    } catch (error: any) {
      logger.error('Error marking received invoice as paid:', error);
      toast.error(error.message || 'Failed to mark received invoice as paid');
    }
  };

  const handleDisputeReceivedInvoice = async (invoiceId: string) => {
    try {
      toast.loading('Disputing received invoice...');
      await financeService.disputeReceivedInvoice(invoiceId);
      toast.success('Received invoice disputed successfully');
      loadData();
    } catch (error: any) {
      logger.error('Error disputing received invoice:', error);
      toast.error(error.message || 'Failed to dispute received invoice');
    }
  };

  return (
    <div className="min-h-full bg-gray-50">
      <div className="p-4 md:p-6  space-y-6">
        {/* Header Container */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Finance Documents</h1>
              <p className="text-gray-600 mt-1">Manage POs, invoices, and financial documents</p>
            </div>
            <div className="flex items-center gap-3">
              <FinanceExportButton
                onExport={handleExport}
                disabled={loading}
                totalCount={
                  activeTab === 'received-pos' ? receivedPOs.length :
                  activeTab === 'invoices' ? invoices.length :
                  activeTab === 'issued-pos' ? issuedPOs.length :
                  receivedInvoices.length
                }
              />
              <button
                onClick={handleCreateNew}
                disabled={!canUpload}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                  canUpload
                    ? 'bg-primary-600 text-white hover:bg-primary-700'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                <Plus className="w-4 h-4" />
                Create New
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <FinanceDocumentTabs
          activeTab={activeTab}
          onTabChange={setActiveTab}
          receivedPOCount={receivedPOs.length}
          invoiceCount={invoices.length}
          issuedPOCount={issuedPOs.length}
          receivedInvoiceCount={receivedInvoices.length}
        />

        {/* Content */}
        {/* Search Bar */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search PO number, client, or project..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-10 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Tab Content */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        ) : (
          <>
            {activeTab === 'received-pos' && (
              <ReceivedPOsTab
                receivedPOs={receivedPOs}
                searchQuery={searchQuery}
                canUpload={canUpload}
                canDeletePO={canDeletePO || false}
                onViewDocument={handleViewDocument}
                onAttachDocument={handleAttachDocument}
                onEditPO={handleEditPO}
                onDeletePO={handleDeletePO}
                onViewDetails={handleViewDetails}
              />
            )}
            {activeTab === 'invoices' && (
              <InvoicesTab
                invoices={invoices}
                searchQuery={searchQuery}
                onViewPDF={handleViewInvoicePDF}
                onUploadDocument={handleUploadInvoiceDocument}
                onEditInvoice={handleEditInvoice}
                onDeleteInvoice={handleDeleteInvoice}
                canUpload={canUpload}
                canDelete={canDeleteInvoice || false}
                canApprove={canApprove}
                onSubmitForApproval={handleSubmitForApproval}
                onApprove={handleApproveInvoice}
                onWithdraw={handleWithdrawInvoice}
                onMarkAsSent={handleMarkAsSent}
                onMarkAsPaid={handleMarkAsPaid}
                currentUserId={currentUser?.id}
              />
            )}
            {activeTab === 'issued-pos' && (
              <IssuedPOsTab
                issuedPOs={issuedPOs}
                searchQuery={searchQuery}
                canApprove={canApprove}
                canDeletePO={canDeletePO || false}
                canUpload={canUpload}
                onViewPDF={handleViewIssuedPOPDF}
                onUploadDocument={handleUploadIssuedPODocument}
                onDeletePO={handleDeletePO}
              />
            )}
            {activeTab === 'received-invoices' && (
              <ReceivedInvoicesTab
                receivedInvoices={receivedInvoices}
                searchQuery={searchQuery}
                canVerify={canApprove}
                canDelete={canDeleteInvoice || false}
                onViewDocument={() => {}}
                onEditInvoice={handleEditReceivedInvoice}
                onDeleteInvoice={(invoice: any) => handleDeleteReceivedInvoice(invoice.id)}
                onVerify={handleVerifyReceivedInvoice}
                onMarkAsPaid={handleMarkReceivedInvoiceAsPaid}
                onDispute={handleDisputeReceivedInvoice}
              />
            )}
          </>
        )}

        {/* File Upload Modal */}
        {showUploadModal && selectedDocument && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">Upload Documents</h2>
              </div>
              <div className="p-6">
                <FileUploadZone
                  attachments={[]}
                  onFilesAdded={(files) => handleFileUpload((selectedDocument as any).id, files)}
                  onFileRemoved={(fileId) => handleFileRemove((selectedDocument as any).id, fileId)}
                />
              </div>
              <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
                <button
                  onClick={() => {
                    setShowUploadModal(false);
                    setSelectedDocument(null);
                  }}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setShowUploadModal(false);
                    setSelectedDocument(null);
                  }}
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Add Received PO Modal */}
        <AddReceivedPOModal
          isOpen={showAddReceivedPOModal}
          onClose={() => {
            setShowAddReceivedPOModal(false);
            loadData(); // Refresh data after modal closes
          }}
        />

        {/* Add Invoice Modal */}
        <AddInvoiceModal
          isOpen={showAddInvoiceModal}
          onClose={() => {
            setShowAddInvoiceModal(false);
            loadData(); // Refresh data after modal closes
          }}
        />

        {/* Edit Invoice Modal */}
        {showEditInvoiceModal && selectedInvoice && (
          <EditInvoiceModal
            isOpen={showEditInvoiceModal}
            onClose={() => {
              setShowEditInvoiceModal(false);
              setSelectedInvoice(null);
              loadData(); // Refresh data after modal closes
            }}
            invoice={selectedInvoice}
            onSave={() => {
              setShowEditInvoiceModal(false);
              setSelectedInvoice(null);
              loadData();
            }}
          />
        )}

        {/* Add Issued PO Modal */}
        <AddIssuedPOModal
          isOpen={showAddIssuedPOModal}
          onClose={() => {
            setShowAddIssuedPOModal(false);
            loadData(); // Refresh data after modal closes
          }}
        />

        {/* Add Received Invoice Modal */}
        {showAddReceivedInvoiceModal && (
          <AddReceivedInvoiceModal
            isOpen={showAddReceivedInvoiceModal}
            onClose={() => {
              setShowAddReceivedInvoiceModal(false);
              setEditingReceivedInvoice(null);
              loadData(); // Refresh data after modal closes
            }}
            onSuccess={() => {
              setEditingReceivedInvoice(null);
              loadData();
              setShowAddReceivedInvoiceModal(false);
            }}
            editingInvoice={editingReceivedInvoice}
          />
        )}

        {/* Edit PO Modal */}
        {showEditPOModal && selectedPO && (
          <EditPOModal
            isOpen={showEditPOModal}
            po={selectedPO}
            onClose={() => setShowEditPOModal(false)}
            onSave={async (data) => {
              try {
                await financeService.updatePurchaseOrder(selectedPO.id, data);
                await loadData();
                setShowEditPOModal(false);
                toast.success('PO updated successfully!');
              } catch (error: any) {
                logger.error('Error updating PO:', error);
                toast.error(error.response?.data?.message || 'Failed to update PO');
                setShowEditPOModal(false);
              }
            }}
          />
        )}

        {/* View PO Details Modal */}
        {showViewDetailsModal && selectedPO && (
          <ViewPODetailsModal
            isOpen={showViewDetailsModal}
            po={selectedPO}
            onClose={() => {
              setShowViewDetailsModal(false);
              setSelectedPO(null);
            }}
          />
        )}

      </div>
    </div>
  );
};
