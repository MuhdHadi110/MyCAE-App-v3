import { CheckCircle, X, Copy, Printer, QrCode as QrCodeIcon } from 'lucide-react';
import { Button } from '../ui/Button';
import { useState } from 'react';

interface CheckoutSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  masterBarcode: string;
  itemCount: number;
  expectedReturnDate?: string;
}

export function CheckoutSuccessModal({
  isOpen,
  onClose,
  masterBarcode,
  itemCount,
  expectedReturnDate,
}: CheckoutSuccessModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(masterBarcode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    // Create a simple print window with the barcode
    const printWindow = window.open('', '', 'width=400,height=300');
    if (printWindow) {
      // Sanitize data to prevent XSS
      const sanitizeHtml = (str: string): string => {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
      };

      const safeBarcode = sanitizeHtml(masterBarcode);
      const safeItemCount = sanitizeHtml(String(itemCount));
      const safeReturnDate = expectedReturnDate 
        ? sanitizeHtml(new Date(expectedReturnDate).toLocaleDateString())
        : '';

      // Build DOM safely instead of using document.write with template literals
      printWindow.document.open();
      printWindow.document.write('<!DOCTYPE html><html><head><title>Master Barcode</title></head><body></body></html>');
      printWindow.document.close();

      const doc = printWindow.document;
      const body = doc.body;
      
      // Apply styles
      body.style.fontFamily = 'Arial, sans-serif';
      body.style.display = 'flex';
      body.style.flexDirection = 'column';
      body.style.alignItems = 'center';
      body.style.justifyContent = 'center';
      body.style.height = '100vh';
      body.style.margin = '0';

      // Create label
      const label = doc.createElement('div');
      label.textContent = 'MASTER BARCODE';
      label.style.fontSize = '14px';
      label.style.color = '#666';
      label.style.marginBottom = '10px';
      body.appendChild(label);

      // Create barcode
      const barcode = doc.createElement('div');
      barcode.textContent = safeBarcode;
      barcode.style.fontSize = '32px';
      barcode.style.fontWeight = 'bold';
      barcode.style.fontFamily = 'monospace';
      barcode.style.margin = '20px 0';
      barcode.style.letterSpacing = '3px';
      body.appendChild(barcode);

      // Create info
      const info = doc.createElement('div');
      info.textContent = `${safeItemCount} items checked out`;
      info.style.fontSize = '12px';
      info.style.color = '#999';
      info.style.marginTop = '20px';
      body.appendChild(info);

      // Add return date if present
      if (safeReturnDate) {
        const returnInfo = doc.createElement('div');
        returnInfo.textContent = `Return by: ${safeReturnDate}`;
        returnInfo.style.fontSize = '12px';
        returnInfo.style.color = '#999';
        returnInfo.style.marginTop = '10px';
        body.appendChild(returnInfo);
      }

      printWindow.focus();
      printWindow.print();
      printWindow.close();
    }
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
