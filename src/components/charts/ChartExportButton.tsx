import React, { useState } from 'react';
import { Download, FileJson, Image, FileText } from 'lucide-react';
import { exportChartAsPNG, exportChartAsPDF, exportDataAsCSV } from '../../utils/chartHelpers';
import { toast } from 'react-hot-toast';

interface ChartExportButtonProps {
  chartId: string;
  chartTitle: string;
  data?: any[];
  formats?: ('png' | 'pdf' | 'csv')[];
}

export const ChartExportButton: React.FC<ChartExportButtonProps> = ({
  chartId,
  chartTitle,
  data,
  formats = ['png', 'pdf'],
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const handleExportPNG = async () => {
    setIsExporting(true);
    try {
      await exportChartAsPNG(chartId, chartTitle);
      toast.success('Chart exported as PNG');
    } catch (error) {
      toast.error('Failed to export chart as PNG');
    } finally {
      setIsExporting(false);
      setIsOpen(false);
    }
  };

  const handleExportPDF = async () => {
    setIsExporting(true);
    try {
      await exportChartAsPDF(chartId, chartTitle, chartTitle);
      toast.success('Chart exported as PDF');
    } catch (error) {
      toast.error('Failed to export chart as PDF');
    } finally {
      setIsExporting(false);
      setIsOpen(false);
    }
  };

  const handleExportCSV = () => {
    if (!data || data.length === 0) {
      toast.error('No data to export');
      return;
    }

    try {
      exportDataAsCSV(data, chartTitle);
      toast.success('Data exported as CSV');
    } catch (error) {
      toast.error('Failed to export data as CSV');
    } finally {
      setIsOpen(false);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isExporting}
        className="flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Download className="w-4 h-4" />
        {isExporting ? 'Exporting...' : 'Export'}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
          <div className="p-2">
            {formats.includes('png') && (
              <button
                onClick={handleExportPNG}
                disabled={isExporting}
                className="w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-50 rounded transition-colors disabled:opacity-50"
              >
                <Image className="w-4 h-4 text-blue-600" />
                <span className="text-sm text-gray-700">Export as PNG</span>
              </button>
            )}

            {formats.includes('pdf') && (
              <button
                onClick={handleExportPDF}
                disabled={isExporting}
                className="w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-50 rounded transition-colors disabled:opacity-50"
              >
                <FileText className="w-4 h-4 text-red-600" />
                <span className="text-sm text-gray-700">Export as PDF</span>
              </button>
            )}

            {formats.includes('csv') && data && data.length > 0 && (
              <button
                onClick={handleExportCSV}
                className="w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-50 rounded transition-colors"
              >
                <FileJson className="w-4 h-4 text-green-600" />
                <span className="text-sm text-gray-700">Export as CSV</span>
              </button>
            )}
          </div>
        </div>
      )}

      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};
