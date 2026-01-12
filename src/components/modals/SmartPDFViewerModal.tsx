import React, { useState, useEffect } from 'react';
import { Document, Page } from 'react-pdf';
import { X, Download, ZoomIn, ZoomOut, ChevronLeft, ChevronRight, AlertTriangle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { logger } from '../../lib/logger';

interface PDFViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  pdfSource: Blob | string;
  fileName: string;
  title?: string;
}

export const SmartPDFViewerModal: React.FC<PDFViewerModalProps> = ({
  isOpen,
  onClose,
  pdfSource,
  fileName,
  title
}) => {
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.0);
  const [pdfUrl, setPdfUrl] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [useBrowserViewer, setUseBrowserViewer] = useState<boolean>(false);

  // Auto-detect if we should use browser viewer based on file characteristics
  const detectBestViewer = () => {
    if (pdfSource instanceof Blob) {
      const sizeMB = pdfSource.size / (1024 * 1024);
      // Auto-use browser for large files (>3MB) to avoid react-pdf issues
      return sizeMB > 3;
    }
    return false;
  };

  // Normalize PDF source to consistent Blob format
  const normalizePDFSource = async (source: Blob | string): Promise<Blob> => {
    if (source instanceof Blob) {
      return source;
    }
    
    // Handle Base64 strings
    if (typeof source === 'string' && source.startsWith('data:')) {
      const response = await fetch(source);
      const blob = await response.blob();
      if (blob.type !== 'application/pdf') {
        throw new Error('Invalid PDF format');
      }
      return blob;
    }
    
    // Handle URL strings
    if (typeof source === 'string') {
      const response = await fetch(source);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      return await response.blob();
    }
    
    throw new Error('Invalid PDF source format');
  };

  // PDF URL management with auto-detection
  useEffect(() => {
    if (!isOpen) return;

    let objectUrl: string;
    let isGeneratedUrl = false;

    const setupPDF = async () => {
      try {
        setLoading(true);
        setError(null);
        setPageNumber(1);

        const normalizedBlob = await normalizePDFSource(pdfSource);
        objectUrl = URL.createObjectURL(normalizedBlob);
        isGeneratedUrl = true;
        
        setPdfUrl(objectUrl);
        
        // Auto-detect and use browser viewer for large files
        if (detectBestViewer()) {
          console.log('Auto-switching to browser viewer for large/complex PDF');
          setTimeout(() => {
            setUseBrowserViewer(true);
            setLoading(false);
          }, 1000);
        }
        
      } catch (error: any) {
        logger.error('PDF normalization error:', error);
        setError(error.message || 'Failed to process PDF data');
        setLoading(false);
      }
    };

    setupPDF();

    return () => {
      if (isGeneratedUrl && objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [pdfSource, isOpen]);

  // Auto-timeout with immediate fallback suggestion
  useEffect(() => {
    if (!isOpen || !loading || useBrowserViewer) return;

    const timeout = setTimeout(() => {
      if (loading) {
        console.warn('PDF loading timeout - switching to browser viewer');
        setError('React-PDF viewer is taking too long. Switching to browser viewer for better performance.');
        setTimeout(() => {
          setUseBrowserViewer(true);
          setLoading(false);
        }, 2000);
      }
    }, 15000); // 15 second timeout (shorter for better UX)

    return () => clearTimeout(timeout);
  }, [isOpen, loading, useBrowserViewer]);

  // Handlers
  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    console.log('PDF loaded successfully with react-pdf:', { numPages });
    setNumPages(numPages);
    setLoading(false);
    setError(null);
  };

  const onDocumentLoadError = (error: Error) => {
    logger.error('React-PDF load error:', error);
    console.log('React-PDF failed, switching to browser viewer');
    setError('React-PDF viewer had issues. Switching to browser viewer for compatibility.');
    setTimeout(() => {
      setUseBrowserViewer(true);
      setLoading(false);
    }, 1500);
  };

  const handlePreviousPage = () => {
    setPageNumber(prev => Math.max(prev - 1, 1));
  };

  const handleNextPage = () => {
    setPageNumber(prev => Math.min(prev + 1, numPages));
  };

  const handleZoomIn = () => {
    setScale(prev => Math.min(prev + 0.25, 3.0));
  };

  const handleZoomOut = () => {
    setScale(prev => Math.max(prev - 0.25, 0.5));
  };

  const handleZoomReset = () => {
    setScale(1.0);
  };

  const handleDownload = () => {
    if (pdfSource instanceof Blob) {
      const url = URL.createObjectURL(pdfSource);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } else {
      const a = document.createElement('a');
      a.href = pdfSource;
      a.download = fileName;
      a.click();
    }
    toast.success('PDF downloaded successfully');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl w-full max-w-6xl h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
              {title || fileName}
            </h2>
            {title && (
              <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{fileName}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors ml-4"
            aria-label="Close PDF viewer"
          >
            <X className="w-5 h-5 text-gray-900 dark:text-white" />
          </button>
        </div>

        {/* Controls Toolbar */}
        <div className="flex flex-col sm:flex-row items-center justify-between p-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 gap-2">
          {/* Viewer Toggle */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setUseBrowserViewer(false)}
              className={`px-3 py-1 text-sm rounded transition-colors ${
                !useBrowserViewer 
                  ? 'bg-primary-600 text-white' 
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300'
              }`}
            >
              Enhanced Viewer
            </button>
            <button
              onClick={() => setUseBrowserViewer(true)}
              className={`px-3 py-1 text-sm rounded transition-colors ${
                useBrowserViewer 
                  ? 'bg-primary-600 text-white' 
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300'
              }`}
            >
              Browser Viewer
            </button>
          </div>

          {/* Zoom/Navigation - only for enhanced viewer */}
          {!useBrowserViewer && (
            <>
              {/* Zoom Controls */}
              <div className="flex items-center gap-2">
                <button
                  onClick={handleZoomOut}
                  disabled={scale <= 0.5}
                  className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded disabled:opacity-50 disabled:cursor-not-allowed text-gray-900 dark:text-white"
                  title="Zoom Out (-)"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <span className="text-sm font-medium min-w-[60px] text-center text-gray-900 dark:text-white">
                  {Math.round(scale * 100)}%
                </span>
                <button
                  onClick={handleZoomIn}
                  disabled={scale >= 3.0}
                  className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded disabled:opacity-50 disabled:cursor-not-allowed text-gray-900 dark:text-white"
                  title="Zoom In (+)"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
                <button
                  onClick={handleZoomReset}
                  className="px-3 py-1 text-sm hover:bg-gray-200 dark:hover:bg-gray-700 rounded text-gray-900 dark:text-white"
                  title="Reset Zoom"
                >
                  Reset
                </button>
              </div>

              {/* Page Navigation */}
              {numPages > 0 && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={handlePreviousPage}
                    disabled={pageNumber <= 1}
                    className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded disabled:opacity-50 disabled:cursor-not-allowed text-gray-900 dark:text-white"
                    title="Previous Page (←)"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min={1}
                      max={numPages}
                      value={pageNumber}
                      onChange={(e) => {
                        const page = parseInt(e.target.value);
                        if (page >= 1 && page <= numPages) {
                          setPageNumber(page);
                        }
                      }}
                      className="w-16 px-2 py-1 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded text-center text-sm"
                    />
                    <span className="text-sm text-gray-600 dark:text-gray-400">/ {numPages}</span>
                  </div>
                  <button
                    onClick={handleNextPage}
                    disabled={pageNumber >= numPages}
                    className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded disabled:opacity-50 disabled:cursor-not-allowed text-gray-900 dark:text-white"
                    title="Next Page (→)"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </>
          )}

          {/* Download Button */}
          <button
            onClick={handleDownload}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Download</span>
          </button>
        </div>

        {/* PDF Content Area */}
        <div className="flex-1 overflow-auto bg-gray-100 dark:bg-gray-900 p-4">
          {loading && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mb-4 mx-auto"></div>
                <p className="text-gray-600 dark:text-gray-400">Loading PDF...</p>
                {pdfSource instanceof Blob && (
                  <p className="text-sm text-gray-500 mt-2">
                    File size: {(pdfSource.size / (1024 * 1024)).toFixed(2)} MB
                    {detectBestViewer() && (
                      <span className="text-blue-600 ml-2">⚡ Using browser viewer for better performance</span>
                    )}
                  </p>
                )}
              </div>
            </div>
          )}

          {error && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center max-w-md">
                <div className="flex items-center justify-center mb-4">
                  <AlertTriangle className="w-6 h-6 text-yellow-500 mr-2" />
                  <p className="text-yellow-600 dark:text-yellow-400">{error}</p>
                </div>
                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => {
                      setUseBrowserViewer(true);
                      setError(null);
                      setLoading(false);
                    }}
                    className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
                  >
                    Try Browser Viewer (Recommended)
                  </button>
                  <button
                    onClick={handleDownload}
                    className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                  >
                    Download PDF Instead
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Browser Viewer */}
          {useBrowserViewer && pdfUrl && !loading && !error && (
            <div className="flex flex-col h-full">
              <div className="bg-blue-50 border border-blue-200 p-2 mb-2 rounded text-center">
                <p className="text-sm text-blue-800">
                  🚀 Using browser PDF viewer - best compatibility and performance
                </p>
              </div>
              <iframe
                src={pdfUrl}
                className="flex-1 w-full border border-gray-300 rounded"
                title="PDF Viewer"
                style={{ minHeight: '600px' }}
              />
            </div>
          )}

          {/* React-pdf Viewer */}
          {!useBrowserViewer && pdfUrl && !loading && !error && (
            <div className="flex justify-center">
              <Document
                file={pdfUrl}
                onLoadSuccess={onDocumentLoadSuccess}
                onLoadError={onDocumentLoadError}
                loading={<div className="text-center p-8">Loading PDF content...</div>}
                error={<div className="text-center p-8 text-red-600">Failed to load PDF content</div>}
              >
                <Page
                  pageNumber={pageNumber}
                  scale={scale}
                  renderTextLayer={true}
                  renderAnnotationLayer={true}
                  className="shadow-lg"
                />
              </Document>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};