import { useState } from 'react';
import { X, Upload, Download, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from '../ui/Button';
import { processBulkImport } from '../../lib/csvParser';
import type { BulkImportResult } from '../../types/inventory.types';

interface BulkUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (file: File) => Promise<void>;
}

export function BulkUploadModal({ isOpen, onClose, onImport }: BulkUploadModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [result, setResult] = useState<BulkImportResult | null>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setResult(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setIsUploading(true);
    try {
      // Validate CSV first
      const validationResult = await processBulkImport(file);
      setResult(validationResult);

      if (validationResult.success) {
        // Actual import
        await onImport(file);
      }
    } catch (error) {
      setResult({
        success: false,
        imported: 0,
        failed: 0,
        errors: [{ row: 0, error: `Upload failed: ${error}` }],
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    setFile(null);
    setResult(null);
    onClose();
  };

  const downloadTemplate = () => {
    const link = document.createElement('a');
    link.href = '/templates/inventory-bulk-upload-template.csv';
    link.download = 'inventory-bulk-upload-template.csv';
    link.click();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200 bg-gradient-to-r from-primary-50 to-primary-100">
          <h2 className="text-xl font-semibold text-gray-900">Bulk Import Inventory</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          {/* Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-medium text-blue-900 mb-2">How to use bulk import:</h3>
            <ol className="list-decimal list-inside space-y-1 text-sm text-blue-800">
              <li>Download the CSV template below</li>
              <li>Fill in your inventory data (keep the header row)</li>
              <li>Upload the completed CSV file</li>
              <li>Review the validation results</li>
            </ol>
          </div>

          {/* Download Template */}
          <div>
            <Button
              variant="outline"
              onClick={downloadTemplate}
              className="w-full"
            >
              <Download className="w-4 h-4 mr-2" />
              Download CSV Template
            </Button>
          </div>

          {/* File Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Upload CSV File
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <input
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="hidden"
                id="csv-upload"
              />
              <label
                htmlFor="csv-upload"
                className="cursor-pointer flex flex-col items-center"
              >
                <Upload className="w-12 h-12 text-gray-400 mb-2" />
                <span className="text-sm text-gray-600">
                  {file ? file.name : 'Click to select CSV file'}
                </span>
              </label>
            </div>
          </div>

          {/* Validation Result */}
          {result && (
            <div className={`border rounded-lg p-4 ${
              result.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
            }`}>
              <div className="flex items-start gap-3">
                {result.success ? (
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                )}
                <div className="flex-1">
                  <h4 className={`font-medium mb-2 ${
                    result.success ? 'text-green-900' : 'text-red-900'
                  }`}>
                    {result.success ? 'Validation Successful' : 'Validation Failed'}
                  </h4>
                  <div className="text-sm space-y-1">
                    <p className={result.success ? 'text-green-800' : 'text-red-800'}>
                      ✓ {result.imported} items ready to import
                    </p>
                    {result.failed > 0 && (
                      <p className="text-red-800">
                        ✗ {result.failed} items failed validation
                      </p>
                    )}
                  </div>

                  {/* Error Details */}
                  {result.errors && result.errors.length > 0 && (
                    <div className="mt-3 max-h-40 overflow-y-auto">
                      <p className="text-sm font-medium text-red-900 mb-1">Errors:</p>
                      <ul className="text-xs text-red-800 space-y-1">
                        {result.errors.map((err, idx) => (
                          <li key={idx}>
                            Row {err.row}: {err.error}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t">
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            onClick={handleUpload}
            disabled={!file || isUploading}
          >
            {isUploading ? 'Uploading...' : 'Import Items'}
          </Button>
        </div>
      </div>
    </div>
  );
}
