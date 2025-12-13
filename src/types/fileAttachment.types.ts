/**
 * File Attachment Types for Documents
 */

export interface FileAttachment {
  id: string;
  fileName: string;
  fileType: string; // MIME type (e.g., 'application/pdf', 'image/jpeg')
  fileSize: number; // in bytes
  fileExtension: string; // e.g., 'pdf', 'jpg', 'png'
  uploadedDate: string;
  uploadedBy: string;
  uploadedByName: string;
  fileData: string; // base64 encoded data or blob URL
  thumbnail?: string; // Optional thumbnail for images
}

export type AllowedFileType =
  | 'application/pdf'
  | 'image/jpeg'
  | 'image/jpg'
  | 'image/png'
  | 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' // .xlsx
  | 'application/vnd.ms-excel' // .xls
  | 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' // .docx
  | 'application/msword'; // .doc

export interface FileUploadConfig {
  maxFileSize: number; // in bytes
  maxFiles: number;
  allowedTypes: AllowedFileType[];
  allowMultiple: boolean;
}

export const DEFAULT_FILE_CONFIG: FileUploadConfig = {
  maxFileSize: 10 * 1024 * 1024, // 10MB
  maxFiles: 5,
  allowedTypes: [
    'application/pdf',
    'image/jpeg',
    'image/jpg',
    'image/png',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword',
  ],
  allowMultiple: true,
};

export const FILE_TYPE_ICONS: Record<string, string> = {
  'application/pdf': '📄',
  'image/jpeg': '🖼️',
  'image/jpg': '🖼️',
  'image/png': '🖼️',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '📊',
  'application/vnd.ms-excel': '📊',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '📝',
  'application/msword': '📝',
};

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};

export const getFileExtension = (fileName: string): string => {
  return fileName.slice((fileName.lastIndexOf('.') - 1 >>> 0) + 2).toLowerCase();
};
