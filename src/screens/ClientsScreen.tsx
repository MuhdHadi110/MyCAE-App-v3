import React, { useEffect, useState } from 'react';
import { Plus, Search, Building2, Mail, Phone, Edit, Trash2, Grid3x3, List as ListIcon, Tag } from 'lucide-react';
import { useClientStore } from '../store/clientStore';
import type { Client, ClientCategory } from '../types/client.types';
import { getCurrentUser } from '../lib/auth';
import { checkPermission, getPermissionMessage } from '../lib/permissions';
import { AddClientModal } from '../components/modals/AddClientModal';
import { toast } from 'react-hot-toast';

export const ClientsScreen: React.FC = () => {
  // 1. Destructure all required actions from the store
  const { clients, loading, error, fetchClients, addClient, updateClient, deleteClient } = useClientStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'card' | 'list'>(() => {
    return (localStorage.getItem('clientsViewMode') as 'card' | 'list') || 'card';
  });
  const [categoryFilter, setCategoryFilter] = useState<ClientCategory | 'all'>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);

  const currentUser = getCurrentUser();
  const canAdd = currentUser && checkPermission((currentUser.role || 'engineer') as any, 'canAddBusinessContact');

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  // 2. Update handlers to manage modal state and prepare for editing/adding
  const handleAddClient = () => {
    if (!canAdd) {
      toast.error(getPermissionMessage('add business contact', 'engineer'));
      return;
    }
    setEditingClient(null); // Ensure we are in "add" mode
    setShowAddModal(true);
  };

  const handleEditClient = (client: Client) => {
    if (!canAdd) {
      toast.error(getPermissionMessage('edit business contact', 'engineer'));
      return;
    }
    setEditingClient(client);
    setShowAddModal(true); // Open the same modal for editing
  };

  const handleDeleteClient = (clientId: string, clientName: string) => {
    if (!canAdd) {
      toast.error(getPermissionMessage('delete business contact', 'engineer'));
      return;
    }
    if (confirm(`Are you sure you want to delete ${clientName}?`)) {
      deleteClient(clientId);
      toast.success(`Client ${clientName} deleted successfully.`);
    }
  };

  // 3. Create a submit handler for the modal form
  const handleFormSubmit = (clientData: Omit<Client, 'id' | 'createdDate'>) => {
    try {
      if (editingClient) {
        updateClient(editingClient.id, clientData);
        toast.success(`Client "${clientData.name}" updated successfully.`);
      } else {
        addClient(clientData);
        toast.success(`Client "${clientData.name}" added successfully.`);
      }
      setShowAddModal(false);
      setEditingClient(null);
    } catch (error) {
      toast.error('An error occurred while saving the client.');
      console.error(error);
    }
  };

  const handleViewChange = (mode: 'card' | 'list') => {
    setViewMode(mode);
    localStorage.setItem('clientsViewMode', mode);
  };

  const getCategoryColor = (category: ClientCategory) => {
    switch (category) {
      case 'client':
        return 'bg-blue-100 text-blue-800';
      case 'customer':
        return 'bg-green-100 text-green-800';
      case 'vendor':
        return 'bg-purple-100 text-purple-800';
      case 'supplier':
        return 'bg-orange-100 text-orange-800';
    }
  };

  const getCategoryLabel = (category: ClientCategory) => {
    return category.charAt(0).toUpperCase() + category.slice(1);
  };

  const filteredClients = clients.filter((client) => {
    if (!client || !client.name) return false;

    const matchesSearch =
      searchTerm === '' ||
      client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.industry?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || (client.categories && client.categories.includes(categoryFilter as ClientCategory));
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-full bg-gray-50">
      <div className="p-4 md:p-6  space-y-6">
        {/* Error Alert */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
            <div className="text-red-600 font-medium">Error:</div>
            <div className="text-red-600 text-sm">{error}</div>
            <button
              onClick={() => fetchClients()}
              className="ml-auto text-red-600 hover:text-red-700 font-medium text-sm underline"
            >
              Retry
            </button>
          </div>
        )}

        {/* Header Container */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Business Contacts</h1>
              <p className="text-gray-600 mt-1">Manage your client relationships and contact information</p>
            </div>
            {canAdd && (
              <button
                onClick={handleAddClient}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Business Contact
              </button>
            )}
          </div>
        </div>

      {/* Search and Filter Controls */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 space-y-4">
        {/* Search Bar */}
        <div className="relative">
          <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by client name or industry..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>

        {/* Filter and View Toggle Row */}
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          {/* Category Filter */}
          <div className="flex items-center gap-2">
            <Tag className="w-4 h-4 text-gray-600" />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value as ClientCategory | 'all')}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="all">All Categories</option>
              <option value="client">Client</option>
              <option value="customer">Customer</option>
              <option value="vendor">Vendor</option>
              <option value="supplier">Supplier</option>
            </select>
          </div>

          {/* View Toggle */}
          <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => handleViewChange('card')}
              className={`p-2 rounded transition-all ${
                viewMode === 'card'
                  ? 'bg-white shadow text-primary-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              title="Card view"
            >
              <Grid3x3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleViewChange('list')}
              className={`p-2 rounded transition-all ${
                viewMode === 'list'
                  ? 'bg-white shadow text-primary-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              title="List view"
            >
              <ListIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="text-sm font-medium text-gray-600">Total Clients</div>
          <div className="text-3xl font-bold text-gray-900 mt-2">{clients.length}</div>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="text-sm font-medium text-gray-600">Active Projects</div>
          <div className="text-3xl font-bold text-green-600 mt-2">
            {clients.reduce((sum, c) => sum + c.activeProjects, 0)}
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="text-sm font-medium text-gray-600">Total Projects</div>
          <div className="text-3xl font-bold text-primary-600 mt-2">
            {clients.reduce((sum, c) => sum + c.totalProjects, 0)}
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <div className="inline-block">
            <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mt-4 mb-2">Loading clients...</h3>
          <p className="text-gray-600">Please wait while we fetch your business contacts</p>
        </div>
      )}

      {/* Clients View - Card or List */}
      {!loading && viewMode === 'card' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredClients.map((client) => (
            <div
              key={client.id}
              className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow"
            >
              <div className="p-6">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                    <Building2 className="w-6 h-6 text-primary-600" />
                  </div>
                  <div className="flex gap-2">
                    {canAdd && (
                      <button
                        onClick={() => handleEditClient(client)}
                        className="p-2 text-gray-400 hover:text-primary-600 transition-colors"
                        title="Edit client"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                    )}
                    {canAdd && (
                      <button
                        onClick={() => handleDeleteClient(client.id, client.name)}
                        className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                        title="Delete client"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Client Info */}
                <h3 className="text-lg font-semibold text-gray-900 mb-1">{client.name}</h3>
                {client.categories && client.categories.length > 0 && (
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    {client.categories.map((category) => (
                      <span key={category} className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(category)}`}>
                        {getCategoryLabel(category)}
                      </span>
                    ))}
                  </div>
                )}
                {client.industry && (
                  <p className="text-sm text-gray-600 mb-4">{client.industry}</p>
                )}

              {/* Contact Person */}
              <div className="space-y-2 mb-4">
                {client.contactPerson && (
                  <div className="text-sm">
                    <span className="text-gray-600">Contact:</span>
                    <span className="text-gray-900 ml-2 font-medium">{client.contactPerson}</span>
                  </div>
                )}
                {client.email && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Mail className="w-4 h-4" />
                    <a
                      href={`mailto:${client.email}`}
                      className="hover:text-primary-600 transition-colors truncate"
                    >
                      {client.email}
                    </a>
                  </div>
                )}
                {client.phone && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Phone className="w-4 h-4" />
                    <a
                      href={`tel:${client.phone}`}
                      className="hover:text-primary-600 transition-colors"
                    >
                      {client.phone}
                    </a>
                  </div>
                )}
              </div>

              {/* Projects Stats */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{client.activeProjects}</div>
                  <div className="text-xs text-gray-600">Active</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-600">{client.totalProjects}</div>
                  <div className="text-xs text-gray-600">Total</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-400">
                    {client.totalProjects - client.activeProjects}
                  </div>
                  <div className="text-xs text-gray-600">Completed</div>
                </div>
              </div>
            </div>
          </div>
        ))}
        </div>
      ) : (
        // List View
        <div className="bg-white rounded-lg shadow overflow-hidden" >
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Company
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Active
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredClients.map((client) => (
                  <tr key={client.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{client.name}</div>
                        <div className="text-sm text-gray-500">{client.industry || '-'}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {client.categories && client.categories.length > 0 ? (
                          client.categories.map((category) => (
                            <span key={category} className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(category)}`}>
                              {getCategoryLabel(category)}
                            </span>
                          ))
                        ) : (
                          <span className="text-gray-400 text-xs">No categories</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {client.contactPerson || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {client.email ? (
                        <a
                          href={`mailto:${client.email}`}
                          className="text-sm text-primary-600 hover:text-primary-900"
                        >
                          {client.email}
                        </a>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-green-600">{client.activeProjects}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{client.totalProjects}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex gap-2">
                        {canAdd && (
                          <button
                            onClick={() => handleEditClient(client)}
                            className="text-primary-600 hover:text-primary-900"
                            title="Edit client"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                        )}
                        {canAdd && (
                          <button
                            onClick={() => handleDeleteClient(client.id, client.name)}
                            className="text-red-600 hover:text-red-900"
                            title="Delete client"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!loading && filteredClients.length === 0 && (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No clients found</h3>
          <p className="text-gray-600 mb-4">
            {searchTerm
              ? 'Try adjusting your search criteria'
              : 'Get started by adding your first client'}
          </p>
          {!searchTerm && (
            <button
              onClick={handleAddClient} // Using the primary button style
              className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Business Contact
            </button>
          )}
        </div>
      )}

        {/* Add Client Modal */}
        <AddClientModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          onSubmit={handleFormSubmit}
          client={editingClient}
        />
      </div>
    </div>
  );
};