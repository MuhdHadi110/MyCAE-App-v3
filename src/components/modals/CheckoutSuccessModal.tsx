import { CheckCircle, X, Copy, Printer, QrCode as QrCodeIcon } from 'lucide-react';
import { Button } from '../ui/Button';
import { useState } from 'react';

interface CheckoutItem {
  id: string;
  title: string;
  sku: string;
  quantity: number;
}

interface CheckoutSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  masterBarcode: string;
  itemCount: number;
  expectedReturnDate?: string;
  purpose?: string;
  engineerName?: string;
  location?: string;
  items?: CheckoutItem[];
}

export function CheckoutSuccessModal({
  isOpen,
  onClose,
  masterBarcode,
  itemCount,
  expectedReturnDate,
  purpose,
  engineerName,
  location,
  items,
}: CheckoutSuccessModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(masterBarcode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    if (!printWindow) return;

    const checkoutDate = new Date().toLocaleDateString();
    const returnDate = expectedReturnDate ? new Date(expectedReturnDate).toLocaleDateString() : 'Not set';

    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Checkout Receipt - ${masterBarcode}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 40px; }
          .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px; }
          .header h1 { margin: 0; color: #333; }
          .header p { margin: 5px 0; color: #666; }
          .section { margin-bottom: 20px; }
          .section h2 { color: #333; border-bottom: 1px solid #ddd; padding-bottom: 5px; }
          .detail-row { display: flex; justify-content: space-between; margin: 8px 0; }
          .detail-label { font-weight: bold; color: #555; }
          .detail-value { color: #333; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; }
          th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
          th { background-color: #f5f5f5; font-weight: bold; }
          .barcode { text-align: center; margin: 30px 0; padding: 20px; border: 2px dashed #ccc; }
          .barcode-text { font-family: monospace; font-size: 24px; font-weight: bold; letter-spacing: 3px; }
          .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; text-align: center; color: #666; font-size: 12px; }
          @media print { body { margin: 20px; } }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>MyCAE Equipment Checkout</h1>
          <p>Receipt / Packing List</p>
        </div>

        <div class="section">
          <h2>Checkout Details</h2>
          <div class="detail-row">
            <span class="detail-label">Master Barcode:</span>
            <span class="detail-value">${masterBarcode}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Date:</span>
            <span class="detail-value">${checkoutDate}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Project:</span>
            <span class="detail-value">${purpose || 'N/A'}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Checked Out By:</span>
            <span class="detail-value">${engineerName || 'N/A'}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Location:</span>
            <span class="detail-value">${location || 'N/A'}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Expected Return:</span>
            <span class="detail-value">${returnDate}</span>
          </div>
        </div>

        <div class="section">
          <h2>Items</h2>
          <table>
            <thead>
              <tr>
                <th>Item</th>
                <th>SKU</th>
                <th>Quantity</th>
              </tr>
            </thead>
            <tbody>
              ${items?.map(item => `
                <tr>
                  <td>${item.title}</td>
                  <td>${item.sku}</td>
                  <td>${item.quantity}</td>
                </tr>
              `).join('') || `<tr><td colspan="3">${itemCount} items checked out</td></tr>`}
            </tbody>
          </table>
          <p style="margin-top: 15px; text-align: right; font-weight: bold;">
            Total Items: ${itemCount}
          </p>
        </div>

        <div class="barcode">
          <p style="margin: 0 0 10px 0; color: #666;">Master Barcode</p>
          <div class="barcode-text">${masterBarcode}</div>
        </div>

        <div class="footer">
          <p>Keep this receipt for your records. Use the master barcode to return items.</p>
          <p>Generated on ${new Date().toLocaleString()}</p>
        </div>

        <script>
          window.onload = function() {
            window.print();
            setTimeout(function() {
              window.close();
            }, 1000);
          };
        </script>
      </body>
      </html>
    `;

    printWindow.document.write(printContent);
    printWindow.document.close();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200 bg-gradient-to-r from-primary-50 to-primary-100 dark:from-gray-800 dark:to-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">Checkout Successful!</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          {/* Success Message */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-sm text-green-800">
              {itemCount} {itemCount === 1 ? 'item has' : 'items have'} been successfully checked out.
            </p>
          </div>

          {/* Master Barcode Display */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700">
                Master Barcode
              </label>
              <span className="text-xs text-gray-500">
                Use this to return all items
              </span>
            </div>

            {/* Barcode Card */}
            <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6">
              <div className="flex flex-col items-center gap-4">
                {/* QR Code Placeholder */}
                <div className="w-32 h-32 bg-white border-2 border-gray-300 rounded-lg flex items-center justify-center">
                  <QrCodeIcon className="w-16 h-16 text-gray-400" />
                </div>

                {/* Barcode Text */}
                <div className="text-center">
                  <p className="text-2xl font-mono font-bold text-blue-900 tracking-wider">
                    {masterBarcode}
                  </p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                onClick={handleCopy}
                className="w-full"
              >
                <Copy className="w-4 h-4 mr-2" />
                {copied ? 'Copied!' : 'Copy'}
              </Button>
              <Button
                variant="outline"
                onClick={handlePrint}
                className="w-full"
              >
                <Printer className="w-4 h-4 mr-2" />
                Print
              </Button>
            </div>
          </div>

          {/* Additional Info */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Items checked out:</span>
              <span className="font-medium text-gray-900">{itemCount}</span>
            </div>
            {expectedReturnDate && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Expected return:</span>
                <span className="font-medium text-gray-900">
                  {new Date(expectedReturnDate).toLocaleDateString()}
                </span>
              </div>
            )}
          </div>

          {/* Important Notice */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-yellow-800 font-medium mb-1">
              📋 Important
            </p>
            <p className="text-xs text-yellow-700">
              Save or print this barcode. You'll need it to return the items later.
              You can also find it in "My Active Checkouts" on the dashboard.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t">
          <Button onClick={onClose}>
            Done
          </Button>
        </div>
      </div>
    </div>
  );
}
