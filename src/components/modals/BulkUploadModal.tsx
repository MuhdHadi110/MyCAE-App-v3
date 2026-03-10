import { useState, useRef } from 'react';
import { X, Upload, Download, AlertCircle, CheckCircle, FileText, Package, Info, Tag } from 'lucide-react';
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
  const [activeTab, setActiveTab] = useState<'upload' | 'fields'>('upload');
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    setActiveTab('upload');
    onClose();
  };

  const downloadTemplate = () => {
    const link = document.createElement('a');
    link.href = '/templates/inventory-bulk-upload-template.xlsx';
    link.download = 'inventory-bulk-upload-template.xlsx';
    link.click();
  };

  const downloadCSVTemplate = () => {
    const template = `title,sku,barcode,category,quantity,unitOfMeasure,minimumStock,location,supplier,notes,lastCalibratedDate
Chassis 9171,CHAS-9171,2114DF2,Chassis,14,units,2,Office,Kabex,Used for engine testing,15/03/2024
Wilcoxon Sensor,WILC-731-20G,1FADE7E,Vibration Sensor,1,pcs,1,Office,Mutiara Jaya,Recently calibrated,20/03/2024`;
    
    const blob = new Blob([template], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'inventory_import_template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  // Field definitions for reference
  const inventoryFields = [
    { name: 'title', label: 'Item Title', required: true, example: 'Chassis 9171', type: 'Text', description: 'Name or description of the inventory item' },
    { name: 'sku', label: 'SKU', required: true, example: 'CHAS-9171', type: 'Text', description: 'Unique Stock Keeping Unit code' },
    { name: 'barcode', label: 'Barcode', required: false, example: '2114DF2', type: 'Text', description: 'Product barcode or serial number' },
    { name: 'category', label: 'Category', required: true, example: 'Chassis', type: 'Select', description: 'Must match existing system categories exactly' },
    { name: 'quantity', label: 'Quantity', required: true, example: '14', type: 'Number', description: 'Current stock quantity' },
    { name: 'unitOfMeasure', label: 'Unit of Measure', required: false, example: 'units', type: 'Text', description: 'Unit type: units, pcs, box, set, etc.' },
    { name: 'minimumStock', label: 'Minimum Stock', required: true, example: '2', type: 'Number', description: 'Minimum stock level for low stock alerts' },
    { name: 'location', label: 'Location', required: true, example: 'Office', type: 'Text', description: 'Storage location: Office, Warehouse, etc.' },
    { name: 'supplier', label: 'Supplier', required: false, example: 'Kabex', type: 'Text', description: 'Vendor or supplier name' },
    { name: 'notes', label: 'Notes', required: false, example: 'Used for engine testing', type: 'Text', description: 'Additional notes or description' },
    { name: 'lastCalibratedDate', label: 'Last Calibrated Date', required: false, example: '15/03/2024', type: 'Date', description: 'Last calibration date (DD/MM/YYYY format)' },
  ];

  const validCategories = [
    'Chassis',
    'Consumables',
    'Data Acquisition Module',
    'Dytran Impact Hammer',
    'Electronics',
    'Furniture',
    'Impulse Force Hammer',
    'IT Equipment',
    'Laptop',
    'Microphone',
    'Office Supplies',
    'Safety Equipment',
    'Sound Level Meter',
    'Tools & Equipment',
    'Triaxial Vibration Sensor',
    'Vibration Sensor',
    'Other'
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200 bg-gradient-to-r from-primary-50 to-primary-100">
          <div className="flex items-center gap-3">
            <Package className="w-6 h-6 text-primary-600" />
            <h2 className="text-xl font-semibold text-gray-900">Bulk Import Inventory</h2>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 p-4 bg-gray-50 border-b">
          <button
            onClick={() => setActiveTab('upload')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'upload'
                ? 'bg-white text-primary-700 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Upload className="w-4 h-4" />
            Upload CSV
          </button>
          <button
            onClick={() => setActiveTab('fields')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'fields'
                ? 'bg-white text-primary-700 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Info className="w-4 h-4" />
            Field Reference
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          {activeTab === 'upload' ? (
            <div className="space-y-6">
              {/* Template Download Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-5">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <FileText className="w-6 h-6 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-blue-900 mb-1">Excel Template</h4>
                      <p className="text-sm text-blue-700 mb-3">
                        Download Excel template with instructions sheet and sample data.
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={downloadTemplate}
                        className="bg-white border-blue-300 text-blue-700 hover:bg-blue-50"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Download Excel
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-5">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <FileText className="w-6 h-6 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-green-900 mb-1">CSV Template</h4>
                      <p className="text-sm text-green-700 mb-3">
                        Direct CSV template ready to fill and upload.
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={downloadCSVTemplate}
                        className="bg-white border-green-300 text-green-700 hover:bg-green-50"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Download CSV
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Instructions */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-medium text-blue-900 mb-2">How to use bulk import:</h3>
                <ol className="list-decimal list-inside space-y-1 text-sm text-blue-800">
                  <li>Download the template (Excel or CSV)</li>
                  <li>Fill in your inventory data (keep the header row)</li>
                  <li>For <strong>Category</strong>, use exact names from the Field Reference tab</li>
                  <li>Date format: <strong>DD/MM/YYYY</strong> (e.g., 15/03/2024)</li>
                  <li>Upload the completed file</li>
                  <li>Review the validation results</li>
                </ol>
              </div>

              {/* File Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Upload CSV File
                </label>
                <div 
                  className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-primary-400 hover:bg-gray-50 transition-colors cursor-pointer bg-white"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  {file ? (
                    <div className="flex items-center justify-center gap-3">
                      <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                        <FileText className="w-5 h-5 text-green-600" />
                      </div>
                      <div className="text-left">
                        <p className="font-medium text-gray-900">{file.name}</p>
                        <p className="text-sm text-gray-500">{(file.size / 1024).toFixed(1)} KB</p>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <Upload className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-700 font-medium mb-1">Click to upload or drag and drop</p>
                      <p className="text-sm text-gray-500">CSV files only • Max 5MB</p>
                    </div>
                  )}
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

              {/* Footer */}
              <div className="flex justify-end gap-3 pt-4 border-t">
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
          ) : (
            /* Field Reference Tab */
            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
                <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-blue-900 mb-1">Field Reference Guide</h4>
                  <p className="text-sm text-blue-700">
                    Required fields are marked with a red badge. Categories must match exactly as listed below.
                    Status is automatically calculated based on quantity vs minimum stock.
                  </p>
                </div>
              </div>

              {/* Inventory Fields Table */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Package className="w-5 h-5 text-gray-600" />
                  <h4 className="font-semibold text-gray-900">Inventory Fields</h4>
                </div>
                <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left font-medium text-gray-700">Field</th>
                        <th className="px-4 py-3 text-left font-medium text-gray-700">Type</th>
                        <th className="px-4 py-3 text-left font-medium text-gray-700">Example</th>
                        <th className="px-4 py-3 text-left font-medium text-gray-700">Description</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {inventoryFields.map((field) => (
                        <tr key={field.name} className="hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-gray-900">{field.label}</span>
                              {field.required && (
                                <span className="px-1.5 py-0.5 bg-red-100 text-red-700 text-xs font-medium rounded">
                                  Required
                                </span>
                              )}
                              {!field.required && (
                                <span className="px-1.5 py-0.5 bg-gray-100 text-gray-600 text-xs font-medium rounded">
                                  Optional
                                </span>
                              )}
                            </div>
                            <code className="text-xs text-gray-500">{field.name}</code>
                          </td>
                          <td className="px-4 py-3 text-gray-600">{field.type}</td>
                          <td className="px-4 py-3 text-gray-600 font-mono text-xs">{field.example}</td>
                          <td className="px-4 py-3 text-gray-600 text-sm">{field.description}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Valid Categories */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Tag className="w-5 h-5 text-gray-600" />
                  <h4 className="font-semibold text-gray-900">Valid Categories</h4>
                </div>
                <div className="bg-white border border-gray-200 rounded-xl p-4">
                  <p className="text-sm text-gray-600 mb-3">
                    Categories must match exactly as shown below (case-sensitive):
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {validCategories.map((category) => (
                      <div key={category} className="px-3 py-2 bg-gray-50 rounded-lg text-sm text-gray-700">
                        {category}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Tips */}
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                <h4 className="font-medium text-amber-900 mb-2 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5" />
                  Important Tips
                </h4>
                <ul className="text-sm text-amber-800 space-y-1 list-disc list-inside">
                  <li><strong>SKU must be unique</strong> - Each item needs a different SKU code</li>
                  <li><strong>Category names are case-sensitive</strong> - Use exact spelling from the list above</li>
                  <li><strong>Quantity and Minimum Stock</strong> must be numbers (no text)</li>
                  <li><strong>Date format:</strong> DD/MM/YYYY (e.g., 15/03/2024 for March 15, 2024)</li>
                  <li><strong>Status is auto-calculated</strong> - Don't include a status column, it's calculated automatically</li>
                  <li><strong>Keep the header row</strong> - Don't delete the first row with column names</li>
                </ul>
              </div>

              <Button
                type="button"
                variant="outline"
                onClick={() => setActiveTab('upload')}
                className="w-full"
              >
                Back to Upload
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
