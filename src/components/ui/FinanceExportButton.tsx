import { useState } from 'react';
import { Download, ChevronDown } from 'lucide-react';

interface FinanceExportButtonProps {
  onExport: (format: 'csv' | 'excel') => void;
  disabled?: boolean;
  totalCount?: number;
}

export const FinanceExportButton: React.FC<FinanceExportButtonProps> = ({
  onExport,
  disabled = false,
  totalCount = 0,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleExportCSV = () => {
    onExport('csv');
    setIsOpen(false);
  };

  const handleExportExcel = () => {
    onExport('excel');
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled || totalCount === 0}
        className={`flex items-center gap-2 px-4 py-2 border rounded-lg ${
          disabled || totalCount === 0
            ? 'bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200'
            : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
        }`}
      >
        <Download className="w-4 h-4" />
        Export
        <ChevronDown className="w-4 h-4" />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-20">
            <div className="py-1">
              <button
                onClick={handleExportCSV}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <span className="font-medium">CSV</span>
                <span className="text-xs text-gray-500">.csv file</span>
              </button>
              <button
                onClick={handleExportExcel}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <span className="font-medium">Excel</span>
                <span className="text-xs text-gray-500">.xlsx file</span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
