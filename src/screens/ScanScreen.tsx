import { useState, useEffect, useRef } from 'react';
import { Camera, Type, Zap, Upload, X } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { useInventoryStore } from '../store/inventoryStore';
import { InventoryItem } from '../types/inventory.types';
import { formatCurrency } from '../lib/utils';
import { Badge } from '../components/ui/Badge';
import toast from 'react-hot-toast';
import { Html5QrcodeScanner } from 'html5-qrcode';

export const ScanScreen: React.FC = () => {
  const [manualBarcode, setManualBarcode] = useState('');
  const [scanning, setScanning] = useState(false);
  const [scannedItem, setScannedItem] = useState<InventoryItem | null>(null);
  const [flashEnabled, setFlashEnabled] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [recentScans, setRecentScans] = useState<InventoryItem[]>([]);
  const cameraRef = useRef<HTMLDivElement>(null);
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const { scanBarcode } = useInventoryStore();

  // Initialize recent scans from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('recentScans');
    if (saved) {
      try {
        setRecentScans(JSON.parse(saved));
      } catch (error) {
        console.error('Error loading recent scans:', error);
      }
    }
  }, []);

  const handleManualScan = async () => {
    if (!manualBarcode.trim()) return;
    setScanning(true);
    const item = await scanBarcode(manualBarcode);
    if (item) {
      setScannedItem(item);
      addToRecentScans(item);
      setManualBarcode('');
      toast.success(`Scanned: ${item.title}`);
    } else {
      toast.error('Item not found');
    }
    setScanning(false);
  };

  const addToRecentScans = (item: InventoryItem) => {
    setRecentScans((prev) => {
      // Remove duplicate if exists, then add to front
      const filtered = prev.filter((scan) => scan.id !== item.id);
      const updated = [item, ...filtered].slice(0, 10); // Keep last 10 scans
      localStorage.setItem('recentScans', JSON.stringify(updated));
      return updated;
    });
  };

  const handleCameraScan = () => {
    if (isCameraActive) {
      // Stop camera
      setIsCameraActive(false);
      if (scannerRef.current) {
        scannerRef.current
          .clear()
          .catch((error) => console.error('Error stopping scanner:', error));
        scannerRef.current = null;
      }
    } else {
      // Start camera
      setIsCameraActive(true);
      setTimeout(() => {
        if (cameraRef.current) {
          initializeScanner();
        }
      }, 100);
    }
  };

  const initializeScanner = () => {
    if (!cameraRef.current || scannerRef.current) return;

    const scanner = new Html5QrcodeScanner(
      'camera-scanner',
      {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        rememberLastUsedCamera: true,
        disableFlip: false,
      },
      false
    );

    scannerRef.current = scanner;

    scanner.render(
      async (decodedText) => {
        // Stop scanner and process barcode
        setIsCameraActive(false);
        await scanner.clear().catch(() => {});
        scannerRef.current = null;

        setScanning(true);
        const item = await scanBarcode(decodedText);
        if (item) {
          setScannedItem(item);
          addToRecentScans(item);
          toast.success(`Scanned: ${item.title}`);
        } else {
          toast.error('Item not found');
        }
        setScanning(false);
      },
      (errorMessage) => {
        // Silently ignore scan errors (continuous scanning)
      }
    );
  };

  // Cleanup scanner on unmount or when deactivating camera
  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current
          .clear()
          .catch((error) => console.error('Error cleaning up scanner:', error));
      }
    };
  }, []);

  return (
    <div className="min-h-full bg-gray-50">
      <div className="p-4 md:p-6  space-y-6">
        {/* Header Container */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Scan Item</h1>
              <p className="text-gray-600 mt-1">Scan barcode or enter manually</p>
            </div>
          </div>
        </div>

        {/* Camera View */}
        <Card variant="bordered" padding="none" className="mb-6 overflow-hidden">
        <div
          ref={cameraRef}
          className={`${isCameraActive ? '' : 'aspect-video'} bg-gray-900 relative`}
          id="camera-scanner"
        >
          {!isCameraActive && (
            <>
              <div className="aspect-video flex items-center justify-center">
                <div className="text-center text-white">
                  <Camera className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p className="text-sm opacity-75">Click button to start camera scan</p>
                </div>
              </div>

              {/* Scan Frame Overlay */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-64 h-64 border-4 border-blue-500 rounded-lg opacity-75"></div>
              </div>
            </>
          )}
        </div>

        <div className="p-4 bg-white border-t border-gray-200 flex gap-2">
          <Button
            fullWidth
            icon={isCameraActive ? <X className="w-5 h-5" /> : <Camera className="w-5 h-5" />}
            onClick={handleCameraScan}
            variant={isCameraActive ? 'danger' : 'primary'}
          >
            {isCameraActive ? 'Stop Camera' : 'Start Camera Scan'}
          </Button>
          <button
            onClick={() => setFlashEnabled(!flashEnabled)}
            className="p-3 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
            title="Toggle flash"
          >
            <Zap className={`w-5 h-5 ${flashEnabled ? 'text-yellow-500 fill-yellow-500' : 'text-gray-600'}`} />
          </button>
        </div>
        </Card>

        {/* Manual Entry */}
        <Card variant="bordered" className="mb-6">
        <CardHeader>
          <CardTitle>Manual Entry</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              placeholder="Enter barcode number..."
              icon={<Type className="w-4 h-4" />}
              value={manualBarcode}
              onChange={(e) => setManualBarcode(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleManualScan()}
              fullWidth
            />
            <Button onClick={handleManualScan} disabled={scanning || !manualBarcode.trim()}>
              {scanning ? 'Scanning...' : 'Scan'}
            </Button>
          </div>
        </CardContent>
        </Card>

        {/* Scanned Item Result */}
        {scannedItem && (
          <Card variant="elevated" className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Scanned Item</CardTitle>
              <Badge variant="success">Found</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <h3 className="text-xl font-semibold text-gray-900">{scannedItem.title}</h3>
                <p className="text-sm text-gray-600 mt-1">SKU: {scannedItem.sku}</p>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Quantity</p>
                  <p className="font-medium">{scannedItem.quantity} {scannedItem.unitOfMeasure}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Price</p>
                  <p className="font-medium">{formatCurrency(scannedItem.price)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Location</p>
                  <p className="font-medium">{scannedItem.location}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Category</p>
                  <p className="font-medium">{scannedItem.category}</p>
                </div>
              </div>
              <div className="flex gap-2 pt-3">
                <Button fullWidth>View Details</Button>
                <Button fullWidth variant="outline">Checkout</Button>
              </div>
            </div>
          </CardContent>
          </Card>
        )}

        {/* Recent Scans */}
        <Card variant="bordered">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Recent Scans</CardTitle>
            {recentScans.length > 0 && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setRecentScans([]);
                  localStorage.removeItem('recentScans');
                  toast.success('Recent scans cleared');
                }}
              >
                Clear
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {recentScans.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Upload className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No recent scans</p>
            </div>
          ) : (
            <div className="space-y-2">
              {recentScans.map((item) => (
                <div
                  key={item.id}
                  className="p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors cursor-pointer"
                  onClick={() => setScannedItem(item)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">{item.title}</p>
                      <p className="text-xs text-gray-600">SKU: {item.sku}</p>
                    </div>
                    <div className="text-right ml-2">
                      <p className="font-semibold text-gray-900">
                        {item.quantity} {item.unitOfMeasure}
                      </p>
                      <p className="text-xs text-gray-600">{formatCurrency(item.price)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
        </Card>
      </div>
    </div>
  );
};
