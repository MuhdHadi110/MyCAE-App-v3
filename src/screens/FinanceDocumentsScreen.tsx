import React, { useState, useEffect } from 'react';
import { Plus, Download, Filter, CheckCircle, Clock, XCircle, Paperclip, FileText, Edit2, X, Upload, Trash2, Search } from 'lucide-react';
import { FinanceDocumentTabs, type FinanceTab } from '../components/FinanceDocumentTabs';
import { FileUploadZone } from '../components/FileUploadZone';
import { AddReceivedPOModal } from '../components/modals/AddReceivedPOModal';
import { AddInvoiceModal } from '../components/modals/AddInvoiceModal';
import { AddIssuedPOModal } from '../components/modals/AddIssuedPOModal';
import { getCurrentUser } from '../lib/auth';
import { checkPermission, getPermissionMessage } from '../lib/permissions';
import { toast } from 'react-hot-toast';
import apiService from '../services/api.service';
import type { ReceivedPO, IssuedPO } from '../types/receivedPO.types';
import type { Invoice } from '../types/invoice.types';
import type { FileAttachment } from '../types/fileAttachment.types';
import { usePurchaseOrderStore } from '../store/purchaseOrderStore';
import { useProjectStore } from '../store/projectStore';
import { useClientStore } from '../store/clientStore';

export const FinanceDocumentsScreen = () => {
  const currentUser = getCurrentUser();
  const canAccess = currentUser && checkPermission(currentUser.role as any, 'canAccessFinance');
  const canUpload = currentUser && checkPermission(currentUser.role as any, 'canUploadPO');
  const canApprove = currentUser && checkPermission(currentUser.role as any, 'canApproveInvoices');

  const { updatePurchaseOrder } = usePurchaseOrderStore();

  const [activeTab, setActiveTab] = useState<FinanceTab>('received-pos');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<string | null>(null);
  const [showAddReceivedPOModal, setShowAddReceivedPOModal] = useState(false);
  const [showAddInvoiceModal, setShowAddInvoiceModal] = useState(false);
  const [showAddIssuedPOModal, setShowAddIssuedPOModal] = useState(false);
  const [showEditPOModal, setShowEditPOModal] = useState(false);
  const [selectedPO, setSelectedPO] = useState<any | null>(null);
  const [showViewDetailsModal, setShowViewDetailsModal] = useState(false);

  // Real data from API
  const [receivedPOs, setReceivedPOs] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [issuedPOs, setIssuedPOs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Load data on mount and when tab changes
  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'received-pos') {
        const response = await apiService.getAllPurchaseOrders();
        // API returns { data, total, limit, offset }, extract the data array
        const data = Array.isArray(response) ? response : response.data || [];
        setReceivedPOs(data);
      } else if (activeTab === 'invoices') {
        const data = await apiService.getAllInvoices();
        setInvoices(data || []);
      } else if (activeTab === 'issued-pos') {
        const data = await apiService.getAllIssuedPOs();
        setIssuedPOs(data || []);
      }
    } catch (error: any) {
      console.error('Error loading data:', error);
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
    }
  };

  const handleFileUpload = (_documentId: string, files: FileAttachment[]) => {
    toast.success(`${files.length} file(s) uploaded successfully!`);
    setShowUploadModal(false);
    setSelectedDocument(null);
  };

  const handleFileRemove = (_documentId: string, _fileId: string) => {
    toast.success('File removed successfully');
  };

  const handleDownloadInvoicePDF = async (invoiceId: string, invoiceNumber: string) => {
    try {
      const blob = await apiService.downloadInvoicePDF(invoiceId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `invoice-${invoiceNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      toast.success('Invoice PDF downloaded successfully');
    } catch (error: any) {
      console.error('Error downloading invoice PDF:', error);
      toast.error('Failed to download invoice PDF');
    }
  };

  const handleDownloadIssuedPOPDF = async (poId: string, poNumber: string) => {
    try {
      const blob = await apiService.downloadIssuedPOPDF(poId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `po-${poNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      toast.success('PO PDF downloaded successfully');
    } catch (error: any) {
      console.error('Error downloading PO PDF:', error);
      toast.error('Failed to download PO PDF');
    }
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      received: { label: 'Received', color: 'bg-blue-100 text-blue-800', icon: FileText },
      'in-progress': { label: 'In Progress', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      invoiced: { label: 'Invoiced', color: 'bg-purple-100 text-purple-800', icon: FileText },
      paid: { label: 'Paid', color: 'bg-green-100 text-green-800', icon: CheckCircle },
      cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-800', icon: XCircle },
      draft: { label: 'Draft', color: 'bg-gray-100 text-gray-800', icon: FileText },
      sent: { label: 'Sent', color: 'bg-blue-100 text-blue-800', icon: CheckCircle },
      viewed: { label: 'Viewed', color: 'bg-primary-100 text-indigo-800', icon: CheckCircle },
      overdue: { label: 'Overdue', color: 'bg-red-100 text-red-800', icon: XCircle },
      pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      approved: { label: 'Approved', color: 'bg-green-100 text-green-800', icon: CheckCircle },
      rejected: { label: 'Rejected', color: 'bg-red-100 text-red-800', icon: XCircle },
    };
    return badges[status as keyof typeof badges] || badges.pending;
  };

  const renderReceivedPOs = () => (
    <div className="space-y-4">
      {Array.isArray(receivedPOs) && receivedPOs.length > 0 ? (
        receivedPOs
          .filter((po) => {
            const query = searchQuery.toLowerCase();
            if (!query) return true;

            return (
              po.po_number?.toLowerCase().includes(query) ||
              po.client_name?.toLowerCase().includes(query) ||
              po.project_code?.toLowerCase().includes(query) ||
              po.project?.title?.toLowerCase().includes(query)
            );
          })
          .map((po) => {
          const statusBadge = getStatusBadge(po.status);
          const StatusIcon = statusBadge.icon;

          return (
            <div key={po.id} className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <div className="mb-4">
                {/* PO Number and badges */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-semibold text-gray-900">{po.po_number}</h3>
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${statusBadge.color}`}>
                      <StatusIcon className="w-3 h-3" />
                      {statusBadge.label}
                    </span>
                    {/* Document uploaded indicator */}
                    {po.file_url && (
                      <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-1 bg-green-100 text-green-800 rounded-full">
                        <FileText className="w-3 h-3" />
                        Document
                      </span>
                    )}
                    {po.attachments?.length > 0 && (
                      <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                        <Paperclip className="w-3 h-3" />
                        {po.attachments.length}
                      </span>
                    )}
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{po.currency} {po.amount.toLocaleString()}</p>
                </div>

                {/* Project code and title as subheading - SAME SIZE as PO number */}
                {po.project_code ? (
                  <h4 className="text-lg font-semibold text-primary-600 mb-2">
                    {po.project_code} - {po.project?.title || 'Untitled Project'}
                  </h4>
                ) : (
                  <p className="text-sm text-gray-500 mb-2">No project linked</p>
                )}

                {/* Client name */}
                <p className="text-sm text-gray-600 mb-1">{po.client_name}</p>

                {/* Description */}
                {po.description && <p className="text-sm text-gray-500">{po.description}</p>}
              </div>

              <div className="grid grid-cols-3 gap-4 py-3 border-t border-gray-100">
                <div>
                  <p className="text-xs text-gray-500">Received Date</p>
                  <p className="text-sm font-medium text-gray-900">{po.received_date ? new Date(po.received_date).toLocaleDateString() : 'Invalid Date'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Due Date</p>
                  <p className="text-sm font-medium text-gray-900">{po.due_date ? new Date(po.due_date).toLocaleDateString() : 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Amount</p>
                  <p className="text-sm font-medium text-gray-900">RM {po.amount?.toLocaleString() || '0.00'}</p>
                </div>
              </div>

              {/* Document download link */}
              {po.file_url && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <a
                    href={po.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 hover:underline"
                  >
                    <Download className="w-4 h-4" />
                    View Uploaded Document
                  </a>
                </div>
              )}

              <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                <button
                  onClick={() => {
                    setSelectedDocument(po.id);
                    setShowUploadModal(true);
                  }}
                  className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1"
                >
                  <Paperclip className="w-4 h-4" />
                  Attach Document
                </button>
                <div className="flex gap-2">
                  {canUpload && (
                    <button
                      onClick={() => {
                        setSelectedPO(po);
                        setShowEditPOModal(true);
                      }}
                      className="px-3 py-1.5 bg-blue-100 text-blue-700 text-sm rounded-lg hover:bg-blue-200 flex items-center gap-1.5"
                    >
                      <Edit2 className="w-4 h-4" />
                      Edit PO
                    </button>
                  )}
                  {po.status === 'in-progress' && (
                    <button
                      onClick={() => toast.success('Create Invoice - Coming Soon')}
                      className="px-3 py-1.5 bg-primary-600 text-white text-sm rounded-lg hover:bg-primary-700"
                      disabled
                    >
                      Create Invoice
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setSelectedPO(po);
                      setShowViewDetailsModal(true);
                    }}
                    className="px-3 py-1.5 bg-gray-100 text-gray-700 text-sm rounded-lg hover:bg-gray-200"
                  >
                    View Details
                  </button>
                </div>
              </div>
            </div>
          );
        })
      ) : (
        <div className="text-center py-12">
          <p className="text-gray-500">No purchase orders found</p>
        </div>
      )}
    </div>
  );

  const renderInvoices = () => (
    <div className="space-y-4">
      {Array.isArray(invoices) && invoices.length > 0 ? (
        invoices
          .filter((inv) => {
            const query = searchQuery.toLowerCase();
            if (!query) return true;

            return (
              inv.invoiceNumber?.toLowerCase().includes(query) ||
              inv.clientName?.toLowerCase().includes(query) ||
              inv.projectCode?.toLowerCase().includes(query) ||
              inv.project?.title?.toLowerCase().includes(query)
            );
          })
          .map((inv) => {
          const statusBadge = getStatusBadge(inv.status);
          const StatusIcon = statusBadge.icon;

          return (
            <div key={inv.id} className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <div className="mb-4">
                {/* Invoice Number and badges */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-semibold text-gray-900">{inv.invoiceNumber}</h3>
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${statusBadge.color}`}>
                      <StatusIcon className="w-3 h-3" />
                      {statusBadge.label}
                    </span>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{inv.currency} {inv.totalAmount.toLocaleString()}</p>
                </div>

                {/* Project code and title as subheading - SAME SIZE as invoice number */}
                {inv.projectCode ? (
                  <h4 className="text-lg font-semibold text-primary-600 mb-2">
                    {inv.projectCode} - {inv.project?.title || 'Untitled Project'}
                  </h4>
                ) : (
                  <p className="text-sm text-gray-500 mb-2">No project linked</p>
                )}

                {/* Client name */}
                <p className="text-sm text-gray-600 mb-1">{inv.clientName}</p>

                {/* PO Reference and Balance */}
                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <span>PO Ref: {inv.receivedPONumber}</span>
                  <span>Balance: {inv.currency} {inv.balanceDue.toLocaleString()}</span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 py-3 border-t border-gray-100">
                <div>
                  <p className="text-xs text-gray-500">Issue Date</p>
                  <p className="text-sm font-medium text-gray-900">{new Date(inv.issueDate).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Due Date</p>
                  <p className="text-sm font-medium text-gray-900">{new Date(inv.dueDate).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Project</p>
                  <p className="text-sm font-medium text-primary-600">{inv.projectCode}</p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 mt-4 pt-4 border-t border-gray-100">
                <button
                  onClick={() => handleDownloadInvoicePDF(inv.id, inv.invoiceNumber)}
                  className="px-3 py-1.5 bg-gray-100 text-gray-700 text-sm rounded-lg hover:bg-gray-200 flex items-center gap-1.5"
                >
                  <Download className="w-4 h-4" />
                  Download PDF
                </button>
                {inv.status === 'sent' && (
                  <button
                    onClick={() => toast.success('Marked as Paid - Coming Soon')}
                    className="px-3 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700"
                    disabled
                  >
                    Mark as Paid
                  </button>
                )}
              </div>
            </div>
          );
        })
      ) : (
        <div className="text-center py-12">
          <p className="text-gray-500">No invoices found</p>
        </div>
      )}
    </div>
  );

  const renderIssuedPOs = () => (
    <div className="space-y-4">
      {Array.isArray(issuedPOs) && issuedPOs.length > 0 ? (
        issuedPOs
          .filter((po) => {
            const query = searchQuery.toLowerCase();
            if (!query) return true;

            return (
              po.poNumber?.toLowerCase().includes(query) ||
              po.vendor?.toLowerCase().includes(query) ||
              po.projectCode?.toLowerCase().includes(query) ||
              po.project?.title?.toLowerCase().includes(query)
            );
          })
          .map((po) => {
          const statusBadge = getStatusBadge(po.status);
          const StatusIcon = statusBadge.icon;

          return (
            <div key={po.id} className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <div className="mb-4">
                {/* PO Number and badges */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-semibold text-gray-900">{po.poNumber}</h3>
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${statusBadge.color}`}>
                      <StatusIcon className="w-3 h-3" />
                      {statusBadge.label}
                    </span>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{po.currency} {po.amount.toLocaleString()}</p>
                </div>

                {/* Project code and title as subheading - SAME SIZE as PO number */}
                {po.projectCode ? (
                  <h4 className="text-lg font-semibold text-primary-600 mb-2">
                    {po.projectCode} - {po.project?.title || 'Untitled Project'}
                  </h4>
                ) : (
                  <p className="text-sm text-gray-500 mb-2">No project linked</p>
                )}

                {/* Vendor name */}
                <p className="text-sm text-gray-600 mb-1">{po.vendor}</p>

                {/* Description and Category */}
                <div className="flex items-center gap-4">
                  {po.description && <p className="text-sm text-gray-500">{po.description}</p>}
                  {po.category && (
                    <span className="text-xs text-gray-500 capitalize">• {po.category}</span>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                <p className="text-xs text-gray-500">
                  Created {po.issueDate ? new Date(po.issueDate).toLocaleDateString() : 'N/A'}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleDownloadIssuedPOPDF(po.id, po.poNumber)}
                    className="px-3 py-1.5 bg-gray-100 text-gray-700 text-sm rounded-lg hover:bg-gray-200 flex items-center gap-1.5"
                  >
                    <Download className="w-4 h-4" />
                    Download PDF
                  </button>
                  {po.status === 'pending' && canApprove && (
                    <>
                      <button
                        onClick={() => toast.success(`PO ${po.poNumber} - Coming Soon`)}
                        className="px-3 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700"
                        disabled
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => toast.error(`PO ${po.poNumber} - Coming Soon`)}
                        className="px-3 py-1.5 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700"
                        disabled
                      >
                        Reject
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })
      ) : (
        <div className="text-center py-12">
          <p className="text-gray-500">No issued POs found</p>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-full bg-gray-50">
      <div className="p-4 md:p-6  space-y-6">
        {/* Header Container */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center gap-3">
                <FileText className="w-8 h-8 text-primary-600" />
                Finance Documents
              </h1>
              <p className="text-gray-600 mt-1">Manage POs, invoices, and financial documents</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => toast.success('Export - Coming Soon')}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                disabled
              >
                <Download className="w-4 h-4" />
                Export
              </button>
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
            {activeTab === 'received-pos' && renderReceivedPOs()}
            {activeTab === 'invoices' && renderInvoices()}
            {activeTab === 'issued-pos' && renderIssuedPOs()}
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
                  onFilesAdded={(files) => handleFileUpload(selectedDocument, files)}
                  onFileRemoved={(fileId) => handleFileRemove(selectedDocument, fileId)}
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

        {/* Add Issued PO Modal */}
        <AddIssuedPOModal
          isOpen={showAddIssuedPOModal}
          onClose={() => {
            setShowAddIssuedPOModal(false);
            loadData(); // Refresh data after modal closes
          }}
        />

        {/* Edit PO Modal - Reuse PurchaseOrdersScreen modal component */}
        {showEditPOModal && selectedPO && (
          <EditPOModalInline
            isOpen={showEditPOModal}
            po={selectedPO}
            onClose={() => {
              setShowEditPOModal(false);
              setSelectedPO(null);
            }}
            onSave={async (data) => {
              try {
                await updatePurchaseOrder(selectedPO.id, data);
                toast.success('Purchase order updated successfully');
                setShowEditPOModal(false);
                setSelectedPO(null);
                loadData(); // Refresh data
              } catch (error: any) {
                toast.error(error.message || 'Failed to update purchase order');
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

// Edit PO Modal Component (same as PurchaseOrdersScreen but inline)
interface EditPOModalInlineProps {
  isOpen: boolean;
  po: any;
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
}

const EditPOModalInline: React.FC<EditPOModalInlineProps> = ({ isOpen, po, onClose, onSave }) => {
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
        const uploadFormData = new FormData();
        uploadFormData.append('file', selectedFile);
        uploadFormData.append('projectCode', formData.projectCode);

        const uploadResponse = await apiService.uploadPurchaseOrderFile(uploadFormData);
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
            <h2 className="text-xl font-semibold text-gray-900">Edit Purchase Order</h2>
            <p className="text-sm text-gray-600 mt-1">Update PO details</p>
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
                  .filter(p => p.status === 'pre-lim' || p.status === 'ongoing')
                  .map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.projectCode} - {project.title}
                    </option>
                  ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Client Name *</label>
            <select
              required
              value={formData.clientId}
              onChange={(e) => {
                const selectedClient = clients.find(c => c.id === e.target.value);
                setFormData({
                  ...formData,
                  clientId: e.target.value,
                  clientName: selectedClient?.name || ''
                });
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select a client</option>
              {clients.map((client) => (
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
                    className="p-2 text-blue-600 hover:bg-blue-100 rounded transition-colors"
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
                id="po-file-upload-edit"
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
                htmlFor="po-file-upload-edit"
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
              className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : 'Update PO'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// View PO Details Modal Component (read-only view)
interface ViewPODetailsModalProps {
  isOpen: boolean;
  po: any;
  onClose: () => void;
}

const ViewPODetailsModal: React.FC<ViewPODetailsModalProps> = ({ isOpen, po, onClose }) => {
  if (!isOpen || !po) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Purchase Order Details</h2>
            <p className="text-sm text-gray-600 mt-1">{po.po_number || po.poNumber}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {/* Project Info */}
          {(po.project_code || po.projectCode) && (
            <div className="bg-primary-50 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Project</h3>
              <p className="text-lg font-semibold text-primary-600">
                {po.project_code || po.projectCode} - {po.project?.title || 'No project'}
              </p>
            </div>
          )}

          {/* Client & Amount */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Client</label>
              <p className="text-base text-gray-900 mt-1">{po.client_name || po.clientName || po.vendor}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Amount</label>
              <p className="text-base font-semibold text-gray-900 mt-1">
                {po.currency} {po.amount?.toLocaleString() || '0.00'}
              </p>
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700">
                {po.received_date ? 'Received Date' : 'Issue Date'}
              </label>
              <p className="text-base text-gray-900 mt-1">
                {po.received_date
                  ? new Date(po.received_date).toLocaleDateString()
                  : po.issueDate
                  ? new Date(po.issueDate).toLocaleDateString()
                  : 'N/A'}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Due Date</label>
              <p className="text-base text-gray-900 mt-1">
                {po.due_date || po.dueDate
                  ? new Date(po.due_date || po.dueDate).toLocaleDateString()
                  : 'N/A'}
              </p>
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="text-sm font-medium text-gray-700">Status</label>
            <p className="text-base text-gray-900 mt-1 capitalize">{po.status}</p>
          </div>

          {/* Description */}
          {po.description && (
            <div>
              <label className="text-sm font-medium text-gray-700">Description</label>
              <p className="text-base text-gray-900 mt-1">{po.description}</p>
            </div>
          )}

          {/* Category (for issued POs) */}
          {po.category && (
            <div>
              <label className="text-sm font-medium text-gray-700">Category</label>
              <p className="text-base text-gray-900 mt-1 capitalize">{po.category}</p>
            </div>
          )}

          {/* Document */}
          {po.file_url && (
            <div className="border-t border-gray-200 pt-4">
              <label className="text-sm font-medium text-gray-700 mb-2 block">Attached Document</label>
              <a
                href={po.file_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100"
              >
                <FileText className="w-4 h-4" />
                View Document
              </a>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};