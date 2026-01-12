import React, { useState, useEffect } from 'react';
import { Calendar, AlertCircle } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { useInventoryStore } from '../../store/inventoryStore';
import { useScheduledMaintenanceStore } from '../../store/scheduledMaintenanceStore';
import {
  MaintenanceType,
  InventoryAction,
  maintenanceTypeLabels,
  inventoryActionLabels,
  inventoryActionDescriptions,
  ScheduledMaintenance,
} from '../../types/scheduledMaintenance.types';

interface AddScheduledMaintenanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingSchedule?: ScheduledMaintenance | null;
  preselectedItemId?: string;
}

export const AddScheduledMaintenanceModal: React.FC<AddScheduledMaintenanceModalProps> = ({
  isOpen,
  onClose,
  editingSchedule,
  preselectedItemId,
}) => {
  const { items, fetchInventory } = useInventoryStore();
  const { createSchedule, updateSchedule, loading } = useScheduledMaintenanceStore();

  const [formData, setFormData] = useState({
    item_id: '',
    maintenance_type: 'calibration' as MaintenanceType,
    description: '',
    scheduled_date: '',
    inventory_action: 'none' as InventoryAction,
    quantity_affected: 1,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen) {
      fetchInventory();
    }
  }, [isOpen, fetchInventory]);

  useEffect(() => {
    if (editingSchedule) {
      setFormData({
        item_id: editingSchedule.item_id,
        maintenance_type: editingSchedule.maintenance_type,
        description: editingSchedule.description || '',
        scheduled_date: editingSchedule.scheduled_date.split('T')[0],
        inventory_action: editingSchedule.inventory_action,
        quantity_affected: editingSchedule.quantity_affected,
      });
    } else if (preselectedItemId) {
      setFormData((prev) => ({ ...prev, item_id: preselectedItemId }));
    } else {
      setFormData({
        item_id: '',
        maintenance_type: 'calibration',
        description: '',
        scheduled_date: '',
        inventory_action: 'none',
        quantity_affected: 1,
      });
    }
    setErrors({});
  }, [editingSchedule, preselectedItemId, isOpen]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.item_id) {
      newErrors.item_id = 'Please select an item';
    }

    if (!formData.scheduled_date) {
      newErrors.scheduled_date = 'Please select a date';
    } else {
      const selectedDate = new Date(formData.scheduled_date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (selectedDate < today && !editingSchedule) {
        newErrors.scheduled_date = 'Date cannot be in the past';
      }
    }

    if (formData.inventory_action === 'deduct' && formData.quantity_affected < 1) {
      newErrors.quantity_affected = 'Quantity must be at least 1';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    try {
      if (editingSchedule) {
        await updateSchedule(editingSchedule.id, {
          maintenance_type: formData.maintenance_type,
          description: formData.description || undefined,
          scheduled_date: formData.scheduled_date,
          inventory_action: formData.inventory_action,
          quantity_affected: formData.quantity_affected,
        });
      } else {
        await createSchedule({
          item_id: formData.item_id,
          maintenance_type: formData.maintenance_type,
          description: formData.description || undefined,
          scheduled_date: formData.scheduled_date,
          inventory_action: formData.inventory_action,
          quantity_affected: formData.quantity_affected,
        });
      }
      onClose();
    } catch (error) {
      // Error handled by store
    }
  };

  const selectedItem = items.find((i) => i.id === formData.item_id);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingSchedule ? 'Edit Scheduled Maintenance' : 'Schedule Maintenance'}
      description="Set up maintenance reminders"
      icon={<Calendar className="w-5 h-5 text-amber-600" />}
      size="md"
    >
      <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Item Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Equipment/Item *
            </label>
            <select
              value={formData.item_id}
              onChange={(e) => setFormData({ ...formData, item_id: e.target.value })}
              disabled={!!editingSchedule || !!preselectedItemId}
              className={`w-full px-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all ${
                errors.item_id ? 'border-red-300' : 'border-gray-200'
              } ${(editingSchedule || preselectedItemId) ? 'bg-gray-50 cursor-not-allowed' : ''}`}
            >
              <option value="">Select an item...</option>
              {items.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.title} ({item.sku})
                </option>
              ))}
            </select>
            {errors.item_id && (
              <p className="mt-1 text-sm text-red-600">{errors.item_id}</p>
            )}
          </div>

          {/* Maintenance Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Maintenance Type *
            </label>
            <select
              value={formData.maintenance_type}
              onChange={(e) =>
                setFormData({ ...formData, maintenance_type: e.target.value as MaintenanceType })
              }
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
            >
              {Object.entries(maintenanceTypeLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          {/* Scheduled Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Scheduled Date *
            </label>
            <Input
              type="date"
              value={formData.scheduled_date}
              onChange={(e) => setFormData({ ...formData, scheduled_date: e.target.value })}
              min={new Date().toISOString().split('T')[0]}
              className={errors.scheduled_date ? 'border-red-300' : ''}
            />
            {errors.scheduled_date && (
              <p className="mt-1 text-sm text-red-600">{errors.scheduled_date}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Description (Optional)
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Additional notes about this maintenance..."
              rows={3}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all resize-none"
            />
          </div>

          {/* Inventory Action */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Inventory Impact
            </label>
            <div className="space-y-3">
              {(Object.keys(inventoryActionLabels) as InventoryAction[]).map((action) => (
                <label
                  key={action}
                  className={`flex items-start gap-3 p-3 border rounded-xl cursor-pointer transition-all ${
                    formData.inventory_action === action
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="inventory_action"
                    value={action}
                    checked={formData.inventory_action === action}
                    onChange={(e) =>
                      setFormData({ ...formData, inventory_action: e.target.value as InventoryAction })
                    }
                    className="mt-1"
                  />
                  <div>
                    <div className="font-medium text-gray-900">{inventoryActionLabels[action]}</div>
                    <div className="text-sm text-gray-500">{inventoryActionDescriptions[action]}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Quantity (only for deduct) */}
          {formData.inventory_action === 'deduct' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Quantity to Deduct
              </label>
              <Input
                type="number"
                min={1}
                max={selectedItem?.quantity || 100}
                value={formData.quantity_affected}
                onChange={(e) =>
                  setFormData({ ...formData, quantity_affected: parseInt(e.target.value) || 1 })
                }
                className={errors.quantity_affected ? 'border-red-300' : ''}
              />
              {selectedItem && (
                <p className="mt-1 text-sm text-gray-500">
                  Available: {selectedItem.quantity} {selectedItem.unitOfMeasure || 'units'}
                </p>
              )}
              {errors.quantity_affected && (
                <p className="mt-1 text-sm text-red-600">{errors.quantity_affected}</p>
              )}
            </div>
          )}

          {/* Info box */}
          <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-amber-800">
              <p className="font-medium">Reminders will be sent:</p>
              <ul className="mt-1 space-y-0.5 list-disc list-inside">
                <li>14 days before the scheduled date</li>
                <li>7 days before the scheduled date</li>
                <li>1 day before the scheduled date</li>
              </ul>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? 'Saving...' : editingSchedule ? 'Update Schedule' : 'Create Schedule'}
            </Button>
          </div>
        </form>
    </Modal>
  );
};

export default AddScheduledMaintenanceModal;
