import React, { useState } from 'react';
import { X, Package, RotateCcw, AlertCircle } from 'lucide-react';
import type { ExtendedCheckout, CheckoutItemDetail } from '../../types/checkout.types';

interface PartialReturnModalProps {
  checkout: ExtendedCheckout | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (returnData: ReturnData) => void;
}

export interface ReturnData {
  checkoutId: string;
  items: Array<{
    itemId: string;
    itemName: string;
    quantityToReturn: number;
  }>;
  notes: string;
}

export const PartialReturnModal: React.FC<PartialReturnModalProps> = ({
  checkout,
  isOpen,
  onClose,
  onConfirm,
}) => {
  const [selectedItems, setSelectedItems] = useState<Map<string, number>>(new Map());
  const [notes, setNotes] = useState('');

  if (!isOpen || !checkout) return null;

  const handleQuantityChange = (item: CheckoutItemDetail, quantity: number) => {
    const newSelected = new Map(selectedItems);
    if (quantity <= 0) {
      newSelected.delete(item.itemId);
    } else {
      // Ensure quantity doesn't exceed remaining
      const maxQty = item.remainingQuantity;
      newSelected.set(item.itemId, Math.min(quantity, maxQty));
    }
    setSelectedItems(newSelected);
  };

  const toggleItem = (item: CheckoutItemDetail) => {
    const newSelected = new Map(selectedItems);
    if (newSelected.has(item.itemId)) {
      newSelected.delete(item.itemId);
    } else {
      // Default to returning all remaining quantity
      newSelected.set(item.itemId, item.remainingQuantity);
    }
    setSelectedItems(newSelected);
  };

  const handleConfirm = () => {
    const itemsToReturn = checkout.items
      .filter((item) => selectedItems.has(item.itemId))
      .map((item) => ({
        itemId: item.itemId,
        itemName: item.itemName,
        quantityToReturn: selectedItems.get(item.itemId) || 0,
      }));

    if (itemsToReturn.length === 0) return;

    onConfirm({
      checkoutId: checkout.id,
      items: itemsToReturn,
      notes,
    });

    // Reset
    setSelectedItems(new Map());
    setNotes('');
  };

  const totalItemsToReturn = Array.from(selectedItems.values()).reduce((sum, qty) => sum + qty, 0);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-primary-50 to-primary-100">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Partial Return</h2>
            <p className="text-sm text-gray-600 mt-1">{checkout.purpose || 'Untitled Checkout'}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          <div className="space-y-4">
            <p className="text-sm text-gray-600">Select items to return:</p>

            {/* Items List */}
            <div className="space-y-2">
              {checkout.items.map((item) => (
                <div
                  key={item.itemId}
                  className={`border rounded-lg p-4 transition-colors ${
                    selectedItems.has(item.itemId)
                      ? 'border-primary-300 bg-primary-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => toggleItem(item)}
                        className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                          selectedItems.has(item.itemId)
                            ? 'bg-primary-600 border-primary-600'
                            : 'border-gray-300'
                        }`}
                      >
                        {selectedItems.has(item.itemId) && (
                          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path
                              fillRule="evenodd"
                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                        )}
                      </button>

                      <div>
                        <p className="font-medium text-gray-900">{item.itemName}</p>
                        <p className="text-sm text-gray-500">
                          Barcode: {item.barcode}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm text-gray-500">Available</p>
                        <p className="font-medium text-gray-900">
                          {item.remainingQuantity} of {item.quantity}
                        </p>
                      </div>

                      {selectedItems.has(item.itemId) && (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() =>
                              handleQuantityChange(
                                item,
                                (selectedItems.get(item.itemId) || 0) - 1
                              )
                            }
                            className="w-8 h-8 rounded border border-gray-300 flex items-center justify-center hover:bg-gray-50"
                            disabled={(selectedItems.get(item.itemId) || 0) <= 1}
                          >
                            -
                          </button>

                          <span className="w-12 text-center font-medium">
                            {selectedItems.get(item.itemId)}
                          </span>

                          <button
                            onClick={() =>
                              handleQuantityChange(
                                item,
                                (selectedItems.get(item.itemId) || 0) + 1
                              )
                            }
                            className="w-8 h-8 rounded border border-gray-300 flex items-center justify-center hover:bg-gray-50"
                            disabled={
                              (selectedItems.get(item.itemId) || 0) >= item.remainingQuantity
                            }
                          >
                            +
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Notes */}
            <div className="pt-4 border-t border-gray-200">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Return Notes
              </label>
              <textarea
                rows={3}
                placeholder="Optional notes about the return..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
              />
            </div>

            {totalItemsToReturn > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-blue-900">
                    Returning {totalItemsToReturn} item
                    {totalItemsToReturn > 1 ? 's' : ''}
                  </p>
                  <p className="text-xs text-blue-700 mt-1">
                    Remaining items will stay checked out
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={totalItemsToReturn === 0}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            Confirm Return ({totalItemsToReturn} items)
          </button>
        </div>
      </div>
    </div>
  );
};
