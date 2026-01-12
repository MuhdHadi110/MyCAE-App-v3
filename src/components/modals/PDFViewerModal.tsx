import React, { useState, useEffect } from 'react';
import { Document, Page } from 'react-pdf';
import { X, Download, ZoomIn, ZoomOut, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { logger } from '../../lib/logger';

interface PDFViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  pdfSource: Blob | string;
  fileName: string;
  title?: string;
}

/**
 * Normalize PDF source to consistent Blob format
 */
const normalizePDFSource = async (source: Blob | string): Promise<Blob> => {
  console.log('normalizePDFSource input:', {
    type: typeof source,
    isBlob: source instanceof Blob,
    stringLength: typeof source === 'string' ? source.length : 'N/A',
    stringStart: typeof source === 'string' ? source.substring(0, 100) : 'N/A'
  });

  // If already a Blob, return as-is
  if (source instanceof Blob) {
    console.log('Source is already Blob, returning as-is:', {
      size: source.size,
      type: source.type
    });
    return source;
  }
  
  // Handle Base64 strings
  if (typeof source === 'string' && source.startsWith('data:')) {
    try {
      console.log('Processing Base64 data URI...');
      const response = await fetch(source);
      const blob = await response.blob();
      console.log('Base64 blob created:', {
        size: blob.size,
        type: blob.type
      });
      if (blob.type !== 'application/pdf') {
        throw new Error(`Invalid PDF format: ${blob.type}`);
      }
      return blob;
    } catch (error) {
      console.error('Base64 processing error:', error);
      throw new Error('Failed to process Base64 PDF data');
    }
  }
  
  // Handle URL strings
  if (typeof source === 'string') {
    try {
      console.log('Processing URL string...');
      const response = await fetch(source);
      console.log('URL response:', {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries())
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const blob = await response.blob();
      console.log('URL blob created:', {
        size: blob.size,
        type: blob.type
      });
      if (blob.type !== 'application/pdf' && !source.endsWith('.pdf')) {
        throw new Error('URL does not point to a valid PDF');
      }
      return blob;
    } catch (error: any) {
      console.error('URL processing error:', error);
      throw new Error(`Failed to fetch PDF from URL: ${error.message}`);
    }
  }
  
  throw new Error('Invalid PDF source format');
};

export const PDFViewerModal: React.FC<PDFViewerModalProps> = ({
  isOpen,
  onClose,
  pdfSource,
  fileName,
  title
}) => {
   // State management
   const [numPages, setNumPages] = useState<number>(0);
   const [pageNumber, setPageNumber] = useState<number>(1);
   const [scale, setScale] = useState<number>(1.0);
   const [pdfUrl, setPdfUrl] = useState<string>('');
   const [loading, setLoading] = useState<boolean>(true);
   const [error, setError] = useState<string | null>(null);
   const [useFallback, setUseFallback] = useState<boolean>(false);

   // Auto-detect if we should use browser viewer based on file characteristics
   const shouldUseBrowserViewer = () => {
     if (pdfSource instanceof Blob) {
       const sizeMB = pdfSource.size / (1024 * 1024);
       // Use browser for very large files (>8MB) 
       return sizeMB > 8;
     }
     return false;
   };



  // PDF URL management with cleanup and normalization
  useEffect(() => {
    if (!isOpen) return;

    let objectUrl: string;
    let isGeneratedUrl = false;

    const setupPDF = async () => {
      try {
        setLoading(true);
        setError(null);
        setPageNumber(1);

        console.log('PDF Source type:', typeof pdfSource, pdfSource instanceof Blob ? 'Blob' : 'String');
        
        const normalizedBlob = await normalizePDFSource(pdfSource);
        
        console.log('Normalized blob:', {
          size: normalizedBlob.size,
          type: normalizedBlob.type,
          slice: normalizedBlob.slice(0, 10).toString()
        });
        
        objectUrl = URL.createObjectURL(normalizedBlob);
        isGeneratedUrl = true;
        
        console.log('Object URL created:', objectUrl.substring(0, 50) + '...');
        
        setPdfUrl(objectUrl);
      } catch (error: any) {
        logger.error('PDF normalization error:', error);
        console.error('PDF normalization failed:', error);
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

  // Add timeout to catch infinite loading with size-based adjustment
  useEffect(() => {
    if (!isOpen || !loading) return;

    // Adjust timeout based on file size
    const getTimeoutDuration = () => {
      if (pdfSource instanceof Blob) {
        const sizeMB = pdfSource.size / (1024 * 1024);
        if (sizeMB > 5) return 60000; // 1 minute for large files
        if (sizeMB > 2) return 45000; // 45 seconds for medium files
        if (sizeMB > 1) return 30000; // 30 seconds for small files
        return 15000; // 15 seconds for tiny files
      }
      return 30000; // Default 30 seconds
    };

    const timeout = setTimeout(() => {
      if (loading) {
        console.warn('PDF loading timeout triggered');
        const fileSize = pdfSource instanceof Blob ? (pdfSource.size / (1024 * 1024)).toFixed(2) : 'unknown';
        setError(`PDF loading is taking too long (${fileSize}MB file). The file might be too complex for JavaScript PDF viewer. Try using the browser viewer or download instead.`);
        setLoading(false);
        
        // Auto-suggest fallback for very large files
        if (pdfSource instanceof Blob && pdfSource.size > 5 * 1024 * 1024) { // > 5MB
          setTimeout(() => {
            setUseFallback(true);
            setError('');
          }, 2000);
        }
      }
    }, getTimeoutDuration());

    return () => clearTimeout(timeout);
  }, [isOpen, loading, pdfSource]);

  // Keyboard shortcuts
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') handlePreviousPage();
      if (e.key === 'ArrowRight') handleNextPage();
      if (e.key === '+' || e.key === '=') handleZoomIn();
      if (e.key === '-' || e.key === '_') handleZoomOut();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, pageNumber, numPages, scale]);

  // Handlers
  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    console.log('PDF loaded successfully:', { numPages });
    setNumPages(numPages);
    setLoading(false);
    setError(null);
  };

  const onDocumentLoadError = (error: Error) => {
    logger.error('PDF load error:', error);
    
    // Specific error handling based on error message
    let errorMessage = 'Failed to load PDF. Please try downloading it instead.';
    
    if (error.message.includes('Invalid PDF') || error.message.includes('Not a PDF')) {
      errorMessage = 'This file is not a valid PDF or is corrupted. Please try downloading it.';
    } else if (error.message.includes('network') || error.message.includes('fetch')) {
      errorMessage = 'Network error loading PDF. Please check your connection and try again.';
    } else if (error.message.includes('size') || error.message.includes('too large')) {
      errorMessage = 'PDF file is too large to display. Please download it to view.';
    } else if (error.message.includes('password') || error.message.includes('encrypted')) {
      errorMessage = 'This PDF is password protected and cannot be displayed. Please download it.';
    } else if (error.message.includes('CORS')) {
      errorMessage = 'Security error loading PDF. Please try downloading it instead.';
    } else if (error.message) {
      errorMessage = `Failed to load PDF: ${error.message}`;
    }
    
    setError(errorMessage);
    setLoading(false);
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
      // Base64 download
      const a = document.createElement('a');
      a.href = pdfSource;
      a.download = fileName;
      a.click();
    }
    toast.success('PDF downloaded successfully');
  };

  const handlePageInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const page = parseInt(e.target.value);
    if (page >= 1 && page <= numPages) {
      setPageNumber(page);
    }
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
          {!loading && numPages > 0 && (
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
                  onChange={handlePageInputChange}
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
                  </p>
                )}
              </div>
            </div>
          )}

          {error && !useFallback && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center max-w-md">
                <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
                <div className="flex flex-col gap-2">
                  <button
                    onClick={handleDownload}
                    className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                  >
                    Download PDF Instead
                  </button>
                  <button
                    onClick={() => {
                      console.log('Retrying PDF load...');
                      setError(null);
                      setLoading(true);
                      setUseFallback(false);
                      // Trigger re-setup by forcing a re-render
                      setPdfUrl('');
                      setTimeout(() => {
                        const setupPDF = async () => {
                          try {
                            setLoading(true);
                            setError(null);
                            setPageNumber(1);
                            const normalizedBlob = await normalizePDFSource(pdfSource);
                            const newObjectUrl = URL.createObjectURL(normalizedBlob);
                            setPdfUrl(newObjectUrl);
                          } catch (error: any) {
                            setError(`Retry failed: ${error.message}`);
                            setLoading(false);
                          }
                        };
                        setupPDF();
                      }, 100);
                    }}
                    className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                  >
                    Retry Loading
                  </button>
                  <button
                    onClick={() => {
                      setUseFallback(true);
                      setError(null);
                      setLoading(false);
                    }}
                    className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
                  >
                    Use Browser PDF Viewer
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Fallback PDF viewer using iframe/embed */}
          {useFallback && pdfUrl && (
            <div className="flex flex-col h-full">
              <div className="bg-yellow-50 border border-yellow-200 p-3 mb-2 rounded text-center">
                <p className="text-sm text-yellow-800">
                  Using browser PDF viewer. Some features may be limited.
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

          {/* React-pdf viewer */}
          {!loading && !error && !useFallback && pdfUrl && (
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
