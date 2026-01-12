import React, { memo } from 'react';
import { Paperclip, FileText, Edit2, Eye } from 'lucide-react';
import { getStatusBadge, formatDate } from '../../lib/financeUtils';
import { toast } from 'react-hot-toast';

interface ReceivedPOsTabProps {
  receivedPOs: any[];
  searchQuery: string;
  canUpload: boolean;
  onViewDocument: (po: any) => void;
  onAttachDocument: (poId: string) => void;
  onEditPO: (po: any) => void;
  onViewDetails: (po: any) => void;
}

export const ReceivedPOsTab: React.FC<ReceivedPOsTabProps> = memo(({
  receivedPOs,
  searchQuery,
  canUpload,
  onViewDocument,
  onAttachDocument,
  onEditPO,
  onViewDetails,
}) => {
  const filteredPOs = receivedPOs.filter((po) => {
    const query = searchQuery.toLowerCase();
    if (!query) return true;

    return (
      po.po_number?.toLowerCase().includes(query) ||
      po.client_name?.toLowerCase().includes(query) ||
      po.project_code?.toLowerCase().includes(query) ||
      po.project?.title?.toLowerCase().includes(query)
    );
  });

  if (!Array.isArray(receivedPOs) || receivedPOs.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No purchase orders found</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {filteredPOs.map((po) => {
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

              {/* Project code and title as subheading */}
              {po.project_code || po.project?.title ? (
                <h4 className="text-lg font-semibold text-primary-600 mb-2">
                  {po.project_code || po.project?.project_code || 'Unknown'} - {po.project?.title || po.project_code || 'Untitled Project'}
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
                <p className="text-sm font-medium text-gray-900">{formatDate(po.received_date)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Due Date</p>
                <p className="text-sm font-medium text-gray-900">{formatDate(po.due_date)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Amount</p>
                <p className="text-sm font-medium text-gray-900">RM {po.amount?.toLocaleString() || '0.00'}</p>
              </div>
            </div>

            {/* Document view button */}
            {po.file_url && (
              <div className="mt-3 pt-3 border-t border-gray-100">
                <button
                  onClick={() => onViewDocument(po)}
                  className="inline-flex items-center gap-1 text-sm text-primary-600 hover:text-primary-800 font-medium"
                >
                  <Eye className="w-4 h-4" />
                  View Document
                </button>
              </div>
            )}

            <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
              <button
                onClick={() => onAttachDocument(po.id)}
                className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1"
              >
                <Paperclip className="w-4 h-4" />
                Attach Document
              </button>
              <div className="flex gap-2">
                {canUpload && (
                  <button
                    onClick={() => onEditPO(po)}
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
                  onClick={() => onViewDetails(po)}
                  className="px-3 py-1.5 bg-gray-100 text-gray-700 text-sm rounded-lg hover:bg-gray-200"
                >
                  View Details
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
});
