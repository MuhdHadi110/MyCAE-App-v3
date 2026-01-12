import React, { useState } from 'react';
import { X, AlertCircle, AlertTriangle, Edit3 } from 'lucide-react';
import financeService from '../../services/api.service';

interface AdjustMYRModalProps {
  isOpen: boolean;
  onClose: () => void;
  po: {
    id: string;
    po_number: string;
    amount: number;
    currency: string;
    amount_myr: number;
    exchange_rate: number;
    amount_myr_adjusted: number | null;
    adjustment_reason: string | null;
  };
  onSuccess: () => void;
}

export const AdjustMYRModal: React.FC<AdjustMYRModalProps> = ({
  isOpen,
  onClose,
  po,
  onSuccess,
}) => {
  const [adjustedAmount, setAdjustedAmount] = useState<string>(
    (po.amount_myr_adjusted || po.amount_myr).toFixed(2)
  );
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const calculatedAmount = po.amount_myr;
  const currentAdjusted = parseFloat(adjustedAmount) || 0;
  const difference = currentAdjusted - calculatedAmount;
  const percentDiff = calculatedAmount !== 0 ? (difference / calculatedAmount) * 100 : 0;
  const isOverLimit = Math.abs(percentDiff) > 50;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (reason.trim().length < 10) {
      setError('Adjustment reason must be at least 10 characters');
      return;
    }

    if (currentAdjusted <= 0) {
      setError('Adjusted amount must be greater than 0');
      return;
    }

    if (isOverLimit) {
      setError(
        `Adjustment is too large (${percentDiff.toFixed(1)}%). Please create a revision instead.`
      );
      return;
    }

    setLoading(true);
    try {
      await financeService.adjustPOMYRAmount(po.id, currentAdjusted, reason);
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Failed to adjust MYR amount');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <Edit3 className="w-6 h-6 text-yellow-600" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Adjust MYR Amount</h2>
              <p className="text-sm text-gray-500">PO Number: {po.po_number}</p>
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
          {/* Warning Banner */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6 flex items-start space-x-3">
            <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-yellow-900">
              <p className="font-medium mb-1">Important Notes:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Use this for minor adjustments only (fees, taxes, bank charges)</li>
                <li>Adjustments over 50% are not allowed - create a revision instead</li>
                <li>This will override the automatically calculated MYR amount</li>
                <li>The adjustment will be recorded in the audit trail</li>
              </ul>
            </div>
          </div>

          {/* Original Details */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h3 className="font-medium text-gray-900 mb-3">Current Details</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Original Amount:</span>
                <span className="text-gray-900 font-medium">
                  {po.currency} {po.amount.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Exchange Rate:</span>
                <span className="text-gray-900 font-medium">{po.exchange_rate.toFixed(6)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Calculated MYR:</span>
                <span className="text-gray-900 font-medium">MYR {calculatedAmount.toFixed(2)}</span>
              </div>
              {po.amount_myr_adjusted && (
                <div className="flex justify-between pt-2 border-t border-gray-200">
                  <span className="text-gray-500">Current Adjusted MYR:</span>
                  <span className="text-yellow-700 font-medium">
                    MYR {po.amount_myr_adjusted.toFixed(2)}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-red-900">Error</p>
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Adjusted MYR Amount <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">MYR</span>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={adjustedAmount}
                  onChange={e => setAdjustedAmount(e.target.value)}
                  className={`w-full pl-14 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                    isOverLimit
                      ? 'border-red-300 focus:ring-red-500'
                      : 'border-gray-300 focus:ring-blue-500'
                  }`}
                />
              </div>
            </div>

            {/* Difference Display */}
            {currentAdjusted !== calculatedAmount && (
              <div
                className={`rounded-lg p-4 ${
                  isOverLimit ? 'bg-red-50 border border-red-200' : 'bg-blue-50 border border-blue-200'
                }`}
              >
                <h4
                  className={`font-medium mb-2 ${isOverLimit ? 'text-red-900' : 'text-blue-900'}`}
                >
                  Adjustment Summary
                </h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className={isOverLimit ? 'text-red-700' : 'text-blue-700'}>
                      Difference:
                    </span>
                    <span
                      className={`font-medium ${isOverLimit ? 'text-red-900' : 'text-blue-900'}`}
                    >
                      {difference >= 0 ? '+' : ''}
                      {difference.toFixed(2)} MYR
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className={isOverLimit ? 'text-red-700' : 'text-blue-700'}>
                      Percentage:
                    </span>
                    <span
                      className={`font-medium ${isOverLimit ? 'text-red-900' : 'text-blue-900'}`}
                    >
                      {percentDiff >= 0 ? '+' : ''}
                      {percentDiff.toFixed(2)}%
                    </span>
                  </div>
                  {isOverLimit && (
                    <p className="text-xs text-red-700 mt-2 font-medium">
                      ⚠️ This adjustment exceeds the 50% limit. Please create a revision instead.
                    </p>
                  )}
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Adjustment Reason <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={4}
                required
                minLength={10}
                value={reason}
                onChange={e => setReason(e.target.value)}
                placeholder="Explain why this adjustment is needed (e.g., bank fees, transfer charges, taxes)..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                {reason.length} / 10 characters minimum
              </p>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || reason.trim().length < 10 || isOverLimit || currentAdjusted <= 0}
            className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Saving...' : 'Save Adjustment'}
          </button>
        </div>
      </div>
    </div>
  );
};
