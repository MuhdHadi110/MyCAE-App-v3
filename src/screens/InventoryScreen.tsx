import { useEffect, useState, useCallback, useMemo } from 'react';
import { Search, Plus, Filter, Package, Upload, QrCode, LogIn, ChevronDown, ChevronUp, Box, Edit2, Trash2, X, ChevronsUpDown } from 'lucide-react';
import { Badge } from '../components/ui/Badge';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { BulkUploadModal } from '../components/modals/BulkUploadModal';
import { BulkCheckoutModal } from '../components/modals/BulkCheckoutModal';
import { BulkCheckInModal, type BulkCheckInData } from '../components/modals/BulkCheckInModal';
import { SingleItemCheckoutModal, type SingleCheckoutData } from '../components/modals/SingleItemCheckoutModal';
import { SingleItemCheckInModal, type SingleCheckInData } from '../components/modals/SingleItemCheckInModal';
import { AddItemModal } from '../components/modals/AddItemModal';
import { useInventoryStore } from '../store/inventoryStore';
import { getCurrentUser } from '../lib/auth';
import { checkPermission, getPermissionMessage } from '../lib/permissions';
import { formatCurrency, formatDate } from '../lib/utils';
import { useResponsive } from '../hooks/useResponsive';
import { toast } from 'react-hot-toast';
import inventoryService from '../services/inventory.service';
import type { BulkCheckout, InventoryItem } from '../types/inventory.types';

export const InventoryScreen: React.FC = () => {
  const { filteredItems: storeFilteredItems, filters, setFilters, fetchInventory, loading } = useInventoryStore();
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
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [showBulkCheckout, setShowBulkCheckout] = useState(false);
  const [showBulkCheckIn, setShowBulkCheckIn] = useState(false);
  const [showSingleCheckout, setShowSingleCheckout] = useState(false);
  const [showSingleCheckIn, setShowSingleCheckIn] = useState(false);
  const [showAddItem, setShowAddItem] = useState(false);
  const [showCheckoutMenu, setShowCheckoutMenu] = useState(false);
  const [showCheckInMenu, setShowCheckInMenu] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    itemId?: string;
    itemTitle?: string;
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
        return sortDirection === 'asc'
          ? aValue - bValue
          : bValue - aValue;
      }
    });
  }, [filteredItems, categoryFilter, statusFilter, stockFilter, sortColumn, sortDirection]);

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
      Active: 'success',
      Inactive: 'warning',
      Discontinued: 'danger',
    };
    return <Badge variant={variants[status] || 'default'}>{status}</Badge>;
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
      // Parse and extract valid items from CSV
      const reader = new FileReader();

      reader.onload = async (e) => {
        try {
          const csvText = e.target?.result as string;
          const lines = csvText.split('\n').filter((line) => line.trim());

          if (lines.length < 2) {
            toast.error('CSV file is empty or has no data rows');
            return;
          }

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

            // Validate required fields
            if (!rowObj.title || !rowObj.sku) {
              errorCount++;
              continue;
            }

            // Validate numeric fields
            const quantity = parseInt(rowObj.quantity);
            const minimumStock = parseInt(rowObj.minimumStock);
            const cost = parseFloat(rowObj.cost || '0');
            const price = parseFloat(rowObj.price || '0');

            if (isNaN(quantity) || isNaN(minimumStock) || isNaN(cost) || isNaN(price)) {
              errorCount++;
              continue;
            }

            // Create item object
            const item: Omit<InventoryItem, 'id'> = {
              title: rowObj.title,
              sku: rowObj.sku,
              barcode: rowObj.barcode || '',
              category: rowObj.category || 'Uncategorized',
              quantity: quantity || 0,
              minimumStock: minimumStock || 0,
              location: rowObj.location || '',
              unitOfMeasure: rowObj.unitOfMeasure || 'Unit',
              cost: cost || 0,
              price: price || 0,
              supplier: rowObj.supplier || '',
              status: (rowObj.status as 'Active' | 'Inactive' | 'Discontinued') || 'Active',
              notes: rowObj.notes || '',
              lastUpdated: new Date().toISOString(),
              createdBy: currentUser.displayName,
            };

            itemsToImport.push(item);
          }

          if (itemsToImport.length === 0) {
            toast.error('No valid items found in CSV file');
            return;
          }

          // Send to API
          const response = await inventoryService.bulkCreateInventoryItems(itemsToImport);
          toast.success(
            `Successfully imported ${itemsToImport.length} items${
              errorCount > 0 ? ` (${errorCount} rows skipped due to errors)` : ''
            }`
          );

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

      reader.readAsText(file);
    } catch (error: any) {
      toast.error('Error processing bulk import');
    }
  };

  const handleBulkCheckout = async (checkout: BulkCheckout) => {
    try {
      const result = await inventoryService.createBulkCheckout(checkout);
      toast.success(result.message || 'Bulk checkout completed successfully!');
      await fetchInventory(); // Refresh inventory to show updated quantities
      setShowBulkCheckout(false);
    } catch (error: any) {
      toast.error(error?.response?.data?.error || 'Failed to complete checkout');
    }
  };

  const handleBulkCheckIn = async (checkInData: BulkCheckInData) => {
    try {
      const result = await inventoryService.checkInBulk({
        masterBarcode: checkInData.masterBarcode,
        returnType: checkInData.returnType,
        items: checkInData.items,
        notes: checkInData.notes,
      });
      toast.success(result.message || 'Check-in completed successfully!');
      await fetchInventory(); // Refresh inventory to show updated quantities
      setShowBulkCheckIn(false);
    } catch (error: any) {
      toast.error(error?.response?.data?.error || 'Failed to complete check-in');
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

  const handleSingleCheckout = async (checkout: SingleCheckoutData) => {
    try {
      const result = await inventoryService.createSingleCheckout(checkout);
      toast.success(result.message || 'Item checked out successfully!');
      await fetchInventory(); // Refresh inventory to show updated quantities
      setShowSingleCheckout(false);
    } catch (error: any) {
      toast.error(error?.response?.data?.error || 'Failed to checkout item');
    }
  };

  const handleSingleCheckIn = async (checkIn: SingleCheckInData) => {
    try {
      const result = await inventoryService.checkInSingle(checkIn);
      toast.success(result.message || 'Item checked in successfully!');
      await fetchInventory(); // Refresh inventory to show updated quantities
      setShowSingleCheckIn(false);
    } catch (error: any) {
      toast.error(error?.response?.data?.error || 'Failed to check in item');
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

              {/* Checkout Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowCheckoutMenu(!showCheckoutMenu)}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium shadow-sm"
                >
                  <QrCode className="w-5 h-5" />
                  {!isMobile && 'Checkout'}
                  <ChevronDown className="w-4 h-4" />
                </button>
                {showCheckoutMenu && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                    <button
                      onClick={() => {
                        setShowSingleCheckout(true);
                        setShowCheckoutMenu(false);
                      }}
                      className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center gap-3 transition-colors rounded-t-lg"
                    >
                      <Box className="w-5 h-5 text-primary-600" />
                      <div>
                        <p className="font-medium text-gray-900">Single Item</p>
                        <p className="text-xs text-gray-500">Check out one item</p>
                      </div>
                    </button>
                    <button
                      onClick={() => {
                        setShowBulkCheckout(true);
                        setShowCheckoutMenu(false);
                      }}
                      className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center gap-3 transition-colors rounded-b-lg border-t border-gray-100"
                    >
                      <QrCode className="w-5 h-5 text-primary-600" />
                      <div>
                        <p className="font-medium text-gray-900">Bulk Checkout</p>
                        <p className="text-xs text-gray-500">Check out multiple items</p>
                      </div>
                    </button>
                  </div>
                )}
              </div>

              {/* Check-In Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowCheckInMenu(!showCheckInMenu)}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium shadow-sm"
                >
                  <LogIn className="w-5 h-5" />
                  {!isMobile && 'Check-In'}
                  <ChevronDown className="w-4 h-4" />
                </button>
                {showCheckInMenu && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                    <button
                      onClick={() => {
                        setShowSingleCheckIn(true);
                        setShowCheckInMenu(false);
                      }}
                      className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center gap-3 transition-colors rounded-t-lg"
                    >
                      <Box className="w-5 h-5 text-green-600" />
                      <div>
                        <p className="font-medium text-gray-900">Single Item</p>
                        <p className="text-xs text-gray-500">Return one item</p>
                      </div>
                    </button>
                    <button
                      onClick={() => {
                        setShowBulkCheckIn(true);
                        setShowCheckInMenu(false);
                      }}
                      className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center gap-3 transition-colors rounded-b-lg border-t border-gray-100"
                    >
                      <LogIn className="w-5 h-5 text-green-600" />
                      <div>
                        <p className="font-medium text-gray-900">Bulk Check-In</p>
                        <p className="text-xs text-gray-500">Return with master barcode</p>
                      </div>
                    </button>
                  </div>
                )}
              </div>

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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="md:col-span-3">
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
            <div>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 border rounded-xl transition-colors ${
                  activeFilterCount > 0
                    ? 'border-primary-500 bg-primary-50 text-primary-700'
                    : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Filter className="w-5 h-5" />
                Filters
                {activeFilterCount > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 text-xs font-medium bg-primary-600 text-white rounded-full">
                    {activeFilterCount}
                  </span>
                )}
                {showFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            </div>
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
                  <p className="text-xs text-gray-500">Price</p>
                  <p className="text-sm font-medium">{formatCurrency(item.price)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Location</p>
                  <p className="text-sm font-medium">{item.location}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Category</p>
                  <p className="text-sm font-medium">{item.category}</p>
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
          <div className="px-4 py-3 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              All Items ({displayedItems.length})
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th onClick={() => handleSort('title')} className="px-3 py-2 text-left text-xs font-semibold text-gray-700 cursor-pointer hover:bg-gray-100 transition-colors">Item {getSortIcon('title')}</th>
                  <th onClick={() => handleSort('sku')} className="px-3 py-2 text-left text-xs font-semibold text-gray-700 cursor-pointer hover:bg-gray-100 transition-colors">SKU {getSortIcon('sku')}</th>
                  <th onClick={() => handleSort('category')} className="px-3 py-2 text-left text-xs font-semibold text-gray-700 cursor-pointer hover:bg-gray-100 transition-colors">Category {getSortIcon('category')}</th>
                  <th onClick={() => handleSort('quantity')} className="px-3 py-2 text-left text-xs font-semibold text-gray-700 cursor-pointer hover:bg-gray-100 transition-colors">Quantity {getSortIcon('quantity')}</th>
                  <th onClick={() => handleSort('price')} className="px-3 py-2 text-left text-xs font-semibold text-gray-700 cursor-pointer hover:bg-gray-100 transition-colors">Price {getSortIcon('price')}</th>
                  <th onClick={() => handleSort('location')} className="px-3 py-2 text-left text-xs font-semibold text-gray-700 cursor-pointer hover:bg-gray-100 transition-colors">Location {getSortIcon('location')}</th>
                  <th onClick={() => handleSort('status')} className="px-3 py-2 text-left text-xs font-semibold text-gray-700 cursor-pointer hover:bg-gray-100 transition-colors">Status {getSortIcon('status')}</th>
                  {canAdd && <th className="px-3 py-2 text-right text-xs font-semibold text-gray-700">Actions</th>}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {displayedItems.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-3 py-2">
                      <div>
                        <p className="font-medium text-gray-900">{item.title}</p>
                        <p className="text-xs text-gray-500">{item.supplier}</p>
                      </div>
                    </td>
                    <td className="px-3 py-2 text-gray-900">{item.sku}</td>
                    <td className="px-3 py-2 text-gray-600">{item.category}</td>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-2">
                        <span className="text-gray-900">{item.quantity}</span>
                        {getStockStatus(item.quantity, item.minimumStock)}
                      </div>
                    </td>
                    <td className="px-3 py-2 text-gray-900">{formatCurrency(item.price)}</td>
                    <td className="px-3 py-2 text-gray-600">{item.location}</td>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-2">
                        {getStatusBadge(item.status)}
                        {getLastActionBadge(item.lastAction)}
                      </div>
                    </td>
                    {canAdd && (
                      <td className="px-3 py-2 text-right">
                        <div className="flex gap-1 justify-end">
                          <button
                            onClick={() => handleEditItem(item)}
                            className="p-1.5 hover:bg-blue-100 text-blue-600 rounded transition-colors"
                            title="Edit item"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteItem(item.id)}
                            className="p-1.5 hover:bg-red-100 text-red-600 rounded transition-colors"
                            title="Delete item"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
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
            <p className="text-sm">Try adjusting your search or filters</p>
          </div>
        </div>
      )}

        {/* Modals */}
        <BulkUploadModal
          isOpen={showBulkUpload}
          onClose={() => setShowBulkUpload(false)}
          onImport={handleBulkImport}
        />
        <BulkCheckoutModal
          isOpen={showBulkCheckout}
          onClose={() => setShowBulkCheckout(false)}
          onCheckout={handleBulkCheckout}
        />
        <BulkCheckInModal
          isOpen={showBulkCheckIn}
          onClose={() => setShowBulkCheckIn(false)}
          onCheckIn={handleBulkCheckIn}
        />
        <SingleItemCheckoutModal
          isOpen={showSingleCheckout}
          onClose={() => setShowSingleCheckout(false)}
          onCheckout={handleSingleCheckout}
        />
        <SingleItemCheckInModal
          isOpen={showSingleCheckIn}
          onClose={() => setShowSingleCheckIn(false)}
          onCheckIn={handleSingleCheckIn}
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
      </div>
    </div>
  );
};