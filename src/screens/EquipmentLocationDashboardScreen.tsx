import { useEffect, useState, useMemo, useCallback } from 'react';
import { MapPin, Package, User, Search, Building2, TrendingUp, Box, Clock, ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Input } from '../components/ui/Input';
import { useCheckoutStore } from '../store/checkoutStore';
import { useInventoryStore } from '../store/inventoryStore';
import { useResponsive } from '../hooks/useResponsive';
import { formatDate } from '../lib/utils';

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

export const EquipmentLocationDashboardScreen: React.FC = () => {
  const { filteredCheckouts, fetchCheckouts, loading: checkoutsLoading } = useCheckoutStore();
  const { items, fetchInventory, loading: inventoryLoading } = useInventoryStore();
  const { isMobile } = useResponsive();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'person' | 'site'>('all');
  const [sortColumn, setSortColumn] = useState<string>('location');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  useEffect(() => {
    fetchCheckouts();
    fetchInventory();
  }, []);

  // Group checkouts by location/person
  const locationSummaries = useMemo(() => {
    const summaries: LocationSummary[] = [];

    // Process active checkouts
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
            // Determine location - either site location or person's name
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

  // Filter summaries based on search and filter type
  const filteredSummaries = useMemo(() => {
    let filtered = [...locationSummaries];

    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(s =>
        s.location.toLowerCase().includes(search) ||
        s.checkedOutBy.toLowerCase().includes(search) ||
        s.items.some(item => item.itemName.toLowerCase().includes(search))
      );
    }

    return filtered.sort((a, b) => {
      const getSortValue = (summary: LocationSummary) => {
        switch (sortColumn) {
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
  }, [locationSummaries, searchTerm, sortColumn, sortDirection]);

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

  // Calculate stats
  const stats = useMemo(() => {
    const totalEquipmentOut = locationSummaries.reduce((sum, s) => sum + s.totalItems, 0);
    const totalLocations = locationSummaries.length;
    const uniqueUsers = new Set(locationSummaries.map(s => s.checkedOutByEmail)).size;

    // Total inventory value - items in warehouse
    const totalInventoryItems = items.reduce((sum, item) => sum + item.quantity, 0);

    return {
      totalEquipmentOut,
      totalLocations,
      uniqueUsers,
      totalInWarehouse: totalInventoryItems - totalEquipmentOut,
    };
  }, [locationSummaries, items]);

  const loading = checkoutsLoading || inventoryLoading;

  const isOverdue = (expectedReturn?: string) => {
    if (!expectedReturn) return false;
    return new Date(expectedReturn) < new Date();
  };

  return (
    <div className="min-h-full bg-gray-50">
      <div className="p-4 md:p-6  space-y-6">
        {/* Header Container */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Equipment Location Tracker</h1>
              <p className="text-gray-600 mt-1">
                Track where all equipment is currently located and who has checked it out
              </p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          <Card variant="bordered" padding="md">
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center">
                <Package className="w-6 h-6 text-primary-600" />
              </div>
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
            <p className="text-sm text-gray-600 mb-1">Equipment Checked Out</p>
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
            <p className="text-sm text-gray-600 mb-1">Users With Equipment</p>
            <p className="text-3xl font-bold text-gray-900">{stats.uniqueUsers}</p>
          </Card>

          <Card variant="bordered" padding="md">
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <Box className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-1">In Warehouse</p>
            <p className="text-3xl font-bold text-gray-900">{stats.totalInWarehouse}</p>
          </Card>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex-1">
            <Input
              placeholder="Search by location, person, or equipment..."
              icon={<Search className="w-4 h-4" />}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
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

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        )}

        {/* Location Cards - Mobile */}
        {!loading && isMobile && (
          <div className="space-y-4">
            {filteredSummaries.map((summary, index) => (
              <Card key={index} variant="bordered" padding="md">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                      <MapPin className="w-5 h-5 text-primary-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{summary.location}</h3>
                      <p className="text-sm text-gray-600">{summary.checkedOutBy}</p>
                    </div>
                  </div>
                  {isOverdue(summary.expectedReturn) && (
                    <Badge variant="danger">Overdue</Badge>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3 mb-3 pb-3 border-b border-gray-100">
                  <div>
                    <p className="text-xs text-gray-500">Total Items</p>
                    <p className="text-lg font-semibold text-gray-900">{summary.totalItems}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Unique Equipment</p>
                    <p className="text-lg font-semibold text-gray-900">{summary.uniqueEquipment}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-medium text-gray-700">Equipment:</p>
                  {summary.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center text-sm">
                      <span className="text-gray-600">{item.itemName}</span>
                      <span className="font-medium text-gray-900">x{item.quantity}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-2 text-xs text-gray-500">
                  <Clock className="w-3 h-3" />
                  <span>Since {formatDate(summary.checkoutDate)}</span>
                  {summary.expectedReturn && (
                    <span className={isOverdue(summary.expectedReturn) ? 'text-red-600 font-medium' : ''}>
                      • Due {formatDate(summary.expectedReturn)}
                    </span>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Location Table - Desktop */}
        {!loading && !isMobile && (
          <Card variant="bordered" padding="none">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th onClick={() => handleSort('location')} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100 transition-colors">
                      Location / Purpose {getSortIcon('location')}
                    </th>
                    <th onClick={() => handleSort('checkedOutBy')} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100 transition-colors">
                      Checked Out By {getSortIcon('checkedOutBy')}
                    </th>
                    <th onClick={() => handleSort('totalItems')} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100 transition-colors">
                      Total Items {getSortIcon('totalItems')}
                    </th>
                    <th onClick={() => handleSort('uniqueEquipment')} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100 transition-colors">
                      Equipment {getSortIcon('uniqueEquipment')}
                    </th>
                    <th onClick={() => handleSort('checkoutDate')} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100 transition-colors">
                      Checkout Date {getSortIcon('checkoutDate')}
                    </th>
                    <th onClick={() => handleSort('expectedReturn')} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100 transition-colors">
                      Expected Return {getSortIcon('expectedReturn')}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredSummaries.map((summary, index) => (
                    <tr key={index} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <MapPin className="w-4 h-4 text-primary-600" />
                          </div>
                          <span className="font-medium text-gray-900">{summary.location}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-900">{summary.checkedOutBy}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-semibold text-gray-900">{summary.totalItems}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="max-w-xs">
                          <div className="text-sm text-gray-600 space-y-1">
                            {summary.items.slice(0, 3).map((item, idx) => (
                              <div key={idx} className="flex justify-between">
                                <span className="truncate mr-2">{item.itemName}</span>
                                <span className="font-medium text-gray-900">x{item.quantity}</span>
                              </div>
                            ))}
                            {summary.items.length > 3 && (
                              <p className="text-xs text-primary-600 font-medium">
                                +{summary.items.length - 3} more
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-900">{formatDate(summary.checkoutDate)}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {summary.expectedReturn ? (
                          <div className="flex items-center gap-2">
                            {isOverdue(summary.expectedReturn) ? (
                              <Badge variant="danger">Overdue - {formatDate(summary.expectedReturn)}</Badge>
                            ) : (
                              <span className="text-sm text-gray-600">{formatDate(summary.expectedReturn)}</span>
                            )}
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* Empty State */}
        {!loading && filteredSummaries.length === 0 && (
          <Card variant="bordered">
            <div className="flex flex-col items-center justify-center py-12 text-gray-500">
              <MapPin className="w-16 h-16 mb-4 opacity-50" />
              <p className="text-lg font-medium mb-2">No equipment currently checked out</p>
              <p className="text-sm">All equipment is in the warehouse</p>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};
