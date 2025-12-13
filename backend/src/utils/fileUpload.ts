import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Ensure upload directory exists
const uploadsDir = path.join(__dirname, '../../uploads/purchase-orders');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    // Get project code from request params or body
    const projectCode = req.params.id || req.body.projectCode || 'PROJECT';
    const timestamp = Date.now();
    const ext = path.extname(file.originalname);
    const filename = `${projectCode}_PO_${timestamp}${ext}`;
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
    cb(new Error('Invalid file type. Only PDF, PNG, JPG, and DOCX files are allowed.'));
  }
};

// Create multer upload instance
export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max file size
  },
});

/**
 * Delete a file from the uploads directory
 */
export const deleteFile = (fileUrl: string): boolean => {
  try {
    if (!fileUrl) return false;

    // Extract filename from URL
    const filename = path.basename(fileUrl);
    const filePath = path.join(uploadsDir, filename);

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error deleting file:', error);
    return false;
  }
};

/**
 * Generate the file URL for serving
 */
export const generateFileUrl = (filename: string, req: any): string => {
  const protocol = req.protocol;
  const host = req.get('host');
  return `${protocol}://${host}/uploads/purchase-orders/${filename}`;
};
