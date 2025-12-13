import React, { useState, useEffect } from 'react';
import { X, DollarSign, Save } from 'lucide-react';
import { toast } from 'react-hot-toast';
import type { ManHourBreakdown } from '../../types/projectFinance.types';

interface ManageProjectHourlyRatesModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectCode: string;
  projectTitle: string;
  manHourBreakdown: ManHourBreakdown[];
  onSave: (rates: Record<string, number>) => Promise<void>;
}

export const ManageProjectHourlyRatesModal: React.FC<ManageProjectHourlyRatesModalProps> = ({
  isOpen,
  onClose,
  projectCode,
  projectTitle,
  manHourBreakdown,
  onSave,
}) => {
  const [rates, setRates] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && manHourBreakdown.length > 0) {
      const initialRates: Record<string, number> = {};
      manHourBreakdown.forEach((member) => {
        initialRates[member.engineerId] = member.hourlyRate;
      });
      setRates(initialRates);
    }
  }, [isOpen, manHourBreakdown]);

  const handleRateChange = (engineerId: string, rate: string) => {
    setRates({
      ...rates,
      [engineerId]: parseFloat(rate) || 0,
    });
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await onSave(rates);
      toast.success('Hourly rates updated successfully!');
      onClose();
    } catch (error) {
      toast.error('Failed to save hourly rates: ' + (error instanceof Error ? error.message : String(error)));
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={onClose} />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-primary-50 to-primary-100">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Manage Hourly Rates</h2>
              <p className="text-sm text-gray-600 mt-1">{projectCode} - {projectTitle}</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            {manHourBreakdown.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>No team members have logged hours on this project yet.</p>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-gray-600 mb-4">
                  Set the hourly rates for team members on this project. These rates will be used for cost calculations.
                </p>

                <div className="space-y-3">
                  {manHourBreakdown.map((member) => (
                    <div key={member.engineerId} className="flex items-end gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{member.engineerName}</p>
                        <p className="text-xs text-gray-500 mt-1">{member.role} • {member.hoursLogged} hours logged</p>
                      </div>

                      <div className="w-32">
                        <label htmlFor={`rate-${member.engineerId}`} className="block text-xs font-medium text-gray-600 mb-1">
                          Hourly Rate (RM)
                        </label>
                        <div className="flex items-center gap-1">
                          <span className="text-gray-600">RM</span>
                          <input
                            id={`rate-${member.engineerId}`}
                            type="number"
                            value={rates[member.engineerId] || 0}
                            onChange={(e) => handleRateChange(member.engineerId, e.target.value)}
                            placeholder="0.00"
                            min="0"
                            step="0.01"
                            disabled={loading}
                            className="w-20 px-2 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-100"
                          />
                          <span className="text-gray-600">/h</span>
                        </div>
                      </div>

                      <div className="w-24">
                        <p className="text-xs text-gray-600 mb-1">Total Cost</p>
                        <p className="text-sm font-semibold text-gray-900">
                          RM{((rates[member.engineerId] || 0) * member.hoursLogged).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Summary */}
                <div className="mt-6 p-4 bg-primary-50 border border-primary-200 rounded-lg">
                  <p className="text-sm font-medium text-gray-900 mb-2">Project Total Cost</p>
                  <p className="text-2xl font-bold text-primary-600">
                    RM{Object.entries(rates).reduce((total, [engineerId, rate]) => {
                      const member = manHourBreakdown.find(m => m.engineerId === engineerId);
                      return total + ((rate || 0) * (member?.hoursLogged || 0));
                    }, 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={loading || manHourBreakdown.length === 0}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              {loading ? 'Saving...' : 'Save Rates'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
