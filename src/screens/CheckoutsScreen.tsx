import { useEffect, useState } from 'react';
import { Search, Filter, Package, Clock, User, Calendar, ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { BulkCheckInModal } from '../components/modals/BulkCheckInModal';
import { useCheckoutStore } from '../store/checkoutStore';
import { useResponsive } from '../hooks/useResponsive';
import { getCurrentUser } from '../lib/auth';
import inventoryService from '../services/inventory.service';
import toast from 'react-hot-toast';
import type { CheckoutStatus } from '../types/checkout.types';
import type { BulkCheckInData } from '../components/modals/BulkCheckInModal';

type TabType = 'my-checkouts' | 'all-checkouts';

export const CheckoutsScreen: React.FC = () => {
  const { filteredCheckouts, fetchCheckouts, setFilters, loading } = useCheckoutStore();
  const { isMobile } = useResponsive();
  const currentUser = getCurrentUser();

  // Null check for currentUser
  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-gray-600 text-lg">Please log in to access checkouts</p>
        </div>
      </div>
    );
  }

  const [activeTab, setActiveTab] = useState<TabType>('my-checkouts');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<CheckoutStatus | 'all'>('all');
  const [sortColumn, setSortColumn] = useState<string>('masterBarcode');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [isCheckInModalOpen, setIsCheckInModalOpen] = useState(false);
  const [selectedCheckoutForCheckIn, setSelectedCheckoutForCheckIn] = useState<any>(null);

  useEffect(() => {
    fetchCheckouts();
  }, []);

  useEffect(() => {
    // Apply filters based on active tab
    if (activeTab === 'my-checkouts') {
      setFilters({
        userId: currentUser.email,
        status: statusFilter === 'all' ? undefined : statusFilter,
        search: searchTerm,
        showMyCheckoutsFirst: false,
      });
    } else {
      setFilters({
        userId: undefined,
        status: statusFilter === 'all' ? undefined : statusFilter,
        search: searchTerm,
        showMyCheckoutsFirst: true,
      });
    }
  }, [activeTab, statusFilter, searchTerm, currentUser.email]);

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

  const handleCheckInClick = (checkout: any) => {
    setSelectedCheckoutForCheckIn(checkout);
    setIsCheckInModalOpen(true);
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

  const handleCheckInSubmit = async (checkInData: BulkCheckInData) => {
    try {
      await inventoryService.checkInBulk(checkInData);
      toast.success('Items checked in successfully!');
      setIsCheckInModalOpen(false);
      await fetchCheckouts();
    } catch (error: any) {
      toast.error(error?.message || 'Failed to check in items');
    }
  };

  const tabCounts = {
    'my-checkouts': filteredCheckouts.filter(c => c.checkedOutByEmail === currentUser.email).length,
    'all-checkouts': filteredCheckouts.length,
  };

  const displayCheckouts = useMemo(() => {
    const baseCheckouts = activeTab === 'my-checkouts'
      ? filteredCheckouts.filter(c => c.checkedOutByEmail === currentUser.email)
      : filteredCheckouts;

    return [...baseCheckouts].sort((a, b) => {
      const getSortValue = (checkout: any) => {
        switch (sortColumn) {
          case 'masterBarcode':
            return checkout.masterBarcode.toLowerCase();
          case 'checkedOutBy':
            return checkout.checkedOutBy.toLowerCase();
          case 'items':
            return checkout.totalItems || 0;
          case 'purpose':
            return (checkout.purpose || '').toLowerCase();
          case 'checkoutDate':
            return new Date(checkout.checkedOutDate).getTime();
          case 'dueDate':
            return checkout.expectedReturnDate ? new Date(checkout.expectedReturnDate).getTime() : 0;
          case 'status':
            const statusOrder = { 'active': 0, 'partial-return': 1, 'overdue': 2, 'fully-returned': 3 };
            return statusOrder[checkout.status as keyof typeof statusOrder] ?? 4;
          default:
            return checkout.masterBarcode.toLowerCase();
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
  }, [activeTab, filteredCheckouts, currentUser.email, sortColumn, sortDirection]);

  return (
    <div className="min-h-full bg-gray-50">
      <div className="p-4 md:p-6  space-y-6">
        {/* Header Container */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Checkouts</h1>
              <p className="text-gray-600 mt-1">Manage and track all equipment checkouts</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('my-checkouts')}
          className={`px-4 py-3 font-medium text-sm border-b-2 transition-colors ${
            activeTab === 'my-checkouts'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          My Checkouts
          {tabCounts['my-checkouts'] > 0 && (
            <span className="ml-2 bg-blue-100 text-blue-800 text-xs font-medium px-2 py-0.5 rounded-full">
              {tabCounts['my-checkouts']}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('all-checkouts')}
          className={`px-4 py-3 font-medium text-sm border-b-2 transition-colors ${
            activeTab === 'all-checkouts'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          All Checkouts
          {tabCounts['all-checkouts'] > 0 && (
            <span className="ml-2 bg-gray-200 text-gray-800 text-xs font-medium px-2 py-0.5 rounded-full">
              {tabCounts['all-checkouts']}
            </span>
          )}
        </button>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-3 mb-6">
        <div className="flex-1">
          <Input
            placeholder="Search by barcode, purpose, or items..."
            icon={<Search className="w-4 h-4" />}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            fullWidth
          />
        </div>
        <div className="flex gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as CheckoutStatus | 'all')}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="partial-return">Partial Return</option>
            <option value="overdue">Overdue</option>
            <option value="fully-returned">Returned</option>
          </select>
        </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        )}

        {/* Checkouts List - Mobile Cards */}
        {!loading && isMobile && (
          <div className="space-y-3">
          {displayCheckouts.map((checkout) => {
            const daysInfo = getDaysInfo(checkout.expectedReturnDate);
            const isOwnCheckout = checkout.checkedOutByEmail === currentUser.email;

            return (
              <Card key={checkout.id} variant="bordered" padding="md">
                {/* Header */}
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

                {/* Info Grid */}
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

                {/* Actions */}
                {(checkout.status === 'active' || checkout.status === 'partial-return' || checkout.status === 'overdue') && isOwnCheckout && (
                  <div className="pt-3 border-t border-gray-100">
                    <Button
                      size="sm"
                      fullWidth
                      variant="outline"
                      onClick={() => handleCheckInClick(checkout)}
                    >
                      Check-In Items
                    </Button>
                  </div>
                )}
              </Card>
            );
          })}
          </div>
        )}

        {/* Checkouts List - Desktop Table */}
        {!loading && !isMobile && (
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th onClick={() => handleSort('masterBarcode')} className="px-3 py-2 text-left text-xs font-semibold text-gray-700 cursor-pointer hover:bg-gray-100 transition-colors">Master Barcode {getSortIcon('masterBarcode')}</th>
                  <th onClick={() => handleSort('checkedOutBy')} className="px-3 py-2 text-left text-xs font-semibold text-gray-700 cursor-pointer hover:bg-gray-100 transition-colors">Checked Out By {getSortIcon('checkedOutBy')}</th>
                  <th onClick={() => handleSort('items')} className="px-3 py-2 text-left text-xs font-semibold text-gray-700 cursor-pointer hover:bg-gray-100 transition-colors">Items {getSortIcon('items')}</th>
                  <th onClick={() => handleSort('purpose')} className="px-3 py-2 text-left text-xs font-semibold text-gray-700 cursor-pointer hover:bg-gray-100 transition-colors">Purpose {getSortIcon('purpose')}</th>
                  <th onClick={() => handleSort('checkoutDate')} className="px-3 py-2 text-left text-xs font-semibold text-gray-700 cursor-pointer hover:bg-gray-100 transition-colors">Checkout Date {getSortIcon('checkoutDate')}</th>
                  <th onClick={() => handleSort('dueDate')} className="px-3 py-2 text-left text-xs font-semibold text-gray-700 cursor-pointer hover:bg-gray-100 transition-colors">Due Date {getSortIcon('dueDate')}</th>
                  <th onClick={() => handleSort('status')} className="px-3 py-2 text-left text-xs font-semibold text-gray-700 cursor-pointer hover:bg-gray-100 transition-colors">Status {getSortIcon('status')}</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {displayCheckouts.map((checkout) => {
                  const daysInfo = getDaysInfo(checkout.expectedReturnDate);
                  const isOwnCheckout = checkout.checkedOutByEmail === currentUser.email;

                  return (
                    <tr
                      key={checkout.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-3 py-2">
                        <p className="font-mono font-medium text-gray-900">
                          {checkout.masterBarcode}
                        </p>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-900">
                            {isOwnCheckout ? 'You' : checkout.checkedOutBy}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-2">
                          <Package className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-900">
                            {checkout.status === 'partial-return'
                              ? `${checkout.remainingItems}/${checkout.totalItems} out`
                              : `${checkout.totalItems}`}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-2">
                        <p className="text-gray-900 max-w-xs truncate">
                          {checkout.purpose || '-'}
                        </p>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-900">
                            {new Date(checkout.checkedOutDate).toLocaleDateString()}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-2">
                        {daysInfo ? (
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-gray-400" />
                            <span className={`font-medium ${daysInfo.className}`}>
                              {daysInfo.text}
                            </span>
                          </div>
                        ) : (
                          <span className="text-gray-500">-</span>
                        )}
                      </td>
                      <td className="px-3 py-2">{getStatusBadge(checkout.status)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          </div>
        )}

        {/* Empty State */}
        {!loading && displayCheckouts.length === 0 && (
          <Card variant="bordered">
          <div className="flex flex-col items-center justify-center py-12 text-gray-500">
            <Package className="w-16 h-16 mb-4 opacity-50" />
            <p className="text-lg font-medium mb-2">No checkouts found</p>
            <p className="text-sm">
              {activeTab === 'my-checkouts'
                ? "You don't have any checkouts matching the filters"
                : 'No checkouts match the current filters'}
            </p>
          </div>
          </Card>
        )}
      </div>

      {/* Check-In Modal */}
      <BulkCheckInModal
        isOpen={isCheckInModalOpen}
        onClose={() => setIsCheckInModalOpen(false)}
        onCheckIn={handleCheckInSubmit}
      />
    </div>
  );
};
