import React, { useMemo } from 'react';
import { Eye, Edit2, Trash2, Upload } from 'lucide-react';
import { getStatusBadge, formatDate } from '../../lib/financeUtils';
import { DataTable, Column, MobileCardProps } from '../ui/DataTable';
import { Button } from '../ui/Button';

interface IssuedPO {
  id: string;
  poNumber: string;
  projectCode?: string;
  recipient: string;  // Vendor name
  currency?: string;
  amount: number;
  status: string;
  items?: string;     // Description/items
  issueDate?: string;
  fileUrl?: string;
  project?: {
    title?: string;
  };
}

interface IssuedPOsTabProps {
  issuedPOs: any[];
  searchQuery: string;
  canApprove: boolean;
  canDeletePO: boolean;
  canUpload?: boolean;
  onViewPDF: (poId: string, poNumber: string) => void;
  onUploadDocument?: (po: any) => void;
  onDeletePO: (po: any) => void;
  onEditPO?: (po: any) => void;
}

export const IssuedPOsTab: React.FC<IssuedPOsTabProps> = ({
  issuedPOs,
  searchQuery,
  canApprove,
  canDeletePO,
  canUpload = false,
  onViewPDF,
  onUploadDocument,
  onDeletePO,
  onEditPO,
}) => {
  // Filter POs based on search query
  const filteredPOs = useMemo(() => {
    return issuedPOs.filter((po) => {
      const query = searchQuery.toLowerCase();
      if (!query) return true;

      return (
        po.poNumber?.toLowerCase().includes(query) ||
        po.recipient?.toLowerCase().includes(query) ||
        po.projectCode?.toLowerCase().includes(query) ||
        po.project?.title?.toLowerCase().includes(query)
      );
    });
  }, [issuedPOs, searchQuery]);

  // Define table columns
  const columns: Column<IssuedPO>[] = useMemo(() => [
    {
      key: 'poNumber',
      header: 'PO Number',
      accessor: 'poNumber',
      sortable: true,
      cell: (_, row) => (
        <span className="font-semibold text-gray-900">{row.poNumber}</span>
      ),
    },
    {
      key: 'project',
      header: 'Project',
      accessor: (row) => row.projectCode || 'No Code',
      sortable: true,
      cell: (_, row) => {
        const projectCode = row.projectCode;
        const projectTitle = row.project?.title;

        return (
          <div className="flex flex-col">
            <span className="font-semibold text-primary-600">
              {projectCode || 'No Code'}
            </span>
            {projectTitle && (
              <span className="text-xs text-gray-500 truncate max-w-xs">
                {projectTitle}
              </span>
            )}
          </div>
        );
      },
    },
    {
      key: 'recipient',
      header: 'Vendor',
      accessor: 'recipient',
      sortable: true,
      cell: (value) => (
        <span className="text-sm text-gray-900">{value as string}</span>
      ),
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
      key: 'issueDate',
      header: 'Issue Date',
      accessor: 'issueDate',
      sortable: true,
      cell: (value) => (
        <span className="text-sm text-gray-700">{formatDate(value as string)}</span>
      ),
      hideOnMobile: true,
    },
  ], []);

  // Mobile card renderer
  const renderMobileCard = ({ row, actions }: MobileCardProps<IssuedPO>) => {
    const statusBadge = getStatusBadge(row.status);
    const StatusIcon = statusBadge.icon;

    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
        <div className="mb-4">
          {/* PO Number and badges */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <h3 className="text-lg font-semibold text-gray-900">{row.poNumber}</h3>
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
              {row.projectCode} - {row.project?.title || 'Untitled Project'}
            </h4>
          ) : (
            <p className="text-sm text-gray-500 mb-2">No project linked</p>
          )}

          {/* Vendor name */}
          <p className="text-sm text-gray-600 mb-1">{row.recipient}</p>

          {/* Description */}
          {row.items && <p className="text-sm text-gray-500">{row.items}</p>}
        </div>

        <div className="py-3 border-t border-gray-100">
          <div>
            <p className="text-xs text-gray-500">Issue Date</p>
            <p className="text-sm font-medium text-gray-900">{formatDate(row.issueDate)}</p>
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
  const rowActions = (po: IssuedPO) => {
    return (
      <div className="flex items-center gap-2 justify-end">
        {/* View Document */}
        {po.fileUrl && (
          <Button
            size="sm"
            variant="ghost"
            onClick={(e) => {
              e.stopPropagation();
              onViewPDF(po.id, po.poNumber);
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
              onUploadDocument(po);
            }}
            title="Upload Document"
          >
            <Upload className="w-4 h-4" />
          </Button>
        )}

        {/* Edit */}
        {canUpload && onEditPO && (
          <Button
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onEditPO(po);
            }}
            title="Edit PO"
          >
            <Edit2 className="w-4 h-4" />
          </Button>
        )}

        {/* Delete */}
        {canDeletePO && (
          <Button
            size="sm"
            variant="danger"
            onClick={(e) => {
              e.stopPropagation();
              onDeletePO(po);
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
    <DataTable<IssuedPO>
      data={filteredPOs}
      columns={columns}
      getRowKey={(po) => po.id}
      searchable={false}
      sortable={true}
      defaultSortKey="issueDate"
      defaultSortDirection="desc"
      pagination={true}
      defaultPageSize={10}
      pageSizeOptions={[10, 25, 50, 100]}
      responsiveCards={true}
      mobileCard={renderMobileCard}
      rowActions={rowActions}
      emptyTitle="No issued POs found"
      emptyDescription="There are no issued POs to display."
    />
  );
};
