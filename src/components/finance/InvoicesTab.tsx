import React from 'react';
import { Eye, Edit2 } from 'lucide-react';
import { getStatusBadge, formatDate } from '../../lib/financeUtils';
import { toast } from 'react-hot-toast';

interface InvoicesTabProps {
  invoices: any[];
  searchQuery: string;
  onViewPDF: (invoiceId: string, invoiceNumber: string) => void;
  onEditInvoice?: (invoice: any) => void;
  canUpload?: boolean;
  canApprove?: boolean;
  onSubmitForApproval?: (invoiceId: string) => void;
  onApprove?: (invoiceId: string) => void;
  onWithdraw?: (invoiceId: string) => void;
  onMarkAsSent?: (invoiceId: string) => void;
  currentUserId?: string;
}

export const InvoicesTab: React.FC<InvoicesTabProps> = ({
  invoices,
  searchQuery,
  onViewPDF,
  onEditInvoice,
  canUpload = false,
  canApprove = false,
  onSubmitForApproval,
  onApprove,
  onWithdraw,
  onMarkAsSent,
  currentUserId,
}) => {
  const filteredInvoices = invoices.filter((inv) => {
    const query = searchQuery.toLowerCase();
    if (!query) return true;

    return (
      inv.invoiceNumber?.toLowerCase().includes(query) ||
      inv.clientName?.toLowerCase().includes(query) ||
      inv.projectCode?.toLowerCase().includes(query) ||
      inv.project?.title?.toLowerCase().includes(query)
    );
  });

  if (!Array.isArray(invoices) || invoices.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No invoices found</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {filteredInvoices.map((inv) => {
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
                <p className="text-2xl font-bold text-gray-900">{inv.currency || 'MYR'} {(inv.amount || 0).toLocaleString()}</p>
              </div>

              {/* Project code and title as subheading */}
              {inv.projectCode ? (
                <h4 className="text-lg font-semibold text-primary-600 mb-2">
                  {inv.projectCode} - {inv.projectName || 'Untitled Project'}
                </h4>
              ) : (
                <p className="text-sm text-gray-500 mb-2">No project linked</p>
              )}

              {/* Invoice details */}
              <p className="text-sm text-gray-600 mb-1">Progress: {inv.percentageOfTotal}% (Invoice #{inv.invoiceSequence})</p>

              {/* Cumulative percentage */}
              <div className="flex items-center gap-4 text-xs text-gray-500">
                <span>Cumulative: {inv.cumulativePercentage}%</span>
                {inv.remark && <span>• {inv.remark}</span>}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 py-3 border-t border-gray-100">
              <div>
                <p className="text-xs text-gray-500">Invoice Date</p>
                <p className="text-sm font-medium text-gray-900">{formatDate(inv.invoiceDate)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Status</p>
                <p className="text-sm font-medium text-gray-900 capitalize">{inv.status || 'draft'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Project</p>
                <p className="text-sm font-medium text-primary-600">{inv.projectCode}</p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 mt-4 pt-4 border-t border-gray-100">
              {/* View PDF */}
              <button
                onClick={() => onViewPDF(inv.id, inv.invoiceNumber)}
                className="px-3 py-1.5 bg-primary-100 text-primary-700 text-sm rounded-lg hover:bg-primary-200 flex items-center gap-1.5"
              >
                <Eye className="w-4 h-4" />
                View PDF
              </button>

              {/* Edit - Draft or Pending (creator only) */}
              {canUpload && onEditInvoice &&
               (inv.status === 'draft' ||
                (inv.status === 'pending-approval' && inv.createdBy === currentUserId)) && (
                <button
                  onClick={() => onEditInvoice(inv)}
                  className="px-3 py-1.5 bg-gray-100 text-gray-700 text-sm rounded-lg hover:bg-gray-200 flex items-center gap-1.5"
                >
                  <Edit2 className="w-4 h-4" />
                  Edit
                </button>
              )}

              {/* Submit for Approval - Draft only */}
              {inv.status === 'draft' && canUpload && onSubmitForApproval && (
                <button
                  onClick={() => onSubmitForApproval(inv.id)}
                  className="px-3 py-1.5 bg-orange-100 text-orange-700 text-sm rounded-lg hover:bg-orange-200"
                >
                  Submit for Approval
                </button>
              )}

              {/* Approve - Pending Approval, MD only */}
              {inv.status === 'pending-approval' && canApprove && onApprove && (
                <button
                  onClick={() => onApprove(inv.id)}
                  className="px-3 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700"
                >
                  Approve
                </button>
              )}

              {/* Withdraw - Pending Approval, creator only */}
              {inv.status === 'pending-approval' &&
               inv.createdBy === currentUserId && onWithdraw && (
                <button
                  onClick={() => onWithdraw(inv.id)}
                  className="px-3 py-1.5 bg-red-100 text-red-700 text-sm rounded-lg hover:bg-red-200"
                >
                  Withdraw
                </button>
              )}

              {/* Mark as Sent - Approved only */}
              {inv.status === 'approved' && canUpload && onMarkAsSent && (
                <button
                  onClick={() => onMarkAsSent(inv.id)}
                  className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
                >
                  Mark as Sent
                </button>
              )}

              {/* Mark as Paid - Sent only (placeholder) */}
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
      })}
    </div>
  );
};
