import React from 'react';
import { User } from 'lucide-react';
import type { EngineerCost } from '../../types/financeOverview.types';
import { usePermissions } from '../../hooks/usePermissions';

interface EngineerBreakdownRowProps {
  engineers: EngineerCost[];
}

const roleLabels: Record<string, string> = {
  'engineer': 'Engineer',
  'senior-engineer': 'Senior Engineer',
  'principal-engineer': 'Principal Engineer',
  'manager': 'Manager',
  'managing-director': 'Managing Director',
  'admin': 'Admin',
};

export const EngineerBreakdownRow: React.FC<EngineerBreakdownRowProps> = ({
  engineers,
}) => {
  const { canViewBaseCost } = usePermissions();

  const formatCurrency = (amount: number) => {
    return `RM ${amount.toLocaleString('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  if (engineers.length === 0) {
    return (
      <div className="py-6 px-4">
        <div className="flex items-center justify-center text-gray-500">
          <User className="w-5 h-5 mr-2" />
          <span className="text-sm">No timesheets recorded for this project</span>
        </div>
      </div>
    );
  }

  // Calculate totals
  const totalHours = engineers.reduce((sum, eng) => sum + eng.hours, 0);
  const totalCost = engineers.reduce((sum, eng) => sum + eng.totalCost, 0);
  const avgRate = totalHours > 0 ? totalCost / totalHours : 0;

  return (
    <div className="py-4 px-4 border-l-4 border-primary-200">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-sm font-semibold text-gray-700">Engineer Breakdown</h4>
      </div>

      {/* Engineer Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="pb-2 text-left font-medium text-gray-600">Engineer</th>
              <th className="pb-2 text-left font-medium text-gray-600">Role</th>
              <th className="pb-2 text-right font-medium text-gray-600">Hours</th>
              {canViewBaseCost && (
                <>
                  <th className="pb-2 text-right font-medium text-gray-600">Rate/hr</th>
                  <th className="pb-2 text-right font-medium text-gray-600">Cost</th>
                </>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {engineers.map((engineer) => (
              <tr key={engineer.engineerId} className="hover:bg-gray-100/50">
                <td className="py-2.5">
                  <span className="font-medium text-gray-900">{engineer.engineerName}</span>
                </td>
                <td className="py-2.5">
                  <span className="text-gray-600">
                    {roleLabels[engineer.role] || engineer.role}
                  </span>
                </td>
                <td className="py-2.5 text-right">
                  <span className="text-gray-900">{engineer.hours.toFixed(1)} hrs</span>
                </td>
                {canViewBaseCost && (
                  <>
                    <td className="py-2.5 text-right">
                      <span className="text-gray-600">
                        {formatCurrency(engineer.hourlyRate)}
                      </span>
                    </td>
                    <td className="py-2.5 text-right">
                      <span className="font-medium text-gray-900">
                        {formatCurrency(engineer.totalCost)}
                      </span>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-gray-200 bg-gray-50/50">
              <td className="py-2.5 font-semibold text-gray-900">Total</td>
              <td className="py-2.5"></td>
              <td className="py-2.5 text-right font-semibold text-gray-900">
                {totalHours.toFixed(1)} hrs
              </td>
              {canViewBaseCost && (
                <>
                  <td className="py-2.5 text-right text-gray-600">
                    Avg: {formatCurrency(avgRate)}
                  </td>
                  <td className="py-2.5 text-right font-semibold text-gray-900">
                    {formatCurrency(totalCost)}
                  </td>
                </>
              )}
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};

export default EngineerBreakdownRow;
