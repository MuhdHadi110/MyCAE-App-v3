import React, { useState } from 'react';
import { Monitor, Plus, X } from 'lucide-react';
import { LoadingButton } from '../ui/LoadingButton';
import type { PC } from '../../types/pc.types';

interface AddPCModalProps {
  onClose: () => void;
  onAdd: (pc: Omit<PC, 'id' | 'lastUpdated'>) => void;
  isLoading?: boolean;
}

export const AddPCModal: React.FC<AddPCModalProps> = ({ onClose, onAdd, isLoading = false }) => {
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    status: 'available' as const,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Map frontend format to backend format
    const backendData = {
      assetTag: formData.name,
      deviceName: formData.name,
      computerType: 'laptop',
      location: formData.location,
    };
    onAdd(backendData as any);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={onClose} />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full">
          {/* Header with Gradient */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-primary-50 to-primary-100">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Monitor className="w-6 h-6 text-primary-600" />
                Add New PC
              </h2>
              <p className="text-sm text-gray-600 mt-1">Register a new computer</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6">
            <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">PC Name *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
                placeholder="e.g., PC1, PC2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Location</label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
                placeholder="e.g., Office Floor 2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select
                value={formData.status}
                onChange={(e) =>
                  setFormData({ ...formData, status: e.target.value as any })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="available">Available</option>
                <option value="maintenance">Maintenance</option>
              </select>
            </div>
          </div>

          {/* Footer with Buttons */}
          <div className="flex gap-3 mt-6 border-t border-gray-200 pt-6">
            <LoadingButton
              type="button"
              variant="secondary"
              fullWidth
              onClick={onClose}
            >
              Cancel
            </LoadingButton>
            <LoadingButton
              type="submit"
              variant="primary"
              fullWidth
              isLoading={isLoading}
              loadingText="Adding PC..."
            >
              Add PC
            </LoadingButton>
          </div>
        </form>
        </div>
      </div>
    </div>
  );
};