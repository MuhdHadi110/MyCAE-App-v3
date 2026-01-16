import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { logger } from './logger';

// Ensure upload directory exists
const uploadsDir = path.join(__dirname, '../../uploads/purchase-orders');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

/**
 * Sanitize filename to prevent path traversal attacks
 * Removes directory separators, null bytes, and other dangerous characters
 */
function sanitizeFilename(filename: string): string {
  // Remove path separators and null bytes
  let sanitized = filename
    .replace(/[/\\]/g, '_') // Replace path separators
    .replace(/\0/g, '') // Remove null bytes
    .replace(/\.\./g, '_') // Remove parent directory references
    .replace(/[<>:"|?*]/g, '_') // Remove Windows-invalid chars
    .replace(/[\x00-\x1f\x80-\x9f]/g, '') // Remove control characters
    .trim();

  // Ensure filename doesn't start with a dot (hidden files)
  if (sanitized.startsWith('.')) {
    sanitized = '_' + sanitized.substring(1);
  }

  // Limit length
  if (sanitized.length > 200) {
    const ext = path.extname(sanitized);
    sanitized = sanitized.substring(0, 200 - ext.length) + ext;
  }

  return sanitized || 'file';
}

/**
 * Sanitize project code for use in filenames
 */
function sanitizeProjectCode(code: string): string {
  // Only allow alphanumeric characters and basic punctuation
  return code.replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 50);
}

// Safe extensions whitelist
const SAFE_EXTENSIONS = ['.pdf', '.png', '.jpg', '.jpeg', '.doc', '.docx'];

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    // Get and sanitize project code from request params or body
    const rawProjectCode = req.params.id || req.body.projectCode || 'PROJECT';
    const projectCode = sanitizeProjectCode(rawProjectCode);
    const timestamp = Date.now();
    const ext = path.extname(sanitizeFilename(file.originalname)).toLowerCase();

    // Only allow safe extensions
    const finalExt = SAFE_EXTENSIONS.includes(ext) ? ext : '.bin';

    const filename = `${projectCode}_PO_${timestamp}${finalExt}`;

    // Log file upload for audit
    logger.info('File upload initiated', {
      originalName: file.originalname,
      sanitizedFilename: filename,
      mimeType: file.mimetype,
      projectCode,
    });

    cb(null, filename);
  },
});

// File filter - only allow specific file types
const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedTypes = [
    'application/pdf',
    'image/png',
    'image/jpeg',
    'image/jpg',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
    'application/msword', // .doc
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    logger.warn('File upload rejected - invalid type', {
      originalName: file.originalname,
      mimeType: file.mimetype,
    });
    cb(new Error('Invalid file type. Only PDF, PNG, JPG, and DOCX files are allowed.'));
  }
};

// Create multer upload instance
export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max file size
    files: 1, // Only allow 1 file per request
  },
});

/**
 * Delete a file from the uploads directory
 * Validates the filename to prevent path traversal
 */
export const deleteFile = (fileUrl: string): boolean => {
  try {
    if (!fileUrl) return false;

    // Extract and sanitize filename from URL
    const rawFilename = path.basename(fileUrl);
    const filename = sanitizeFilename(rawFilename);

    // Ensure the file is within the uploads directory (prevent path traversal)
    const filePath = path.join(uploadsDir, filename);
    const resolvedPath = path.resolve(filePath);

    if (!resolvedPath.startsWith(path.resolve(uploadsDir))) {
      logger.warn('Attempted path traversal in deleteFile', { fileUrl, resolvedPath });
      return false;
    }

    if (fs.existsSync(resolvedPath)) {
      fs.unlinkSync(resolvedPath);
      logger.info('File deleted', { filename });
      return true;
    }
    return false;
  } catch (error) {
    logger.error('Error deleting file:', error);
    return false;
  }
};

/**
 * Generate the file URL for serving
 */
export const generateFileUrl = (filename: string, req: any): string => {
  const sanitized = sanitizeFilename(filename);
  const protocol = req.protocol;
  const host = req.get('host');
  return `${protocol}://${host}/uploads/purchase-orders/${sanitized}`;
};

/**
 * Get total size of uploads directory
 * Useful for monitoring disk usage
 */
export const getUploadsDirSize = (): number => {
  try {
    let totalSize = 0;
    const files = fs.readdirSync(uploadsDir);
    for (const file of files) {
      const filePath = path.join(uploadsDir, file);
      const stats = fs.statSync(filePath);
      if (stats.isFile()) {
        totalSize += stats.size;
      }
    }
    return totalSize;
  } catch (error) {
    logger.error('Error calculating uploads directory size:', error);
    return 0;
  }
};
