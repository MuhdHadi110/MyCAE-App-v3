import React, { useMemo } from 'react';
import { Eye, Edit2, Trash2, CheckCircle, DollarSign, AlertTriangle, Link2 } from 'lucide-react';
import { getStatusBadge, formatDate } from '../../lib/financeUtils';
import { DataTable, Column, MobileCardProps } from '../ui/DataTable';
import { Button } from '../ui/Button';

interface ReceivedInvoice {
  id: string;
  invoiceNumber: string;
  vendorName: string;
  currency: string;
  amount: number;
  status: string;
  description?: string;
  invoiceDate: string;
  receivedDate: string;
  dueDate?: string;
  createdAt: string;
  fileUrl?: string;
  issuedPO?: {
    poNumber: string;
  };
}

interface ReceivedInvoicesTabProps {
  receivedInvoices: any[];
  searchQuery: string;
  canVerify: boolean;
  canDelete: boolean;
  onViewDocument?: (invoice: any) => void;
  onEditInvoice?: (invoice: any) => void;
  onDeleteInvoice?: (invoice: any) => void;
  onVerify?: (invoiceId: string) => void;
  onMarkAsPaid?: (invoiceId: string) => void;
  onDispute?: (invoiceId: string) => void;
}

export const ReceivedInvoicesTab: React.FC<ReceivedInvoicesTabProps> = ({
  receivedInvoices,
  searchQuery,
  canVerify,
  canDelete,
  onViewDocument,
  onEditInvoice,
  onDeleteInvoice,
  onVerify,
  onMarkAsPaid,
  onDispute,
}) => {
  // Filter invoices based on search query
  const filteredInvoices = useMemo(() => {
    return receivedInvoices.filter((inv) => {
      const query = searchQuery.toLowerCase();
      if (!query) return true;

      return (
        inv.invoiceNumber?.toLowerCase().includes(query) ||
        inv.vendorName?.toLowerCase().includes(query) ||
        inv.issuedPO?.poNumber?.toLowerCase().includes(query)
      );
    });
  }, [receivedInvoices, searchQuery]);

  // Define table columns
  const columns: Column<ReceivedInvoice>[] = useMemo(() => [
    {
      key: 'invoiceNumber',
      header: 'Invoice Number',
      accessor: 'invoiceNumber',
      sortable: true,
      cell: (_, row) => (
        <span className="font-semibold text-gray-900">{row.invoiceNumber}</span>
      ),
    },
    {
      key: 'vendorName',
      header: 'Vendor',
      accessor: 'vendorName',
      sortable: true,
      cell: (value) => (
        <span className="text-sm font-medium text-gray-900">{value as string}</span>
      ),
    },
    {
      key: 'linkedPO',
      header: 'Linked PO',
      accessor: (row) => row.issuedPO?.poNumber || '-',
      sortable: true,
      cell: (_, row) => {
        if (!row.issuedPO) {
          return <span className="text-sm text-gray-400">-</span>;
        }

        return (
          <div className="flex items-center gap-1">
            <Link2 className="w-3 h-3 text-primary-500" />
            <span className="text-sm text-primary-600 font-medium">
              {row.issuedPO.poNumber}
            </span>
          </div>
        );
      },
    },
    {
      key: 'amount',
      header: 'Amount',
      accessor: 'amount',
      sortable: true,
      align: 'right',
      cell: (_, row) => (
        <span className="font-bold text-gray-900">
          {row.currency} {(row.amount || 0).toLocaleString()}
        </span>
      ),
    },
    {
      key: 'invoiceDate',
      header: 'Invoice Date',
      accessor: 'invoiceDate',
      sortable: true,
      cell: (value) => (
        <span className="text-sm text-gray-700">{formatDate(value as string)}</span>
      ),
      hideOnMobile: true,
    },
    {
      key: 'receivedDate',
      header: 'Received Date',
      accessor: 'receivedDate',
      sortable: true,
      cell: (value) => (
        <span className="text-sm text-gray-700">{formatDate(value as string)}</span>
      ),
      hideOnMobile: true,
    },
    {
      key: 'dueDate',
      header: 'Due Date',
      accessor: 'dueDate',
      sortable: true,
      cell: (value) => (
        <span className="text-sm text-gray-700">
          {value ? formatDate(value as string) : 'N/A'}
        </span>
      ),
      hideOnMobile: true,
    },
  ], []);

  // Mobile card renderer
  const renderMobileCard = ({ row, actions }: MobileCardProps<ReceivedInvoice>) => {
    const statusBadge = getStatusBadge(row.status);
    const StatusIcon = statusBadge.icon;

    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
        <div className="mb-4">
          {/* Invoice Number and badges */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <h3 className="text-lg font-semibold text-gray-900">{row.invoiceNumber}</h3>
              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${statusBadge.color}`}>
                <StatusIcon className="w-3 h-3" />
                {statusBadge.label}
              </span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{row.currency} {(row.amount || 0).toLocaleString()}</p>
          </div>

          {/* Vendor name */}
          <p className="text-lg font-medium text-gray-700 mb-2">{row.vendorName}</p>

          {/* Linked Issued PO */}
          {row.issuedPO && (
            <div className="flex items-center gap-2 mb-2">
              <Link2 className="w-4 h-4 text-primary-500" />
              <span className="text-sm text-primary-600 font-medium">
                Linked to: {row.issuedPO.poNumber}
              </span>
            </div>
          )}

          {/* Description */}
          {row.description && (
            <p className="text-sm text-gray-500">{row.description}</p>
          )}
        </div>

        {/* Dates Grid */}
        <div className="grid grid-cols-3 gap-4 py-3 border-t border-gray-100">
          <div>
            <p className="text-xs text-gray-500">Invoice Date</p>
            <p className="text-sm font-medium text-gray-900">{formatDate(row.invoiceDate)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Received Date</p>
            <p className="text-sm font-medium text-gray-900">{formatDate(row.receivedDate)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Due Date</p>
            <p className="text-sm font-medium text-gray-900">{row.dueDate ? formatDate(row.dueDate) : 'N/A'}</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2 pt-3 border-t border-gray-100">
          {actions}
        </div>
      </div>
    );
  };

  // Row actions renderer
  const rowActions = (inv: ReceivedInvoice) => {
    return (
      <div className="flex items-center gap-2 justify-end flex-wrap">
        {/* View Document */}
        {inv.fileUrl && onViewDocument && (
          <Button
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onViewDocument(inv);
            }}
            title="View Document"
          >
            <Eye className="w-4 h-4" />
          </Button>
        )}

        {/* Edit - only if not paid */}
        {inv.status !== 'paid' && onEditInvoice && (
          <Button
            size="sm"
            variant="ghost"
            onClick={(e) => {
              e.stopPropagation();
              onEditInvoice(inv);
            }}
            title="Edit"
          >
            <Edit2 className="w-4 h-4" />
          </Button>
        )}

        {/* Verify - only pending/disputed and canVerify */}
        {(inv.status === 'pending' || inv.status === 'disputed') && canVerify && onVerify && (
          <Button
            size="sm"
            className="bg-blue-600 hover:bg-blue-700 text-white"
            onClick={(e) => {
              e.stopPropagation();
              onVerify(inv.id);
            }}
            title="Verify"
          >
            <CheckCircle className="w-4 h-4" />
          </Button>
        )}

        {/* Mark as Paid - only verified and canVerify */}
        {inv.status === 'verified' && canVerify && onMarkAsPaid && (
          <Button
            size="sm"
            className="bg-green-600 hover:bg-green-700 text-white"
            onClick={(e) => {
              e.stopPropagation();
              onMarkAsPaid(inv.id);
            }}
            title="Mark Paid"
          >
            <DollarSign className="w-4 h-4" />
          </Button>
        )}

        {/* Dispute - only pending/verified */}
        {(inv.status === 'pending' || inv.status === 'verified') && onDispute && (
          <Button
            size="sm"
            className="bg-orange-100 hover:bg-orange-200 text-orange-700"
            onClick={(e) => {
              e.stopPropagation();
              onDispute(inv.id);
            }}
            title="Dispute"
          >
            <AlertTriangle className="w-4 h-4" />
          </Button>
        )}

        {/* Delete - only if not paid and canDelete */}
        {inv.status !== 'paid' && canDelete && onDeleteInvoice && (
          <Button
            size="sm"
            variant="danger"
            onClick={(e) => {
              e.stopPropagation();
              onDeleteInvoice(inv);
            }}
            title="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        )}
      </div>
    );
  };

  return (
    <DataTable<ReceivedInvoice>
      data={filteredInvoices}
      columns={columns}
      getRowKey={(inv) => inv.id}
      searchable={false}
      sortable={true}
      defaultSortKey="receivedDate"
      defaultSortDirection="desc"
      pagination={true}
      defaultPageSize={10}
      pageSizeOptions={[10, 25, 50, 100]}
      responsiveCards={true}
      mobileCard={renderMobileCard}
      rowActions={rowActions}
      emptyTitle="No received invoices found"
      emptyDescription="Create an Issued PO first, then add a received invoice from the vendor."
    />
  );
};
