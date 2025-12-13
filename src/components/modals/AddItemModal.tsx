import { useState } from 'react';
import { Package, Barcode, MapPin, Hash } from 'lucide-react';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import type { InventoryItem } from '../../types/inventory.types';

interface AddItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (item: Omit<InventoryItem, 'id' | 'lastUpdated' | 'createdBy'>) => void;
  initialData?: InventoryItem;
  isEditMode?: boolean;
}

export const AddItemModal: React.FC<AddItemModalProps> = ({ isOpen, onClose, onSubmit, initialData, isEditMode = false }) => {

  const [formData, setFormData] = useState({
    title: '',
    sku: '',
    category: '',
    quantity: 0,
    minimumStock: 0,
    location: '',
    unitOfMeasure: 'units',
    cost: 0,
    price: 0,
    supplier: '',
    status: 'Active' as const,
    barcode: '',
    notes: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const categories = [
    'Electronics',
    'Office Supplies',
    'Furniture',
    'Tools & Equipment',
    'Safety Equipment',
    'IT Equipment',
    'Consumables',
    'Other',
  ];

  const locations = ['In the office', 'On site'];

  const unitOptions = [
    'units',
    'boxes',
    'packs',
    'pieces',
    'sets',
    'meters',
    'kg',
    'liters',
  ];

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) newErrors.title = 'Item name is required';
    if (!formData.sku.trim()) newErrors.sku = 'SKU is required';
    if (!formData.category) newErrors.category = 'Category is required';
    if (formData.quantity < 0) newErrors.quantity = 'Quantity must be 0 or greater';
    if (formData.minimumStock < 0) newErrors.minimumStock = 'Minimum stock must be 0 or greater';
    if (!formData.location) newErrors.location = 'Location is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    onSubmit(formData);
    handleClose();
  };

  const handleClose = () => {
    setFormData({
      title: '',
      sku: '',
      category: '',
      quantity: 0,
      minimumStock: 0,
      location: '',
      unitOfMeasure: 'units',
      cost: 0,
      price: 0,
      supplier: '',
      status: 'Active',
      barcode: '',
      notes: '',
    });
    setErrors({});
    onClose();
  };

  const handleInputChange = (field: string, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const modalFooter = (
    <>
      <p className="text-sm text-gray-500">
        Fields marked with <span className="text-red-500">*</span> are required
      </p>
      <div className="flex gap-3">
        <Button variant="outline" onClick={handleClose}>
          Cancel
        </Button>
        <Button onClick={handleSubmit}>{isEditMode ? 'Update Item' : 'Add Item'}</Button>
      </div>
    </>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={isEditMode ? 'Edit Item' : 'Add New Item'}
      description="Register a new equipment or item to inventory"
      icon={<Package className="w-5 h-5 text-primary-600" aria-hidden="true" />}
      size="xl"
      footer={modalFooter}
    >
      {/* Form */}
      <form onSubmit={handleSubmit} className="p-6" id="add-item-form">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Item Name */}
            <div>
              <label htmlFor="item-title" className="block text-sm font-medium text-gray-700 mb-2">
                Item Name <span className="text-red-500" aria-hidden="true">*</span>
              </label>
              <input
                id="item-title"
                type="text"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                aria-invalid={errors.title ? 'true' : undefined}
                aria-describedby={errors.title ? 'title-error' : undefined}
                aria-required="true"
                className={`w-full px-4 py-2.5 min-h-[44px] border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                  errors.title ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="e.g., Laptop Dell XPS 15"
              />
              {errors.title && <p id="title-error" className="text-red-500 text-xs mt-1" role="alert">{errors.title}</p>}
            </div>

            {/* SKU */}
            <div>
              <label htmlFor="item-sku" className="block text-sm font-medium text-gray-700 mb-2">
                SKU <span className="text-red-500" aria-hidden="true">*</span>
              </label>
              <div className="relative">
                <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" aria-hidden="true" />
                <input
                  id="item-sku"
                  type="text"
                  value={formData.sku}
                  onChange={(e) => handleInputChange('sku', e.target.value)}
                  aria-invalid={errors.sku ? 'true' : undefined}
                  aria-describedby={errors.sku ? 'sku-error' : undefined}
                  aria-required="true"
                  className={`w-full pl-10 pr-4 py-2.5 min-h-[44px] border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                    errors.sku ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="e.g., LAP-DELL-001"
                />
              </div>
              {errors.sku && <p id="sku-error" className="text-red-500 text-xs mt-1" role="alert">{errors.sku}</p>}
            </div>

            {/* Barcode */}
            <div>
              <label htmlFor="item-barcode" className="block text-sm font-medium text-gray-700 mb-2">
                Barcode (Optional)
              </label>
              <div className="relative">
                <Barcode className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" aria-hidden="true" />
                <input
                  id="item-barcode"
                  type="text"
                  value={formData.barcode}
                  onChange={(e) => handleInputChange('barcode', e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 min-h-[44px] border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="e.g., 1234567890123"
                />
              </div>
            </div>

            {/* Category */}
            <div>
              <label htmlFor="item-category" className="block text-sm font-medium text-gray-700 mb-2">
                Category <span className="text-red-500" aria-hidden="true">*</span>
              </label>
              <select
                id="item-category"
                value={formData.category}
                onChange={(e) => handleInputChange('category', e.target.value)}
                aria-invalid={errors.category ? 'true' : undefined}
                aria-describedby={errors.category ? 'category-error' : undefined}
                aria-required="true"
                className={`w-full px-4 py-2.5 min-h-[44px] border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                  errors.category ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Select category</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
              {errors.category && <p id="category-error" className="text-red-500 text-xs mt-1" role="alert">{errors.category}</p>}
            </div>

            {/* Quantity */}
            <div>
              <label htmlFor="item-quantity" className="block text-sm font-medium text-gray-700 mb-2">
                Quantity <span className="text-red-500" aria-hidden="true">*</span>
              </label>
              <input
                id="item-quantity"
                type="number"
                value={formData.quantity}
                onChange={(e) => handleInputChange('quantity', parseInt(e.target.value) || 0)}
                aria-invalid={errors.quantity ? 'true' : undefined}
                aria-describedby={errors.quantity ? 'quantity-error' : undefined}
                aria-required="true"
                className={`w-full px-4 py-2.5 min-h-[44px] border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                  errors.quantity ? 'border-red-500' : 'border-gray-300'
                }`}
                min="0"
              />
              {errors.quantity && <p id="quantity-error" className="text-red-500 text-xs mt-1" role="alert">{errors.quantity}</p>}
            </div>

            {/* Unit of Measure */}
            <div>
              <label htmlFor="item-unit" className="block text-sm font-medium text-gray-700 mb-2">
                Unit of Measure
              </label>
              <select
                id="item-unit"
                value={formData.unitOfMeasure}
                onChange={(e) => handleInputChange('unitOfMeasure', e.target.value)}
                className="w-full px-4 py-2.5 min-h-[44px] border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                {unitOptions.map((unit) => (
                  <option key={unit} value={unit}>
                    {unit}
                  </option>
                ))}
              </select>
            </div>

            {/* Minimum Stock */}
            <div>
              <label htmlFor="item-min-stock" className="block text-sm font-medium text-gray-700 mb-2">
                Minimum Stock Level <span className="text-red-500" aria-hidden="true">*</span>
              </label>
              <input
                id="item-min-stock"
                type="number"
                value={formData.minimumStock}
                onChange={(e) => handleInputChange('minimumStock', parseInt(e.target.value) || 0)}
                aria-invalid={errors.minimumStock ? 'true' : undefined}
                aria-describedby={errors.minimumStock ? 'min-stock-error' : undefined}
                aria-required="true"
                className={`w-full px-4 py-2.5 min-h-[44px] border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                  errors.minimumStock ? 'border-red-500' : 'border-gray-300'
                }`}
                min="0"
              />
              {errors.minimumStock && (
                <p id="min-stock-error" className="text-red-500 text-xs mt-1" role="alert">{errors.minimumStock}</p>
              )}
            </div>

            {/* Location */}
            <div>
              <label htmlFor="item-location" className="block text-sm font-medium text-gray-700 mb-2">
                Location <span className="text-red-500" aria-hidden="true">*</span>
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" aria-hidden="true" />
                <select
                  id="item-location"
                  value={formData.location}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                  aria-invalid={errors.location ? 'true' : undefined}
                  aria-describedby={errors.location ? 'location-error' : undefined}
                  aria-required="true"
                  className={`w-full pl-10 pr-4 py-2.5 min-h-[44px] border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                    errors.location ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="">Select location</option>
                  {locations.map((loc) => (
                    <option key={loc} value={loc}>
                      {loc}
                    </option>
                  ))}
                </select>
              </div>
              {errors.location && <p id="location-error" className="text-red-500 text-xs mt-1" role="alert">{errors.location}</p>}
            </div>

            {/* Supplier */}
            <div>
              <label htmlFor="item-supplier" className="block text-sm font-medium text-gray-700 mb-2">
                Supplier (Optional)
              </label>
              <input
                id="item-supplier"
                type="text"
                value={formData.supplier}
                onChange={(e) => handleInputChange('supplier', e.target.value)}
                className="w-full px-4 py-2.5 min-h-[44px] border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="e.g., Dell Malaysia"
              />
            </div>

            {/* Status */}
            <div>
              <label htmlFor="item-status" className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select
                id="item-status"
                value={formData.status}
                onChange={(e) => handleInputChange('status', e.target.value)}
                className="w-full px-4 py-2.5 min-h-[44px] border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
                <option value="Discontinued">Discontinued</option>
              </select>
            </div>

            {/* Notes */}
            <div className="md:col-span-2">
              <label htmlFor="item-notes" className="block text-sm font-medium text-gray-700 mb-2">
                Notes (Optional)
              </label>
              <textarea
                id="item-notes"
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                rows={3}
                placeholder="Additional information about this item..."
              />
            </div>
          </div>
        </form>
    </Modal>
  );
};
