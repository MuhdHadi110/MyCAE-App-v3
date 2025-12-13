import React, { useState, useEffect } from 'react';
import { Monitor, UserPlus, UserMinus, MapPin, Clock, Plus, X, Edit2 } from 'lucide-react';
import { usePCStore } from '../store/pcStore';
import { getCurrentUser } from '../lib/auth';
import { checkPermission } from '../lib/permissions';
import { SoftwareSelection } from '../components/SoftwareSelection';
import type { PC } from '../types/pc.types';

export const PCAssignmentScreen: React.FC = () => {
  const { pcs, loading, fetchPCs, addPC, assignPC, releasePC, deletePC, updatePC } = usePCStore();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedPC, setSelectedPC] = useState<PC | null>(null);
  const [currentUser] = useState(getCurrentUser());

  useEffect(() => {
    fetchPCs();
  }, [fetchPCs]);

  const handleAssign = (pc: PC) => {
    setSelectedPC(pc);
    setShowAssignModal(true);
  };

  const handleEdit = (pc: PC) => {
    setSelectedPC(pc);
    setShowEditModal(true);
  };

  const handleRelease = (pcId: string) => {
    if (confirm('Are you sure you want to release this PC?')) {
      releasePC(pcId);
    }
  };

  const handleDelete = (pcId: string) => {
    if (confirm('Are you sure you want to delete this PC?')) {
      deletePC(pcId);
    }
  };

  const stats = {
    total: pcs.length,
    available: pcs.filter((pc) => pc.status === 'available').length,
    assigned: pcs.filter((pc) => pc.status === 'assigned').length,
    maintenance: pcs.filter((pc) => pc.status === 'maintenance').length,
  };

  const canAddOrRemove = currentUser && checkPermission((currentUser.role || 'engineer') as any, 'canAddOrRemovePC');
  const canAssign = currentUser && checkPermission((currentUser.role || 'engineer') as any, 'canAssignPC');

  return (
    <div className="min-h-full bg-gray-50">
      <div className="p-4 md:p-6  space-y-6">
        {/* Header Container */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">PC Assignment Tracking</h1>
              <p className="text-gray-600 mt-1">Track which engineers are using company PCs</p>
            </div>
            {canAddOrRemove && (
              <button
                onClick={() => setShowAddModal(true)}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add New PC
              </button>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total PCs</p>
              <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <Monitor className="w-8 h-8 text-gray-400" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Available</p>
              <p className="text-3xl font-bold text-primary-600">{stats.available}</p>
            </div>
            <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
              <div className="w-3 h-3 bg-primary-600 rounded-full"></div>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Assigned</p>
              <p className="text-3xl font-bold text-primary-600">{stats.assigned}</p>
            </div>
            <UserPlus className="w-8 h-8 text-gray-400" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Maintenance</p>
              <p className="text-3xl font-bold text-primary-600">{stats.maintenance}</p>
            </div>
            <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
              <div className="w-3 h-3 bg-primary-600 rounded-full"></div>
            </div>
          </div>
        </div>
        </div>

        {/* PC List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {pcs.map((pc) => (
          <div
            key={pc.id}
            className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <Monitor className="w-8 h-8 text-gray-700" />
                <div>
                  <h3 className="font-bold text-lg text-gray-900">{pc.name}</h3>
                  <span
                    className="inline-block px-2 py-1 text-xs rounded-full bg-primary-100 text-primary-700"
                  >
                    {pc.status.charAt(0).toUpperCase() + pc.status.slice(1)}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-2 mb-4">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <MapPin className="w-4 h-4" />
                <span>{pc.location}</span>
              </div>

              {pc.assignedTo && (
                <>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <UserPlus className="w-4 h-4" />
                    <span>{pc.assignedTo}</span>
                  </div>
                  {pc.assignedDate && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Clock className="w-4 h-4" />
                      <span>
                        Since {new Date(pc.assignedDate).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </>
              )}

              {pc.softwareUsed && pc.softwareUsed.length > 0 && (
                <div className="mt-2 p-2 bg-gray-50 rounded text-sm text-gray-600">
                  <h4 className="font-semibold">Software Used:</h4>
                  <ul className="list-disc pl-5">
                    {pc.softwareUsed.map(software => <li key={software}>{software}</li>)}
                  </ul>
                </div>
              )}

              {pc.notes && (
                <div className="mt-2 p-2 bg-gray-50 rounded text-sm text-gray-600">
                  {pc.notes}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              {canAddOrRemove && (
                <button
                  onClick={() => handleEdit(pc)}
                  className="flex-1 px-3 py-2 bg-blue-50 text-blue-700 text-sm rounded hover:bg-blue-100 transition-colors flex items-center justify-center gap-2"
                >
                  <Edit2 className="w-4 h-4" />
                  Edit
                </button>
              )}
              {canAssign && (
                <>
                  {pc.status === 'available' ? (
                    <button
                      onClick={() => handleAssign(pc)}
                      className="flex-1 px-3 py-2 bg-primary-600 text-white text-sm rounded hover:bg-primary-700 transition-colors"
                    >
                      Assign
                    </button>
                  ) : (
                    <button
                      onClick={() => handleRelease(pc.id)}
                      className="flex-1 px-3 py-2 bg-primary-600 text-white text-sm rounded hover:bg-primary-700 transition-colors"
                    >
                      Release
                    </button>
                  )}
                </>
              )}
              {canAddOrRemove && (
                <button
                  onClick={() => handleDelete(pc.id)}
                  className="px-3 py-2 text-sm border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition-colors"
                >
                  Delete
                </button>
              )}
            </div>
          </div>
        ))}
        </div>

        {/* Add PC Modal */}
        {showAddModal && (
          <AddPCModal
            onClose={() => setShowAddModal(false)}
            onAdd={(pcData) => {
              addPC(pcData);
              setShowAddModal(false);
              fetchPCs();
            }}
          />
        )}

        {/* Assign PC Modal */}
        {showAssignModal && selectedPC && (
          <AssignPCModal
            pc={selectedPC}
            currentUser={currentUser}
            onClose={() => {
              setShowAssignModal(false);
              setSelectedPC(null);
            }}
            onAssign={(assignedTo, assignedToEmail, notes, softwareUsed) => {
              assignPC(selectedPC.id, assignedTo, assignedToEmail, notes, softwareUsed);
              setShowAssignModal(false);
              setSelectedPC(null);
              fetchPCs();
            }}
          />
        )}

        {/* Edit PC Modal */}
        {showEditModal && selectedPC && (
          <EditPCModal
            pc={selectedPC}
            onClose={() => {
              setShowEditModal(false);
              setSelectedPC(null);
            }}
            onEdit={(updates) => {
              updatePC(selectedPC.id, updates);
              setShowEditModal(false);
              setSelectedPC(null);
              fetchPCs();
            }}
          />
        )}
      </div>
    </div>
  );
};

// Add PC Modal Component
interface AddPCModalProps {
  onClose: () => void;
  onAdd: (pc: Omit<PC, 'id' | 'lastUpdated'>) => void;
}

const AddPCModal: React.FC<AddPCModalProps> = ({ onClose, onAdd }) => {
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
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 transition-colors"
            >
              Add PC
            </button>
          </div>
        </form>
        </div>
      </div>
    </div>
  );
};

// Assign PC Modal Component
interface AssignPCModalProps {
  pc: PC;
  currentUser: any;
  onClose: () => void;
  onAssign: (assignedTo: string, assignedToEmail: string, notes: string | undefined, softwareUsed: string[]) => void;
}

const AssignPCModal: React.FC<AssignPCModalProps> = ({
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
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 transition-colors"
              >
                Assign PC
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// Edit PC Modal Component
interface EditPCModalProps {
  pc: PC;
  onClose: () => void;
  onEdit: (updates: Partial<PC>) => void;
}

const EditPCModal: React.FC<EditPCModalProps> = ({
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
          <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-blue-100">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Edit2 className="w-6 h-6 text-blue-600" />
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
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
              >
                Save Changes
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};