import React from 'react';
import { Edit2, Trash2 } from 'lucide-react';
import type { InventoryItem } from '../../types/inventory.types';

interface SingleInventoryRowProps {
  item: InventoryItem;
  onEditItem: (item: InventoryItem) => void;
  onDeleteItem: (itemId: string) => void;
  canEdit: boolean;
}

export const SingleInventoryRow: React.FC<SingleInventoryRowProps> = ({
  item,
  onEditItem,
  onDeleteItem,
  canEdit,
}) => {
  const available = item.quantity - (item.checkedOut || 0);
  const checkedOut = item.checkedOut || 0;

  return (
    <>
      <tr className="hover:bg-gray-50 transition-colors border-b border-gray-100">
        {/* Item */}
        <td className="px-4 py-3">
          <div>
            <p className="font-medium text-gray-900">{item.title}</p>
            {item.supplier && (
              <p className="text-sm text-gray-500">{item.supplier}</p>
            )}
          </div>
        </td>
        {/* SKUs */}
        <td className="px-4 py-3 text-center">
          <span className="font-medium text-gray-900">1</span>
        </td>
        {/* Available */}
        <td className="px-4 py-3 text-center">
          <span className="font-medium text-green-600">{available}</span>
        </td>
        {/* Checked Out */}
        <td className="px-4 py-3 text-center">
          <span className="font-medium text-orange-600">{checkedOut}</span>
        </td>
        {/* Category */}
        <td className="px-4 py-3">
          <span className="text-gray-700">{item.category}</span>
        </td>
        {/* Location */}
        <td className="px-4 py-3">
          <span className="text-gray-700">{item.location}</span>
        </td>
        {/* Actions */}
        <td className="px-4 py-3 text-right">
          {canEdit && (
            <div className="flex gap-1 justify-end">
              <button
                onClick={() => onEditItem(item)}
                className="p-1.5 hover:bg-blue-100 text-blue-600 rounded transition-colors"
                title="Edit item"
                aria-label={`Edit ${item.title}`}
              >
                <Edit2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => onDeleteItem(item.id)}
                className="p-1.5 hover:bg-red-100 text-red-600 rounded transition-colors"
                title="Delete item"
                aria-label={`Delete ${item.title}`}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          )}
        </td>
      </tr>
    </>
  );
};
