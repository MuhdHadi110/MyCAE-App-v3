import { useEffect, useState, useCallback, useMemo } from 'react';
import { Search, Plus, Filter, Package, Upload, ChevronUp, ChevronDown, Edit2, Trash2, X, ChevronsUpDown, LayoutGrid, List } from 'lucide-react';
import { Badge } from '../components/ui/Badge';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { BulkUploadModal } from '../components/modals/BulkUploadModal';
import { AddItemModal } from '../components/modals/AddItemModal';
import { GroupedInventoryRow } from '../components/inventory/GroupedInventoryRow';
import { SingleInventoryRow } from '../components/inventory/SingleInventoryRow';
import { useInventoryStore } from '../store/inventoryStore';
import { getCurrentUser } from '../lib/auth';
import { checkPermission, getPermissionMessage } from '../lib/permissions';
import { formatCurrency, formatDate } from '../lib/utils';
import { useResponsive } from '../hooks/useResponsive';
import { useCalibrationData } from '../hooks/useCalibrationData';
import { toast } from 'react-hot-toast';
import inventoryService from '../services/inventory.service';
import type { InventoryItem, GroupedInventoryItem } from '../types/inventory.types';

export const InventoryScreen: React.FC = () => {
  const { filteredItems: storeFilteredItems, filters, setFilters, fetchInventory, loading, viewMode, setViewMode } = useInventoryStore();
  const filteredItems = Array.isArray(storeFilteredItems) ? storeFilteredItems : [];
  const { isMobile } = useResponsive();

  const currentUser = getCurrentUser();
  const canAdd = currentUser && checkPermission(currentUser.role as any, 'canAddOrRemoveInventory');
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [stockFilter, setStockFilter] = useState('');
  const [sortColumn, setSortColumn] = useState<string>('title');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [showAddItem, setShowAddItem] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    itemId?: string;
    itemTitle?: string;
  }>({ isOpen: false });
  
  // Bulk import confirmation state
  const [bulkImportConfirm, setBulkImportConfirm] = useState<{
    isOpen: boolean;
    file?: File;
    itemCount?: number;
  }>({ isOpen: false });

  // Categories for filter dropdown
  const categories = [
    'Chassis',
    'Consumables',
    'Data Acquisition Module',
    'Dytran Impact Hammer',
    'Electronics',
    'Furniture',
    'Impulse Force Hammer',
    'IT Equipment',
    'Laptop',
    'Microphone',
    'Office Supplies',
    'Safety Equipment',
    'Sound Level Meter',
    'Tools & Equipment',
    'Triaxial Vibration Sensor',
    'Vibration Sensor',
    'Other',
  ];

  // Count active filters
  const activeFilterCount = [categoryFilter, statusFilter, stockFilter].filter(Boolean).length;

  // Apply local filters to items
  const displayedItems = useMemo(() => {
    const filtered = filteredItems.filter(item => {
      if (categoryFilter && item.category !== categoryFilter) return false;
      if (statusFilter && item.status !== statusFilter) return false;
      if (stockFilter === 'low' && item.quantity > item.minimumStock) return false;
      if (stockFilter === 'out' && item.quantity !== 0) return false;
      if (stockFilter === 'in' && item.quantity <= item.minimumStock) return false;
      return true;
    });

    return [...filtered].sort((a, b) => {
      const getSortValue = (item: InventoryItem) => {
        switch (sortColumn) {
          case 'title':
            return item.title.toLowerCase();
          case 'sku':
            return (item.sku || '').toLowerCase();
          case 'category':
            return item.category.toLowerCase();
          case 'quantity':
            return item.quantity || 0;
          case 'price':
            return item.price || 0;
          case 'location':
            return (item.location || '').toLowerCase();
          case 'status':
            const statusOrder = { 'active': 0, 'inactive': 1, 'discontinued': 2 };
            return statusOrder[item.status as keyof typeof statusOrder] ?? 3;
          default:
            return item.title.toLowerCase();
        }
      };

      const aValue = getSortValue(a);
      const bValue = getSortValue(b);

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection === 'asc'
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      } else {
        const aNum = typeof aValue === 'number' ? aValue : 0;
        const bNum = typeof bValue === 'number' ? bValue : 0;
        return sortDirection === 'asc'
          ? aNum - bNum
          : bNum - aNum;
      }
    });
  }, [filteredItems, categoryFilter, statusFilter, stockFilter, sortColumn, sortDirection]);

  // Group items by title for grouped view
  const groupedData = useMemo(() => {
    if (viewMode === 'flat') {
      return displayedItems.map(item => ({ type: 'single' as const, item }));
    }

    const groups = new Map<string, InventoryItem[]>();
    displayedItems.forEach(item => {
      const key = item.title;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(item);
    });

    const result: Array<GroupedInventoryItem | { type: 'single'; item: InventoryItem }> = [];
    groups.forEach((items, title) => {
      if (items.length >= 1) {
        // Always group (even single items for consistency)
        result.push({
          type: 'group',
          title,
          items,
          totalQuantity: items.reduce((sum, i) => sum + i.quantity, 0),
          uniqueSKUs: items.length,
          category: items[0].category,
          location: items[0].location,
        });
      }
    });

    // Sort groups by title
    return result.sort((a, b) => {
      const titleA = a.type === 'group' ? a.title : a.item.title;
      const titleB = b.type === 'group' ? b.title : b.item.title;
      return titleA.localeCompare(titleB);
    });
  }, [displayedItems, viewMode]);

  // Get all item IDs for calibration data fetching
  const allItemIds = useMemo(() => {
    return displayedItems.map(item => item.id);
  }, [displayedItems]);

  // Fetch calibration data
  const calibrationData = useCalibrationData(allItemIds);

  // Toggle group expansion
  const toggleGroup = useCallback((title: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(title)) {
        next.delete(title);
      } else {
        next.add(title);
      }
      return next;
    });
  }, []);

  const clearFilters = () => {
    setCategoryFilter('');
    setStatusFilter('');
    setStockFilter('');
  };

  const handleSort = useCallback((column: string) => {
    if (sortColumn === column) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  }, [sortColumn]);

  const getSortIcon = (column: string) => {
    if (sortColumn !== column) {
      return <ChevronsUpDown className="w-4 h-4 ml-1 inline-block" />;
    }
    return sortDirection === 'asc'
      ? <ChevronUp className="w-4 h-4 ml-1 inline-block" />
      : <ChevronDown className="w-4 h-4 ml-1 inline-block" />;
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  const handleCloseAddItemModal = useCallback(() => {
    setShowAddItem(false);
    setSelectedItem(null);
    setIsEditMode(false);
  }, []);

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setFilters({ ...filters, search: value });
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'success' | 'warning' | 'danger'> = {
      Available: 'success',
      available: 'success',  // Handle lowercase from DB
      Active: 'success',     // Legacy support
      Inactive: 'warning',
      Discontinued: 'danger',
    };

    // Normalize display text
    const displayText = (status === 'available' || status === 'Active') ? 'Available' : status;

    return <Badge variant={variants[status] || 'default'}>{displayText}</Badge>;
  };

  const getStockStatus = (quantity: number, minStock: number) => {
    if (quantity === 0) return <Badge variant="danger">Out of Stock</Badge>;
    if (quantity <= minStock) return <Badge variant="warning">Low Stock</Badge>;
    return <Badge variant="success">In Stock</Badge>;
  };

  const getLastActionBadge = (lastAction?: string) => {
    if (!lastAction) return null;
    const variants: Record<string, 'success' | 'info' | 'warning' | 'default'> = {
      added: 'success',
      returned: 'info',
      'checked-out': 'warning',
      updated: 'default',
    };
    const labels: Record<string, string> = {
      added: 'ADDED',
      returned: 'RETURNED',
      'checked-out': 'CHECKED OUT',
      updated: 'UPDATED',
    };
    return <Badge variant={variants[lastAction] || 'default'} size="sm">{labels[lastAction] || lastAction}</Badge>;
  };

  const handleBulkImport = async (file: File) => {
    try {
      // Parse CSV first to validate and count items
      const reader = new FileReader();
      
      reader.onload = async (e) => {
        try {
          const csvText = e.target?.result as string;
          // Filter out empty lines and comment lines (starting with #)
          const lines = csvText.split('\n').filter((line) => {
            const trimmed = line.trim();
            return trimmed && !trimmed.startsWith('#');
          });

          if (lines.length < 2) {
            toast.error('CSV file is empty or has no data rows');
            return;
          }

          const headers = lines[0].split(',').map((h) => h.trim());
          const dataRows = lines.slice(1);
          let validItemCount = 0;
          let errorCount = 0;
          const errors: string[] = [];

          // Parse each row to count valid items
          for (let i = 0; i < dataRows.length; i++) {
            const row = dataRows[i].split(',').map((v) => v.trim());
            const rowObj: any = {};
            headers.forEach((header, index) => {
              rowObj[header] = row[index];
            });

            // Validate required fields: title, sku, category, quantity, minimumStock, location
            const requiredFields = ['title', 'sku', 'category', 'quantity', 'minimumStock', 'location'];
            const missingFields = requiredFields.filter(field => !rowObj[field] || rowObj[field].trim() === '');
            
            if (missingFields.length > 0) {
              errorCount++;
              if (errors.length < 3) {
                errors.push(`Row ${i + 2}: Missing ${missingFields.join(', ')}`);
              }
              continue;
            }

            // Validate numeric fields
            const quantity = parseInt(rowObj.quantity);
            const minimumStock = parseInt(rowObj.minimumStock);

            if (isNaN(quantity) || isNaN(minimumStock) || quantity < 0 || minimumStock < 0) {
              errorCount++;
              if (errors.length < 3) {
                errors.push(`Row ${i + 2}: Invalid quantity or minimumStock`);
              }
              continue;
            }

            // Validate date format (DD/MM/YYYY) if provided
            if (rowObj.lastCalibratedDate && rowObj.lastCalibratedDate.trim() !== '') {
              const dateRegex = /^(0[1-9]|[12][0-9]|3[01])\/(0[1-9]|1[0-2])\/\d{4}$/;
              if (!dateRegex.test(rowObj.lastCalibratedDate.trim())) {
                errorCount++;
                if (errors.length < 3) {
                  errors.push(`Row ${i + 2}: Invalid date format. Use DD/MM/YYYY`);
                }
                continue;
              }
            }

            validItemCount++;
          }

          if (validItemCount === 0) {
            toast.error(`No valid items found in CSV file. ${errors.length > 0 ? errors[0] : ''}`);
            return;
          }

          // Show confirmation dialog
          setBulkImportConfirm({
            isOpen: true,
            file,
            itemCount: validItemCount,
          });
        } catch (error: any) {
          toast.error('Error validating CSV file');
        }
      };

      reader.onerror = () => {
        toast.error('Failed to read CSV file');
      };

      reader.readAsText(file);
    } catch (error: any) {
      toast.error('Error processing bulk import');
    }
  };

  const executeBulkImport = async () => {
    if (!bulkImportConfirm.file) return;
    
    try {
      const reader = new FileReader();
      
      reader.onload = async (e) => {
        try {
          const csvText = e.target?.result as string;
          // Filter out empty lines and comment lines (starting with #)
          const lines = csvText.split('\n').filter((line) => {
            const trimmed = line.trim();
            return trimmed && !trimmed.startsWith('#');
          });
          
          const headers = lines[0].split(',').map((h) => h.trim());
          const dataRows = lines.slice(1);
          const itemsToImport: Array<Omit<InventoryItem, 'id'>> = [];
          let errorCount = 0;

          // Parse each row
          for (let i = 0; i < dataRows.length; i++) {
            const row = dataRows[i].split(',').map((v) => v.trim());
            const rowObj: any = {};
            headers.forEach((header, index) => {
              rowObj[header] = row[index];
            });

            // Validate required fields: title, sku, category, quantity, minimumStock, location
            const requiredFields = ['title', 'sku', 'category', 'quantity', 'minimumStock', 'location'];
            const missingFields = requiredFields.filter(field => !rowObj[field] || rowObj[field].trim() === '');
            
            if (missingFields.length > 0) {
              errorCount++;
              continue;
            }

            // Validate numeric fields
            const quantity = parseInt(rowObj.quantity);
            const minimumStock = parseInt(rowObj.minimumStock);

            if (isNaN(quantity) || isNaN(minimumStock) || quantity < 0 || minimumStock < 0) {
              errorCount++;
              continue;
            }

            // Parse date from DD/MM/YYYY to ISO format if provided
            let lastCalibratedDate: string | undefined = undefined;
            if (rowObj.lastCalibratedDate && rowObj.lastCalibratedDate.trim() !== '') {
              const dateParts = rowObj.lastCalibratedDate.split('/');
              if (dateParts.length === 3) {
                const day = dateParts[0];
                const month = dateParts[1];
                const year = dateParts[2];
                lastCalibratedDate = `${year}-${month}-${day}`;
              }
            }

            // Create item object
            const item: Omit<InventoryItem, 'id'> = {
              title: rowObj.title,
              sku: rowObj.sku,
              barcode: rowObj.barcode || '',
              category: rowObj.category,
              quantity: quantity,
              minimumStock: minimumStock,
              location: rowObj.location,
              unitOfMeasure: rowObj.unitOfMeasure || 'units',
              cost: 0, // Auto-set to 0, not used in UI
              price: 0, // Auto-set to 0, not used in UI
              supplier: rowObj.supplier || '',
              status: 'Available', // Auto-calculated by backend based on quantity vs minimumStock
              notes: rowObj.notes || '',
              lastCalibratedDate,
              lastUpdated: new Date().toISOString(),
              createdBy: currentUser?.displayName || 'Unknown',
            };

            itemsToImport.push(item);
          }

          // Send to API
          await inventoryService.bulkCreateInventoryItems(itemsToImport);
          toast.success(
            `Successfully imported ${itemsToImport.length} items${
              errorCount > 0 ? ` (${errorCount} rows skipped due to errors)` : ''
            }`
          );

          setBulkImportConfirm({ isOpen: false });
          setShowBulkUpload(false);
          await fetchInventory();
        } catch (error: any) {
          const errorMessage = error?.response?.data?.error || error?.message || 'Failed to import items';
          toast.error(errorMessage);
        }
      };

      reader.onerror = () => {
        toast.error('Failed to read CSV file');
      };

      reader.readAsText(bulkImportConfirm.file);
    } catch (error: any) {
      toast.error('Error processing bulk import');
    }
  };

  const handleAddItem = async (itemData: Omit<InventoryItem, 'id' | 'lastUpdated' | 'createdBy'>) => {
    if (!canAdd) {
      toast.error(getPermissionMessage('add or remove inventory', 'engineer'));
      return;
    }
    try {
      const dataToSend: any = itemData;
      await inventoryService.createInventoryItem(dataToSend);
      toast.success(`Item "${itemData.title}" added successfully!`);
      await fetchInventory();
    } catch (error: any) {
      toast.error(error?.response?.data?.error || 'Failed to add item');
      throw error;
    }
  };



  const handleEditItem = (item: InventoryItem) => {
    setSelectedItem(item);
    setIsEditMode(true);
    setShowAddItem(true);
  };

  const handleDeleteItem = async (itemId: string) => {
    const item = filteredItems.find(i => i.id === itemId);
    setConfirmDialog({
      isOpen: true,
      itemId,
      itemTitle: item?.title,
    });
  };

  const confirmDeleteItem = async () => {
    if (!confirmDialog.itemId) return;

    try {
      await inventoryService.deleteInventoryItem(confirmDialog.itemId);
      toast.success('Item deleted successfully!');
      await fetchInventory();
      setConfirmDialog({ isOpen: false });
    } catch (error: any) {
      toast.error(error?.response?.data?.error || 'Failed to delete item');
    }
  };

  const handleAddItemSubmit = async (itemData: Omit<InventoryItem, 'id' | 'lastUpdated' | 'createdBy'>) => {
    if (!canAdd) {
      toast.error(getPermissionMessage('add or remove inventory', 'engineer'));
      return;
    }
    try {
      if (isEditMode && selectedItem) {
        await inventoryService.updateInventoryItem(selectedItem.id, itemData);
        toast.success('Item updated successfully!');
      } else {
        await handleAddItem(itemData);
      }
      setShowAddItem(false);
      setSelectedItem(null);
      setIsEditMode(false);
      await fetchInventory();
    } catch (error: any) {
      toast.error(error?.response?.data?.error || 'Failed to save item');
    }
  };

  return (
    <div className="min-h-full bg-gray-50">
      <div className="p-4 md:p-6  space-y-6">
        {/* Header Container */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Equipment Inventory</h1>
              <p className="text-gray-600 mt-1">Manage your equipment, tools, and materials inventory</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setShowBulkUpload(true)}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium shadow-sm"
              >
                <Upload className="w-5 h-5" />
                {!isMobile && 'Bulk Import'}
              </button>

              {canAdd && (
                <button
                  onClick={() => setShowAddItem(true)}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors font-medium shadow-sm"
                >
                  <Plus className="w-5 h-5" />
                  {!isMobile && 'Add Item'}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex flex-col md:flex-row gap-3">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  placeholder="Search by name, SKU, or barcode..."
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Filter Button */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`inline-flex items-center justify-center gap-2 px-4 py-2.5 border rounded-xl transition-colors whitespace-nowrap ${
                activeFilterCount > 0
                  ? 'border-primary-500 bg-primary-50 text-primary-700'
                  : 'border-gray-200 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Filter className="w-5 h-5" />
              <span className="hidden sm:inline">Filters</span>
              {activeFilterCount > 0 && (
                <span className="ml-1 px-1.5 py-0.5 text-xs font-medium bg-primary-600 text-white rounded-full">
                  {activeFilterCount}
                </span>
              )}
              {showFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {/* View Mode Toggle */}
            <button
              onClick={() => setViewMode(viewMode === 'grouped' ? 'flat' : 'grouped')}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors whitespace-nowrap"
              title={viewMode === 'grouped' ? 'Switch to flat view' : 'Switch to grouped view'}
              >
                {viewMode === 'grouped' ? (
                  <>
                    <List className="w-5 h-5" />
                    <span className="hidden sm:inline">Show All</span>
                  </>
                ) : (
                  <>
                    <LayoutGrid className="w-5 h-5" />
                    <span className="hidden sm:inline">Group Items</span>
                  </>
                )}
              </button>
            </div>

            {/* Collapsible Filter Panel */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Category Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                  >
                    <option value="">All Categories</option>
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                {/* Status Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                  >
                    <option value="">All Statuses</option>
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                    <option value="Discontinued">Discontinued</option>
                  </select>
                </div>

                {/* Stock Level Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Stock Level</label>
                  <select
                    value={stockFilter}
                    onChange={(e) => setStockFilter(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                  >
                    <option value="">All Stock Levels</option>
                    <option value="in">In Stock</option>
                    <option value="low">Low Stock</option>
                    <option value="out">Out of Stock</option>
                  </select>
                </div>

                {/* Clear Filters Button */}
                <div className="flex items-end">
                  <button
                    onClick={clearFilters}
                    disabled={activeFilterCount === 0}
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                  >
                    <X className="w-4 h-4" />
                    Clear Filters
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      )}

      {/* Inventory Items - Mobile Cards */}
      {!loading && isMobile && (
        <div className="space-y-3">
          {displayedItems.map((item) => (
            <div key={item.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">{item.title}</h3>
                  <p className="text-sm text-gray-600 mt-0.5">SKU: {item.sku}</p>
                </div>
                {getStatusBadge(item.status)}
              </div>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <p className="text-xs text-gray-500">Quantity</p>
                  <p className="text-sm font-medium">{item.quantity} {item.unitOfMeasure}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Available</p>
                  <p className="text-sm font-medium text-green-600">{item.quantity - (item.checkedOut || 0)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Checked Out</p>
                  <p className="text-sm font-medium text-orange-600">{item.checkedOut || 0}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Location</p>
                  <p className="text-sm font-medium">{item.location}</p>
                </div>
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-gray-100 mb-3">
                <div className="flex items-center gap-2">
                  {getStockStatus(item.quantity, item.minimumStock)}
                  {getLastActionBadge(item.lastAction)}
                </div>
                <p className="text-xs text-gray-500">Updated {formatDate(item.lastUpdated)}</p>
              </div>
              {canAdd && (
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEditItem(item)}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium"
                  >
                    <Edit2 className="w-4 h-4" />
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteItem(item.id)}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors text-sm font-medium"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Inventory Items - Desktop Table */}
      {!loading && !isMobile && (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              All Items ({displayedItems.length})
            </h2>
            <span className="text-sm text-gray-500">
              {viewMode === 'grouped' ? `Grouped by title (${groupedData.length} groups)` : 'Individual items'}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">Item</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700">SKUs</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700">Available</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700">Checked Out</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">Category</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">Location</th>
                  {canAdd && <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700">Actions</th>}
                </tr>
              </thead>
              <tbody>
                {groupedData.map((group) =>
                  group.type === 'group' ? (
                    <GroupedInventoryRow
                      key={group.title}
                      title={group.title}
                      supplier={group.items[0]?.supplier}
                      items={group.items}
                      totalQuantity={group.totalQuantity}
                      uniqueSKUs={group.uniqueSKUs}
                      category={group.category}
                      location={group.location}
                      isExpanded={expandedGroups.has(group.title)}
                      onToggle={() => toggleGroup(group.title)}
                      onEditItem={handleEditItem}
                      canEdit={!!canAdd}
                      calibrationData={calibrationData}
                    />
                  ) : (
                    <SingleInventoryRow
                      key={group.item.id}
                      item={group.item}
                      onEditItem={handleEditItem}
                      onDeleteItem={handleDeleteItem}
                      canEdit={!!canAdd}
                    />
                  )
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!loading && displayedItems.length === 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
          <div className="flex flex-col items-center justify-center py-12 text-gray-500">
            <Package className="w-16 h-16 mb-4 opacity-50" />
            <p className="text-lg font-medium mb-2">No items found</p>
            <p className="text-sm mb-4">Try adjusting your search or filters</p>
            {(searchTerm || categoryFilter || statusFilter || stockFilter) && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setCategoryFilter('');
                  setStatusFilter('');
                  setStockFilter('');
                }}
                className="px-4 py-2 text-sm font-medium text-primary-600 hover:text-primary-700 hover:bg-primary-50 rounded-lg transition-colors"
              >
                Clear All Filters
              </button>
            )}
          </div>
        </div>
      )}

        {/* Modals */}
        <BulkUploadModal
          isOpen={showBulkUpload}
          onClose={() => setShowBulkUpload(false)}
          onImport={handleBulkImport}
        />
        <AddItemModal
          isOpen={showAddItem}
          onClose={handleCloseAddItemModal}
          onSubmit={handleAddItemSubmit}
          initialData={isEditMode ? selectedItem || undefined : undefined}
          isEditMode={isEditMode}
        />

        {/* Delete Confirmation Dialog */}
        <ConfirmDialog
          isOpen={confirmDialog.isOpen}
          onClose={() => setConfirmDialog({ isOpen: false })}
          onConfirm={confirmDeleteItem}
          title="Delete Inventory Item"
          message={`Are you sure you want to delete "${confirmDialog.itemTitle}"? This action cannot be undone.`}
          variant="danger"
          confirmText="Delete Item"
          cancelText="Cancel"
        />

        {/* Bulk Import Confirmation Dialog */}
        <ConfirmDialog
          isOpen={bulkImportConfirm.isOpen}
          onClose={() => setBulkImportConfirm({ isOpen: false })}
          onConfirm={executeBulkImport}
          title="Confirm Bulk Import"
          message={`You are about to import ${bulkImportConfirm.itemCount} inventory items. This action cannot be undone. Do you want to proceed?`}
          variant="warning"
          confirmText="Import Items"
          cancelText="Cancel"
        />
      </div>
    </div>
  );
};