import React, { useState } from 'react';
import { X, User, MapPin, Calendar, FileText, Package } from 'lucide-react';
import { Input } from '../ui/Input';
import type { InventoryItem } from '../../types/inventory.types';

interface CheckoutCartProps {
  selectedItems: InventoryItem[];
  onRemoveItem: (itemId: string) => void;
  onCheckout: (checkoutData: CheckoutFormData) => void;
  onCancel: () => void;
  teamMembers: Array<{ id: string; name: string; email?: string }>;
}

export interface CheckoutFormData {
  engineerId: string;
  engineerName: string;
  purpose: string;
  location: string;
  expectedReturnDate: string;
  notes: string;
}

export const CheckoutCart: React.FC<CheckoutCartProps> = ({
  selectedItems,
  onRemoveItem,
  onCheckout,
  onCancel,
  teamMembers,
}) => {
  const [formData, setFormData] = useState<CheckoutFormData>({
    engineerId: '',
    engineerName: '',
    purpose: '',
    location: '',
    expectedReturnDate: '',
    notes: '',
  });

  const [errors, setErrors] = useState<Partial<Record<keyof CheckoutFormData, string>>>({});

  const handleEngineerChange = (engineerId: string) => {
    const engineer = teamMembers.find((tm) => tm.id === engineerId);
    setFormData((prev) => ({
      ...prev,
      engineerId,
      engineerName: engineer?.name || '',
    }));
    if (errors.engineerId) {
      setErrors((prev) => ({ ...prev, engineerId: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof CheckoutFormData, string>> = {};

    if (!formData.engineerId) {
      newErrors.engineerId = 'Please select an engineer';
    }
    if (!formData.purpose.trim()) {
      newErrors.purpose = 'Purpose is required';
    }
    if (!formData.location.trim()) {
      newErrors.location = 'Location is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      onCheckout(formData);
    }
  };

  // Set default return date to 7 days from now
  const defaultReturnDate = () => {
    const date = new Date();
    date.setDate(date.getDate() + 7);
    return date.toISOString().split('T')[0];
  };

  React.useEffect(() => {
    if (!formData.expectedReturnDate) {
      setFormData((prev) => ({ ...prev, expectedReturnDate: defaultReturnDate() }));
    }
  }, []);

  return (
    <div className="space-y-6">
      {/* Selected Items Summary */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
          <Package className="w-5 h-5 text-primary-600" />
          Selected Items ({selectedItems.length})
        </h3>
        <div className="space-y-2 max-h-[200px] overflow-y-auto">
          {selectedItems.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between bg-white p-3 rounded-lg border border-gray-200"
            >
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 truncate">{item.title}</p>
                <p className="text-sm text-gray-500">
                  SKU: {item.sku} | {item.category}
                </p>
              </div>
              <button
                onClick={() => onRemoveItem(item.id)}
                className="ml-2 p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="Remove item"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Checkout Form */}
      <div className="space-y-4">
        <h3 className="font-medium text-gray-900">Checkout Details</h3>

        {/* Title (Purpose) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            <FileText className="w-4 h-4 inline mr-1" />
            Title *
          </label>
          <Input
            type="text"
            placeholder="e.g., Site calibration, Client visit, Lab testing"
            value={formData.purpose}
            onChange={(e) => {
              setFormData((prev) => ({ ...prev, purpose: e.target.value }));
              if (errors.purpose) setErrors((prev) => ({ ...prev, purpose: undefined }));
            }}
            error={errors.purpose}
          />
        </div>

        {/* Engineer Select */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            <User className="w-4 h-4 inline mr-1" />
            Engineer *
          </label>
          <select
            value={formData.engineerId}
            onChange={(e) => handleEngineerChange(e.target.value)}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
              errors.engineerId ? 'border-red-500' : 'border-gray-300'
            }`}
          >
            <option value="">Select Engineer</option>
            {teamMembers.map((member) => (
              <option key={member.id} value={member.id}>
                {member.name}
              </option>
            ))}
          </select>
          {errors.engineerId && (
            <p className="mt-1 text-sm text-red-600">{errors.engineerId}</p>
          )}
        </div>

        {/* Location */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            <MapPin className="w-4 h-4 inline mr-1" />
            Location *
          </label>
          <Input
            type="text"
            placeholder="e.g., Client Site A, Warehouse, Lab"
            value={formData.location}
            onChange={(e) => {
              setFormData((prev) => ({ ...prev, location: e.target.value }));
              if (errors.location) setErrors((prev) => ({ ...prev, location: undefined }));
            }}
            error={errors.location}
          />
        </div>

        {/* Expected Return Date */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            <Calendar className="w-4 h-4 inline mr-1" />
            Expected Return Date
          </label>
          <Input
            type="date"
            value={formData.expectedReturnDate}
            onChange={(e) => setFormData((prev) => ({ ...prev, expectedReturnDate: e.target.value }))}
          />
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
          <textarea
            rows={3}
            placeholder="Additional notes or instructions..."
            value={formData.notes}
            onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
          />
        </div>
      </div>

      {/* Footer */}
      <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
        <button
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Back
        </button>
        <button
          onClick={handleSubmit}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
        >
          Confirm Checkout ({selectedItems.length} items)
        </button>
      </div>
    </div>
  );
};
