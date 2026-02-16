import React, { useMemo } from 'react';
import { Eye, Edit2, Trash2, Upload } from 'lucide-react';
import { getStatusBadge, formatDate } from '../../lib/financeUtils';
import { DataTable, Column, MobileCardProps } from '../ui/DataTable';
import { Button } from '../ui/Button';

interface Invoice {
  id: string;
  invoiceNumber: string;
  projectCode?: string;
  projectName?: string;
  clientName?: string;
  currency: string;
  amount: number;
  status: string;
  invoiceDate: string;
  percentageOfTotal: number;
  invoiceSequence: number;
  cumulativePercentage: number;
  remark?: string;
  createdBy?: string;
  fileUrl?: string;
  project?: {
    title?: string;
  };
}

interface InvoicesTabProps {
  invoices: any[];
  searchQuery: string;
  onViewPDF: (invoiceId: string, invoiceNumber: string) => void;
  onUploadDocument?: (invoice: any) => void;
  onEditInvoice?: (invoice: any) => void;
  onDeleteInvoice?: (invoice: any) => void;
  canUpload?: boolean;
  canDelete?: boolean;
  canApprove?: boolean;
  onSubmitForApproval?: (invoiceId: string) => void;
  onApprove?: (invoiceId: string) => void;
  onWithdraw?: (invoiceId: string) => void;
  onMarkAsSent?: (invoiceId: string) => void;
  onMarkAsPaid?: (invoiceId: string) => void;
  currentUserId?: string;
}

export const InvoicesTab: React.FC<InvoicesTabProps> = ({
  invoices,
  searchQuery,
  onViewPDF,
  onUploadDocument,
  onEditInvoice,
  onDeleteInvoice,
  canUpload = false,
  canDelete = false,
  canApprove = false,
  onSubmitForApproval,
  onApprove,
  onWithdraw,
  onMarkAsSent,
  onMarkAsPaid,
  currentUserId,
}) => {
  // Filter invoices based on search query
  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      const query = searchQuery.toLowerCase();
      if (!query) return true;

      return (
        inv.invoiceNumber?.toLowerCase().includes(query) ||
        inv.clientName?.toLowerCase().includes(query) ||
        inv.projectCode?.toLowerCase().includes(query) ||
        inv.project?.title?.toLowerCase().includes(query)
      );
    });
  }, [invoices, searchQuery]);

  // Define table columns
  const columns: Column<Invoice>[] = useMemo(() => [
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
      key: 'project',
      header: 'Project',
      accessor: (row) => row.projectCode || 'No Code',
      sortable: true,
      cell: (_, row) => {
        const projectCode = row.projectCode;
        const projectName = row.projectName || row.project?.title;

        return (
          <div className="flex flex-col">
            <span className="font-semibold text-primary-600">
              {projectCode || 'No Code'}
            </span>
            {projectName && (
              <span className="text-xs text-gray-500 truncate max-w-xs">
                {projectName}
              </span>
            )}
          </div>
        );
      },
    },
    {
      key: 'progress',
      header: 'Progress',
      accessor: 'percentageOfTotal',
      sortable: true,
      cell: (_, row) => (
        <div className="flex flex-col">
          <span className="text-sm font-medium text-gray-900">
            {row.percentageOfTotal}% (#{row.invoiceSequence})
          </span>
          <span className="text-xs text-gray-500">
            Cumulative: {row.cumulativePercentage}%
          </span>
        </div>
      ),
      hideOnMobile: true,
    },
    {
      key: 'amount',
      header: 'Amount',
      accessor: 'amount',
      sortable: true,
      align: 'right',
      cell: (_, row) => (
        <span className="font-bold text-gray-900">
          {row.currency || 'MYR'} {(row.amount || 0).toLocaleString()}
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
  ], []);

  // Mobile card renderer
  const renderMobileCard = ({ row, actions }: MobileCardProps<Invoice>) => {
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
            <p className="text-2xl font-bold text-gray-900">{row.currency || 'MYR'} {(row.amount || 0).toLocaleString()}</p>
          </div>

          {/* Project code and title */}
          {row.projectCode ? (
            <h4 className="text-lg font-semibold text-primary-600 mb-2">
              {row.projectCode} - {row.projectName || 'Untitled Project'}
            </h4>
          ) : (
            <p className="text-sm text-gray-500 mb-2">No project linked</p>
          )}

          {/* Invoice details */}
          <p className="text-sm text-gray-600 mb-1">Progress: {row.percentageOfTotal}% (Invoice #{row.invoiceSequence})</p>

          {/* Cumulative percentage */}
          <div className="flex items-center gap-4 text-xs text-gray-500">
            <span>Cumulative: {row.cumulativePercentage}%</span>
            {row.remark && <span>• {row.remark}</span>}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 py-3 border-t border-gray-100">
          <div>
            <p className="text-xs text-gray-500">Invoice Date</p>
            <p className="text-sm font-medium text-gray-900">{formatDate(row.invoiceDate)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Status</p>
            <p className="text-sm font-medium text-gray-900 capitalize">{row.status || 'draft'}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Project</p>
            <p className="text-sm font-medium text-primary-600">{row.projectCode}</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2 pt-3 border-t border-gray-100">
          {actions}
        </div>
      </div>
    );
  };

  // Row actions renderer with complex workflow logic
  const rowActions = (inv: Invoice) => {
    return (
      <div className="flex items-center gap-2 justify-end flex-wrap">
        {/* View Document */}
        {inv.fileUrl && (
          <Button
            size="sm"
            variant="ghost"
            onClick={(e) => {
              e.stopPropagation();
              onViewPDF(inv.id, inv.invoiceNumber);
            }}
            title="View Document"
          >
            <Eye className="w-4 h-4" />
          </Button>
        )}

        {/* Upload Document */}
        {canUpload && onUploadDocument && (
          <Button
            size="sm"
            variant="ghost"
            onClick={(e) => {
              e.stopPropagation();
              onUploadDocument(inv);
            }}
            title="Upload Document"
          >
            <Upload className="w-4 h-4" />
          </Button>
        )}

        {/* Edit - Allow editing for all statuses except paid */}
        {canUpload && onEditInvoice && inv.status !== 'paid' && (
          <Button
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onEditInvoice(inv);
            }}
            title="Edit"
          >
            <Edit2 className="w-4 h-4" />
          </Button>
        )}

        {/* Delete - Senior Engineer and above */}
        {canDelete && onDeleteInvoice && (
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

        {/* Submit for Approval - Draft only */}
        {inv.status === 'draft' && canUpload && onSubmitForApproval && (
          <Button
            size="sm"
            className="bg-orange-100 hover:bg-orange-200 text-orange-700"
            onClick={(e) => {
              e.stopPropagation();
              onSubmitForApproval(inv.id);
            }}
            title="Submit for Approval"
          >
            Submit
          </Button>
        )}

        {/* Approve - Pending Approval, MD only */}
        {inv.status === 'pending-approval' && canApprove && onApprove && (
          <Button
            size="sm"
            className="bg-green-600 hover:bg-green-700 text-white"
            onClick={(e) => {
              e.stopPropagation();
              onApprove(inv.id);
            }}
            title="Approve"
          >
            Approve
          </Button>
        )}

        {/* Withdraw - Pending Approval, creator only */}
        {inv.status === 'pending-approval' &&
         inv.createdBy === currentUserId && onWithdraw && (
          <Button
            size="sm"
            className="bg-red-100 hover:bg-red-200 text-red-700"
            onClick={(e) => {
              e.stopPropagation();
              onWithdraw(inv.id);
            }}
            title="Withdraw"
          >
            Withdraw
          </Button>
        )}

        {/* Mark as Sent - Approved only */}
        {inv.status === 'approved' && canUpload && onMarkAsSent && (
          <Button
            size="sm"
            className="bg-primary-600 hover:bg-primary-700 text-white"
            onClick={(e) => {
              e.stopPropagation();
              onMarkAsSent(inv.id);
            }}
            title="Mark as Sent"
          >
            Mark Sent
          </Button>
        )}

        {/* Mark as Paid - Sent only */}
        {inv.status === 'sent' && onMarkAsPaid && canApprove && (
          <Button
            size="sm"
            className="bg-green-600 hover:bg-green-700 text-white"
            onClick={(e) => {
              e.stopPropagation();
              onMarkAsPaid(inv.id);
            }}
            title="Mark as Paid"
          >
            Mark Paid
          </Button>
        )}
      </div>
    );
  };

  return (
    <DataTable<Invoice>
      data={filteredInvoices}
      columns={columns}
      getRowKey={(inv) => inv.id}
      searchable={false}
      sortable={true}
      defaultSortKey="invoiceDate"
      defaultSortDirection="desc"
      pagination={true}
      defaultPageSize={10}
      pageSizeOptions={[10, 25, 50, 100]}
      responsiveCards={true}
      mobileCard={renderMobileCard}
      rowActions={rowActions}
      emptyTitle="No invoices found"
      emptyDescription="There are no invoices to display."
    />
  );
};
