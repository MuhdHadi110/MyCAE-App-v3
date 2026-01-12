import { useEffect, useState, useCallback } from 'react';
import { Search, Plus, Filter, Package, Upload, QrCode, LogIn, ChevronDown, Box, Edit2, Trash2 } from 'lucide-react';
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
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
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
              <button className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors">
                <Filter className="w-5 h-5" />
                Filters
              </button>
            </div>
          </div>
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
          {filteredItems.map((item) => (
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
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900">
              All Items ({filteredItems.length})
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SKU</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  {canAdd && <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredItems.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50 cursor-pointer transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-gray-900">{item.title}</p>
                        <p className="text-sm text-gray-500">{item.supplier}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">{item.sku}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{item.category}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-900">{item.quantity}</span>
                        {getStockStatus(item.quantity, item.minimumStock)}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">{formatCurrency(item.price)}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{item.location}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {getStatusBadge(item.status)}
                        {getLastActionBadge(item.lastAction)}
                      </div>
                    </td>
                    {canAdd && (
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEditItem(item)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded transition-colors"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteItem(item.id)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-red-700 bg-red-50 hover:bg-red-100 rounded transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            Delete
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
      {!loading && filteredItems.length === 0 && (
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