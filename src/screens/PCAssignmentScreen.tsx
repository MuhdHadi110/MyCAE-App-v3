import React, { useState, useEffect, useMemo } from 'react';
import { Monitor, Clock, Plus, Edit2, Wrench, Trash2 } from 'lucide-react';
import { usePCStore } from '../store/pcStore';
import { getCurrentUser } from '../lib/auth';
import { checkPermission } from '../lib/permissions';
import { AddPCModal } from '../components/modals/AddPCModal';
import { AssignPCModal } from '../components/modals/AssignPCModal';
import { EditPCModal } from '../components/modals/EditPCModal';
import { DropdownMenu, DropdownTrigger } from '../components/ui/DropdownMenu';
import type { PC } from '../types/pc.types';

export const PCAssignmentScreen: React.FC = () => {
  const { pcs, fetchPCs, addPC, assignPC, releasePC, deletePC, updatePC, setMaintenanceStatus } = usePCStore();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedPC, setSelectedPC] = useState<PC | null>(null);
  const [showDropdown, setShowDropdown] = useState<string | null>(null);
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

  const handleMaintenance = async (pcId: string, inMaintenance: boolean) => {
    try {
      await setMaintenanceStatus(pcId, inMaintenance);
    } catch (error) {
      console.error('Failed to update maintenance status:', error);
    }
  };

  const handleMaintenanceConfirmation = (pc: PC, inMaintenance: boolean): boolean => {
    let message: string;

    if (inMaintenance) {
      // Ending maintenance - no assignment impact
      message = 'End maintenance for this PC?';
    } else {
      // Starting maintenance - may unassign current user
      if (pc.status === 'assigned' && pc.assignedTo) {
        message = `Mark this PC for maintenance? This will unassign ${pc.assignedTo}.`;
      } else {
        message = 'Mark this PC for maintenance?';
      }
    }

    return confirm(message);
  };

  // Sort PCs numerically by name (PC1, PC2, PC3... instead of PC1, PC10, PC11...)
  const sortedPCs = useMemo(() => {
    return [...pcs].sort((a, b) => {
      const aMatch = a.name.match(/^PC(\d+)$/);
      const bMatch = b.name.match(/^PC(\d+)$/);

      if (aMatch && bMatch) {
        const aNum = parseInt(aMatch[1]);
        const bNum = parseInt(bMatch[1]);
        return aNum - bNum;
      }

      // Fallback to alphabetical sort for non-PC names
      return a.name.localeCompare(b.name);
    });
  }, [pcs]);

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
      <div className="p-4 md:p-6 space-y-6">
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
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="text-sm font-medium text-gray-600">Total PCs</div>
            <div className="text-3xl font-bold text-gray-900 mt-2">{stats.total}</div>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="text-sm font-medium text-gray-600">Available</div>
            <div className="text-3xl font-bold text-green-600 mt-2">{stats.available}</div>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="text-sm font-medium text-gray-600">Assigned</div>
            <div className="text-3xl font-bold text-blue-600 mt-2">{stats.assigned}</div>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="text-sm font-medium text-gray-600">Maintenance</div>
            <div className="text-3xl font-bold text-yellow-600 mt-2">{stats.maintenance}</div>
          </div>
        </div>

        {/* PC List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sortedPCs.map((pc) => (
          <div key={pc.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-lg transition-shadow relative">
            {canAddOrRemove && (
              <div className="absolute top-4 right-4 z-10">
                <DropdownTrigger
                  isOpen={showDropdown === pc.id}
                  onClick={() => setShowDropdown(showDropdown === pc.id ? null : pc.id)}
                />
                <DropdownMenu
                  isOpen={showDropdown === pc.id}
                  onClose={() => setShowDropdown(null)}
                  items={[
                    { icon: <Edit2 className="w-4 h-4" />, label: 'Edit PC', onClick: () => handleEdit(pc) },
                    { icon: <Trash2 className="w-4 h-4" />, label: 'Delete PC', onClick: () => handleDelete(pc.id), variant: 'danger' },
                    ...(pc.status === 'maintenance' ? [
                      { icon: <Wrench className="w-4 h-4" />, label: 'End Maintenance', onClick: () => {
                        if (handleMaintenanceConfirmation(pc, false)) {
                          handleMaintenance(pc.id, false);
                        }
                      }}
                    ] : [
                      { icon: <Wrench className="w-4 h-4" />, label: 'Mark for Maintenance', onClick: () => {
                        if (handleMaintenanceConfirmation(pc, true)) {
                          handleMaintenance(pc.id, true);
                        }
                      }}
                    ])
                  ]}
                />
              </div>
            )}
            <div className="p-6">
              {/* Header with Status Badge */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Monitor className={`w-8 h-8 ${
                    pc.status === 'available' ? 'text-green-600' :
                    pc.status === 'assigned' ? 'text-blue-600' :
                    'text-yellow-600'
                  }`} />
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-lg text-gray-900">{pc.name}</h3>
                    {pc.status === 'available' && (
                      <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded">Available</span>
                    )}
                    {pc.status === 'assigned' && (
                      <span className="px-2 py-1 bg-primary-600 text-white text-xs font-medium rounded">Assigned</span>
                    )}
                    {pc.status === 'maintenance' && (
                      <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded">Maintenance</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Assigned User Section */}
              {pc.status === 'assigned' && (
                <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary-600 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-white font-semibold text-sm">
                        {pc.assignedTo ? pc.assignedTo.charAt(0).toUpperCase() : '?'}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{pc.assignedTo || 'Unknown User'}</p>
                      {pc.assignedToEmail && (
                        <p className="text-sm text-gray-600 truncate">{pc.assignedToEmail}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Software Licenses */}
              {pc.status === 'assigned' && pc.softwareUsed && pc.softwareUsed.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Software</h4>
                  <div className="flex flex-wrap gap-1">
                    {pc.softwareUsed.map(software => (
                      <span key={software} className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded">
                        {software}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Details */}
              <div className="space-y-2 mb-6">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <span>{pc.location}</span>
                </div>
                {pc.status === 'assigned' && pc.assignedDate && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Clock className="w-4 h-4" />
                    <span>Assigned {new Date(pc.assignedDate).toLocaleDateString()}</span>
                  </div>
                )}
                {pc.notes && (
                  <div className="mt-2 p-2 bg-gray-50 rounded text-sm text-gray-700">
                    {pc.notes}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                {pc.status === 'available' && canAssign && (
                  <button
                    onClick={() => handleAssign(pc)}
                    className="flex-1 px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors"
                  >
                    Assign
                  </button>
                )}

                {pc.status === 'assigned' && canAssign && (
                  <button
                    onClick={() => handleRelease(pc.id)}
                    className="flex-1 px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors"
                  >
                    Release
                  </button>
                )}

                {pc.status === 'maintenance' && canAddOrRemove && (
                  <button
                    onClick={() => {
                      if (handleMaintenanceConfirmation(pc, false)) {
                        handleMaintenance(pc.id, false);
                      }
                    }}
                    className="flex-1 px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Mark Available
                  </button>
                )}
              </div>
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
           onAssign={async (assignedTo, assignedToEmail, notes, softwareUsed) => {
              const userId = currentUser?.id || currentUser?.userId;
              if (!userId) {
                alert('Error: Unable to identify current user. Please log in again.');
                return;
              }
              try {
                await assignPC(selectedPC.id, userId, assignedTo, assignedToEmail, notes, softwareUsed);
                setShowAssignModal(false);
                setSelectedPC(null);
                fetchPCs();
              } catch (error: any) {
                const errorMsg = error?.response?.data?.error || error?.message || 'Failed to assign PC';
                alert(`Assignment failed: ${errorMsg}`);
              }
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
