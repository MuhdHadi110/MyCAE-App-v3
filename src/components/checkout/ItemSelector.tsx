import React, { useState, useMemo } from 'react';
import { Search, Filter, CheckSquare, Square, Package } from 'lucide-react';
import { Input } from '../ui/Input';
import type { InventoryItem } from '../../types/inventory.types';

interface ItemSelectorProps {
  items: InventoryItem[];
  selectedItems: InventoryItem[];
  onSelectItems: (items: InventoryItem[]) => void;
  onClose: () => void;
}

export const ItemSelector: React.FC<ItemSelectorProps> = ({
  items,
  selectedItems,
  onSelectItems,
  onClose,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Get unique categories and locations for filters
  const categories = useMemo(() => {
    const cats = new Set(items.map((item) => item.category));
    return Array.from(cats).sort();
  }, [items]);

  const locations = useMemo(() => {
    const locs = new Set(items.map((item) => item.location));
    return Array.from(locs).sort();
  }, [items]);

  // Filter items
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesSearch =
        !searchTerm ||
        item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.barcode && item.barcode.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesCategory = !categoryFilter || item.category === categoryFilter;
      const matchesLocation = !locationFilter || item.location === locationFilter;
      const matchesStatus = !statusFilter || item.status === statusFilter;

      return matchesSearch && matchesCategory && matchesLocation && matchesStatus;
    });
  }, [items, searchTerm, categoryFilter, locationFilter, statusFilter]);

  const isSelected = (item: InventoryItem) => {
    return selectedItems.some((selected) => selected.id === item.id);
  };

  const toggleItem = (item: InventoryItem) => {
    if (isSelected(item)) {
      onSelectItems(selectedItems.filter((i) => i.id !== item.id));
    } else {
      onSelectItems([...selectedItems, item]);
    }
  };

  const selectAll = () => {
    const currentIds = new Set(selectedItems.map((i) => i.id));
    const newItems = filteredItems.filter((item) => !currentIds.has(item.id));
    onSelectItems([...selectedItems, ...newItems]);
  };

  const clearSelection = () => {
    const filteredIds = new Set(filteredItems.map((i) => i.id));
    onSelectItems(selectedItems.filter((item) => !filteredIds.has(item.id)));
  };

  const allSelected = filteredItems.length > 0 && filteredItems.every((item) => isSelected(item));

  return (
    <div className="space-y-4">
      {/* Search and Filters */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <Input
            type="text"
            placeholder="Search by name, SKU, or barcode..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="grid grid-cols-3 gap-2">
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
            <option value="Checked Out">Checked Out</option>
            <option value="Inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* Selection Controls */}
      <div className="flex items-center justify-between py-2 border-b border-gray-200">
        <div className="flex items-center gap-4">
          <button
            onClick={allSelected ? clearSelection : selectAll}
            className="flex items-center gap-2 text-sm text-primary-600 hover:text-primary-700 font-medium"
          >
            {allSelected ? (
              <>
                <CheckSquare className="w-4 h-4" />
                Clear Selection
              </>
            ) : (
              <>
                <Square className="w-4 h-4" />
                Select All ({filteredItems.length})
              </>
            )}
          </button>
        </div>
        <span className="text-sm text-gray-600">
          <span className="font-semibold text-gray-900">{selectedItems.length}</span> items selected
        </span>
      </div>

      {/* Items List */}
      <div className="border border-gray-200 rounded-lg overflow-hidden max-h-[400px] overflow-y-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 sticky top-0">
            <tr>
              <th className="px-4 py-3 text-left w-10"></th>
              <th className="px-4 py-3 text-left font-medium text-gray-700">Item</th>
              <th className="px-4 py-3 text-left font-medium text-gray-700">SKU</th>
              <th className="px-4 py-3 text-left font-medium text-gray-700">Category</th>
              <th className="px-4 py-3 text-left font-medium text-gray-700">Location</th>
              <th className="px-4 py-3 text-left font-medium text-gray-700">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredItems.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                  <div className="flex flex-col items-center gap-2">
                    <Package className="w-8 h-8 text-gray-300" />
                    <p>No items found</p>
                  </div>
                </td>
              </tr>
            ) : (
              filteredItems.map((item) => (
                <tr
                  key={item.id}
                  onClick={() => toggleItem(item)}
                  className={`hover:bg-gray-50 cursor-pointer transition-colors ${
                    isSelected(item) ? 'bg-primary-50' : ''
                  }`}
                >
                  <td className="px-4 py-3">
                    <div
                      className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                        isSelected(item)
                          ? 'bg-primary-600 border-primary-600'
                          : 'border-gray-300'
                      }`}
                    >
                      {isSelected(item) && (
                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-medium text-gray-900">{item.title}</p>
                      {item.supplier && (
                        <p className="text-xs text-gray-500">{item.supplier}</p>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 font-mono text-gray-600">{item.sku}</td>
                  <td className="px-4 py-3 text-gray-600">{item.category}</td>
                  <td className="px-4 py-3 text-gray-600">{item.location}</td>
              <td className="px-4 py-3">
                <span
                  className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${
                    ['Active', 'active', 'Available', 'available'].includes(item.status)
                      ? 'bg-green-100 text-green-800'
                      : item.status === 'Inactive'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {item.status}
                </span>
              </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
        <button
          onClick={onClose}
          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={onClose}
          disabled={selectedItems.length === 0}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Continue ({selectedItems.length} items)
        </button>
      </div>
    </div>
  );
};
