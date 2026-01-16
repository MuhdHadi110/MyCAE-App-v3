import React from 'react';
import { Eye, Trash2 } from 'lucide-react';
import { getStatusBadge, formatDate } from '../../lib/financeUtils';
import { toast } from 'react-hot-toast';

interface IssuedPOsTabProps {
  issuedPOs: any[];
  searchQuery: string;
  canApprove: boolean;
  canDeletePO: boolean;
  onViewPDF: (poId: string, poNumber: string) => void;
  onDeletePO: (po: any) => void;
}

export const IssuedPOsTab: React.FC<IssuedPOsTabProps> = ({
  issuedPOs,
  searchQuery,
  canApprove,
  canDeletePO,
  onViewPDF,
  onDeletePO,
}) => {
  const filteredPOs = issuedPOs.filter((po) => {
    const query = searchQuery.toLowerCase();
    if (!query) return true;

    return (
      po.poNumber?.toLowerCase().includes(query) ||
      po.vendor?.toLowerCase().includes(query) ||
      po.projectCode?.toLowerCase().includes(query) ||
      po.project?.title?.toLowerCase().includes(query)
    );
  });

  if (!Array.isArray(issuedPOs) || issuedPOs.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No issued POs found</p>
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
                  <h3 className="text-lg font-semibold text-gray-900">{po.poNumber}</h3>
                  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${statusBadge.color}`}>
                    <StatusIcon className="w-3 h-3" />
                    {statusBadge.label}
                  </span>
                </div>
                <p className="text-2xl font-bold text-gray-900">{po.currency} {(po.amount || 0).toLocaleString()}</p>
              </div>

              {/* Project code and title as subheading */}
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
                Created {formatDate(po.issueDate)}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => onViewPDF(po.id, po.poNumber)}
                  className="px-3 py-1.5 bg-primary-100 text-primary-700 text-sm rounded-lg hover:bg-primary-200 flex items-center gap-1.5"
                >
                  <Eye className="w-4 h-4" />
                  View PDF
                </button>
                {canDeletePO && (
                  <button
                    onClick={() => onDeletePO(po)}
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
