import { useState } from 'react';
import { X, Package, Calendar, User, Hash } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { getCurrentUser } from '../../lib/auth';
import toast from 'react-hot-toast';

interface SingleItemCheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCheckout: (checkout: SingleCheckoutData) => Promise<void>;
  prefilledBarcode?: string;
}

export interface SingleCheckoutData {
  itemBarcode: string;
  quantity: number;
  checkedOutBy: string;
  checkedOutByEmail: string;
  checkedOutDate: string;
  expectedReturnDate?: string;
  purpose?: string;
  notes?: string;
  location?: string;
}

export function SingleItemCheckoutModal({
  isOpen,
  onClose,
  onCheckout,
  prefilledBarcode = ''
}: SingleItemCheckoutModalProps) {
  const [barcode, setBarcode] = useState(prefilledBarcode);
  const [quantity, setQuantity] = useState(1);
  const [expectedReturnDate, setExpectedReturnDate] = useState('');
  const [purpose, setPurpose] = useState('');
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    // Validation
    if (!barcode.trim()) {
      toast.error('Please enter an item barcode or SKU');
      return;
    }

    if (quantity <= 0) {
      toast.error('Quantity must be greater than 0');
      return;
    }

    const currentUser = getCurrentUser();

    const checkoutData: SingleCheckoutData = {
      itemBarcode: barcode.trim(),
      quantity,
      checkedOutBy: currentUser.displayName,
      checkedOutByEmail: currentUser.email,
      checkedOutDate: new Date().toISOString(),
      expectedReturnDate: expectedReturnDate || undefined,
      purpose: purpose.trim() || undefined,
      location: location.trim() || undefined,
      notes: notes.trim() || undefined,
    };

    setIsSubmitting(true);
    try {
      await onCheckout(checkoutData);
      handleClose();
      toast.success('Item checked out successfully!');
    } catch (error: any) {
      toast.error(error?.message || 'Checkout failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setBarcode('');
    setQuantity(1);
    setExpectedReturnDate('');
    setPurpose('');
    setLocation('');
    setNotes('');
    onClose();
  };

  const currentUser = getCurrentUser();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200 bg-gradient-to-r from-primary-50 to-primary-100">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Single Item Checkout</h2>
            <p className="text-sm text-gray-600 mt-1">Check out a single item or quantity</p>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          {/* Item Barcode/SKU */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Package className="w-4 h-4 inline mr-1" />
              Item Barcode or SKU *
            </label>
            <Input
              placeholder="Scan or enter barcode/SKU"
              value={barcode}
              onChange={(e) => setBarcode(e.target.value)}
              autoFocus
            />
          </div>

          {/* Quantity */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Hash className="w-4 h-4 inline mr-1" />
              Quantity *
            </label>
            <Input
              type="number"
              min="1"
              placeholder="1"
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
            />
          </div>

          {/* Location/Site */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Location/Site (Optional)
            </label>
            <Input
              placeholder="e.g., Client Site - Building A, Office 3B"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
            <p className="text-xs text-gray-500 mt-1">
              Where will this equipment be taken to?
            </p>
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
              placeholder="e.g., Client demonstration, Field testing, Repair"
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
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              rows={3}
              placeholder="Any additional notes..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          {/* Summary Box */}
          <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
            <h4 className="font-medium text-indigo-900 mb-2 flex items-center gap-2">
              <User className="w-4 h-4" />
              Checkout Summary
            </h4>
            <div className="text-sm text-indigo-800 space-y-1">
              <p>Checked out by: <span className="font-medium">{currentUser.displayName}</span></p>
              <p>Checkout date: <span className="font-medium">{new Date().toLocaleDateString()}</span></p>
              {quantity > 0 && (
                <p>Quantity: <span className="font-medium">{quantity}</span></p>
              )}
              {location && (
                <p>Destination: <span className="font-medium">{location}</span></p>
              )}
              {expectedReturnDate && (
                <p>Expected return: <span className="font-medium">{new Date(expectedReturnDate).toLocaleDateString()}</span></p>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
          <Button variant="outline" onClick={handleClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || !barcode.trim() || quantity <= 0}
          >
            {isSubmitting ? 'Processing...' : 'Complete Checkout'}
          </Button>
        </div>
      </div>
    </div>
  );
}
