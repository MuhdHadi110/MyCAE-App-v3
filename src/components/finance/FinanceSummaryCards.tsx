import React from 'react';
import { FileText, Receipt, Clock, Briefcase } from 'lucide-react';
import type { FinanceTotals } from '../../types/financeOverview.types';
import { formatTotalWithCurrency } from '../../hooks/useFinanceData';
import { DAILY_MAN_HOUR_COST, FIXED_HOURLY_RATE } from '../../constants/finance';

interface FinanceSummaryCardsProps {
  totals: FinanceTotals;
  showOriginalCurrency: boolean;
  loading?: boolean;
}

export const FinanceSummaryCards: React.FC<FinanceSummaryCardsProps> = ({
  totals,
  showOriginalCurrency,
  loading = false,
}) => {
  const formatCurrency = (amount: number) => {
    return `RM ${amount.toLocaleString('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const cards = [
    {
      title: 'PO Received',
      value: showOriginalCurrency
        ? formatTotalWithCurrency(totals.totalPOReceived, totals.poReceivedByCurrency, true)
        : formatCurrency(totals.totalPOReceived),
      icon: FileText,
      iconBg: 'bg-green-100',
      iconColor: 'text-green-600',
      subtitle: 'Total purchase orders received',
    },
    {
      title: 'Invoiced',
      value: showOriginalCurrency
        ? formatTotalWithCurrency(totals.totalInvoiced, totals.invoicedByCurrency, true)
        : formatCurrency(totals.totalInvoiced),
      icon: Receipt,
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
      subtitle: 'Total amount invoiced',
    },
    {
      title: 'Outstanding',
      value: formatCurrency(totals.totalOutstanding),
      icon: Clock,
      iconBg: totals.totalOutstanding > 0 ? 'bg-orange-100' : 'bg-gray-100',
      iconColor: totals.totalOutstanding > 0 ? 'text-orange-600' : 'text-gray-600',
      subtitle: 'Remaining to invoice',
    },
    {
      title: 'Man-Hour Cost',
      value: formatCurrency(totals.totalManHourCost),
      icon: Briefcase,
      iconBg: 'bg-purple-100',
      iconColor: 'text-purple-600',
      subtitle: `RM ${DAILY_MAN_HOUR_COST.toLocaleString()}/day (RM ${FIXED_HOURLY_RATE.toFixed(2)}/hr)`,
    },
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 animate-pulse">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gray-200 rounded-xl" />
            </div>
            <div className="h-4 bg-gray-200 rounded w-24 mb-2" />
            <div className="h-8 bg-gray-200 rounded w-32 mb-2" />
            <div className="h-3 bg-gray-100 rounded w-28" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => {
        const Icon = card.icon;
        const isMultiLine = card.value.includes('\n');

        return (
          <div
            key={card.title}
            className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`w-12 h-12 ${card.iconBg} rounded-xl flex items-center justify-center`}>
                <Icon className={`w-6 h-6 ${card.iconColor}`} />
              </div>
            </div>
            <div className="text-sm font-medium text-gray-600 mb-2">{card.title}</div>
            {isMultiLine ? (
              <div className="space-y-1">
                {card.value.split('\n').map((line, i) => (
                  <div key={i} className="text-lg font-bold text-gray-900">
                    {line}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-2xl lg:text-3xl font-bold text-gray-900 whitespace-nowrap overflow-hidden text-ellipsis">
                {card.value}
              </div>
            )}
            <div className="text-xs text-gray-500 mt-2">{card.subtitle}</div>
          </div>
        );
      })}
    </div>
  );
};

export default FinanceSummaryCards;
