import React, { useState } from 'react';
import { UserPlus, X } from 'lucide-react';
import { Button } from '../ui/Button';
import { SoftwareSelection } from '../SoftwareSelection';
import type { PC } from '../../types/pc.types';

interface AssignPCModalProps {
  pc: PC;
  currentUser: any;
  onClose: () => void;
  onAssign: (assignedTo: string, assignedToEmail: string, notes: string | undefined, softwareUsed: string[]) => void;
}

export const AssignPCModal: React.FC<AssignPCModalProps> = ({
  pc,
  currentUser,
  onClose,
  onAssign,
}) => {
  const [formData, setFormData] = useState({
    assignedTo: currentUser?.displayName || '',
    assignedToEmail: currentUser?.email || '',
    notes: '',
  });
  const [selectedSoftware, setSelectedSoftware] = useState<string[]>([]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAssign(formData.assignedTo, formData.assignedToEmail, formData.notes, selectedSoftware);
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
                <UserPlus className="w-6 h-6 text-primary-600" />
                Assign {pc.name}
              </h2>
              <p className="text-sm text-gray-600 mt-1">Assign this PC to an engineer</p>
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
                <label className="block text-sm font-medium text-gray-700 mb-2">Assigned To *</label>
                <input
                  type="text"
                  required
                  value={formData.assignedTo}
                  onChange={(e) =>
                    setFormData({ ...formData, assignedTo: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Staff name"
                />
            </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                <input
                  type="email"
                  value={formData.assignedToEmail}
                  onChange={(e) =>
                    setFormData({ ...formData, assignedToEmail: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="staff@email.com"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
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
                Assign PC
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};