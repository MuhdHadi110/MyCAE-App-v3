import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, Package, Search, Clock } from 'lucide-react';
import { SelectItemModal } from './SelectItemModal';
import type { InventoryItem } from '../../types/inventory.types';

interface ItemSelectorDropdownProps {
  items: InventoryItem[];
  selectedItemId?: string;
  onSelect: (item: InventoryItem) => void;
  placeholder?: string;
  disabled?: boolean;
  label?: string;
  required?: boolean;
  error?: string;
  storageKey?: string; // For storing recent items
}

const RECENT_ITEMS_KEY = 'recent-selected-items';
const MAX_RECENT_ITEMS = 5;

export const ItemSelectorDropdown: React.FC<ItemSelectorDropdownProps> = ({
  items,
  selectedItemId,
  onSelect,
  placeholder = 'Select equipment...',
  disabled = false,
  label,
  required = false,
  error,
  storageKey = RECENT_ITEMS_KEY,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [recentItemIds, setRecentItemIds] = useState<string[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Load recent items from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setRecentItemIds(parsed);
        }
      } catch {
        // Invalid JSON, ignore
      }
    }
  }, [storageKey]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Get recent items from IDs
  const recentItems = recentItemIds
    .map((id) => items.find((item) => item.id === id))
    .filter(Boolean) as InventoryItem[];

  // Get selected item
  const selectedItem = selectedItemId ? items.find((i) => i.id === selectedItemId) : null;

  // Save recent item to localStorage
  const saveRecentItem = (itemId: string) => {
    setRecentItemIds((prev) => {
      // Remove if already exists, add to front, limit to MAX_RECENT_ITEMS
      const filtered = prev.filter((id) => id !== itemId);
      const updated = [itemId, ...filtered].slice(0, MAX_RECENT_ITEMS);
      localStorage.setItem(storageKey, JSON.stringify(updated));
      return updated;
    });
  };

  const handleSelect = (item: InventoryItem) => {
    onSelect(item);
    saveRecentItem(item.id);
    setIsOpen(false);
  };

  const handleBrowseAll = () => {
    setIsOpen(false);
    setShowModal(true);
  };

  const handleModalSelect = (item: InventoryItem) => {
    onSelect(item);
    saveRecentItem(item.id);
    setShowModal(false);
  };

  return (
    <>
      <div ref={dropdownRef} className="relative">
        {label && (
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            {label}
            {required && <span className="text-red-500">*</span>}
          </label>
        )}

        {/* Dropdown Trigger */}
        <button
          type="button"
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
          className={`w-full px-4 py-2.5 border rounded-xl text-left flex items-center justify-between transition-all ${
            error
              ? 'border-red-300 focus:ring-2 focus:ring-red-500 focus:border-transparent'
              : 'border-gray-200 focus:ring-2 focus:ring-primary-500 focus:border-transparent'
          } ${disabled ? 'bg-gray-50 cursor-not-allowed' : 'bg-white hover:border-gray-300'}`}
        >
          <div className="flex items-center gap-2 overflow-hidden">
            <Package className="w-5 h-5 text-gray-400 flex-shrink-0" />
            {selectedItem ? (
              <span className="truncate">
                {selectedItem.title} ({selectedItem.sku})
              </span>
            ) : (
              <span className="text-gray-400">{placeholder}</span>
            )}
          </div>
          <ChevronDown
            className={`w-5 h-5 text-gray-400 flex-shrink-0 transition-transform ${
              isOpen ? 'rotate-180' : ''
            }`}
          />
        </button>

        {error && <p className="mt-1 text-sm text-red-600">{error}</p>}

        {/* Dropdown Menu */}
        {isOpen && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
            {/* Recent Items */}
            {recentItems.length > 0 && (
              <div className="p-2">
                <div className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-gray-500">
                  <Clock className="w-4 h-4" />
                  Recent Items
                </div>
                <div className="space-y-1">
                  {recentItems.slice(0, 5).map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleSelect(item)}
                      className={`w-full px-3 py-2 text-left rounded-lg hover:bg-gray-50 transition-colors ${
                        selectedItemId === item.id ? 'bg-primary-50 text-primary-700' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium truncate">{item.title}</span>
                        <span className="text-xs text-gray-500 ml-2">{item.category}</span>
                      </div>
                      <div className="text-xs text-gray-400">{item.sku} • {item.location}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Divider */}
            {recentItems.length > 0 && (
              <div className="border-t border-gray-100" />
            )}

            {/* Browse All Button */}
            <button
              type="button"
              onClick={handleBrowseAll}
              className="w-full px-4 py-3 text-left flex items-center gap-3 hover:bg-gray-50 transition-colors text-primary-600 font-medium"
            >
              <Search className="w-5 h-5" />
              <div>
                <div>Browse All Equipment...</div>
                <div className="text-xs text-gray-500 font-normal">
                  Search and filter all {items.length} items
                </div>
              </div>
            </button>
          </div>
        )}
      </div>

      {/* Full Item Picker Modal */}
      <SelectItemModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSelect={handleModalSelect}
        items={items}
      />
    </>
  );
};
