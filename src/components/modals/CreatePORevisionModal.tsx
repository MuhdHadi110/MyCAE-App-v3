import React, { useState, useEffect } from 'react';
import { X, AlertCircle, Info, TrendingUp } from 'lucide-react';
import financeService from '../../services/finance.service';
import { format } from 'date-fns';

interface CreatePORevisionModalProps {
  isOpen: boolean;
  onClose: () => void;
  originalPO: {
    id: string;
    po_number: string;
    project_code: string;
    client_name: string;
    amount: number;
    currency: string;
    received_date: string;
    description?: string;
    file_url?: string;
  };
  onSuccess: () => void;
}

interface ExchangeRatePreview {
  rate: number | null;
  amountMYR: number | null;
  source: 'api' | 'manual' | null;
  loading: boolean;
}

export const CreatePORevisionModal: React.FC<CreatePORevisionModalProps> = ({
  isOpen,
  onClose,
  originalPO,
  onSuccess,
}) => {
  const [formData, setFormData] = useState({
    amount: originalPO.amount,
    currency: originalPO.currency,
    receivedDate: format(new Date(originalPO.received_date), 'yyyy-MM-dd'),
    description: originalPO.description || '',
    revisionReason: '',
  });

  const [exchangePreview, setExchangePreview] = useState<ExchangeRatePreview>({
    rate: null,
    amountMYR: null,
    source: null,
    loading: false,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && formData.currency && formData.receivedDate && formData.amount > 0) {
      fetchExchangeRatePreview();
    }
  }, [formData.currency, formData.receivedDate, formData.amount, isOpen]);

  const fetchExchangeRatePreview = async () => {
    if (formData.currency === 'MYR') {
      setExchangePreview({
        rate: 1.0,
        amountMYR: formData.amount,
        source: null,
        loading: false,
      });
      return;
    }

    setExchangePreview(prev => ({ ...prev, loading: true }));
    try {
      const rate = await financeService.getExchangeRate(
        formData.currency,
        new Date(formData.receivedDate)
      );
      const amountMYR = formData.amount * rate.rate;
      setExchangePreview({
        rate: rate.rate,
        amountMYR,
        source: rate.source as 'api' | 'manual',
        loading: false,
      });
    } catch (err: any) {
      setExchangePreview({
        rate: null,
        amountMYR: null,
        source: null,
        loading: false,
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (formData.revisionReason.trim().length < 10) {
      setError('Revision reason must be at least 10 characters');
      return;
    }

    if (!exchangePreview.rate && formData.currency !== 'MYR') {
      setError('Exchange rate not available for the selected date. Please add rate first.');
      return;
    }

    setLoading(true);
    try {
      await financeService.createPORevision(originalPO.id, {
        amount: formData.amount,
        currency: formData.currency,
        receivedDate: formData.receivedDate,
        description: formData.description,
        revisionReason: formData.revisionReason,
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Failed to create revision');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <TrendingUp className="w-6 h-6 text-blue-600" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Create PO Revision</h2>
              <p className="text-sm text-gray-500">Original: {originalPO.po_number}</p>
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
          {/* Info Banner */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 flex items-start space-x-3">
            <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-900">
              <p className="font-medium mb-1">Creating a revision will:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Mark the current PO version as inactive</li>
                <li>Create a new active version with updated details</li>
                <li>Maintain full audit trail of all changes</li>
              </ul>
            </div>
          </div>

          {/* Original PO Details */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h3 className="font-medium text-gray-900 mb-3">Original PO Details</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Project: </span>
                <span className="text-gray-900">{originalPO.project_code}</span>
              </div>
              <div>
                <span className="text-gray-500">Client: </span>
                <span className="text-gray-900">{originalPO.client_name}</span>
              </div>
              <div>
                <span className="text-gray-500">Amount: </span>
                <span className="text-gray-900">
                  {originalPO.currency} {originalPO.amount.toFixed(2)}
                </span>
              </div>
              <div>
                <span className="text-gray-500">Received: </span>
                <span className="text-gray-900">
                  {format(new Date(originalPO.received_date), 'dd/MM/yyyy')}
                </span>
              </div>
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
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Amount <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={formData.amount}
                  onChange={e => setFormData({ ...formData, amount: parseFloat(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Currency <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.currency}
                  onChange={e => setFormData({ ...formData, currency: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="MYR">MYR - Malaysian Ringgit</option>
                  <option value="SGD">SGD - Singapore Dollar</option>
                  <option value="USD">USD - US Dollar</option>
                  <option value="EUR">EUR - Euro</option>
                  <option value="GBP">GBP - British Pound</option>
                  <option value="JPY">JPY - Japanese Yen</option>
                  <option value="CNY">CNY - Chinese Yuan</option>
                  <option value="THB">THB - Thai Baht</option>
                  <option value="IDR">IDR - Indonesian Rupiah</option>
                  <option value="PHP">PHP - Philippine Peso</option>
                  <option value="VND">VND - Vietnamese Dong</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Received Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                required
                value={formData.receivedDate}
                onChange={e => setFormData({ ...formData, receivedDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Exchange Rate Preview */}
            {formData.currency !== 'MYR' && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h4 className="font-medium text-green-900 mb-2">Exchange Rate Preview</h4>
                {exchangePreview.loading ? (
                  <p className="text-sm text-green-700">Fetching rate...</p>
                ) : exchangePreview.rate ? (
                  <div className="space-y-1 text-sm">
                    <p className="text-green-900">
                      <span className="font-medium">Rate:</span> 1 {formData.currency} ={' '}
                      {exchangePreview.rate.toFixed(6)} MYR
                      {exchangePreview.source && (
                        <span className="ml-2 text-xs bg-green-200 px-2 py-0.5 rounded">
                          {exchangePreview.source.toUpperCase()}
                        </span>
                      )}
                    </p>
                    <p className="text-green-900">
                      <span className="font-medium">Converted Amount:</span> MYR{' '}
                      {exchangePreview.amountMYR?.toFixed(2)}
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-red-700">
                    No exchange rate available for this date. Please add rate first.
                  </p>
                )}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description (Optional)
              </label>
              <textarea
                rows={2}
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Revision Reason <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={3}
                required
                minLength={10}
                value={formData.revisionReason}
                onChange={e => setFormData({ ...formData, revisionReason: e.target.value })}
                placeholder="Explain why this revision is being created (minimum 10 characters)..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                {formData.revisionReason.length} / 10 characters minimum
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
            disabled={loading || formData.revisionReason.trim().length < 10}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Creating...' : 'Create Revision'}
          </button>
        </div>
      </div>
    </div>
  );
};
