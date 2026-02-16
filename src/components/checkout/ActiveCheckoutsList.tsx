import React, { useState } from 'react';
import { Package, User, MapPin, Calendar, Clock, RotateCcw, CheckCircle, AlertCircle } from 'lucide-react';
import { Badge } from '../ui/Badge';
import type { ExtendedCheckout, CheckoutStatus } from '../../types/checkout.types';

interface ActiveCheckoutsListProps {
  checkouts: ExtendedCheckout[];
  onReturnAll: (checkoutId: string) => void;
  onPartialReturn: (checkout: ExtendedCheckout) => void;
  loading?: boolean;
}

export const ActiveCheckoutsList: React.FC<ActiveCheckoutsListProps> = ({
  checkouts,
  onReturnAll,
  onPartialReturn,
  loading,
}) => {
  const [filter, setFilter] = useState<CheckoutStatus | 'all'>('all');

  const filteredCheckouts = checkouts.filter((checkout) => {
    if (filter === 'all') return true;
    return checkout.status === filter;
  });

  const getStatusBadge = (status: CheckoutStatus) => {
    switch (status) {
      case 'active':
        return <Badge variant="success">Active</Badge>;
      case 'partial-return':
        return <Badge variant="warning">Partial Return</Badge>;
      case 'overdue':
        return <Badge variant="danger">Overdue</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getDaysOut = (checkoutDate: string) => {
    const days = Math.floor(
      (new Date().getTime() - new Date(checkoutDate).getTime()) / (1000 * 60 * 60 * 24)
    );
    return days;
  };

  const isOverdue = (expectedReturnDate?: string) => {
    if (!expectedReturnDate) return false;
    return new Date(expectedReturnDate) < new Date();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (checkouts.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-lg">
        <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500">No active checkouts</p>
        <p className="text-sm text-gray-400 mt-1">All equipment is currently in the warehouse</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {[
          { key: 'all', label: 'All', count: checkouts.length },
          { key: 'active', label: 'Active', count: checkouts.filter((c) => c.status === 'active').length },
          { key: 'partial-return', label: 'Partial', count: checkouts.filter((c) => c.status === 'partial-return').length },
          { key: 'overdue', label: 'Overdue', count: checkouts.filter((c) => c.status === 'overdue').length },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key as any)}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              filter === tab.key
                ? 'bg-primary-100 text-primary-700 border border-primary-300'
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            {tab.label}
            <span className="ml-2 px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs">
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Checkouts List */}
      <div className="space-y-3">
        {filteredCheckouts.map((checkout) => (
          <div
            key={checkout.id}
            className={`bg-white rounded-lg border p-4 transition-shadow hover:shadow-md ${
              checkout.status === 'overdue'
                ? 'border-red-200 bg-red-50'
                : 'border-gray-200'
            }`}
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                  <Package className="w-5 h-5 text-primary-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{checkout.masterBarcode}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    {getStatusBadge(checkout.status)}
                    <span className="text-sm text-gray-500">
                      <Clock className="w-3 h-3 inline mr-1" />
                      {getDaysOut(checkout.checkedOutDate)} days out
                    </span>
                  </div>
                </div>
              </div>

              {/* Return Buttons - Only show if not fully returned */}
              {checkout.status !== 'fully-returned' && (
                <div className="flex gap-2">
                  <button
                    onClick={() => onPartialReturn(checkout)}
                    className="px-3 py-1.5 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Partial Return
                  </button>
                  <button
                    onClick={() => onReturnAll(checkout.id)}
                    className="px-3 py-1.5 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                  >
                    Return All
                  </button>
                </div>
              )}
            </div>

            {/* Details */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
              <div>
                <p className="text-gray-500 mb-0.5">
                  <User className="w-3 h-3 inline mr-1" />
                  Checked Out By
                </p>
                <p className="font-medium text-gray-900">{checkout.checkedOutBy}</p>
              </div>

              <div>
                <p className="text-gray-500 mb-0.5">
                  <MapPin className="w-3 h-3 inline mr-1" />
                  Location
                </p>
                <p className="font-medium text-gray-900 truncate">{checkout.purpose || 'N/A'}</p>
              </div>

              <div>
                <p className="text-gray-500 mb-0.5">Items</p>
                <p className="font-medium text-gray-900">
                  {checkout.remainingItems} of {checkout.totalItems} remaining
                </p>
              </div>

              <div>
                <p className="text-gray-500 mb-0.5">
                  <Calendar className="w-3 h-3 inline mr-1" />
                  Due Date
                </p>
                <p
                  className={`font-medium ${
                    isOverdue(checkout.expectedReturnDate)
                      ? 'text-red-600'
                      : 'text-gray-900'
                  }`}
                >
                  {checkout.expectedReturnDate
                    ? new Date(checkout.expectedReturnDate).toLocaleDateString()
                    : 'Not set'}
                  {isOverdue(checkout.expectedReturnDate) && (
                    <span className="ml-1 text-xs">(Overdue)</span>
                  )}
                </p>
              </div>
            </div>

            {/* Items Preview */}
            <div className="mt-3 pt-3 border-t border-gray-100">
              <p className="text-xs text-gray-500 mb-2">Items in this checkout:</p>
              <div className="flex flex-wrap gap-2">
                {checkout.items.slice(0, 5).map((item, idx) => (
                  <span
                    key={idx}
                    className={`inline-flex items-center px-2 py-1 rounded text-xs ${
                      item.returnStatus === 'returned'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-blue-100 text-blue-700'
                    }`}
                  >
                    {item.returnStatus === 'returned' && (
                      <CheckCircle className="w-3 h-3 mr-1" />
                    )}
                    {item.itemName} ({item.remainingQuantity}/{item.quantity})
                  </span>
                ))}
                {checkout.items.length > 5 && (
                  <span className="text-xs text-gray-500">
                    +{checkout.items.length - 5} more
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
