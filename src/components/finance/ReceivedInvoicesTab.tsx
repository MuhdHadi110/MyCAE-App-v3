import React from 'react';
import { Eye, Edit2, Trash2, CheckCircle, DollarSign, AlertTriangle, Link2 } from 'lucide-react';
import { getStatusBadge, formatDate } from '../../lib/financeUtils';

interface ReceivedInvoicesTabProps {
  receivedInvoices: any[];
  searchQuery: string;
  canVerify: boolean;
  canDelete: boolean;
  onViewDocument?: (invoice: any) => void;
  onEditInvoice?: (invoice: any) => void;
  onDeleteInvoice?: (invoice: any) => void;
  onVerify?: (invoiceId: string) => void;
  onMarkAsPaid?: (invoiceId: string) => void;
  onDispute?: (invoiceId: string) => void;
}

export const ReceivedInvoicesTab: React.FC<ReceivedInvoicesTabProps> = ({
  receivedInvoices,
  searchQuery,
  canVerify,
  canDelete,
  onViewDocument,
  onEditInvoice,
  onDeleteInvoice,
  onVerify,
  onMarkAsPaid,
  onDispute,
}) => {
  const filteredInvoices = receivedInvoices.filter((inv) => {
    const query = searchQuery.toLowerCase();
    if (!query) return true;

    return (
      inv.invoiceNumber?.toLowerCase().includes(query) ||
      inv.vendorName?.toLowerCase().includes(query) ||
      inv.issuedPO?.poNumber?.toLowerCase().includes(query)
    );
  });

  if (!Array.isArray(receivedInvoices) || receivedInvoices.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No received invoices found</p>
        <p className="text-sm text-gray-400 mt-1">Create an Issued PO first, then add a received invoice from the vendor</p>
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
                <p className="text-2xl font-bold text-gray-900">{inv.currency} {(inv.amount || 0).toLocaleString()}</p>
              </div>

              {/* Vendor name */}
              <p className="text-lg font-medium text-gray-700 mb-2">{inv.vendorName}</p>

              {/* Linked Issued PO */}
              {inv.issuedPO && (
                <div className="flex items-center gap-2 mb-2">
                  <Link2 className="w-4 h-4 text-primary-500" />
                  <span className="text-sm text-primary-600 font-medium">
                    Linked to: {inv.issuedPO.poNumber}
                  </span>
                </div>
              )}

              {/* Description */}
              {inv.description && (
                <p className="text-sm text-gray-500">{inv.description}</p>
              )}
            </div>

            {/* Dates Grid */}
            <div className="grid grid-cols-3 gap-4 mb-4 text-sm">
              <div>
                <p className="text-gray-500">Invoice Date</p>
                <p className="font-medium text-gray-900">{formatDate(inv.invoiceDate)}</p>
              </div>
              <div>
                <p className="text-gray-500">Received Date</p>
                <p className="font-medium text-gray-900">{formatDate(inv.receivedDate)}</p>
              </div>
              <div>
                <p className="text-gray-500">Due Date</p>
                <p className="font-medium text-gray-900">{inv.dueDate ? formatDate(inv.dueDate) : 'N/A'}</p>
              </div>
            </div>

            <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
              <p className="text-xs text-gray-500">
                Created {formatDate(inv.createdAt)}
              </p>
              <div className="flex gap-2">
                {/* View Document */}
                {inv.fileUrl && onViewDocument && (
                  <button
                    onClick={() => onViewDocument(inv)}
                    className="px-3 py-1.5 bg-primary-100 text-primary-700 text-sm rounded-lg hover:bg-primary-200 flex items-center gap-1.5"
                  >
                    <Eye className="w-4 h-4" />
                    View
                  </button>
                )}

                {/* Edit - only if not paid */}
                {inv.status !== 'paid' && onEditInvoice && (
                  <button
                    onClick={() => onEditInvoice(inv)}
                    className="px-3 py-1.5 bg-gray-100 text-gray-700 text-sm rounded-lg hover:bg-gray-200 flex items-center gap-1.5"
                  >
                    <Edit2 className="w-4 h-4" />
                    Edit
                  </button>
                )}

                {/* Verify - only pending/disputed and canVerify */}
                {(inv.status === 'pending' || inv.status === 'disputed') && canVerify && onVerify && (
                  <button
                    onClick={() => onVerify(inv.id)}
                    className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 flex items-center gap-1.5"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Verify
                  </button>
                )}

                {/* Mark as Paid - only verified and canVerify */}
                {inv.status === 'verified' && canVerify && onMarkAsPaid && (
                  <button
                    onClick={() => onMarkAsPaid(inv.id)}
                    className="px-3 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 flex items-center gap-1.5"
                  >
                    <DollarSign className="w-4 h-4" />
                    Mark Paid
                  </button>
                )}

                {/* Dispute - only pending/verified */}
                {(inv.status === 'pending' || inv.status === 'verified') && onDispute && (
                  <button
                    onClick={() => onDispute(inv.id)}
                    className="px-3 py-1.5 bg-orange-100 text-orange-700 text-sm rounded-lg hover:bg-orange-200 flex items-center gap-1.5"
                  >
                    <AlertTriangle className="w-4 h-4" />
                    Dispute
                  </button>
                )}

                {/* Delete - only if not paid and canDelete */}
                {inv.status !== 'paid' && canDelete && onDeleteInvoice && (
                  <button
                    onClick={() => onDeleteInvoice(inv)}
                    className="px-3 py-1.5 bg-red-100 text-red-700 text-sm rounded-lg hover:bg-red-200 flex items-center gap-1.5"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
