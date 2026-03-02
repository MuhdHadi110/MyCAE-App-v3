"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUploadsDirSize = exports.generateFileUrl = exports.deleteFile = exports.upload = void 0;
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const logger_1 = require("./logger");
// Ensure upload directory exists
const uploadsDir = path_1.default.join(__dirname, '../../uploads/purchase-orders');
if (!fs_1.default.existsSync(uploadsDir)) {
    fs_1.default.mkdirSync(uploadsDir, { recursive: true });
}
/**
 * Sanitize filename to prevent path traversal attacks
 * Removes directory separators, null bytes, and other dangerous characters
 */
function sanitizeFilename(filename) {
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
        const ext = path_1.default.extname(sanitized);
        sanitized = sanitized.substring(0, 200 - ext.length) + ext;
    }
    return sanitized || 'file';
}
/**
 * Sanitize project code for use in filenames
 */
function sanitizeProjectCode(code) {
    // Only allow alphanumeric characters and basic punctuation
    return code.replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 50);
}
// Safe extensions whitelist
const SAFE_EXTENSIONS = ['.pdf', '.png', '.jpg', '.jpeg', '.doc', '.docx'];
// Configure storage
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
        // Get and sanitize project code from request params or body
        const rawProjectCode = req.params.id || req.body.projectCode || 'PROJECT';
        const projectCode = sanitizeProjectCode(rawProjectCode);
        const timestamp = Date.now();
        const ext = path_1.default.extname(sanitizeFilename(file.originalname)).toLowerCase();
        // Only allow safe extensions
        const finalExt = SAFE_EXTENSIONS.includes(ext) ? ext : '.bin';
        const filename = `${projectCode}_PO_${timestamp}${finalExt}`;
        // Log file upload for audit
        logger_1.logger.info('File upload initiated', {
            originalName: file.originalname,
            sanitizedFilename: filename,
            mimeType: file.mimetype,
            projectCode,
        });
        cb(null, filename);
    },
});
// File filter - only allow specific file types
const fileFilter = (req, file, cb) => {
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
    }
    else {
        logger_1.logger.warn('File upload rejected - invalid type', {
            originalName: file.originalname,
            mimeType: file.mimetype,
        });
        cb(new Error('Invalid file type. Only PDF, PNG, JPG, and DOCX files are allowed.'));
    }
};
// Create multer upload instance
exports.upload = (0, multer_1.default)({
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
const deleteFile = (fileUrl) => {
    try {
        if (!fileUrl)
            return false;
        // Extract and sanitize filename from URL
        const rawFilename = path_1.default.basename(fileUrl);
        const filename = sanitizeFilename(rawFilename);
        // Ensure the file is within the uploads directory (prevent path traversal)
        const filePath = path_1.default.join(uploadsDir, filename);
        const resolvedPath = path_1.default.resolve(filePath);
        if (!resolvedPath.startsWith(path_1.default.resolve(uploadsDir))) {
            logger_1.logger.warn('Attempted path traversal in deleteFile', { fileUrl, resolvedPath });
            return false;
        }
        if (fs_1.default.existsSync(resolvedPath)) {
            fs_1.default.unlinkSync(resolvedPath);
            logger_1.logger.info('File deleted', { filename });
            return true;
        }
        return false;
    }
    catch (error) {
        logger_1.logger.error('Error deleting file:', error);
        return false;
    }
};
exports.deleteFile = deleteFile;
/**
 * Generate the file URL for serving
 */
const generateFileUrl = (filename, req) => {
    const sanitized = sanitizeFilename(filename);
    const protocol = req.protocol;
    const host = req.get('host');
    return `${protocol}://${host}/uploads/purchase-orders/${sanitized}`;
};
exports.generateFileUrl = generateFileUrl;
/**
 * Get total size of uploads directory
 * Useful for monitoring disk usage
 */
const getUploadsDirSize = () => {
    try {
        let totalSize = 0;
        const files = fs_1.default.readdirSync(uploadsDir);
        for (const file of files) {
            const filePath = path_1.default.join(uploadsDir, file);
            const stats = fs_1.default.statSync(filePath);
            if (stats.isFile()) {
                totalSize += stats.size;
            }
        }
        return totalSize;
    }
    catch (error) {
        logger_1.logger.error('Error calculating uploads directory size:', error);
        return 0;
    }
};
exports.getUploadsDirSize = getUploadsDirSize;
//# sourceMappingURL=fileUpload.js.map