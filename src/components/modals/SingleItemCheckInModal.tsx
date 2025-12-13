import { useState } from 'react';
import { X, Package, CheckCircle, User, Hash } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { getCurrentUser } from '../../lib/auth';
import toast from 'react-hot-toast';

interface SingleItemCheckInModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCheckIn: (checkIn: SingleCheckInData) => Promise<void>;
  prefilledBarcode?: string;
}

export interface SingleCheckInData {
  itemBarcode: string;
  quantityToReturn: number;
  returnedBy: string;
  returnedByEmail: string;
  returnDate: string;
  condition?: 'good' | 'fair' | 'damaged' | 'needs-repair';
  notes?: string;
}

export function SingleItemCheckInModal({
  isOpen,
  onClose,
  onCheckIn,
  prefilledBarcode = ''
}: SingleItemCheckInModalProps) {
  const [barcode, setBarcode] = useState(prefilledBarcode);
  const [quantity, setQuantity] = useState(1);
  const [condition, setCondition] = useState<'good' | 'fair' | 'damaged' | 'needs-repair'>('good');
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

    const checkInData: SingleCheckInData = {
      itemBarcode: barcode.trim(),
      quantityToReturn: quantity,
      returnedBy: currentUser.displayName,
      returnedByEmail: currentUser.email,
      returnDate: new Date().toISOString(),
      condition,
      notes: notes.trim() || undefined,
    };

    setIsSubmitting(true);
    try {
      await onCheckIn(checkInData);
      handleClose();
      toast.success('Item checked in successfully!');
    } catch (error: any) {
      toast.error(error?.message || 'Check-in failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setBarcode('');
    setQuantity(1);
    setCondition('good');
    setNotes('');
    onClose();
  };

  const currentUser = getCurrentUser();

  const getConditionColor = (cond: string) => {
    switch (cond) {
      case 'good':
        return 'bg-green-100 text-green-700 border-green-300';
      case 'fair':
        return 'bg-yellow-100 text-yellow-700 border-yellow-300';
      case 'damaged':
        return 'bg-orange-100 text-orange-700 border-orange-300';
      case 'needs-repair':
        return 'bg-red-100 text-red-700 border-red-300';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200 bg-gradient-to-r from-primary-50 to-primary-100">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Single Item Check-In</h2>
            <p className="text-sm text-gray-600 mt-1">Return a single item or quantity</p>
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
            <p className="text-xs text-gray-500 mt-1">
              Scan or enter the barcode of the item you're returning
            </p>
          </div>

          {/* Quantity */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Hash className="w-4 h-4 inline mr-1" />
              Quantity to Return *
            </label>
            <Input
              type="number"
              min="1"
              placeholder="1"
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
            />
          </div>

          {/* Condition */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Item Condition *
            </label>
            <div className="grid grid-cols-2 gap-3">
              {(['good', 'fair', 'damaged', 'needs-repair'] as const).map((cond) => (
                <button
                  key={cond}
                  type="button"
                  onClick={() => setCondition(cond)}
                  className={`px-4 py-3 rounded-lg border-2 text-sm font-medium transition-all ${
                    condition === cond
                      ? getConditionColor(cond) + ' border-current shadow-sm'
                      : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                  }`}
                >
                  {cond === 'good' && '✓ Good Condition'}
                  {cond === 'fair' && '⚠ Fair Condition'}
                  {cond === 'damaged' && '⚠ Damaged'}
                  {cond === 'needs-repair' && '🔧 Needs Repair'}
                </button>
              ))}
            </div>
            {(condition === 'damaged' || condition === 'needs-repair') && (
              <p className="text-xs text-red-600 mt-2 flex items-center gap-1">
                <span>⚠</span> Please add detailed notes about the damage or repair needed
              </p>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes {(condition === 'damaged' || condition === 'needs-repair') && <span className="text-red-600">*</span>}
            </label>
            <textarea
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              rows={3}
              placeholder={
                condition === 'damaged' || condition === 'needs-repair'
                  ? 'Describe the damage or repair needed...'
                  : 'Any additional notes about the return...'
              }
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          {/* Summary Box */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h4 className="font-medium text-green-900 mb-2 flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              Check-In Summary
            </h4>
            <div className="text-sm text-green-800 space-y-1">
              <p>Returned by: <span className="font-medium">{currentUser.displayName}</span></p>
              <p>Return date: <span className="font-medium">{new Date().toLocaleDateString()}</span></p>
              {quantity > 0 && (
                <p>Quantity: <span className="font-medium">{quantity}</span></p>
              )}
              <p>Condition: <span className={`font-medium px-2 py-0.5 rounded ${getConditionColor(condition)}`}>
                {condition.charAt(0).toUpperCase() + condition.slice(1).replace('-', ' ')}
              </span></p>
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
            disabled={
              isSubmitting ||
              !barcode.trim() ||
              quantity <= 0 ||
              ((condition === 'damaged' || condition === 'needs-repair') && !notes.trim())
            }
          >
            {isSubmitting ? 'Processing...' : 'Complete Check-In'}
          </Button>
        </div>
      </div>
    </div>
  );
}
