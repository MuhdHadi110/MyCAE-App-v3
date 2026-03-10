import { useState, useRef } from 'react';
import { Upload, Download, FileSpreadsheet, AlertCircle, CheckCircle2, Info, FileText, Building2, Users } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { useCompanyStore } from '../../store/companyStore';
import { toast } from 'react-hot-toast';

interface BulkImportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ImportRow {
  company_name: string;
  company_type?: string;
  industry?: string;
  website?: string;
  address?: string;
  contact_name?: string;
  contact_email?: string;
  contact_phone?: string;
  contact_position?: string;
}

export const BulkImportModal: React.FC<BulkImportModalProps> = ({ isOpen, onClose }) => {
  const { createCompany, createContact } = useCompanyStore();
  const [isLoading, setIsLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<ImportRow[]>([]);
  const [importStatus, setImportStatus] = useState<{ success: number; errors: number } | null>(null);
  const [activeTab, setActiveTab] = useState<'upload' | 'fields'>('upload');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      parseCSV(selectedFile);
    }
  };

  const parseCSV = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.split('\n').filter(line => line.trim());
      
      // Skip header row
      const dataRows = lines.slice(1);
      
      const parsed: ImportRow[] = dataRows.map(line => {
        const cols = line.split(',').map(col => col.trim().replace(/^"|"$/g, ''));
        return {
          company_name: cols[0] || '',
          company_type: cols[1] || '',
          industry: cols[2] || '',
          website: cols[3] || '',
          address: cols[4] || '',
          contact_name: cols[5] || '',
          contact_email: cols[6] || '',
          contact_phone: cols[7] || '',
          contact_position: cols[8] || '',
        };
      }).filter(row => row.company_name);

      setPreviewData(parsed.slice(0, 5));
    };
    reader.readAsText(file);
  };

  const downloadTemplate = () => {
    const template = `company_name,company_type,industry,website,address,contact_name,contact_email,contact_phone,contact_position
My Company Inc.,client;vendor,Technology,https://mycompany.com,123 Main St,John Doe,john@mycompany.com,+60 12-345 6789,CEO
Another Company,supplier,Manufacturing,https://another.com,456 Industrial Ave,Jane Smith,jane@another.com,+60 11-234 5678,Project Manager`;
    
    const blob = new Blob([template], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'companies_import_template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const handleImport = async () => {
    if (!file) return;

    setIsLoading(true);
    let successCount = 0;
    let errorCount = 0;

    const reader = new FileReader();
    reader.onload = async (e) => {
      const text = e.target?.result as string;
      const lines = text.split('\n').filter(line => line.trim());
      const dataRows = lines.slice(1);

      const companyMap = new Map<string, ImportRow[]>();
      
      dataRows.forEach(line => {
        const cols = line.split(',').map(col => col.trim().replace(/^"|"$/g, ''));
        const companyName = cols[0];
        if (companyName) {
          if (!companyMap.has(companyName)) {
            companyMap.set(companyName, []);
          }
          companyMap.get(companyName)!.push({
            company_name: companyName,
            company_type: cols[1] || '',
            industry: cols[2] || '',
            website: cols[3] || '',
            address: cols[4] || '',
            contact_name: cols[5] || '',
            contact_email: cols[6] || '',
            contact_phone: cols[7] || '',
            contact_position: cols[8] || '',
          });
        }
      });

      for (const [companyName, rows] of companyMap) {
        try {
          const companyTypes = rows[0].company_type
            ? rows[0].company_type.split(';').filter(Boolean) as ('client' | 'vendor' | 'customer' | 'supplier')[]
            : [];

          const company = await createCompany({
            name: companyName,
            company_type: companyTypes,
            industry: rows[0].industry,
            website: rows[0].website,
            address: rows[0].address,
          });

          if (company) {
            successCount++;

            for (const row of rows) {
              if (row.contact_name && row.contact_email) {
                try {
                  await createContact({
                    company_id: company.id,
                    name: row.contact_name,
                    email: row.contact_email,
                    phone: row.contact_phone,
                    position: row.contact_position,
                  });
                } catch (err) {
                  console.error(`Failed to create contact ${row.contact_name}:`, err);
                }
              }
            }
          } else {
            errorCount++;
          }
        } catch (err) {
          console.error(`Failed to create company ${companyName}:`, err);
          errorCount++;
        }
      }

      setImportStatus({ success: successCount, errors: errorCount });
      setIsLoading(false);
      
      if (successCount > 0) {
        toast.success(`Successfully imported ${successCount} companies`);
      }
      if (errorCount > 0) {
        toast.error(`Failed to import ${errorCount} companies`);
      }
    };
    reader.readAsText(file);
  };

  const handleClose = () => {
    setFile(null);
    setPreviewData([]);
    setImportStatus(null);
    setActiveTab('upload');
    onClose();
  };

  const companyFields = [
    { name: 'company_name', label: 'Company Name', required: true, example: 'Acme Corporation', type: 'Text' },
    { name: 'company_type', label: 'Company Type', required: false, example: 'client;vendor;supplier', type: 'Multiple (semicolon separated)' },
    { name: 'industry', label: 'Industry', required: false, example: 'Technology, Manufacturing', type: 'Text' },
    { name: 'website', label: 'Website', required: false, example: 'https://example.com', type: 'URL' },
    { name: 'address', label: 'Address', required: false, example: '123 Main Street, City', type: 'Text' },
  ];

  const contactFields = [
    { name: 'contact_name', label: 'Contact Name', required: false, example: 'John Smith', type: 'Text' },
    { name: 'contact_email', label: 'Contact Email', required: false, example: 'john@example.com', type: 'Email' },
    { name: 'contact_phone', label: 'Contact Phone', required: false, example: '+60 12-345 6789', type: 'Phone' },
    { name: 'contact_position', label: 'Contact Position', required: false, example: 'CEO, Manager', type: 'Text' },
  ];

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Bulk Import Companies & Contacts" icon={<Upload className="w-5 h-5 text-primary-600" />} size="xl">
      <div className="p-6">
        {/* Tabs */}
        <div className="flex gap-2 mb-6 bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => setActiveTab('upload')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-md text-sm font-medium transition-all ${
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
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-md text-sm font-medium transition-all ${
              activeTab === 'fields'
                ? 'bg-white text-primary-700 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Info className="w-4 h-4" />
            Field Reference
          </button>
        </div>

        {activeTab === 'upload' ? (
          <div className="space-y-6">
            {/* Template Download Card */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-5">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <FileSpreadsheet className="w-6 h-6 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-blue-900 mb-1">Download Template</h4>
                  <p className="text-sm text-blue-700 mb-3">
                    Get started with our CSV template. Fill in your data and upload it here.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={downloadTemplate}
                    icon={<Download className="w-4 h-4" />}
                    className="bg-white border-blue-300 text-blue-700 hover:bg-blue-50"
                  >
                    Download CSV Template
                  </Button>
                </div>
              </div>
            </div>

            {/* Upload Area */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Upload CSV File
              </label>
              <div
                className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-primary-400 hover:bg-gray-50 transition-colors cursor-pointer bg-white"
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
                    <CheckCircle2 className="w-5 h-5 text-green-500 ml-2" />
                  </div>
                ) : (
                  <div>
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Upload className="w-8 h-8 text-gray-400" />
                    </div>
                    <p className="text-gray-700 font-medium mb-1">Click to upload or drag and drop</p>
                    <p className="text-sm text-gray-500">CSV files only • Max 5MB</p>
                  </div>
                )}
              </div>
            </div>

            {/* Preview */}
            {previewData.length > 0 && (
              <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
                  <h4 className="font-medium text-gray-900">Preview (First 5 rows)</h4>
                  <span className="text-sm text-gray-500">{previewData.length} rows found</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left font-medium text-gray-700">Company</th>
                        <th className="px-4 py-3 text-left font-medium text-gray-700">Type</th>
                        <th className="px-4 py-3 text-left font-medium text-gray-700">Contact</th>
                        <th className="px-4 py-3 text-left font-medium text-gray-700">Email</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {previewData.map((row, idx) => (
                        <tr key={idx} className="hover:bg-gray-50">
                          <td className="px-4 py-3 font-medium text-gray-900">{row.company_name}</td>
                          <td className="px-4 py-3 text-gray-600">
                            {row.company_type ? (
                              <span className="inline-flex flex-wrap gap-1">
                                {row.company_type.split(';').map((type, i) => (
                                  <span key={i} className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">
                                    {type}
                                  </span>
                                ))}
                              </span>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-gray-600">{row.contact_name || <span className="text-gray-400">-</span>}</td>
                          <td className="px-4 py-3 text-gray-600">{row.contact_email || <span className="text-gray-400">-</span>}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Import Status */}
            {importStatus && (
              <div className={`rounded-xl p-5 ${importStatus.errors > 0 ? 'bg-amber-50 border border-amber-200' : 'bg-green-50 border border-green-200'}`}>
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                  Import Results
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white rounded-lg p-4 border border-green-200">
                    <div className="text-2xl font-bold text-green-600">{importStatus.success}</div>
                    <div className="text-sm text-gray-600">Companies imported</div>
                  </div>
                  {importStatus.errors > 0 && (
                    <div className="bg-white rounded-lg p-4 border border-red-200">
                      <div className="text-2xl font-bold text-red-600">{importStatus.errors}</div>
                      <div className="text-sm text-gray-600">Failed to import</div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isLoading}
                className="flex-1"
              >
                {importStatus ? 'Close' : 'Cancel'}
              </Button>
              {!importStatus && (
                <Button
                  type="button"
                  variant="primary"
                  onClick={handleImport}
                  disabled={!file || isLoading}
                  className="flex-1"
                >
                  {isLoading ? 'Importing...' : 'Import Data'}
                </Button>
              )}
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
                  Only <strong>Company Name</strong> is required. All other fields are optional. 
                  You can add multiple contacts per company by duplicating the company row with different contact details.
                </p>
              </div>
            </div>

            {/* Company Fields */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Building2 className="w-5 h-5 text-gray-600" />
                <h4 className="font-semibold text-gray-900">Company Fields</h4>
              </div>
              <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium text-gray-700">Field</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-700">Type</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-700">Example</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {companyFields.map((field) => (
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
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Contact Fields */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Users className="w-5 h-5 text-gray-600" />
                <h4 className="font-semibold text-gray-900">Contact Fields (Optional)</h4>
              </div>
              <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium text-gray-700">Field</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-700">Type</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-700">Example</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {contactFields.map((field) => (
                      <tr key={field.name} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-900">{field.label}</span>
                            <span className="px-1.5 py-0.5 bg-gray-100 text-gray-600 text-xs font-medium rounded">
                              Optional
                            </span>
                          </div>
                          <code className="text-xs text-gray-500">{field.name}</code>
                        </td>
                        <td className="px-4 py-3 text-gray-600">{field.type}</td>
                        <td className="px-4 py-3 text-gray-600 font-mono text-xs">{field.example}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Tips */}
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <h4 className="font-medium text-amber-900 mb-2 flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                Important Tips
              </h4>
              <ul className="text-sm text-amber-800 space-y-1 list-disc list-inside">
                <li>Use semicolon (;) to separate multiple company types</li>
                <li>Each row can contain one company and optionally one contact</li>
                <li>To add multiple contacts to the same company, duplicate the company row</li>
                <li>Make sure email addresses are valid if provided</li>
                <li>Website should include https:// or http://</li>
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
    </Modal>
  );
};
