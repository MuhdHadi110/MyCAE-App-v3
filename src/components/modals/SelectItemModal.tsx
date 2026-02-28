import React, { useState, useMemo } from 'react';
import { Search, Package, X } from 'lucide-react';
import { Modal } from '../ui/Modal';
import type { InventoryItem } from '../../types/inventory.types';

interface SelectItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (item: InventoryItem) => void;
  items: InventoryItem[];
  title?: string;
  description?: string;
}

export const SelectItemModal: React.FC<SelectItemModalProps> = ({
  isOpen,
  onClose,
  onSelect,
  items,
  title = 'Select Equipment',
  description = 'Choose an item from inventory',
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Get unique categories and locations for filters
  const categories = useMemo(() => {
    const cats = new Set(items.map(item => item.category).filter(Boolean));
    return Array.from(cats).sort();
  }, [items]);

  const locations = useMemo(() => {
    const locs = new Set(items.map(item => item.location).filter(Boolean));
    return Array.from(locs).sort();
  }, [items]);

  // Filter items based on search and filters
  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const matchesSearch = 
        !searchTerm ||
        item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.barcode?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesCategory = !categoryFilter || item.category === categoryFilter;
      const matchesLocation = !locationFilter || item.location === locationFilter;
      const matchesStatus = !statusFilter || item.status === statusFilter;

      return matchesSearch && matchesCategory && matchesLocation && matchesStatus;
    });
  }, [items, searchTerm, categoryFilter, locationFilter, statusFilter]);

  const handleSelect = (item: InventoryItem) => {
    onSelect(item);
    onClose();
  };

  const getStatusBadgeColor = (status: string) => {
    if (status === 'Available' || status === 'available' || status === 'Active') {
      return 'bg-green-100 text-green-800';
    } else if (status === 'Inactive') {
      return 'bg-yellow-100 text-yellow-800';
    } else {
      return 'bg-red-100 text-red-800';
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      description={description}
      icon={<Package className="w-5 h-5 text-primary-600" />}
      size="xl"
    >
      <div className="p-6 space-y-4">
        {/* Search and Filters */}
        <div className="space-y-3">
          {/* Search */}
          <div className="relative">
            <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name, SKU, or barcode..."
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              autoFocus
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Filter Dropdowns */}
          <div className="grid grid-cols-3 gap-3">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="">All Categories</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>

            <select
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="">All Locations</option>
              {locations.map((loc) => (
                <option key={loc} value={loc}>{loc}</option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="">All Status</option>
              <option value="Available">Available</option>
              <option value="Inactive">Inactive</option>
              <option value="Discontinued">Discontinued</option>
            </select>
          </div>
        </div>

        {/* Results Count */}
        <div className="text-sm text-gray-600">
          Showing {filteredItems.length} of {items.length} items
        </div>

        {/* Items Table */}
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <div className="max-h-[400px] overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">Item</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">SKU</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">Category</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">Location</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredItems.length > 0 ? (
                  filteredItems.map((item) => (
                    <tr
                      key={item.id}
                      onClick={() => handleSelect(item)}
                      className="hover:bg-primary-50 cursor-pointer transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium text-gray-900">{item.title}</p>
                          {item.supplier && (
                            <p className="text-xs text-gray-500">{item.supplier}</p>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-700">{item.sku || '-'}</td>
                      <td className="px-4 py-3 text-gray-700">{item.category}</td>
                      <td className="px-4 py-3 text-gray-700">{item.location || '-'}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getStatusBadgeColor(item.status)}`}>
                          {item.status === 'available' || item.status === 'Active' ? 'Available' : item.status}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                      <div className="flex flex-col items-center gap-2">
                        <Package className="w-8 h-8 text-gray-300" />
                        <p>No items match your search criteria</p>
                        <button
                          onClick={() => {
                            setSearchTerm('');
                            setCategoryFilter('');
                            setLocationFilter('');
                            setStatusFilter('');
                          }}
                          className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                        >
                          Clear all filters
                        </button>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Click hint */}
        <p className="text-xs text-gray-500 text-center">
          Click on a row to select the item
        </p>
      </div>
    </Modal>
  );
};
