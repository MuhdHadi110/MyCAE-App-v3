import React, { memo, useMemo } from 'react';
import { Upload, FileText, Edit2, Eye, Trash2 } from 'lucide-react';
import { getStatusBadge, formatDate } from '../../lib/financeUtils';
import { DataTable, Column, MobileCardProps } from '../ui/DataTable';
import { Button } from '../ui/Button';

interface ReceivedPO {
  id: string;
  poNumber?: string;
  po_number?: string;
  projectCode?: string;
  project_code?: string;
  clientName?: string;
  client_name?: string;
  fileUrl?: string;
  file_url?: string;
  receivedDate?: string;
  received_date?: string;
  dueDate?: string;
  due_date?: string;
  currency: string;
  amount: number;
  amount_myr?: number;
  status: string;
  description?: string;
  attachments?: any[];
  project?: {
    title?: string;
    projectCode?: string;
    project_code?: string;
    client?: {
      name?: string;
    };
  };
}

interface ReceivedPOsTabProps {
  receivedPOs: any[];
  searchQuery: string;
  canUpload: boolean;
  canDeletePO: boolean;
  onViewDocument: (po: any) => void;
  onAttachDocument: (poId: string) => void;
  onEditPO: (po: any) => void;
  onDeletePO: (po: any) => void;
  onViewDetails: (po: any) => void;
}

export const ReceivedPOsTab: React.FC<ReceivedPOsTabProps> = memo(({
  receivedPOs,
  searchQuery,
  canUpload,
  canDeletePO,
  onViewDocument,
  onAttachDocument,
  onEditPO,
  onDeletePO,
  onViewDetails,
}) => {
  // Filter POs based on search query
  const filteredPOs = useMemo(() => {
    return receivedPOs.filter((po) => {
      const query = searchQuery.toLowerCase();
      if (!query) return true;

      const poNumber = po.poNumber || po.po_number;
      const projectCode = po.projectCode || po.project_code || po.project?.projectCode || po.project?.project_code;
      const clientName = po.project?.client?.name || po.clientName || po.client_name;

      return (
        poNumber?.toLowerCase().includes(query) ||
        clientName?.toLowerCase().includes(query) ||
        projectCode?.toLowerCase().includes(query) ||
        po.project?.title?.toLowerCase().includes(query)
      );
    });
  }, [receivedPOs, searchQuery]);

  // Define table columns
  const columns: Column<ReceivedPO>[] = useMemo(() => [
    {
      key: 'poNumber',
      header: 'PO Number',
      accessor: (row) => row.poNumber || row.po_number,
      sortable: true,
      cell: (_, row) => {
        const poNumber = row.poNumber || row.po_number;
        const fileUrl = row.fileUrl || row.file_url;

        return (
          <div className="flex items-center gap-2">
            <span className="font-semibold text-gray-900">{poNumber}</span>
            {fileUrl && (
              <span className="inline-flex items-center gap-1 text-xs font-medium px-1.5 py-0.5 bg-green-100 text-green-800 rounded">
                <FileText className="w-3 h-3" />
              </span>
            )}
          </div>
        );
      },
    },
    {
      key: 'project',
      header: 'Project',
      accessor: (row) => {
        const projectCode = row.projectCode || row.project_code || row.project?.projectCode || row.project?.project_code;
        return projectCode || 'No Code';
      },
      sortable: true,
      cell: (_, row) => {
        const projectCode = row.projectCode || row.project_code || row.project?.projectCode || row.project?.project_code;
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
      key: 'clientName',
      header: 'Client',
      accessor: (row) => row.project?.client?.name || row.clientName || row.client_name || 'Unknown',
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
        <div className="flex flex-col items-end">
          <span className="font-bold text-gray-900">
            {row.currency} {row.amount.toLocaleString()}
          </span>
          {row.amount_myr && (
            <span className="text-xs text-gray-500">
              RM {row.amount_myr.toLocaleString()}
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'receivedDate',
      header: 'Received Date',
      accessor: (row) => row.receivedDate || row.received_date,
      sortable: true,
      cell: (value) => (
        <span className="text-sm text-gray-700">{formatDate(value as string)}</span>
      ),
      hideOnMobile: true,
    },
    {
      key: 'dueDate',
      header: 'Due Date',
      accessor: (row) => row.dueDate || row.due_date,
      sortable: true,
      cell: (value) => (
        <span className="text-sm text-gray-700">{formatDate(value as string)}</span>
      ),
      hideOnMobile: true,
    },
  ], []);

  // Mobile card renderer
  const renderMobileCard = ({ row, actions }: MobileCardProps<ReceivedPO>) => {
    const statusBadge = getStatusBadge(row.status);
    const StatusIcon = statusBadge.icon;
    const poNumber = row.poNumber || row.po_number;
    const projectCode = row.projectCode || row.project_code || row.project?.projectCode || row.project?.project_code;
    const clientName = row.project?.client?.name || row.clientName || row.client_name;
    const fileUrl = row.fileUrl || row.file_url;
    const receivedDate = row.receivedDate || row.received_date;
    const dueDate = row.dueDate || row.due_date;

    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
        <div className="mb-4">
          {/* PO Number and badges */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <h3 className="text-lg font-semibold text-gray-900">{poNumber}</h3>
              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${statusBadge.color}`}>
                <StatusIcon className="w-3 h-3" />
                {statusBadge.label}
              </span>
              {fileUrl && (
                <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-1 bg-green-100 text-green-800 rounded-full">
                  <FileText className="w-3 h-3" />
                  Document
                </span>
              )}
              {row.attachments && row.attachments.length > 0 && (
                <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-1 bg-green-100 text-green-800 rounded-full">
                  <FileText className="w-3 h-3" />
                  Document
                </span>
              )}
              {row.attachments && row.attachments.length > 0 && (
                <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                  <Upload className="w-3 h-3" />
                  {row.attachments.length}
                </span>
              )}
            </div>
            <p className="text-2xl font-bold text-gray-900">{row.currency} {row.amount.toLocaleString()}</p>
          </div>

          {/* Project code and title */}
          {(projectCode || row.project?.title) ? (
            <h4 className="text-lg font-semibold text-primary-600 mb-2">
              {projectCode || 'No Code'} - {row.project?.title || 'Untitled Project'}
            </h4>
          ) : (
            <p className="text-sm text-gray-500 mb-2">No project linked</p>
          )}

          {/* Client name */}
          <p className="text-sm text-gray-600 mb-1">{clientName || 'Unknown'}</p>

          {/* Description */}
          {row.description && <p className="text-sm text-gray-500">{row.description}</p>}
        </div>

        <div className="grid grid-cols-2 gap-4 py-3 border-t border-gray-100">
          <div>
            <p className="text-xs text-gray-500">Received Date</p>
            <p className="text-sm font-medium text-gray-900">{formatDate(receivedDate)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Due Date</p>
            <p className="text-sm font-medium text-gray-900">{formatDate(dueDate)}</p>
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
  const rowActions = (po: ReceivedPO) => {
    const fileUrl = po.fileUrl || po.file_url;

    return (
      <div className="flex items-center gap-2 justify-end">
        {fileUrl && (
          <Button
            size="sm"
            variant="ghost"
            onClick={(e) => {
              e.stopPropagation();
              onViewDocument(po);
            }}
            title="View Document"
          >
            <Eye className="w-4 h-4" />
          </Button>
        )}
        <Button
          size="sm"
          variant="ghost"
          onClick={(e) => {
            e.stopPropagation();
            onAttachDocument(po.id);
          }}
          title="Upload Document"
        >
          <Upload className="w-4 h-4" />
        </Button>
        {canUpload && (
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
    <DataTable<ReceivedPO>
      data={filteredPOs}
      columns={columns}
      getRowKey={(po) => po.id}
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
      emptyTitle="No purchase orders found"
      emptyDescription="There are no received POs to display."
    />
  );
});
