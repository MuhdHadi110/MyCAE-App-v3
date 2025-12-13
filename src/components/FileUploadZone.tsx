import { useCallback, useState } from 'react';
import { Upload, X, File, Image as ImageIcon, FileText, Sheet } from 'lucide-react';
import { toast } from 'react-hot-toast';
import type { FileAttachment } from '../types/fileAttachment.types';
import { DEFAULT_FILE_CONFIG, formatFileSize, getFileExtension, FILE_TYPE_ICONS } from '../types/fileAttachment.types';
import { getCurrentUser } from '../lib/auth';

interface FileUploadZoneProps {
  attachments: FileAttachment[];
  onFilesAdded: (files: FileAttachment[]) => void;
  onFileRemoved: (fileId: string) => void;
  maxFiles?: number;
  maxFileSize?: number;
  allowMultiple?: boolean;
}

export const FileUploadZone: React.FC<FileUploadZoneProps> = ({
  attachments,
  onFilesAdded,
  onFileRemoved,
  maxFiles = DEFAULT_FILE_CONFIG.maxFiles,
  maxFileSize = DEFAULT_FILE_CONFIG.maxFileSize,
  allowMultiple = true,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const currentUser = getCurrentUser();

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDragIn = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true);
    }
  }, []);

  const handleDragOut = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const processFiles = async (files: FileList) => {
    const fileArray = Array.from(files);

    // Check max files limit
    if (attachments.length + fileArray.length > maxFiles) {
      toast.error(`Maximum ${maxFiles} files allowed`);
      return;
    }

    const newAttachments: FileAttachment[] = [];

    for (const file of fileArray) {
      // Check file size
      if (file.size > maxFileSize) {
        toast.error(`${file.name} exceeds maximum size of ${formatFileSize(maxFileSize)}`);
        continue;
      }

      // Check file type
      if (!DEFAULT_FILE_CONFIG.allowedTypes.includes(file.type as any)) {
        toast.error(`${file.name} - File type not supported`);
        continue;
      }

      // Convert to base64
      const reader = new FileReader();
      reader.onload = () => {
        const attachment: FileAttachment = {
          id: `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          fileName: file.name,
          fileType: file.type,
          fileSize: file.size,
          fileExtension: getFileExtension(file.name),
          uploadedDate: new Date().toISOString(),
          uploadedBy: currentUser.id,
          uploadedByName: currentUser.name,
          fileData: reader.result as string,
        };

        newAttachments.push(attachment);

        // Call callback when all files are processed
        if (newAttachments.length === fileArray.length) {
          onFilesAdded(newAttachments);
          toast.success(`${newAttachments.length} file(s) uploaded successfully`);
        }
      };

      reader.onerror = () => {
        toast.error(`Error reading ${file.name}`);
      };

      reader.readAsDataURL(file);
    }
  };

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      const files = e.dataTransfer.files;
      if (files && files.length > 0) {
        processFiles(files);
      }
    },
    [attachments.length, maxFiles, maxFileSize, onFilesAdded]
  );

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
    }
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) return <ImageIcon className="w-5 h-5" />;
    if (fileType === 'application/pdf') return <FileText className="w-5 h-5" />;
    if (fileType.includes('sheet') || fileType.includes('excel')) return <Sheet className="w-5 h-5" />;
    return <File className="w-5 h-5" />;
  };

  const handleDownload = (attachment: FileAttachment) => {
    // Create download link
    const link = document.createElement('a');
    link.href = attachment.fileData;
    link.download = attachment.fileName;
    link.click();
  };

  return (
    <div className="space-y-4">
      {/* Upload Zone */}
      <div
        onDragEnter={handleDragIn}
        onDragLeave={handleDragOut}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          isDragging
            ? 'border-primary-500 bg-indigo-50'
            : 'border-gray-300 hover:border-gray-400 bg-gray-50'
        }`}
      >
        <Upload className={`w-12 h-12 mx-auto mb-4 ${isDragging ? 'text-primary-600' : 'text-gray-400'}`} />
        <p className="text-sm font-medium text-gray-700 mb-1">
          Drag & drop files here, or click to browse
        </p>
        <p className="text-xs text-gray-500 mb-4">
          PDF, Images, Excel, Word (max {formatFileSize(maxFileSize)})
        </p>
        <input
          type="file"
          multiple={allowMultiple}
          accept=".pdf,.jpg,.jpeg,.png,.xlsx,.xls,.docx,.doc"
          onChange={handleFileInput}
          className="hidden"
          id="file-upload"
        />
        <label
          htmlFor="file-upload"
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 cursor-pointer transition-colors"
        >
          <Upload className="w-4 h-4" />
          Choose Files
        </label>
        <p className="text-xs text-gray-500 mt-2">
          {attachments.length} / {maxFiles} files uploaded
        </p>
      </div>

      {/* File List */}
      {attachments.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-gray-700">Attached Files ({attachments.length})</h4>
          <div className="space-y-2">
            {attachments.map((attachment) => (
              <div
                key={attachment.id}
                className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="flex-shrink-0 text-gray-500">
                    {getFileIcon(attachment.fileType)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{attachment.fileName}</p>
                    <p className="text-xs text-gray-500">
                      {formatFileSize(attachment.fileSize)} • {new Date(attachment.uploadedDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleDownload(attachment)}
                    className="px-3 py-1 text-xs font-medium text-primary-600 hover:bg-indigo-50 rounded transition-colors"
                  >
                    Download
                  </button>
                  <button
                    onClick={() => onFileRemoved(attachment.id)}
                    className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                    title="Remove file"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
