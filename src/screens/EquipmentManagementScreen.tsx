import { useEffect, useState, useMemo, useCallback } from 'react';
import { Search, Package, Clock, User, Calendar, MapPin, Building2, TrendingUp, Box, BarChart3, ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { useCheckoutStore } from '../store/checkoutStore';
import { useInventoryStore } from '../store/inventoryStore';
import { useResponsive } from '../hooks/useResponsive';
import { getCurrentUser } from '../lib/auth';
import type { CheckoutStatus } from '../types/checkout.types';

type ViewMode = 'transactions' | 'locations';

interface LocationSummary {
  location: string;
  totalItems: number;
  uniqueEquipment: number;
  checkedOutBy: string;
  checkedOutByEmail: string;
  checkoutDate: string;
  expectedReturn?: string;
  items: Array<{
    itemName: string;
    quantity: number;
    barcode: string;
  }>;
}

export const EquipmentManagementScreen: React.FC = () => {
  const { filteredCheckouts, fetchCheckouts, setFilters, loading: checkoutsLoading } = useCheckoutStore();
  const { items, fetchInventory, loading: inventoryLoading } = useInventoryStore();
  const { isMobile } = useResponsive();
  const currentUser = getCurrentUser();

  // Main view mode
  const [viewMode, setViewMode] = useState<ViewMode>('transactions');

  // Transaction view state
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<CheckoutStatus | 'all'>('all');
  const [transactionSortColumn, setTransactionSortColumn] = useState<string>('masterBarcode');
  const [transactionSortDirection, setTransactionSortDirection] = useState<'asc' | 'desc'>('asc');
  
  // Location view state
  const [locationSearch, setLocationSearch] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'person' | 'site'>('all');
  const [locationSortColumn, setLocationSortColumn] = useState<string>('location');
  const [locationSortDirection, setLocationSortDirection] = useState<'asc' | 'desc'>('asc');

  const loading = checkoutsLoading || inventoryLoading;

  // Fetch on mount
  useEffect(() => {
    fetchCheckouts();
    fetchInventory();
  }, []);

  // Refetch when switching views to get latest data
  useEffect(() => {
    if (viewMode === 'locations') {
      fetchInventory();
      fetchCheckouts();
    }
  }, [viewMode]);

  // Apply transaction filters
  useEffect(() => {
    setFilters({
      userId: undefined,
      status: statusFilter === 'all' ? undefined : statusFilter,
      search: searchTerm,
      showMyCheckoutsFirst: false,
    });
  }, [statusFilter, searchTerm]);

  // Location summary calculations
  const locationSummaries = useMemo(() => {
    const summaries: LocationSummary[] = [];

    filteredCheckouts
      .filter(checkout =>
        checkout.status === 'active' ||
        checkout.status === 'partial-return' ||
        checkout.status === 'overdue'
      )
      .forEach(checkout => {
        checkout.items
          .filter(item => item.returnStatus === 'checked-out')
          .forEach(item => {
            const location = checkout.purpose || checkout.checkedOutBy;

            let summary = summaries.find(s =>
              s.location === location && s.checkedOutByEmail === checkout.checkedOutByEmail
            );

            if (!summary) {
              summary = {
                location,
                totalItems: 0,
                uniqueEquipment: 0,
                checkedOutBy: checkout.checkedOutBy,
                checkedOutByEmail: checkout.checkedOutByEmail,
                checkoutDate: checkout.checkedOutDate,
                expectedReturn: checkout.expectedReturnDate,
                items: [],
              };
              summaries.push(summary);
            }

            summary.totalItems += item.remainingQuantity;
            summary.uniqueEquipment += 1;
            summary.items.push({
              itemName: item.itemName,
              quantity: item.remainingQuantity,
              barcode: item.barcode,
            });
          });
      });

    return summaries;
  }, [filteredCheckouts]);

  const filteredLocations = useMemo(() => {
    let filtered = [...locationSummaries];

    if (locationSearch) {
      const search = locationSearch.toLowerCase();
      filtered = filtered.filter(s =>
        s.location.toLowerCase().includes(search) ||
        s.checkedOutBy.toLowerCase().includes(search) ||
        s.items.some(item => item.itemName.toLowerCase().includes(search))
      );
    }

    return filtered.sort((a, b) => {
      const getSortValue = (summary: LocationSummary) => {
        switch (locationSortColumn) {
          case 'location':
            return summary.location.toLowerCase();
          case 'checkedOutBy':
            return summary.checkedOutBy.toLowerCase();
          case 'totalItems':
            return summary.totalItems;
          case 'uniqueEquipment':
            return summary.uniqueEquipment;
          case 'checkoutDate':
            return new Date(summary.checkoutDate).getTime();
          case 'expectedReturn':
            return summary.expectedReturn ? new Date(summary.expectedReturn).getTime() : 0;
          default:
            return summary.location.toLowerCase();
        }
      };

      const aValue = getSortValue(a);
      const bValue = getSortValue(b);

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return locationSortDirection === 'asc'
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      } else {
        const aNum = typeof aValue === 'number' ? aValue : 0;
        const bNum = typeof bValue === 'number' ? bValue : 0;
        return locationSortDirection === 'asc'
          ? aNum - bNum
          : bNum - aNum;
      }
    });
  }, [locationSummaries, locationSearch, locationSortColumn, locationSortDirection]);

  // Statistics
  const stats = useMemo(() => {
    const totalEquipmentOut = locationSummaries.reduce((sum, s) => sum + s.totalItems, 0);
    const totalLocations = locationSummaries.length;
    const uniqueUsers = new Set(locationSummaries.map(s => s.checkedOutByEmail)).size;
    const totalInventoryItems = Array.isArray(items) ? items.reduce((sum, item) => sum + item.quantity, 0) : 0;

    return {
      totalEquipmentOut,
      totalLocations,
      uniqueUsers,
      totalInWarehouse: totalInventoryItems - totalEquipmentOut,
      totalCheckouts: filteredCheckouts.length,
    };
  }, [locationSummaries, items, filteredCheckouts]);

  const getStatusBadge = (status: CheckoutStatus) => {
    switch (status) {
      case 'active':
        return <Badge variant="success">Active</Badge>;
      case 'partial-return':
        return <Badge variant="warning">Partial Return</Badge>;
      case 'overdue':
        return <Badge variant="danger">Overdue</Badge>;
      case 'fully-returned':
        return <Badge variant="default">Returned</Badge>;
      default:
        return null;
    }
  };

  const getDaysInfo = (expectedReturnDate?: string) => {
    if (!expectedReturnDate) return null;
    const now = new Date();
    const dueDate = new Date(expectedReturnDate);
    const diffTime = dueDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return { text: `${Math.abs(diffDays)} days overdue`, className: 'text-red-600' };
    } else if (diffDays === 0) {
      return { text: 'Due today', className: 'text-orange-600' };
    } else if (diffDays === 1) {
      return { text: 'Due tomorrow', className: 'text-gray-600' };
    } else {
      return { text: `Due in ${diffDays} days`, className: 'text-gray-600' };
    }
  };

  const isOverdue = (expectedReturn?: string) => {
    if (!expectedReturn) return false;
    return new Date(expectedReturn) < new Date();
  };

  // Sort handlers for transactions view
  const handleTransactionSort = useCallback((column: string) => {
    if (transactionSortColumn === column) {
      setTransactionSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setTransactionSortColumn(column);
      setTransactionSortDirection('asc');
    }
  }, [transactionSortColumn]);

  const getTransactionSortIcon = (column: string) => {
    if (transactionSortColumn !== column) {
      return <ChevronsUpDown className="w-4 h-4 ml-1 inline-block" />;
    }
    return transactionSortDirection === 'asc'
      ? <ChevronUp className="w-4 h-4 ml-1 inline-block" />
      : <ChevronDown className="w-4 h-4 ml-1 inline-block" />;
  };

  // Sort handlers for locations view
  const handleLocationSort = useCallback((column: string) => {
    if (locationSortColumn === column) {
      setLocationSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setLocationSortColumn(column);
      setLocationSortDirection('asc');
    }
  }, [locationSortColumn]);

  const getLocationSortIcon = (column: string) => {
    if (locationSortColumn !== column) {
      return <ChevronsUpDown className="w-4 h-4 ml-1 inline-block" />;
    }
    return locationSortDirection === 'asc'
      ? <ChevronUp className="w-4 h-4 ml-1 inline-block" />
      : <ChevronDown className="w-4 h-4 ml-1 inline-block" />;
  };

  const displayCheckouts = useMemo(() => {
    return [...filteredCheckouts].sort((a, b) => {
      const getSortValue = (checkout: any) => {
        switch (transactionSortColumn) {
          case 'masterBarcode':
            return checkout.masterBarcode.toLowerCase();
          case 'checkedOutBy':
            return checkout.checkedOutBy.toLowerCase();
          case 'purpose':
            return (checkout.purpose || '').toLowerCase();
          case 'items':
            return checkout.totalItems || 0;
          case 'dueDate':
            return checkout.expectedReturnDate ? new Date(checkout.expectedReturnDate).getTime() : 0;
          case 'status':
            const statusOrder = { 'active': 0, 'partial-return': 1, 'overdue': 2, 'fully-returned': 3 };
            return statusOrder[checkout.status] ?? 4;
          default:
            return checkout.masterBarcode.toLowerCase();
        }
      };

      const aValue = getSortValue(a);
      const bValue = getSortValue(b);

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return transactionSortDirection === 'asc'
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      } else {
        return transactionSortDirection === 'asc'
          ? aValue - bValue
          : bValue - aValue;
      }
    });
  }, [filteredCheckouts, transactionSortColumn, transactionSortDirection]);

  return (
    <div className="min-h-full bg-gray-50">
      <div className="p-4 md:p-6  space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Equipment Management</h1>
              <p className="text-gray-600 mt-1">Manage checkouts and track equipment locations</p>
            </div>
          </div>
        </div>

        {/* Stats Cards - Always Show */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card variant="bordered" padding="md">
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center">
                <Package className="w-6 h-6 text-primary-600" />
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-1">Equipment Out</p>
            <p className="text-3xl font-bold text-gray-900">{stats.totalEquipmentOut}</p>
          </Card>

          <Card variant="bordered" padding="md">
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <Building2 className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-1">Active Locations</p>
            <p className="text-3xl font-bold text-gray-900">{stats.totalLocations}</p>
          </Card>

          <Card variant="bordered" padding="md">
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <User className="w-6 h-6 text-purple-600" />
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-1">Users</p>
            <p className="text-3xl font-bold text-gray-900">{stats.uniqueUsers}</p>
          </Card>

          <Card variant="bordered" padding="md">
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <Box className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-1">Office Storage</p>
            <p className="text-3xl font-bold text-gray-900">{stats.totalInWarehouse}</p>
          </Card>

          <Card variant="bordered" padding="md">
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-orange-600" />
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-1">Total Checkouts</p>
            <p className="text-3xl font-bold text-gray-900">{stats.totalCheckouts}</p>
          </Card>
        </div>

        {/* View Mode Tabs - Clean Header */}
        <div className="border-b border-gray-200">
          <div className="flex gap-2 px-4 md:px-6">
            <button
              onClick={() => setViewMode('transactions')}
              className={`px-4 py-4 font-medium text-sm border-b-2 transition-colors whitespace-nowrap ${
                viewMode === 'transactions'
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <Clock className="w-4 h-4 inline mr-2" />
              Transactions
            </button>
            <button
              onClick={() => setViewMode('locations')}
              className={`px-4 py-4 font-medium text-sm border-b-2 transition-colors whitespace-nowrap ${
                viewMode === 'locations'
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <MapPin className="w-4 h-4 inline mr-2" />
              Locations
            </button>
          </div>
        </div>

        {/* TRANSACTIONS VIEW */}
        {viewMode === 'transactions' && (
          <div className="space-y-4 pt-6">
            {/* Search and Filters */}
            <div className="px-4 md:px-6 space-y-4">
              {/* Filters */}
              <div className="flex flex-col md:flex-row gap-3">
                <div className="flex-1">
                  <Input
                    placeholder="Search by barcode, purpose, or items..."
                    icon={<Search className="w-4 h-4" />}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    fullWidth
                  />
                </div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as CheckoutStatus | 'all')}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="partial-return">Partial Return</option>
                  <option value="overdue">Overdue</option>
                  <option value="fully-returned">Returned</option>
                </select>
              </div>
            </div>

            {/* Content - Direct under main container */}
            {loading && (
              <div className="flex justify-center items-center py-12 px-6">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
              </div>
            )}

            {!loading && displayCheckouts.length === 0 && (
              <div className="text-center py-12 px-4 md:px-6">
                <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 font-medium">No checkouts found</p>
              </div>
            )}

            {!loading && displayCheckouts.length > 0 && isMobile && (
              <div className="space-y-3 px-4 md:px-6">
                {displayCheckouts.map((checkout) => {
                  const daysInfo = getDaysInfo(checkout.expectedReturnDate);
                  const isOwnCheckout = checkout.checkedOutByEmail === currentUser.email;

                  return (
                    <Card key={checkout.id} variant="bordered" padding="md">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <p className="font-mono text-sm font-medium text-gray-900">
                            {checkout.masterBarcode}
                          </p>
                          {checkout.purpose && (
                            <p className="text-sm text-gray-600 mt-0.5">{checkout.purpose}</p>
                          )}
                        </div>
                        {getStatusBadge(checkout.status)}
                      </div>

                      <div className="grid grid-cols-2 gap-3 mb-3">
                        <div>
                          <p className="text-xs text-gray-500">Checked Out By</p>
                          <p className="text-sm font-medium text-gray-900">
                            {isOwnCheckout ? 'You' : checkout.checkedOutBy}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Items</p>
                          <p className="text-sm font-medium text-gray-900">
                            {checkout.status === 'partial-return'
                              ? `${checkout.remainingItems}/${checkout.totalItems} out`
                              : `${checkout.totalItems} items`}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Checkout Date</p>
                          <p className="text-sm font-medium text-gray-900">
                            {new Date(checkout.checkedOutDate).toLocaleDateString()}
                          </p>
                        </div>
                        {daysInfo && (
                          <div>
                            <p className="text-xs text-gray-500">Due Date</p>
                            <p className={`text-sm font-medium ${daysInfo.className}`}>
                              {daysInfo.text}
                            </p>
                          </div>
                        )}
                      </div>

                      {(checkout.status === 'active' || checkout.status === 'partial-return' || checkout.status === 'overdue') && isOwnCheckout && (
                        <div className="pt-3 border-t border-gray-100">
                          <Button size="sm" fullWidth variant="outline">
                            Check-In Items
                          </Button>
                        </div>
                      )}
                    </Card>
                  );
                })}
              </div>
            )}

            {!loading && displayCheckouts.length > 0 && !isMobile && (
              <div className="px-4 md:px-6">
                <Card variant="bordered" padding="none">
                  <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th onClick={() => handleTransactionSort('masterBarcode')} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100 transition-colors">Master Barcode {getTransactionSortIcon('masterBarcode')}</th>
                        <th onClick={() => handleTransactionSort('checkedOutBy')} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100 transition-colors">Checked Out By {getTransactionSortIcon('checkedOutBy')}</th>
                        <th onClick={() => handleTransactionSort('purpose')} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100 transition-colors">Purpose {getTransactionSortIcon('purpose')}</th>
                        <th onClick={() => handleTransactionSort('items')} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100 transition-colors">Items {getTransactionSortIcon('items')}</th>
                        <th onClick={() => handleTransactionSort('dueDate')} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100 transition-colors">Due Date {getTransactionSortIcon('dueDate')}</th>
                        <th onClick={() => handleTransactionSort('status')} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100 transition-colors">Status {getTransactionSortIcon('status')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {displayCheckouts.map((checkout) => {
                        const daysInfo = getDaysInfo(checkout.expectedReturnDate);
                        const isOwnCheckout = checkout.checkedOutByEmail === currentUser.email;

                        return (
                          <tr key={checkout.id} className="border-b border-gray-200 hover:bg-gray-50">
                            <td className="px-6 py-4">
                              <p className="font-mono text-sm text-gray-900">{checkout.masterBarcode}</p>
                            </td>
                            <td className="px-6 py-4">
                              <p className="text-sm text-gray-900">{isOwnCheckout ? 'You' : checkout.checkedOutBy}</p>
                            </td>
                            <td className="px-6 py-4">
                              <p className="text-sm text-gray-900">{checkout.purpose || '-'}</p>
                            </td>
                            <td className="px-6 py-4">
                              <p className="text-sm text-gray-900">
                                {checkout.status === 'partial-return'
                                  ? `${checkout.remainingItems}/${checkout.totalItems}`
                                  : checkout.totalItems}
                              </p>
                            </td>
                            <td className="px-6 py-4">
                              {daysInfo ? (
                                <p className={`text-sm font-medium ${daysInfo.className}`}>{daysInfo.text}</p>
                              ) : (
                                <p className="text-sm text-gray-500">-</p>
                              )}
                            </td>
                            <td className="px-6 py-4">{getStatusBadge(checkout.status)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  </div>
                </Card>
              </div>
            )}
          </div>
        )}

        {/* LOCATIONS VIEW */}
        {viewMode === 'locations' && (
          <div className="space-y-4 pt-6">
            {/* Search and Filters */}
            <div className="px-4 md:px-6">
              <div className="flex flex-col md:flex-row gap-3">
              <div className="flex-1">
                <Input
                  placeholder="Search by location, person, or equipment..."
                  icon={<Search className="w-4 h-4" />}
                  value={locationSearch}
                  onChange={(e) => setLocationSearch(e.target.value)}
                  fullWidth
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setFilterType('all')}
                  className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                    filterType === 'all'
                      ? 'bg-primary-600 text-white'
                      : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setFilterType('person')}
                  className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                    filterType === 'person'
                      ? 'bg-primary-600 text-white'
                      : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  By Person
                </button>
                <button
                  onClick={() => setFilterType('site')}
                  className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                    filterType === 'site'
                      ? 'bg-primary-600 text-white'
                      : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  By Site
                </button>
              </div>
              </div>
            </div>

            {/* Content */}
            {loading && (
              <div className="flex justify-center items-center py-12 px-4 md:px-6">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
              </div>
            )}

            {!loading && filteredLocations.length === 0 && (
              <div className="text-center py-12 px-4 md:px-6">
                <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 font-medium">No equipment at locations</p>
              </div>
            )}

            {!loading && filteredLocations.length > 0 && isMobile && (
              <div className="space-y-4 px-4 md:px-6">
                {filteredLocations.map((summary, index) => (
                  <Card key={index} variant="bordered" padding="md">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                          <MapPin className="w-5 h-5 text-primary-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">{summary.location}</h3>
                          <p className="text-xs text-gray-500 mt-0.5">{summary.checkedOutBy}</p>
                        </div>
                      </div>
                      {isOverdue(summary.expectedReturn) && (
                        <Badge variant="danger">Overdue</Badge>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2 mb-4 text-sm">
                      <div>
                        <p className="text-xs text-gray-500">Items Out</p>
                        <p className="font-semibold text-gray-900">{summary.totalItems}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Types</p>
                        <p className="font-semibold text-gray-900">{summary.uniqueEquipment}</p>
                      </div>
                    </div>

                    {summary.items.length > 0 && (
                      <div className="border-t border-gray-100 pt-3">
                        <p className="text-xs font-semibold text-gray-700 mb-2">Equipment:</p>
                        <div className="space-y-1 text-xs">
                          {summary.items.slice(0, 3).map((item, idx) => (
                            <p key={idx} className="text-gray-600">
                              • {item.itemName} ({item.quantity}x)
                            </p>
                          ))}
                          {summary.items.length > 3 && (
                            <p className="text-gray-500 italic">+{summary.items.length - 3} more</p>
                          )}
                        </div>
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            )}

            {!loading && filteredLocations.length > 0 && !isMobile && (
              <div className="px-4 md:px-6">
                <Card variant="bordered" padding="none">
                  <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th onClick={() => handleLocationSort('location')} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100 transition-colors">Location {getLocationSortIcon('location')}</th>
                        <th onClick={() => handleLocationSort('checkedOutBy')} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100 transition-colors">Checked Out By {getLocationSortIcon('checkedOutBy')}</th>
                        <th onClick={() => handleLocationSort('totalItems')} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100 transition-colors">Items {getLocationSortIcon('totalItems')}</th>
                        <th onClick={() => handleLocationSort('uniqueEquipment')} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100 transition-colors">Types {getLocationSortIcon('uniqueEquipment')}</th>
                        <th onClick={() => handleLocationSort('checkoutDate')} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100 transition-colors">Checkout Date {getLocationSortIcon('checkoutDate')}</th>
                        <th onClick={() => handleLocationSort('expectedReturn')} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100 transition-colors">Expected Return {getLocationSortIcon('expectedReturn')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredLocations.map((summary, index) => (
                        <tr key={index} className="border-b border-gray-200 hover:bg-gray-50">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <MapPin className="w-4 h-4 text-gray-400" />
                              <p className="font-medium text-gray-900">{summary.location}</p>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <p className="text-sm text-gray-900">{summary.checkedOutBy}</p>
                          </td>
                          <td className="px-6 py-4">
                            <p className="text-sm font-semibold text-gray-900">{summary.totalItems}</p>
                          </td>
                          <td className="px-6 py-4">
                            <p className="text-sm text-gray-900">{summary.uniqueEquipment}</p>
                          </td>
                          <td className="px-6 py-4">
                            <p className="text-sm text-gray-900">
                              {new Date(summary.checkoutDate).toLocaleDateString()}
                            </p>
                          </td>
                          <td className="px-6 py-4">
                            {summary.expectedReturn ? (
                              <p className={`text-sm font-medium ${isOverdue(summary.expectedReturn) ? 'text-red-600' : 'text-gray-900'}`}>
                                {new Date(summary.expectedReturn).toLocaleDateString()}
                              </p>
                            ) : (
                              <p className="text-sm text-gray-500">-</p>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  </div>
                </Card>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
