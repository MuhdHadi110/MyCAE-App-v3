import { useEffect, useState } from 'react';
import { Plus, Wrench, Edit2, Trash2, X, Calendar, AlertTriangle, CheckCircle, PlayCircle } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { NewMaintenanceTicketModal } from '../components/modals/NewMaintenanceTicketModal';
import { AddScheduledMaintenanceModal } from '../components/modals/AddScheduledMaintenanceModal';
import { useMaintenanceStore } from '../store/maintenanceStore';
import { useScheduledMaintenanceStore } from '../store/scheduledMaintenanceStore';
import { formatDate } from '../lib/utils';
import { useResponsive } from '../hooks/useResponsive';
import toast from 'react-hot-toast';
import type { MaintenanceTicket } from '../types/maintenance.types';
import type { ScheduledMaintenance } from '../types/scheduledMaintenance.types';
import { maintenanceTypeLabels, inventoryActionLabels } from '../types/scheduledMaintenance.types';

export const MaintenanceScreen: React.FC = () => {
  const { filteredTickets, fetchMaintenance, loading, stats, updateTicket, deleteTicket } = useMaintenanceStore();
  const {
    schedules,
    stats: scheduledStats,
    loading: scheduledLoading,
    fetchSchedules,
    fetchStats: fetchScheduledStats,
    deleteSchedule,
    markCompleted,
    createTicketFromSchedule,
  } = useScheduledMaintenanceStore();
  const { isMobile } = useResponsive();
  const [activeTab, setActiveTab] = useState<'ongoing' | 'completed' | 'scheduled'>('ongoing');
  const [showNewTicketModal, setShowNewTicketModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<MaintenanceTicket | null>(null);
  const [editingSchedule, setEditingSchedule] = useState<ScheduledMaintenance | null>(null);
  const [completedSchedules, setCompletedSchedules] = useState<ScheduledMaintenance[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    ticketId?: string;
    scheduleId?: string;
    type?: 'ticket' | 'schedule';
  }>({ isOpen: false });

  const fetchCompletedSchedules = async () => {
    try {
      const firstOfMonth = new Date();
      firstOfMonth.setDate(1);
      firstOfMonth.setHours(0, 0, 0, 0);

      const response = await (await import('../services/http-client')).httpClient.api.get('/scheduled-maintenance', {
        params: {
          is_completed: true,
          from_date: firstOfMonth.toISOString(),
        }
      });
      setCompletedSchedules(response.data);
    } catch (error) {
      console.error('Failed to fetch completed schedules:', error);
    }
  };

  useEffect(() => {
    fetchMaintenance();
    fetchSchedules({ is_completed: false });
    fetchScheduledStats();

    if (activeTab === 'completed') {
      fetchCompletedSchedules();
    }
  }, [activeTab]);

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'warning' | 'info' | 'success' | 'default'> = {
      'open': 'warning',
      'in-progress': 'info',
      'resolved': 'success',
      'closed': 'default',
    };
    const labels: Record<string, string> = {
      'open': 'Open',
      'in-progress': 'In Progress',
      'resolved': 'Resolved',
      'closed': 'Closed',
    };
    return <Badge variant={variants[status] || 'default'}>{labels[status] || status}</Badge>;
  };

  const getPriorityBadge = (priority: string) => {
    const variants: Record<string, 'danger' | 'warning' | 'info' | 'default'> = {
      'critical': 'danger',
      'high': 'warning',
      'medium': 'info',
      'low': 'default',
    };
    const labels: Record<string, string> = {
      'critical': 'Critical',
      'high': 'High',
      'medium': 'Medium',
      'low': 'Low',
    };
    return <Badge variant={variants[priority] || 'default'} size="sm">{labels[priority] || priority}</Badge>;
  };

  const handleEditClick = (ticket: MaintenanceTicket) => {
    setSelectedTicket(ticket);
    setShowEditModal(true);
  };

  const handleDeleteClick = (ticketId: string) => {
    setConfirmDialog({
      isOpen: true,
      ticketId,
      type: 'ticket',
    });
  };

  const handleDeleteScheduleClick = (scheduleId: string) => {
    setConfirmDialog({
      isOpen: true,
      scheduleId,
      type: 'schedule',
    });
  };

  const confirmDelete = async () => {
    try {
      if (confirmDialog.type === 'ticket' && confirmDialog.ticketId) {
        await deleteTicket(confirmDialog.ticketId);
        toast.success('Ticket deleted successfully');
        fetchMaintenance();
      } else if (confirmDialog.type === 'schedule' && confirmDialog.scheduleId) {
        await deleteSchedule(confirmDialog.scheduleId);
        toast.success('Scheduled maintenance deleted');
        fetchSchedules({ is_completed: false });
        fetchScheduledStats();
      }
      setConfirmDialog({ isOpen: false });
    } catch {
      toast.error(`Failed to delete ${confirmDialog.type}`);
    }
  };

  const handleEditSchedule = (schedule: ScheduledMaintenance) => {
    setEditingSchedule(schedule);
    setShowScheduleModal(true);
  };

  const handleMarkCompleted = async (scheduleId: string) => {
    try {
      await markCompleted(scheduleId);
      toast.success('Maintenance marked as completed');
      fetchSchedules({ is_completed: false });
      fetchScheduledStats();
    } catch {
      toast.error('Failed to mark as completed');
    }
  };

  const handleCreateTicket = async (scheduleId: string) => {
    try {
      await createTicketFromSchedule(scheduleId);
      toast.success('Maintenance ticket created');
      fetchMaintenance();
      fetchSchedules({ is_completed: false });
    } catch {
      toast.error('Failed to create ticket');
    }
  };

  const handleViewLinkedTicket = (scheduleId: string) => {
    const schedule = schedules.find(s => s.id === scheduleId);
    if (schedule?.ticket_id) {
      const ticket = filteredTickets.find(t => t.id === schedule.ticket_id);
      if (ticket) {
        const isCompleted = ticket.status === 'resolved' || ticket.status === 'closed';
        setActiveTab(isCompleted ? 'completed' : 'ongoing');
        toast.success(`Switched to ${isCompleted ? 'Completed' : 'On-going'} tab`);
      }
    }
  };

  const handleViewLinkedSchedule = (ticketId: string) => {
    const ticket = filteredTickets.find(t => t.id === ticketId);
    if (ticket?.scheduledMaintenanceId) {
      setActiveTab('scheduled');
      toast.success('Switched to Scheduled tab');
    }
  };

  const getDaysUntil = (dateString: string): number => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const targetDate = new Date(dateString);
    targetDate.setHours(0, 0, 0, 0);
    const diffTime = targetDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const getScheduleUrgencyBadge = (dateString: string) => {
    const daysUntil = getDaysUntil(dateString);
    if (daysUntil < 0) {
      return <Badge variant="danger">{Math.abs(daysUntil)} days overdue</Badge>;
    } else if (daysUntil === 0) {
      return <Badge variant="danger">Due today</Badge>;
    } else if (daysUntil <= 7) {
      return <Badge variant="warning">{daysUntil} days left</Badge>;
    } else if (daysUntil <= 14) {
      return <Badge variant="info">{daysUntil} days left</Badge>;
    }
    return <Badge variant="success">{daysUntil} days left</Badge>;
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

  const filteredBySearch = (item: any) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    const title = (item.title || item.itemName || '').toLowerCase();
    const description = (item.description || '').toLowerCase();
    const itemTitle = (item.item?.title || '').toLowerCase();
    return title.includes(query) || description.includes(query) || itemTitle.includes(query);
  };

  const displayedTickets = filteredTickets
    .filter((ticket) =>
      activeTab === 'ongoing'
        ? ticket.status !== 'resolved' && ticket.status !== 'closed'
        : ticket.status === 'resolved' || ticket.status === 'closed'
    )
    .filter(filteredBySearch);

  const displayedCompletedSchedules = completedSchedules.filter(filteredBySearch);

  const displayedSchedules = schedules.filter(filteredBySearch);

  return (
    <div className="min-h-full bg-gray-50">
      <div className="p-4 md:p-6  space-y-6">
        {/* Header Container */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Maintenance</h1>
              <p className="text-gray-600 mt-1">
                {stats?.pending || 0} on-going, {stats?.completed || 0} completed
                {scheduledStats && `, ${scheduledStats.total} scheduled`}
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => {
                  setEditingSchedule(null);
                  setShowScheduleModal(true);
                }}
                variant="outline"
                icon={<Calendar className="w-5 h-5" />}
                size={isMobile ? 'md' : 'lg'}
              >
                Schedule
              </Button>
              <Button
                onClick={() => setShowNewTicketModal(true)}
                icon={<Plus className="w-5 h-5" />}
                size={isMobile ? 'md' : 'lg'}
              >
                New Ticket
              </Button>
            </div>
          </div>
        </div>

        {/* Maintenance Stats Cards (visible on all tabs) */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                <Wrench className="w-5 h-5 text-amber-600" />
              </div>
            </div>
            <div className="text-sm font-medium text-gray-600">On-going</div>
            <div className="text-2xl font-bold text-gray-900">{stats?.pending || 0}</div>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-blue-600" />
              </div>
            </div>
            <div className="text-sm font-medium text-gray-600">Scheduled</div>
            <div className="text-2xl font-bold text-gray-900">{scheduledStats?.total || 0}</div>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
            </div>
            <div className="text-sm font-medium text-gray-600">Overdue</div>
            <div className="text-2xl font-bold text-gray-900">{scheduledStats?.overdue || 0}</div>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
            </div>
            <div className="text-sm font-medium text-gray-600">Completed This Month</div>
            <div className="text-2xl font-bold text-gray-900">{scheduledStats?.completedThisMonth || 0}</div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <input
            type="text"
            placeholder="Search by title, description, or item name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('ongoing')}
            className={`px-4 py-2 font-medium transition-colors relative ${
              activeTab === 'ongoing'
                ? 'text-primary-600 border-b-2 border-primary-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            On-going
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
          <button
            onClick={() => setActiveTab('scheduled')}
            className={`px-4 py-2 font-medium transition-colors relative ${
              activeTab === 'scheduled'
                ? 'text-primary-600 border-b-2 border-primary-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Scheduled
            {scheduledStats && (scheduledStats.upcoming > 0 || scheduledStats.overdue > 0) && (
              <span className={`ml-2 px-2 py-0.5 text-xs rounded-full ${
                scheduledStats.overdue > 0
                  ? 'bg-red-100 text-red-700'
                  : 'bg-amber-100 text-amber-700'
              }`}>
                {scheduledStats.overdue > 0 ? scheduledStats.overdue : scheduledStats.upcoming}
              </span>
            )}
          </button>
        </div>

        {/* Loading State */}
        {(loading || scheduledLoading) && (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        )}

        {/* Maintenance Tickets (Pending/Completed tabs) */}
        {!loading && activeTab !== 'scheduled' && displayedTickets.length > 0 && (
          <div className="space-y-3">
          {displayedTickets.map((ticket) => (
            <Card key={ticket.id} variant="bordered" padding="md" className="hover:shadow-md transition-shadow cursor-pointer">
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-start gap-2 mb-2">
                    <h3 className="font-semibold text-gray-900 flex-1">{ticket.title}</h3>
                    {getPriorityBadge(ticket.priority)}
                    {ticket.scheduledMaintenanceId && (
                      <Badge variant="info" size="sm">
                        <Calendar className="w-3 h-3 inline mr-1" />
                        From Schedule
                      </Badge>
                    )}
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
                    {ticket.scheduledMaintenanceId && (
                      <button
                        onClick={() => handleViewLinkedSchedule(ticket.id)}
                        className="p-2 text-purple-600 hover:bg-purple-50 rounded transition-colors"
                        title="View linked schedule"
                      >
                        <Calendar className="w-4 h-4" />
                      </button>
                    )}
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

        {/* Completed Schedules (on Completed tab) */}
        {!scheduledLoading && activeTab === 'completed' && displayedCompletedSchedules.length > 0 && (
          <div className="space-y-3">
            {displayedCompletedSchedules.map((schedule) => (
              <Card key={`schedule-${schedule.id}`} variant="bordered" padding="md" className="hover:shadow-md transition-shadow">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-start gap-2 mb-2">
                      <h3 className="font-semibold text-gray-900 flex-1">
                        {schedule.item?.title || 'Unknown Item'} - {maintenanceTypeLabels[schedule.maintenance_type]}
                      </h3>
                      <Badge variant="success">Completed</Badge>
                    </div>
                    {schedule.description && (
                      <p className="text-sm text-gray-700 line-clamp-2">{schedule.description}</p>
                    )}
                    <div className="flex flex-wrap items-center gap-3 mt-3 text-xs text-gray-500">
                      <span>Scheduled: {formatDate(schedule.scheduled_date)}</span>
                      {schedule.completed_date && <span>Completed: {formatDate(schedule.completed_date)}</span>}
                      {schedule.ticket_id && (
                        <Badge variant="info" size="sm">
                          Ticket #{schedule.ticket_id.slice(0, 8)}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Scheduled Maintenance List */}
        {!scheduledLoading && activeTab === 'scheduled' && displayedSchedules.length > 0 && (
          <div className="space-y-3">
            {displayedSchedules.map((schedule) => (
              <Card key={schedule.id} variant="bordered" padding="md" className="hover:shadow-md transition-shadow">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-start gap-2 mb-2">
                      <h3 className="font-semibold text-gray-900 flex-1">
                        {schedule.item?.title || 'Unknown Item'}
                      </h3>
                      {getScheduleUrgencyBadge(schedule.scheduled_date)}
                    </div>
                    <div className="flex flex-wrap gap-2 mb-2">
                      <Badge variant="info" size="sm">
                        {maintenanceTypeLabels[schedule.maintenance_type]}
                      </Badge>
                      <Badge variant="default" size="sm">
                        {inventoryActionLabels[schedule.inventory_action]}
                      </Badge>
                      {schedule.ticket_id && (
                        <Badge variant="success" size="sm">Ticket Created</Badge>
                      )}
                    </div>
                    {schedule.description && (
                      <p className="text-sm text-gray-700 line-clamp-2">{schedule.description}</p>
                    )}
                    <div className="flex flex-wrap items-center gap-3 mt-3 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDate(schedule.scheduled_date)}
                      </span>
                      {schedule.item?.sku && (
                        <span>SKU: {schedule.item.sku}</span>
                      )}
                      {schedule.inventory_action === 'deduct' && (
                        <span>Qty: {schedule.quantity_affected}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex md:flex-col items-center gap-2">
                    <div className="flex gap-1">
                      {!schedule.ticket_id ? (
                        <button
                          onClick={() => handleCreateTicket(schedule.id)}
                          className="p-2 text-amber-600 hover:bg-amber-50 rounded transition-colors"
                          title="Create maintenance ticket"
                        >
                          <PlayCircle className="w-4 h-4" />
                        </button>
                      ) : (
                        <button
                          onClick={() => handleViewLinkedTicket(schedule.id)}
                          className="p-2 text-green-600 hover:bg-green-50 rounded transition-colors"
                          title="View linked ticket"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </button>
                      )}
                      {schedule.ticket_id ? (
                        <button
                          disabled
                          className="p-2 text-gray-400 cursor-not-allowed rounded"
                          title="Complete by resolving the linked ticket"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </button>
                      ) : (
                        <button
                          onClick={() => handleMarkCompleted(schedule.id)}
                          className="p-2 text-green-600 hover:bg-green-50 rounded transition-colors"
                          title="Mark as completed"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => handleEditSchedule(schedule)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                        title="Edit schedule"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteScheduleClick(schedule.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                        title="Delete schedule"
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

        {/* Empty State for Ongoing/Completed Tabs */}
        {!loading && activeTab !== 'scheduled' && displayedTickets.length === 0 && (
          <>
            {displayedCompletedSchedules.length === 0 && (
              <Card variant="bordered">
              <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                <Wrench className="w-16 h-16 mb-4 opacity-50" />
                {searchQuery ? (
                  <>
                    <p className="text-lg font-medium mb-2">No results found</p>
                    <p className="text-sm">Try adjusting your search query</p>
                  </>
                ) : (
                  <>
                    <p className="text-lg font-medium mb-2">No {activeTab} tickets</p>
                    <p className="text-sm">Create a new maintenance ticket to get started</p>
                  </>
                )}
              </div>
              </Card>
            )}
          </>
        )}

        {/* Empty State for Scheduled */}
        {!scheduledLoading && activeTab === 'scheduled' && displayedSchedules.length === 0 && (
          <Card variant="bordered">
          <div className="flex flex-col items-center justify-center py-12 text-gray-500">
            <Calendar className="w-16 h-16 mb-4 opacity-50" />
            {searchQuery ? (
              <>
                <p className="text-lg font-medium mb-2">No scheduled maintenance found</p>
                <p className="text-sm mb-4">Try adjusting your search query</p>
              </>
            ) : (
              <>
                <p className="text-lg font-medium mb-2">No scheduled maintenance</p>
                <p className="text-sm mb-4">Schedule equipment maintenance, calibrations, or inspections</p>
              </>
            )}
            {!searchQuery && (
              <Button
                onClick={() => {
                  setEditingSchedule(null);
                  setShowScheduleModal(true);
                }}
                icon={<Plus className="w-5 h-5" />}
              >
                Schedule Maintenance
              </Button>
            )}
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

      {/* New/Edit Maintenance Ticket Modal */}
      <NewMaintenanceTicketModal
        isOpen={showNewTicketModal || showEditModal}
        onClose={() => {
          setShowNewTicketModal(false);
          setShowEditModal(false);
          setSelectedTicket(null);
          fetchMaintenance();
        }}
        editingTicket={selectedTicket || undefined}
      />

      {/* Schedule Maintenance Modal */}
      <AddScheduledMaintenanceModal
        isOpen={showScheduleModal}
        onClose={() => {
          setShowScheduleModal(false);
          setEditingSchedule(null);
          fetchSchedules({ is_completed: false });
          fetchScheduledStats();
        }}
        editingSchedule={editingSchedule}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog({ isOpen: false })}
        onConfirm={confirmDelete}
        title={confirmDialog.type === 'schedule' ? 'Delete Scheduled Maintenance' : 'Delete Maintenance Ticket'}
        message={
          confirmDialog.type === 'schedule'
            ? 'Are you sure you want to delete this scheduled maintenance? This action cannot be undone.'
            : 'Are you sure you want to delete this ticket? This action cannot be undone.'
        }
        variant="danger"
        confirmText="Delete"
        cancelText="Cancel"
      />
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
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
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
                <option value="open">Open</option>
                <option value="in-progress">In Progress</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
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
