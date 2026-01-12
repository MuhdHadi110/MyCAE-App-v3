import React, { useEffect, useState } from 'react';
import { X, Clock, AlertCircle, Plus, ArrowDown } from 'lucide-react';
import financeService from '../../services/api.service';
import { format } from 'date-fns';

interface PORevision {
  id: string;
  po_number: string;
  po_number_base: string;
  amount: number;
  currency: string;
  amount_myr: number;
  exchange_rate: number;
  received_date: string;
  revision_number: number;
  is_active: boolean;
  revision_date: string;
  revision_reason: string | null;
  amount_myr_adjusted: number | null;
  adjustment_reason: string | null;
  adjusted_at: string | null;
  status: string;
}

interface PORevisionHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  poNumberBase: string;
  onCreateRevision: (latestPO: PORevision) => void;
}

export const PORevisionHistoryModal: React.FC<PORevisionHistoryModalProps> = ({
  isOpen,
  onClose,
  poNumberBase,
  onCreateRevision,
}) => {
  const [revisions, setRevisions] = useState<PORevision[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && poNumberBase) {
      fetchRevisions();
    }
  }, [isOpen, poNumberBase]);

  const fetchRevisions = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await financeService.getPORevisions(poNumberBase);
      setRevisions(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch revision history');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRevision = () => {
    const latestActive = revisions.find(r => r.is_active);
    if (latestActive) {
      onCreateRevision(latestActive);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <Clock className="w-6 h-6 text-blue-600" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Revision History</h2>
              <p className="text-sm text-gray-500">PO Number: {poNumberBase}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
          {loading && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading revision history...</p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-red-900">Error</p>
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          )}

          {!loading && !error && revisions.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <p>No revisions found for this PO.</p>
            </div>
          )}

          {!loading && !error && revisions.length > 0 && (
            <div className="space-y-4">
              {revisions.map((revision, index) => (
                <div key={revision.id}>
                  <div
                    className={`border rounded-lg p-4 ${
                      revision.is_active
                        ? 'border-green-300 bg-green-50'
                        : 'border-gray-200 bg-gray-50'
                    }`}
                  >
                    {/* Revision Header */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div
                          className={`px-3 py-1 rounded-full text-sm font-medium ${
                            revision.is_active
                              ? 'bg-green-200 text-green-900'
                              : 'bg-gray-300 text-gray-700'
                          }`}
                        >
                          {revision.is_active ? 'ACTIVE' : 'SUPERSEDED'}
                        </div>
                        <h3 className="font-semibold text-gray-900">
                          {revision.po_number}
                        </h3>
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            revision.status === 'received'
                              ? 'bg-blue-100 text-blue-800'
                              : revision.status === 'in-progress'
                              ? 'bg-yellow-100 text-yellow-800'
                              : revision.status === 'invoiced'
                              ? 'bg-purple-100 text-purple-800'
                              : 'bg-green-100 text-green-800'
                          }`}
                        >
                          {revision.status.toUpperCase()}
                        </span>
                      </div>
                      {revision.amount_myr_adjusted && (
                        <div className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs font-medium">
                          Manually Adjusted
                        </div>
                      )}
                    </div>

                    {/* Revision Details Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                      <div>
                        <p className="text-xs text-gray-500">Original Amount</p>
                        <p className="font-medium text-gray-900">
                          {revision.currency} {revision.amount.toFixed(2)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Exchange Rate</p>
                        <p className="font-medium text-gray-900">
                          {revision.exchange_rate.toFixed(6)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Calculated MYR</p>
                        <p className="font-medium text-gray-900">
                          MYR {revision.amount_myr.toFixed(2)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">
                          {revision.amount_myr_adjusted ? 'Adjusted MYR' : 'Effective MYR'}
                        </p>
                        <p className="font-medium text-gray-900">
                          MYR{' '}
                          {(revision.amount_myr_adjusted || revision.amount_myr).toFixed(2)}
                        </p>
                      </div>
                    </div>

                    {/* Dates */}
                    <div className="grid grid-cols-2 gap-4 mb-3 text-sm">
                      <div>
                        <span className="text-gray-500">Received: </span>
                        <span className="text-gray-900">
                          {format(new Date(revision.received_date), 'dd/MM/yyyy')}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500">Revision Date: </span>
                        <span className="text-gray-900">
                          {format(new Date(revision.revision_date), 'dd/MM/yyyy HH:mm')}
                        </span>
                      </div>
                    </div>

                    {/* Revision Reason */}
                    {revision.revision_reason && (
                      <div className="bg-white bg-opacity-70 rounded p-3 mb-2">
                        <p className="text-xs text-gray-500 mb-1">Revision Reason:</p>
                        <p className="text-sm text-gray-900">{revision.revision_reason}</p>
                      </div>
                    )}

                    {/* Adjustment Reason */}
                    {revision.amount_myr_adjusted && revision.adjustment_reason && (
                      <div className="bg-yellow-50 rounded p-3">
                        <p className="text-xs text-yellow-700 mb-1">
                          Adjustment Reason (
                          {format(new Date(revision.adjusted_at!), 'dd/MM/yyyy HH:mm')}):
                        </p>
                        <p className="text-sm text-yellow-900">{revision.adjustment_reason}</p>
                        <p className="text-xs text-yellow-700 mt-1">
                          Difference: MYR{' '}
                          {(revision.amount_myr_adjusted - revision.amount_myr).toFixed(2)} (
                          {(
                            ((revision.amount_myr_adjusted - revision.amount_myr) /
                              revision.amount_myr) *
                            100
                          ).toFixed(1)}
                          %)
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Arrow between revisions */}
                  {index < revisions.length - 1 && (
                    <div className="flex justify-center py-2">
                      <ArrowDown className="w-5 h-5 text-gray-400" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Close
          </button>
          <button
            onClick={handleCreateRevision}
            disabled={loading || revisions.length === 0}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Revision</span>
          </button>
        </div>
      </div>
    </div>
  );
};
