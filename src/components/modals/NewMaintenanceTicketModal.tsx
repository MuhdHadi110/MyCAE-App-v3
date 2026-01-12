import React, { useState, useEffect } from 'react';
import { X, Wrench, AlertCircle } from 'lucide-react';
import { useMaintenanceStore } from '../../store/maintenanceStore';
import { useInventoryStore } from '../../store/inventoryStore';
import { toast } from 'react-hot-toast';
import type { MaintenanceTicket } from '../../types/maintenance.types';
import { logger } from '../../lib/logger';
import {
  InventoryAction,
  inventoryActionLabels,
  inventoryActionDescriptions,
} from '../../types/scheduledMaintenance.types';

const ticketStatusLabels = {
  'open': 'Open',
  'in-progress': 'In Progress',
  'resolved': 'Resolved',
  'closed': 'Closed',
};

interface NewMaintenanceTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingTicket?: MaintenanceTicket | null;
}

export const NewMaintenanceTicketModal: React.FC<NewMaintenanceTicketModalProps> = ({ isOpen, onClose, editingTicket }) => {
  const { createTicket, updateTicket } = useMaintenanceStore();
  const { items, fetchInventory } = useInventoryStore();

  const [formData, setFormData] = useState({
    title: '',
    itemId: '',
    itemName: '',
    description: '',
    status: 'open' as const,
    priority: 'medium' as const,
    category: '',
    assignedTo: '',
    inventoryAction: 'none' as InventoryAction,
    quantityAffected: 1,
  });

  useEffect(() => {
    if (isOpen) {
      fetchInventory();
      if (editingTicket) {
        setFormData({
          title: editingTicket.title || '',
          itemId: editingTicket.itemId || '',
          itemName: editingTicket.itemName || '',
          description: editingTicket.description || '',
          status: editingTicket.status as any,
          priority: editingTicket.priority,
          category: editingTicket.category || '',
          assignedTo: editingTicket.assignedTo || '',
          inventoryAction: editingTicket.inventoryAction || 'none',
          quantityAffected: editingTicket.quantityAffected || 1,
        });
      }
    }
  }, [isOpen, fetchInventory, editingTicket]);

  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value };
      // If selecting an item, auto-populate itemName
      if (field === 'itemId') {
        const selectedItem = items.find(i => i.id === value);
        if (selectedItem) {
          updated.itemName = selectedItem.title;
        }
      }
      return updated;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.title.trim()) {
      toast.error('Please enter a title');
      return;
    }

    if (!formData.description.trim()) {
      toast.error('Please enter a description');
      return;
    }

    if (!formData.category.trim()) {
      toast.error('Please select a category');
      return;
    }

    // Validate quantity if deducting from inventory
    if (formData.inventoryAction === 'deduct' && formData.itemId) {
      const selectedItem = items.find(i => i.id === formData.itemId);
      if (selectedItem && formData.quantityAffected > selectedItem.quantity) {
        toast.error(`Cannot deduct more than available quantity (${selectedItem.quantity})`);
        return;
      }
    }

    setIsSubmitting(true);
    try {
      if (editingTicket) {
        // Update existing ticket
        const updates: Partial<MaintenanceTicket> = {
          title: formData.title.trim(),
          description: formData.description.trim(),
          status: formData.status,
          priority: formData.priority,
          category: formData.category,
          assignedTo: formData.assignedTo || undefined,
        };
        await updateTicket(editingTicket.id, updates);
      } else {
        // Create new ticket
        const newTicket: Omit<MaintenanceTicket, 'id'> = {
          title: formData.title.trim(),
          description: formData.description.trim(),
          status: formData.status,
          priority: formData.priority,
          category: formData.category,
          createdDate: new Date().toISOString(),
          itemId: formData.itemId || undefined,
          itemName: formData.itemName || undefined,
          assignedTo: formData.assignedTo || undefined,
          inventoryAction: formData.itemId ? formData.inventoryAction : undefined,
          quantityAffected: formData.itemId && formData.inventoryAction === 'deduct' ? formData.quantityAffected : undefined,
        };

        await createTicket(newTicket);
      }
      handleClose();
    } catch (error) {
      logger.error('Error saving ticket:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedItem = items.find(i => i.id === formData.itemId);

  const handleClose = () => {
    setFormData({
      title: '',
      itemId: '',
      itemName: '',
      description: '',
      status: 'open',
      priority: 'medium',
      category: '',
      assignedTo: '',
      inventoryAction: 'none',
      quantityAffected: 1,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-primary-50 to-primary-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
              <Wrench className="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                {editingTicket ? 'Edit Maintenance Ticket' : 'New Maintenance Ticket'}
              </h2>
              <p className="text-sm text-gray-600 mt-0.5">
                {editingTicket ? 'Update ticket details and status' : 'Create a new maintenance request'}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-primary-200 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              placeholder="e.g., Equipment maintenance required"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Describe the maintenance issue in detail"
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              required
            />
          </div>

          {/* Grid: Category, Priority, and Status */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.category}
                onChange={(e) => handleInputChange('category', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                required
              >
                <option value="">Select category</option>
                <option value="Equipment">Equipment</option>
                <option value="Infrastructure">Infrastructure</option>
                <option value="Software">Software</option>
                <option value="Hardware">Hardware</option>
                <option value="Facility">Facility</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {/* Priority */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Priority <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.priority}
                onChange={(e) => handleInputChange('priority', e.target.value as any)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>

            {/* Status - only show when editing */}
            {editingTicket && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => handleInputChange('status', e.target.value as any)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="open">Open</option>
                  <option value="in-progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                  <option value="closed">Closed</option>
                </select>
              </div>
            )}
          </div>

          {/* Grid: Item and Assigned To */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Item */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Item (Optional)
              </label>
              <select
                value={formData.itemId}
                onChange={(e) => handleInputChange('itemId', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="">Select an item</option>
                {items.map(item => (
                  <option key={item.id} value={item.id}>
                    {item.title}
                  </option>
                ))}
              </select>
            </div>

            {/* Assigned To */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Assigned To (Optional)
              </label>
              <input
                type="text"
                value={formData.assignedTo}
                onChange={(e) => handleInputChange('assignedTo', e.target.value)}
                placeholder="Team member name"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Inventory Impact Section - Only show when an item is selected */}
          {formData.itemId && (
            <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Inventory Impact
              </label>
              <div className="space-y-3">
                {(Object.keys(inventoryActionLabels) as InventoryAction[]).map((action) => (
                  <label
                    key={action}
                    className={`flex items-start gap-3 p-3 border rounded-lg cursor-pointer transition-all ${
                      formData.inventoryAction === action
                        ? 'border-primary-500 bg-white shadow-sm'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="inventoryAction"
                      value={action}
                      checked={formData.inventoryAction === action}
                      onChange={(e) => handleInputChange('inventoryAction', e.target.value)}
                      className="mt-1"
                    />
                    <div>
                      <div className="font-medium text-gray-900">{inventoryActionLabels[action]}</div>
                      <div className="text-sm text-gray-500">{inventoryActionDescriptions[action]}</div>
                    </div>
                  </label>
                ))}
              </div>

              {/* Quantity input - only show for deduct action */}
              {formData.inventoryAction === 'deduct' && (
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Quantity to Deduct
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={selectedItem?.quantity || 100}
                    value={formData.quantityAffected}
                    onChange={(e) => handleInputChange('quantityAffected', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                  {selectedItem && (
                    <p className="mt-1 text-sm text-gray-500">
                      Available: {selectedItem.quantity} {selectedItem.unitOfMeasure || 'units'}
                    </p>
                  )}
                </div>
              )}

              {/* Info box */}
              <div className="flex items-start gap-2 mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <AlertCircle className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-blue-800">
                  Inventory will be restored automatically when this ticket is marked as completed or resolved.
                </p>
              </div>
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium disabled:opacity-50"
            >
              {editingTicket
                ? isSubmitting
                  ? 'Saving...'
                  : 'Save Changes'
                : isSubmitting
                  ? 'Creating...'
                  : 'Create Ticket'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
