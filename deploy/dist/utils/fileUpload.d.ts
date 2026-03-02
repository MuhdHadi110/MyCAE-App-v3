import multer from 'multer';
export declare const upload: multer.Multer;
/**
 * Delete a file from the uploads directory
 * Validates the filename to prevent path traversal
 */
export declare const deleteFile: (fileUrl: string) => boolean;
/**
 * Generate the file URL for serving
 */
export declare const generateFileUrl: (filename: string, req: any) => string;
/**
 * Get total size of uploads directory
 * Useful for monitoring disk usage
 */
export declare const getUploadsDirSize: () => number;
//# sourceMappingURL=fileUpload.d.ts.map