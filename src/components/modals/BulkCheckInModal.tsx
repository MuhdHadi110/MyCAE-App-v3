import { useState, useEffect } from 'react';
import { X, QrCode, CheckCircle, AlertCircle, Package } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { getCurrentUser } from '../../lib/auth';
import { useCheckoutStore } from '../../store/checkoutStore';
import type { CheckoutItemDetail } from '../../types/checkout.types';

interface BulkCheckInModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCheckIn: (data: BulkCheckInData) => Promise<void>;
}

export type ReturnType = 'full' | 'partial';

export interface BulkCheckInData {
  masterBarcode: string;
  returnType: ReturnType;
  returnDate: string;
  returnedBy: string;
  notes?: string;
  items?: Array<{
    itemId: string;
    quantityToReturn: number;
  }>;
}

export function BulkCheckInModal({ isOpen, onClose, onCheckIn }: BulkCheckInModalProps) {
  const { getCheckoutByMasterBarcode } = useCheckoutStore();
  const [masterBarcode, setMasterBarcode] = useState('');
  const [notes, setNotes] = useState('');
  const [returnType, setReturnType] = useState<ReturnType>('full');
  const [selectedItems, setSelectedItems] = useState<Map<string, number>>(new Map());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [checkoutPreview, setCheckoutPreview] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      // Reset form when modal closes
      setMasterBarcode('');
      setNotes('');
      setReturnType('full');
      setSelectedItems(new Map());
      setCheckoutPreview(null);
      setError(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleLookup = async () => {
    if (!masterBarcode.trim()) {
      setError('Please enter a master barcode');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Try to find checkout from store
      const checkout = getCheckoutByMasterBarcode(masterBarcode);

      if (checkout) {
        setCheckoutPreview(checkout);
        setError(null);

        // Initialize all items as selected for full return
        const initialSelection = new Map<string, number>();
        checkout.items
          .filter(item => item.returnStatus === 'checked-out')
          .forEach(item => {
            initialSelection.set(item.id, item.remainingQuantity);
          });
        setSelectedItems(initialSelection);
      } else {
        setError('Master barcode not found or already fully returned');
        setCheckoutPreview(null);
      }
    } catch (err) {
      setError('Failed to lookup checkout. Please try again.');
      setCheckoutPreview(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleItemToggle = (itemId: string, maxQuantity: number) => {
    const newSelection = new Map(selectedItems);
    if (newSelection.has(itemId)) {
      newSelection.delete(itemId);
    } else {
      newSelection.set(itemId, maxQuantity);
    }
    setSelectedItems(newSelection);
  };

  const handleQuantityChange = (itemId: string, quantity: number, maxQuantity: number) => {
    const newSelection = new Map(selectedItems);
    const validQuantity = Math.max(0, Math.min(quantity, maxQuantity));
    if (validQuantity > 0) {
      newSelection.set(itemId, validQuantity);
    } else {
      newSelection.delete(itemId);
    }
    setSelectedItems(newSelection);
  };

  const handleSubmit = async () => {
    if (!checkoutPreview) return;

    const currentUser = getCurrentUser();
    const returningItems: Array<{ itemId: string; quantityToReturn: number }> = [];

    if (returnType === 'full') {
      // Return all remaining items
      checkoutPreview.items
        .filter((item: CheckoutItemDetail) => item.returnStatus === 'checked-out')
        .forEach((item: CheckoutItemDetail) => {
          returningItems.push({
            itemId: item.itemId,
            quantityToReturn: item.remainingQuantity,
          });
        });
    } else {
      // Partial return - only selected items
      selectedItems.forEach((quantity, itemId) => {
        const item = checkoutPreview.items.find((i: CheckoutItemDetail) => i.id === itemId);
        if (item) {
          returningItems.push({
            itemId: item.itemId,
            quantityToReturn: quantity,
          });
        }
      });
    }

    if (returningItems.length === 0) {
      setError('Please select at least one item to return');
      return;
    }

    const checkInData: BulkCheckInData = {
      masterBarcode: masterBarcode,
      returnType,
      returnDate: new Date().toISOString(),
      returnedBy: currentUser.displayName,
      notes: notes || undefined,
      items: returningItems,
    };

    setIsSubmitting(true);
    try {
      await onCheckIn(checkInData);
      handleClose();
    } catch (error) {
      setError(`Check-in failed: ${error}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setMasterBarcode('');
    setNotes('');
    setReturnType('full');
    setSelectedItems(new Map());
    setCheckoutPreview(null);
    setError(null);
    onClose();
  };

  const isOverdue = checkoutPreview?.expectedReturnDate &&
    new Date(checkoutPreview.expectedReturnDate) < new Date();

  const currentUser = getCurrentUser();
  const isOwnCheckout = checkoutPreview?.checkedOutByEmail === currentUser.email;

  const activeItems = checkoutPreview?.items.filter((item: CheckoutItemDetail) => item.returnStatus === 'checked-out') || [];
  const returnedItems = checkoutPreview?.items.filter((item: CheckoutItemDetail) => item.returnStatus === 'returned') || [];

  const selectedCount = selectedItems.size;
  const selectedQuantity = Array.from(selectedItems.values()).reduce((sum, qty) => sum + qty, 0);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200 bg-gradient-to-r from-primary-50 to-primary-100">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Check-In Items</h2>
            <p className="text-sm text-gray-600 mt-1">Return items using master barcode</p>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          {/* Master Barcode Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <QrCode className="w-4 h-4 inline mr-1" />
              Master Barcode
            </label>
            <div className="flex gap-2">
              <Input
                placeholder="MCO-YYYYMMDD-XXXXX"
                value={masterBarcode}
                onChange={(e) => {
                  setMasterBarcode(e.target.value);
                  setCheckoutPreview(null);
                  setError(null);
                }}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') handleLookup();
                }}
                className="flex-1"
              />
              <Button
                onClick={handleLookup}
                disabled={isLoading || !masterBarcode.trim()}
              >
                {isLoading ? 'Looking up...' : 'Lookup'}
              </Button>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-red-900">Error</p>
                <p className="text-sm text-red-800">{error}</p>
              </div>
            </div>
          )}

          {/* Checkout Preview */}
          {checkoutPreview && (
            <>
              {/* Header Info */}
              <div className={`border rounded-lg overflow-hidden ${isOverdue ? 'border-red-300' : 'border-gray-200'}`}>
                <div className={`p-4 ${isOverdue ? 'bg-red-50' : isOwnCheckout ? 'bg-blue-50' : 'bg-gray-50'}`}>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium text-gray-900">Checkout Details</h3>
                    {isOverdue && (
                      <span className="text-xs font-medium text-red-700 bg-red-100 px-2 py-1 rounded">
                        OVERDUE
                      </span>
                    )}
                    {isOwnCheckout && !isOverdue && (
                      <span className="text-xs font-medium text-blue-700 bg-blue-100 px-2 py-1 rounded">
                        YOUR CHECKOUT
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-gray-600">Master Barcode</p>
                      <p className="font-mono font-medium text-gray-900">{checkoutPreview.masterBarcode}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Checked Out By</p>
                      <p className="font-medium text-gray-900">
                        {isOwnCheckout ? 'You' : checkoutPreview.checkedOutBy}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600">Checkout Date</p>
                      <p className="font-medium text-gray-900">
                        {new Date(checkoutPreview.checkedOutDate).toLocaleDateString()}
                      </p>
                    </div>
                    {checkoutPreview.expectedReturnDate && (
                      <div>
                        <p className="text-gray-600">Expected Return</p>
                        <p className={`font-medium ${isOverdue ? 'text-red-700' : 'text-gray-900'}`}>
                          {new Date(checkoutPreview.expectedReturnDate).toLocaleDateString()}
                        </p>
                      </div>
                    )}
                    {checkoutPreview.purpose && (
                      <div className="col-span-2">
                        <p className="text-gray-600">Purpose</p>
                        <p className="font-medium text-gray-900">{checkoutPreview.purpose}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Return Type Selector */}
                <div className="p-4 border-t border-gray-200 bg-gray-50">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Return Type
                  </label>
                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        setReturnType('full');
                        // Select all items
                        const newSelection = new Map<string, number>();
                        activeItems.forEach((item: CheckoutItemDetail) => {
                          newSelection.set(item.id, item.remainingQuantity);
                        });
                        setSelectedItems(newSelection);
                      }}
                      className={`flex-1 px-4 py-3 rounded-lg border-2 text-sm font-medium transition-colors ${
                        returnType === 'full'
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                      }`}
                    >
                      <CheckCircle className="w-5 h-5 inline mr-2" />
                      Full Return (All Items)
                    </button>
                    <button
                      onClick={() => setReturnType('partial')}
                      className={`flex-1 px-4 py-3 rounded-lg border-2 text-sm font-medium transition-colors ${
                        returnType === 'partial'
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                      }`}
                    >
                      <Package className="w-5 h-5 inline mr-2" />
                      Partial Return (Select Items)
                    </button>
                  </div>
                </div>

                {/* Items List - Active Items */}
                {activeItems.length > 0 && (
                  <div className="p-4 border-t border-gray-200">
                    <h4 className="font-medium text-gray-900 mb-3">
                      Items Still Checked Out ({activeItems.length})
                    </h4>
                    <div className="space-y-2">
                      {activeItems.map((item: CheckoutItemDetail) => {
                        const isSelected = selectedItems.has(item.id);
                        const selectedQty = selectedItems.get(item.id) || item.remainingQuantity;

                        return (
                          <div
                            key={item.id}
                            className={`flex items-center justify-between p-3 rounded-lg border-2 transition-colors ${
                              returnType === 'full' || isSelected
                                ? 'border-blue-200 bg-blue-50'
                                : 'border-gray-200 bg-white'
                            }`}
                          >
                            <div className="flex items-center gap-3 flex-1">
                              {returnType === 'partial' && (
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => handleItemToggle(item.id, item.remainingQuantity)}
                                  className="w-5 h-5 text-blue-600 rounded"
                                />
                              )}
                              <div className="flex-1">
                                <p className="font-medium text-gray-900">{item.itemName}</p>
                                <p className="text-sm text-gray-600">Barcode: {item.barcode}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              {returnType === 'partial' && isSelected ? (
                                <div className="flex items-center gap-2">
                                  <span className="text-sm text-gray-600">Qty:</span>
                                  <input
                                    type="number"
                                    min="1"
                                    max={item.remainingQuantity}
                                    value={selectedQty}
                                    onChange={(e) => handleQuantityChange(item.id, parseInt(e.target.value), item.remainingQuantity)}
                                    className="w-16 px-2 py-1 border border-gray-300 rounded text-center text-sm"
                                  />
                                  <span className="text-sm text-gray-500">/ {item.remainingQuantity}</span>
                                </div>
                              ) : (
                                <span className="text-sm font-medium text-gray-900">
                                  Qty: {item.remainingQuantity}
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Previously Returned Items */}
                {returnedItems.length > 0 && (
                  <div className="p-4 border-t border-gray-200 bg-gray-50">
                    <h4 className="font-medium text-gray-500 mb-2 text-sm">
                      Previously Returned ({returnedItems.length})
                    </h4>
                    <div className="space-y-1">
                      {returnedItems.map((item: CheckoutItemDetail) => (
                        <div key={item.id} className="flex items-center justify-between text-sm text-gray-600">
                          <div className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-green-600" />
                            <span>{item.itemName}</span>
                          </div>
                          <span>Qty: {item.returnedQuantity}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Return Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Return Notes (Optional)
                </label>
                <textarea
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="e.g., All items in good condition, HDMI cable has minor wear..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>

              {/* Summary */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="font-medium text-green-900 mb-2">
                      {returnType === 'full' ? 'Full Return Summary' : 'Partial Return Summary'}
                    </h4>
                    <div className="text-sm text-green-800 space-y-1">
                      {returnType === 'full' ? (
                        <>
                          <p>✓ {activeItems.length} items will be returned</p>
                          <p>✓ {checkoutPreview.remainingItems} total units</p>
                          <p>✓ Checkout will be marked as "Fully Returned"</p>
                        </>
                      ) : (
                        <>
                          <p>✓ {selectedCount} items selected to return</p>
                          <p>✓ {selectedQuantity} total units</p>
                          <p>✓ {activeItems.length - selectedCount} items will remain checked out</p>
                          {selectedCount < activeItems.length && (
                            <p className="text-yellow-700">⚠ Master barcode will remain active</p>
                          )}
                        </>
                      )}
                      <p>✓ Returned by: {currentUser.displayName}</p>
                      <p>✓ Return date: {new Date().toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t">
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!checkoutPreview || isSubmitting || (returnType === 'partial' && selectedCount === 0)}
          >
            {isSubmitting ? 'Processing...' : `Complete ${returnType === 'full' ? 'Full' : 'Partial'} Check-In`}
          </Button>
        </div>
      </div>
    </div>
  );
}
