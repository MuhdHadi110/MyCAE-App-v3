import React, { useState } from 'react';
import { Monitor } from 'lucide-react';
import { LoadingButton } from '../ui/LoadingButton';
import { BaseModal } from '../ui/BaseModal';
import type { PC } from '../../types/pc.types';

interface AddPCModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (pc: Omit<PC, 'id' | 'lastUpdated'>) => void;
  isLoading?: boolean;
}

export const AddPCModal: React.FC<AddPCModalProps> = ({ 
  isOpen, 
  onClose, 
  onAdd, 
  isLoading = false 
}) => {
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

  const footer = (
    <div className="flex gap-3">
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
  );

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Add New PC"
      description="Register a new computer"
      icon={<Monitor className="w-6 h-6 text-primary-600" />}
      footer={footer}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
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
      </form>
    </BaseModal>
  );
};