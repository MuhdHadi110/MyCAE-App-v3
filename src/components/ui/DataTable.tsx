import React, { useState, useMemo, useCallback } from 'react';
import { ChevronUp, ChevronDown, ChevronsUpDown, ChevronLeft, ChevronRight, Search, Filter, X } from 'lucide-react';
import { cn } from '../../lib/utils';
import { EmptyState } from './EmptyState';

// Column definition
export interface Column<T> {
  /** Unique key for the column */
  key: string;
  /** Column header label */
  header: string;
  /** Accessor function or key path */
  accessor: keyof T | ((row: T) => React.ReactNode);
  /** Custom cell renderer */
  cell?: (value: unknown, row: T, index: number) => React.ReactNode;
  /** Whether the column is sortable */
  sortable?: boolean;
  /** Column width (Tailwind class like 'w-32') */
  width?: string;
  /** Text alignment */
  align?: 'left' | 'center' | 'right';
  /** Hide on mobile */
  hideOnMobile?: boolean;
  /** Custom header class */
  headerClassName?: string;
  /** Custom cell class */
  cellClassName?: string;
}

// Mobile card renderer props
export interface MobileCardProps<T> {
  row: T;
  index: number;
  columns: Column<T>[];
  onRowClick?: (row: T) => void;
  actions?: React.ReactNode;
}

// DataTable props
export interface DataTableProps<T> {
  /** Data array to display */
  data: T[];
  /** Column definitions */
  columns: Column<T>[];
  /** Unique key extractor for rows */
  getRowKey: (row: T) => string;
  /** Loading state */
  loading?: boolean;
  /** Enable pagination */
  pagination?: boolean;
  /** Items per page options */
  pageSizeOptions?: number[];
  /** Default page size */
  defaultPageSize?: number;
  /** Enable search */
  searchable?: boolean;
  /** Search placeholder */
  searchPlaceholder?: string;
  /** Custom search filter function */
  searchFilter?: (row: T, query: string) => boolean;
  /** Enable sorting */
  sortable?: boolean;
  /** Default sort column */
  defaultSortKey?: string;
  /** Default sort direction */
  defaultSortDirection?: 'asc' | 'desc';
  /** Row click handler */
  onRowClick?: (row: T) => void;
  /** Row actions renderer */
  rowActions?: (row: T) => React.ReactNode;
  /** Empty state content */
  emptyState?: React.ReactNode;
  /** Empty state title */
  emptyTitle?: string;
  /** Empty state description */
  emptyDescription?: string;
  /** Custom mobile card renderer */
  mobileCard?: (props: MobileCardProps<T>) => React.ReactNode;
  /** Show mobile cards instead of table on small screens */
  responsiveCards?: boolean;
  /** Table container className */
  className?: string;
  /** Sticky header */
  stickyHeader?: boolean;
  /** Row selection */
  selectable?: boolean;
  /** Selected rows (controlled) */
  selectedRows?: string[];
  /** Selection change handler */
  onSelectionChange?: (selectedIds: string[]) => void;
  /** Bulk action header (shown when rows selected) */
  bulkActions?: (selectedIds: string[]) => React.ReactNode;
}

// Skeleton loader
const TableSkeleton = ({ columns, rows = 5 }: { columns: number; rows?: number }) => (
  <>
    {Array.from({ length: rows }).map((_, rowIdx) => (
      <tr key={rowIdx} className="animate-pulse">
        {Array.from({ length: columns }).map((_, colIdx) => (
          <td key={colIdx} className="px-6 py-4">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
          </td>
        ))}
      </tr>
    ))}
  </>
);

// Mobile card skeleton
const CardSkeleton = ({ count = 3 }: { count?: number }) => (
  <div className="space-y-4">
    {Array.from({ length: count }).map((_, idx) => (
      <div key={idx} className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 animate-pulse">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-3"></div>
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-2"></div>
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
      </div>
    ))}
  </div>
);

export function DataTable<T>({
  data,
  columns,
  getRowKey,
  loading = false,
  pagination = true,
  pageSizeOptions = [10, 25, 50, 100],
  defaultPageSize = 10,
  searchable = false,
  searchPlaceholder = 'Search...',
  searchFilter,
  sortable = true,
  defaultSortKey,
  defaultSortDirection = 'asc',
  onRowClick,
  rowActions,
  emptyState,
  emptyTitle = 'No data found',
  emptyDescription = 'There are no items to display.',
  mobileCard,
  responsiveCards = true,
  className,
  stickyHeader = false,
  selectable = false,
  selectedRows: controlledSelectedRows,
  onSelectionChange,
  bulkActions,
}: DataTableProps<T>) {
  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [sortKey, setSortKey] = useState<string | undefined>(defaultSortKey);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>(defaultSortDirection);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(defaultPageSize);
  const [internalSelectedRows, setInternalSelectedRows] = useState<string[]>([]);

  // Use controlled or internal selection
  const selectedRows = controlledSelectedRows ?? internalSelectedRows;
  const setSelectedRows = onSelectionChange ?? setInternalSelectedRows;

  // Filter data by search query
  const filteredData = useMemo(() => {
    if (!searchQuery.trim()) return data;

    return data.filter((row) => {
      if (searchFilter) {
        return searchFilter(row, searchQuery);
      }

      // Default: search across all string/number values
      return columns.some((col) => {
        const value =
          typeof col.accessor === 'function' ? col.accessor(row) : (row as Record<string, unknown>)[col.accessor as string];

        if (value == null) return false;
        return String(value).toLowerCase().includes(searchQuery.toLowerCase());
      });
    });
  }, [data, searchQuery, searchFilter, columns]);

  // Sort data
  const sortedData = useMemo(() => {
    if (!sortKey || !sortable) return filteredData;

    const column = columns.find((c) => c.key === sortKey);
    if (!column || column.sortable === false) return filteredData;

    return [...filteredData].sort((a, b) => {
      const aValue =
        typeof column.accessor === 'function' ? column.accessor(a) : (a as Record<string, unknown>)[column.accessor as string];
      const bValue =
        typeof column.accessor === 'function' ? column.accessor(b) : (b as Record<string, unknown>)[column.accessor as string];

      // Handle null/undefined
      if (aValue == null && bValue == null) return 0;
      if (aValue == null) return sortDirection === 'asc' ? 1 : -1;
      if (bValue == null) return sortDirection === 'asc' ? -1 : 1;

      // Compare values
      let comparison = 0;
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        comparison = aValue - bValue;
      } else if (aValue instanceof Date && bValue instanceof Date) {
        comparison = aValue.getTime() - bValue.getTime();
      } else {
        comparison = String(aValue).localeCompare(String(bValue));
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [filteredData, sortKey, sortDirection, sortable, columns]);

  // Paginate data
  const paginatedData = useMemo(() => {
    if (!pagination) return sortedData;

    const start = (currentPage - 1) * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [sortedData, currentPage, pageSize, pagination]);

  // Pagination info
  const totalPages = Math.ceil(sortedData.length / pageSize);
  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, sortedData.length);

  // Handlers
  const handleSort = useCallback(
    (key: string) => {
      if (!sortable) return;

      const column = columns.find((c) => c.key === key);
      if (!column || column.sortable === false) return;

      if (sortKey === key) {
        setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
      } else {
        setSortKey(key);
        setSortDirection('asc');
      }
      setCurrentPage(1);
    },
    [sortable, sortKey, columns]
  );

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  const handlePageSizeChange = useCallback((size: number) => {
    setPageSize(size);
    setCurrentPage(1);
  }, []);

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
  }, []);

  const toggleRowSelection = useCallback(
    (rowId: string) => {
      setSelectedRows((prev) => (prev.includes(rowId) ? prev.filter((id) => id !== rowId) : [...prev, rowId]));
    },
    [setSelectedRows]
  );

  const toggleAllSelection = useCallback(() => {
    if (selectedRows.length === paginatedData.length) {
      setSelectedRows([]);
    } else {
      setSelectedRows(paginatedData.map((row) => getRowKey(row)));
    }
  }, [selectedRows, paginatedData, setSelectedRows, getRowKey]);

  // Visible columns (hide on mobile)
  const visibleColumns = columns.filter((col) => !col.hideOnMobile);

  // Get cell value
  const getCellValue = (row: T, column: Column<T>): React.ReactNode => {
    const rawValue = typeof column.accessor === 'function' ? column.accessor(row) : (row as Record<string, unknown>)[column.accessor as string];

    if (column.cell) {
      return column.cell(rawValue, row, paginatedData.indexOf(row));
    }

    return rawValue as React.ReactNode;
  };

  // Render sort icon
  const renderSortIcon = (column: Column<T>) => {
    if (!sortable || column.sortable === false) return null;

    if (sortKey === column.key) {
      return sortDirection === 'asc' ? (
        <ChevronUp className="w-4 h-4" />
      ) : (
        <ChevronDown className="w-4 h-4" />
      );
    }

    return <ChevronsUpDown className="w-4 h-4 text-gray-400" />;
  };

  // Render mobile card
  const renderMobileCard = (row: T, index: number) => {
    if (mobileCard) {
      return mobileCard({
        row,
        index,
        columns,
        onRowClick,
        actions: rowActions?.(row),
      });
    }

    // Default mobile card
    return (
      <div
        key={getRowKey(row)}
        className={cn(
          'bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-4',
          onRowClick && 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700'
        )}
        onClick={() => onRowClick?.(row)}
      >
        {visibleColumns.map((column) => (
          <div key={column.key} className="flex justify-between items-start py-2 border-b border-gray-100 dark:border-gray-700 last:border-0">
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">{column.header}</span>
            <span className="text-sm text-gray-900 dark:text-white text-right">{getCellValue(row, column)}</span>
          </div>
        ))}
        {rowActions && <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">{rowActions(row)}</div>}
      </div>
    );
  };

  // Show empty state
  if (!loading && data.length === 0) {
    return (
      <div className={className}>
        {emptyState || <EmptyState title={emptyTitle} description={emptyDescription} />}
      </div>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Search and bulk actions bar */}
      {(searchable || (selectable && selectedRows.length > 0)) && (
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          {searchable && (
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder={searchPlaceholder}
                className="w-full pl-10 pr-10 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
              {searchQuery && (
                <button
                  onClick={() => handleSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          )}

          {selectable && selectedRows.length > 0 && bulkActions && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {selectedRows.length} selected
              </span>
              {bulkActions(selectedRows)}
            </div>
          )}
        </div>
      )}

      {/* Desktop Table */}
      <div className={cn('hidden md:block overflow-x-auto bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700')}>
        <table className="w-full">
          <thead className={cn('bg-gray-50 dark:bg-gray-900', stickyHeader && 'sticky top-0 z-10')}>
            <tr>
              {selectable && (
                <th className="w-12 px-6 py-3">
                  <input
                    type="checkbox"
                    checked={selectedRows.length === paginatedData.length && paginatedData.length > 0}
                    onChange={toggleAllSelection}
                    className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                </th>
              )}
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={cn(
                    'px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider',
                    column.align === 'center' && 'text-center',
                    column.align === 'right' && 'text-right',
                    column.align !== 'center' && column.align !== 'right' && 'text-left',
                    column.width,
                    sortable && column.sortable !== false && 'cursor-pointer select-none hover:bg-gray-100 dark:hover:bg-gray-800',
                    column.headerClassName
                  )}
                  onClick={() => column.sortable !== false && handleSort(column.key)}
                >
                  <div className={cn('flex items-center gap-1', column.align === 'right' && 'justify-end', column.align === 'center' && 'justify-center')}>
                    {column.header}
                    {renderSortIcon(column)}
                  </div>
                </th>
              ))}
              {rowActions && <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {loading ? (
              <TableSkeleton columns={columns.length + (selectable ? 1 : 0) + (rowActions ? 1 : 0)} />
            ) : paginatedData.length === 0 ? (
              <tr>
                <td colSpan={columns.length + (selectable ? 1 : 0) + (rowActions ? 1 : 0)} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                  {searchQuery ? `No results found for "${searchQuery}"` : 'No data available'}
                </td>
              </tr>
            ) : (
              paginatedData.map((row) => {
                const rowId = getRowKey(row);
                const isSelected = selectedRows.includes(rowId);

                return (
                  <tr
                    key={rowId}
                    tabIndex={onRowClick ? 0 : undefined}
                    role={onRowClick ? 'button' : undefined}
                    aria-selected={selectable ? isSelected : undefined}
                    className={cn(
                      'hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors',
                      onRowClick && 'cursor-pointer focus:outline-none focus:bg-primary-50 dark:focus:bg-primary-900/30 focus:ring-2 focus:ring-inset focus:ring-primary-500',
                      isSelected && 'bg-primary-50 dark:bg-primary-900/20'
                    )}
                    onClick={() => onRowClick?.(row)}
                    onKeyDown={(e) => {
                      if (onRowClick && (e.key === 'Enter' || e.key === ' ')) {
                        e.preventDefault();
                        onRowClick(row);
                      }
                    }}
                  >
                    {selectable && (
                      <td className="w-12 px-6 py-4" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleRowSelection(rowId)}
                          className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                        />
                      </td>
                    )}
                    {columns.map((column) => (
                      <td
                        key={column.key}
                        className={cn(
                          'px-6 py-4 text-sm',
                          column.align === 'center' && 'text-center',
                          column.align === 'right' && 'text-right',
                          column.cellClassName
                        )}
                      >
                        {getCellValue(row, column)}
                      </td>
                    ))}
                    {rowActions && (
                      <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                        {rowActions(row)}
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      {responsiveCards && (
        <div className="md:hidden space-y-4">
          {loading ? (
            <CardSkeleton />
          ) : paginatedData.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              {searchQuery ? `No results found for "${searchQuery}"` : 'No data available'}
            </div>
          ) : (
            paginatedData.map((row, index) => renderMobileCard(row, index))
          )}
        </div>
      )}

      {/* Pagination */}
      {pagination && sortedData.length > 0 && (
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between px-2">
          <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
            <span>
              Showing {startItem} to {endItem} of {sortedData.length} results
            </span>
            <select
              value={pageSize}
              onChange={(e) => handlePageSizeChange(Number(e.target.value))}
              className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
            >
              {pageSizeOptions.map((size) => (
                <option key={size} value={size}>
                  {size} per page
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {/* Page numbers */}
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum: number;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }

                return (
                  <button
                    key={pageNum}
                    onClick={() => handlePageChange(pageNum)}
                    className={cn(
                      'w-8 h-8 rounded-lg text-sm font-medium transition-colors',
                      currentPage === pageNum
                        ? 'bg-primary-600 text-white'
                        : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                    )}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default DataTable;
