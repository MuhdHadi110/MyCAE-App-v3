import React, { useState } from 'react';
import { Edit2, X } from 'lucide-react';
import { SoftwareSelection } from '../SoftwareSelection';
import { Button } from '../ui/Button';
import type { PC } from '../../types/pc.types';

interface EditPCModalProps {
  pc: PC;
  onClose: () => void;
  onEdit: (updates: Partial<PC>) => void;
}

export const EditPCModal: React.FC<EditPCModalProps> = ({
  pc,
  onClose,
  onEdit,
}) => {
  const [formData, setFormData] = useState({
    name: pc.name,
    location: pc.location,
    notes: pc.notes || '',
  });
  const [selectedSoftware, setSelectedSoftware] = useState<string[]>(pc.softwareUsed || []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onEdit({
      name: formData.name,
      location: formData.location,
      notes: formData.notes,
      softwareUsed: selectedSoftware,
    });
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={onClose} />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full">
          {/* Header with Gradient */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-primary-50 to-primary-100 dark:from-gray-800 dark:to-gray-700">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Edit2 className="w-6 h-6 text-primary-600" />
                Edit {pc.name}
              </h2>
              <p className="text-sm text-gray-600 mt-1">Update PC properties</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">PC Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., PC1, PC2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) =>
                    setFormData({ ...formData, location: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Office Floor 2"
                />
              </div>

              <SoftwareSelection
                selectedSoftware={selectedSoftware}
                onSelectionChange={setSelectedSoftware}
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  placeholder="Any additional notes..."
                />
              </div>
            </div>

            {/* Footer with Buttons */}
            <div className="flex gap-3 mt-6 border-t border-gray-200 pt-6">
              <Button
                type="button"
                variant="secondary"
                fullWidth
                onClick={onClose}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                fullWidth
              >
                Save Changes
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};