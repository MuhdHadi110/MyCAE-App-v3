import { useState } from 'react';
import { X, Plus, Trash2, QrCode, Calendar } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { generateMasterBarcode } from '../../lib/csvParser';
import { getCurrentUser } from '../../lib/auth';
import type { BulkCheckout } from '../../types/inventory.types';

interface BulkCheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCheckout: (checkout: BulkCheckout) => Promise<void>;
}

interface CheckoutItemInput {
  barcode: string;
  quantity: number;
}

export function BulkCheckoutModal({ isOpen, onClose, onCheckout }: BulkCheckoutModalProps) {
  const [masterBarcode] = useState(generateMasterBarcode());
  const [items, setItems] = useState<CheckoutItemInput[]>([{ barcode: '', quantity: 1 }]);
  const [expectedReturnDate, setExpectedReturnDate] = useState('');
  const [purpose, setPurpose] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const addItem = () => {
    setItems([...items, { barcode: '', quantity: 1 }]);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: keyof CheckoutItemInput, value: string | number) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const handleSubmit = async () => {
    // Validate
    const validItems = items.filter(item => item.barcode.trim() !== '' && item.quantity > 0);

    if (validItems.length === 0) {
      alert('Please add at least one item with a valid barcode');
      return;
    }

    const currentUser = getCurrentUser();

    const checkout: BulkCheckout = {
      masterBarcode,
      items: validItems,
      checkedOutBy: currentUser.displayName,
      checkedOutDate: new Date().toISOString(),
      expectedReturnDate: expectedReturnDate || undefined,
      purpose: purpose || undefined,
      notes: notes || undefined,
    };

    setIsSubmitting(true);
    try {
      await onCheckout(checkout);
      handleClose();
    } catch (error) {
      alert(`Checkout failed: ${error}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setItems([{ barcode: '', quantity: 1 }]);
    setExpectedReturnDate('');
    setPurpose('');
    setNotes('');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200 bg-gradient-to-r from-primary-50 to-primary-100">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Bulk Checkout</h2>
            <p className="text-sm text-gray-600 mt-1">Check out multiple items with a single master barcode</p>
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
          {/* Master Barcode */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <QrCode className="w-8 h-8 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-blue-900">Master Barcode</p>
                <p className="text-lg font-mono font-bold text-blue-700">{masterBarcode}</p>
                <p className="text-xs text-blue-600 mt-1">
                  Use this barcode to return all items together
                </p>
              </div>
            </div>
          </div>

          {/* Items List */}
          <div>
            <div className="flex justify-between items-center mb-3">
              <label className="block text-sm font-medium text-gray-700">
                Items to Check Out
              </label>
              <Button
                variant="outline"
                size="sm"
                onClick={addItem}
              >
                <Plus className="w-4 h-4 mr-1" />
                Add Item
              </Button>
            </div>

            <div className="space-y-3">
              {items.map((item, index) => (
                <div key={index} className="flex gap-3 items-start">
                  <div className="flex-1">
                    <Input
                      placeholder="Barcode or SKU"
                      value={item.barcode}
                      onChange={(e) => updateItem(index, 'barcode', e.target.value)}
                    />
                  </div>
                  <div className="w-24">
                    <Input
                      type="number"
                      min="1"
                      placeholder="Qty"
                      value={item.quantity}
                      onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 1)}
                    />
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => removeItem(index)}
                    disabled={items.length === 1}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {/* Expected Return Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar className="w-4 h-4 inline mr-1" />
              Expected Return Date (Optional)
            </label>
            <Input
              type="date"
              value={expectedReturnDate}
              onChange={(e) => setExpectedReturnDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
            />
          </div>

          {/* Purpose */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Purpose (Optional)
            </label>
            <Input
              placeholder="e.g., Project deployment, Training session, etc."
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes (Optional)
            </label>
            <textarea
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              placeholder="Additional notes..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          {/* Summary */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-2">Summary</h4>
            <div className="text-sm text-gray-600 space-y-1">
              <p>Total items: {items.filter(i => i.barcode.trim()).length}</p>
              <p>Checked out by: {getCurrentUser().displayName}</p>
              {expectedReturnDate && (
                <p>Expected return: {new Date(expectedReturnDate).toLocaleDateString()}</p>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t">
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || items.filter(i => i.barcode.trim()).length === 0}
          >
            {isSubmitting ? 'Processing...' : 'Complete Checkout'}
          </Button>
        </div>
      </div>
    </div>
  );
}
