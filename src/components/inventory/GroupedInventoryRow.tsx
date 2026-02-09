import React from 'react';
import { Edit2, Trash2, ChevronDown, ChevronRight } from 'lucide-react';
import { CalibrationCell } from './CalibrationCell';
import { Link } from 'react-router-dom';
import type { InventoryItem } from '../../types/inventory.types';
import type { CalibrationInfo } from '../../types/inventory.types';

interface GroupedInventoryRowProps {
  title: string;
  supplier?: string;
  items: InventoryItem[];
  totalQuantity: number;
  uniqueSKUs: number;
  category: string;
  location: string;
  isExpanded: boolean;
  onToggle: () => void;
  onEditItem: (item: InventoryItem) => void;
  canEdit: boolean;
  calibrationData: Map<string, CalibrationInfo>;
}

export const GroupedInventoryRow: React.FC<GroupedInventoryRowProps> = ({
  title,
  supplier,
  items,
  totalQuantity,
  uniqueSKUs,
  category,
  location,
  isExpanded,
  onToggle,
  onEditItem,
  canEdit,
  calibrationData,
}) => {
  // Sort items by SKU for consistent display
  const sortedItems = [...items].sort((a, b) => a.sku.localeCompare(b.sku));

  return (
    <>
      {/* Group Header Row */}
      <tr className="bg-gray-50 hover:bg-gray-100 transition-colors border-b border-gray-200">
        <td className="px-4 py-3" colSpan={6}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={onToggle}
                className="p-1 hover:bg-gray-200 rounded transition-colors"
                aria-label={isExpanded ? 'Collapse group' : 'Expand group'}
              >
                {isExpanded ? (
                  <ChevronDown className="w-5 h-5 text-gray-600" />
                ) : (
                  <ChevronRight className="w-5 h-5 text-gray-600" />
                )}
              </button>
              <div>
                <p className="font-semibold text-gray-900">{title}</p>
                {supplier && (
                  <p className="text-sm text-gray-500">{supplier}</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-6 text-sm">
              <div className="text-center">
                <span className="block font-semibold text-gray-900">{uniqueSKUs}</span>
                <span className="text-gray-500 text-xs">SKUs</span>
              </div>
              <div className="text-center">
                <span className="block font-semibold text-gray-900">{totalQuantity}</span>
                <span className="text-gray-500 text-xs">qty</span>
              </div>
              <div className="text-center min-w-[120px]">
                <span className="block text-gray-700">{category}</span>
              </div>
              <div className="text-center min-w-[100px]">
                <span className="block text-gray-700">{location}</span>
              </div>
            </div>
          </div>
        </td>
      </tr>

      {/* Expanded Detail Table */}
      {isExpanded && (
        <tr>
          <td colSpan={6} className="px-4 py-0">
            <div className="bg-white border-t border-gray-100">
              <table className="w-full">
                <thead className="bg-gray-50/50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">SKU</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Quantity</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Status</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Last Calibrated</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {sortedItems.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50/50">
                      <td className="px-4 py-2 text-sm font-medium text-gray-900">
                        {item.sku}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-700">
                        {item.quantity}
                      </td>
                      <td className="px-4 py-2">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                          item.status === 'Active'
                            ? 'bg-green-100 text-green-800'
                            : item.status === 'Inactive'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {item.status}
                        </span>
                      </td>
                      <td className="px-4 py-2">
                        <CalibrationCell 
                          calibrationInfo={calibrationData.get(item.id)} 
                        />
                      </td>
                      <td className="px-4 py-2 text-right">
                        {canEdit && (
                          <div className="flex gap-1 justify-end">
                            <button
                              onClick={() => onEditItem(item)}
                              className="p-1.5 hover:bg-blue-100 text-blue-600 rounded transition-colors"
                              title="Edit item"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {/* View Calibration History Link */}
              <div className="px-4 py-3 bg-gray-50/30 border-t border-gray-100">
                <Link
                  to={`/maintenance?item=${items[0].id}&type=calibration`}
                  className="text-sm text-primary-600 hover:text-primary-700 font-medium inline-flex items-center gap-1"
                >
                  View Calibration History →
                </Link>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
};
