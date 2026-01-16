import React, { useState, useEffect, useCallback } from 'react';
import { DollarSign, RefreshCw, Calendar, Globe, AlertCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { Card, PageHeader } from '../components/ui/Card';

interface ExchangeRate {
  currency: string;
  rate: number;
  name: string;
}

// Currency names for display
const CURRENCY_NAMES: Record<string, string> = {
  // Major currencies
  USD: 'US Dollar',
  EUR: 'Euro',
  GBP: 'British Pound',
  JPY: 'Japanese Yen',
  AUD: 'Australian Dollar',
  CAD: 'Canadian Dollar',
  CHF: 'Swiss Franc',
  NZD: 'New Zealand Dollar',
  // ASEAN currencies
  SGD: 'Singapore Dollar',
  THB: 'Thai Baht',
  IDR: 'Indonesian Rupiah',
  PHP: 'Philippine Peso',
  VND: 'Vietnamese Dong',
  MMK: 'Myanmar Kyat',
  BND: 'Brunei Dollar',
  KHR: 'Cambodian Riel',
  LAK: 'Lao Kip',
  // India
  INR: 'Indian Rupee',
  // Other Asian
  HKD: 'Hong Kong Dollar',
  KRW: 'South Korean Won',
  TWD: 'Taiwan Dollar',
  CNY: 'Chinese Yuan',
  // European
  SEK: 'Swedish Krona',
  NOK: 'Norwegian Krone',
  DKK: 'Danish Krone',
};

// Currencies to fetch - includes ASEAN, major currencies, and India
const CURRENCIES = [
  // Major currencies
  'USD', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD', 'CHF',
  // ASEAN currencies
  'SGD', 'THB', 'IDR', 'PHP', 'VND', 'MMK', 'BND', 'KHR', 'LAK',
  // India
  'INR',
  // Other Asian
  'HKD', 'KRW', 'TWD', 'CNY'
];

export const ExchangeRatesScreen: React.FC = () => {
  const [rates, setRates] = useState<ExchangeRate[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const hasShownNotification = React.useRef(false);
  const isManualRefresh = React.useRef(false);

  // Fetch rates from Frankfurter API
  const fetchRates = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      const response = await fetch(
        `https://api.frankfurter.app/latest?from=MYR&to=${CURRENCIES.join(',')}`,
        { signal: controller.signal }
      );

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();

      if (!data.rates) {
        throw new Error('Invalid response from API');
      }

      // Convert rates: API gives MYR->X, we need X->MYR (inverted)
      const convertedRates: ExchangeRate[] = Object.entries(data.rates).map(([currency, rate]) => ({
        currency,
        rate: 1 / (rate as number),
        name: CURRENCY_NAMES[currency] || currency,
      }));

      // Sort by currency code
      convertedRates.sort((a, b) => a.currency.localeCompare(b.currency));

      setRates(convertedRates);
      setLastUpdated(data.date);

      // Only show notification for manual refresh or first successful load
      if (isManualRefresh.current || !hasShownNotification.current) {
        toast.success('Exchange rates updated', { id: 'exchange-rates-updated' });
        hasShownNotification.current = true;
        isManualRefresh.current = false;
      }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        setError('Request timed out. Please try again.');
      } else {
        setError(err.message || 'Failed to fetch exchange rates');
      }
      console.error('Error fetching exchange rates:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRates();
  }, [fetchRates]);

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <PageHeader
        title="Exchange Rates"
        description="Live currency conversion rates to MYR (Malaysian Ringgit)"
      />

      {/* Controls */}
      <Card padding="sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <Globe className="w-5 h-5 text-blue-600" />
            <div>
              <p className="text-sm font-medium text-gray-900">Frankfurter API</p>
              <p className="text-xs text-gray-500">European Central Bank data</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {lastUpdated && (
              <div className="flex items-center gap-1 text-sm text-gray-600">
                <Calendar className="w-4 h-4" />
                <span>Date: {lastUpdated}</span>
              </div>
            )}
            <button
              onClick={() => {
                isManualRefresh.current = true;
                fetchRates();
              }}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              {loading ? 'Loading...' : 'Refresh'}
            </button>
          </div>
        </div>
      </Card>

      {/* Error State */}
      {error && (
        <Card className="bg-red-50 border-red-200">
          <div className="flex items-center gap-2 text-red-800">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
            <button
              onClick={() => {
                isManualRefresh.current = true;
                fetchRates();
              }}
              className="ml-auto text-sm underline hover:no-underline"
            >
              Retry
            </button>
          </div>
        </Card>
      )}

      {/* Rates Grid */}
      <Card>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Current Exchange Rates to MYR
        </h2>

        {loading && rates.length === 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-gray-100 rounded-lg p-4 animate-pulse">
                <div className="h-5 bg-gray-200 rounded w-16 mb-3"></div>
                <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
                <div className="h-6 bg-gray-200 rounded w-28"></div>
              </div>
            ))}
          </div>
        ) : rates.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <DollarSign className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>No exchange rates available</p>
            <button
              onClick={() => {
                isManualRefresh.current = true;
                fetchRates();
              }}
              className="mt-3 text-emerald-600 hover:underline"
            >
              Click to fetch rates
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {rates.map((rate) => (
              <div
                key={rate.currency}
                className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors border border-gray-100"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-lg font-bold text-gray-900">
                    {rate.currency}
                  </span>
                  <span className="text-xs text-gray-500 bg-gray-200 px-2 py-0.5 rounded">
                    {rate.name}
                  </span>
                </div>
                <div className="text-sm text-gray-600">
                  1 {rate.currency} =
                </div>
                <div className="text-xl font-semibold text-emerald-600">
                  MYR {rate.rate.toFixed(4)}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Info Footer */}
      <Card className="bg-blue-50 border-blue-200">
        <p className="text-sm text-blue-800">
          <strong>Note:</strong> Exchange rates are from the{' '}
          <a
            href="https://www.frankfurter.app/"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:no-underline"
          >
            Frankfurter API
          </a>
          {' '}(European Central Bank data). Rates are updated daily on business days.
        </p>
      </Card>
    </div>
  );
};
