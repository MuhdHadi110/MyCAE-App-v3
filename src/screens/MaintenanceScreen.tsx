import { useEffect, useState } from 'react';
import { Plus, Wrench, Edit2, Trash2, X } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { NewMaintenanceTicketModal } from '../components/modals/NewMaintenanceTicketModal';
import { useMaintenanceStore } from '../store/maintenanceStore';
import { formatDate } from '../lib/utils';
import { useResponsive } from '../hooks/useResponsive';
import toast from 'react-hot-toast';
import type { MaintenanceTicket } from '../types/maintenance.types';

export const MaintenanceScreen: React.FC = () => {
  const { filteredTickets, fetchMaintenance, loading, stats, updateTicket, deleteTicket } = useMaintenanceStore();
  const { isMobile } = useResponsive();
  const [activeTab, setActiveTab] = useState<'pending' | 'completed'>('pending');
  const [showNewTicketModal, setShowNewTicketModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<MaintenanceTicket | null>(null);

  useEffect(() => {
    fetchMaintenance();
  }, []);

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'warning' | 'info' | 'success' | 'default'> = {
      Pending: 'warning',
      'In Progress': 'info',
      Completed: 'success',
      Cancelled: 'default',
    };
    return <Badge variant={variants[status] || 'default'}>{status}</Badge>;
  };

  const getPriorityBadge = (priority: string) => {
    const variants: Record<string, 'danger' | 'warning' | 'info' | 'default'> = {
      Urgent: 'danger',
      High: 'warning',
      Medium: 'info',
      Low: 'default',
    };
    return <Badge variant={variants[priority] || 'default'} size="sm">{priority}</Badge>;
  };

  const handleEditClick = (ticket: MaintenanceTicket) => {
    setSelectedTicket(ticket);
    setShowEditModal(true);
  };

  const handleDeleteClick = (ticketId: string) => {
    if (confirm('Are you sure you want to delete this ticket?')) {
      deleteTicket(ticketId).then(() => {
        toast.success('Ticket deleted successfully');
        fetchMaintenance();
      }).catch(() => {
        toast.error('Failed to delete ticket');
      });
    }
  };

  const handleEditSubmit = async (updates: Partial<MaintenanceTicket>) => {
    if (!selectedTicket) return;
    try {
      await updateTicket(selectedTicket.id, updates);
      toast.success('Ticket updated successfully');
      setShowEditModal(false);
      setSelectedTicket(null);
      await fetchMaintenance();
    } catch (error) {
      toast.error('Failed to update ticket');
    }
  };

  const displayedTickets = filteredTickets.filter((ticket) =>
    activeTab === 'pending' ? ticket.status !== 'Completed' : ticket.status === 'Completed'
  );

  return (
    <div className="min-h-full bg-gray-50">
      <div className="p-4 md:p-6  space-y-6">
        {/* Header Container */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Maintenance</h1>
              <p className="text-gray-600 mt-1">
                {stats?.pending || 0} pending, {stats?.completed || 0} completed
              </p>
            </div>
            <Button
              onClick={() => setShowNewTicketModal(true)}
              icon={<Plus className="w-5 h-5" />}
              size={isMobile ? 'md' : 'lg'}
            >
              New Ticket
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('pending')}
            className={`px-4 py-2 font-medium transition-colors relative ${
              activeTab === 'pending'
                ? 'text-primary-600 border-b-2 border-primary-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Pending
            {stats && stats.pending > 0 && (
              <span className="ml-2 px-2 py-0.5 text-xs bg-primary-100 text-primary-700 rounded-full">
                {stats.pending}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('completed')}
            className={`px-4 py-2 font-medium transition-colors relative ${
              activeTab === 'completed'
                ? 'text-primary-600 border-b-2 border-primary-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Completed
            {stats && stats.completed > 0 && (
              <span className="ml-2 px-2 py-0.5 text-xs bg-gray-100 text-gray-700 rounded-full">
                {stats.completed}
              </span>
            )}
          </button>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        )}

        {/* Maintenance Tickets */}
        {!loading && (
          <div className="space-y-3">
          {displayedTickets.map((ticket) => (
            <Card key={ticket.id} variant="bordered" padding="md" className="hover:shadow-md transition-shadow cursor-pointer">
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-start gap-2 mb-2">
                    <h3 className="font-semibold text-gray-900 flex-1">{ticket.title}</h3>
                    {getPriorityBadge(ticket.priority)}
                  </div>
                  {ticket.itemName && (
                    <p className="text-sm text-gray-600 mb-2">Item: {ticket.itemName}</p>
                  )}
                  <p className="text-sm text-gray-700 line-clamp-2">{ticket.description}</p>
                  <div className="flex flex-wrap items-center gap-3 mt-3 text-xs text-gray-500">
                    <span>Created: {formatDate(ticket.createdDate)}</span>
                    {ticket.assignedTo && <span>Assigned to: {ticket.assignedTo}</span>}
                    {ticket.completedDate && <span>Completed: {formatDate(ticket.completedDate)}</span>}
                  </div>
                </div>
                <div className="flex md:flex-col items-center md:items-end gap-2">
                  {getStatusBadge(ticket.status)}
                  <div className="flex gap-2 mt-2 md:mt-0">
                    <button
                      onClick={() => handleEditClick(ticket)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                      title="Edit ticket"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteClick(ticket.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                      title="Delete ticket"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && displayedTickets.length === 0 && (
          <Card variant="bordered">
          <div className="flex flex-col items-center justify-center py-12 text-gray-500">
            <Wrench className="w-16 h-16 mb-4 opacity-50" />
            <p className="text-lg font-medium mb-2">No {activeTab} tickets</p>
            <p className="text-sm">Create a new maintenance ticket to get started</p>
          </div>
          </Card>
        )}

        {/* Floating Action Button (Mobile) */}
        {isMobile && (
          <button
            onClick={() => setShowNewTicketModal(true)}
            className="fixed bottom-20 right-4 w-14 h-14 bg-primary-600 text-white rounded-full shadow-lg hover:bg-primary-700 transition-colors flex items-center justify-center z-30"
            title="Create new maintenance ticket"
          >
            <Plus className="w-6 h-6" />
          </button>
        )}
      </div>

      {/* New Maintenance Ticket Modal */}
      <NewMaintenanceTicketModal
        isOpen={showNewTicketModal}
        onClose={() => setShowNewTicketModal(false)}
      />

      {/* Edit Maintenance Ticket Modal */}
      {showEditModal && selectedTicket && (
        <EditMaintenanceTicketModal
          ticket={selectedTicket}
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setSelectedTicket(null);
          }}
          onSave={handleEditSubmit}
        />
      )}
    </div>
  );
};

interface EditMaintenanceTicketModalProps {
  ticket: MaintenanceTicket;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updates: Partial<MaintenanceTicket>) => Promise<void>;
}

const EditMaintenanceTicketModal: React.FC<EditMaintenanceTicketModalProps> = ({
  ticket,
  isOpen,
  onClose,
  onSave,
}) => {
  const [formData, setFormData] = useState({
    title: ticket.title,
    description: ticket.description,
    priority: ticket.priority,
    status: ticket.status,
    itemName: ticket.itemName || '',
    assignedTo: ticket.assignedTo || '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSave(formData);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-blue-100">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Edit Maintenance Ticket</h2>
            <p className="text-sm text-gray-600 mt-1">Update ticket details</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Title *</label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Ticket title"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Description *</label>
            <textarea
              required
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={4}
              placeholder="Describe the maintenance issue..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Priority *</label>
              <select
                required
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Urgent">Urgent</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status *</label>
              <select
                required
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="Pending">Pending</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Item Name</label>
            <input
              type="text"
              value={formData.itemName}
              onChange={(e) => setFormData({ ...formData, itemName: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., Laptop A, Server B"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Assigned To</label>
            <input
              type="text"
              value={formData.assignedTo}
              onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Staff name or ID"
            />
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
