import React from 'react';
import { X, FileText } from 'lucide-react';

interface ViewPODetailsModalProps {
  isOpen: boolean;
  po: any;
  onClose: () => void;
}

export const ViewPODetailsModal: React.FC<ViewPODetailsModalProps> = ({ isOpen, po, onClose }) => {
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