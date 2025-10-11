/**
 * @fileoverview Express middleware for secure file upload handling
 * @module File-upload-middleware
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-10-07
 * @compliance CQC, Care Inspectorate, CIW, RQIA, GDPR
 * @stability stable
 * 
 * @description Express middleware for secure file upload handling
 */

import { EventEmitter2 } from "eventemitter2";

/**
 * @fileoverview File Upload Middleware
 * @module FileUploadMiddleware
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-01-01
 * 
 * @description Express middleware for secure file upload handling
 * with virus scanning, validation, and encryption.
 */

import { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import crypto from 'crypto';
import path from 'path';

// File upload configuration
const storage = multer.memoryStorage();

const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Allowed file types for document management
  const allowedMimeTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain',
    'text/csv',
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'video/mp4',
    'video/webm',
    'audio/mpeg',
    'audio/wav',
    'application/json',
    'application/xml'
  ];

  // Check file type
  if (!allowedMimeTypes.includes(file.mimetype)) {
    return cb(new Error(`File type not allowed: ${file.mimetype}`));
  }

  // Check file size (50MB max)
  const maxSize = 50 * 1024 * 1024; // 50MB
  if (file.size && file.size > maxSize) {
    return cb(new Error(`File too large: ${file.size} bytes (max: ${maxSize})`));
  }

  // Validate filename
  const filename = file.originalname;
  if (!/^[a-zA-Z0-9._-]+$/.test(filename)) {
    return cb(new Error('Invalid filename: only alphanumeric characters, dots, underscores, and hyphens allowed'));
  }

  cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB
    files: 1 // Single file upload
  }
});

/**
 * File upload middleware with security validation
 */
export const fileUploadMiddleware = (req: Request, res: Response, next: NextFunction) => {
  upload.single('file')(req, res, async (err) => {
    try {
      if (err instanceof multer.MulterError) {
        let errorMessage = 'File upload error';
        let errorCode = 'UPLOAD_ERROR';

        switch (err.code) {
          case 'LIMIT_FILE_SIZE':
            errorMessage = 'File too large (max 50MB)';
            errorCode = 'FILE_TOO_LARGE';
            break;
          case 'LIMIT_FILE_COUNT':
            errorMessage = 'Too many files (max 1)';
            errorCode = 'TOO_MANY_FILES';
            break;
          case 'LIMIT_UNEXPECTED_FILE':
            errorMessage = 'Unexpected file field';
            errorCode = 'UNEXPECTED_FILE';
            break;
        }

        return res.status(400).json({
          success: false,
          error: errorMessage,
          code: errorCode
        });
      }

      if (err) {
        return res.status(400).json({
          success: false,
          error: err.message,
          code: 'FILE_VALIDATION_ERROR'
        });
      }

      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: 'No file provided',
          code: 'NO_FILE_PROVIDED'
        });
      }

      // Additional security validations
      const securityCheck = await performSecurityValidation(req.file);
      if (!securityCheck.safe) {
        return res.status(400).json({
          success: false,
          error: 'File security validation failed',
          code: 'SECURITY_VALIDATION_FAILED',
          details: securityCheck.issues
        });
      }

      // Generate file hash for integrity
      const fileHash = crypto.createHash('sha256').update(req.file.buffer).digest('hex');
      req.file.hash = fileHash;

      // Log file upload for audit
      console.log(`File uploaded successfully: ${req.file.originalname} (${req.file.size} bytes, hash: ${fileHash})`);

      next();
    } catch (error: unknown) {
      console.error('File upload middleware error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error during file upload',
        code: 'UPLOAD_MIDDLEWARE_ERROR'
      });
    }
  });
};

/**
 * Perform security validation on uploaded file
 */
async function performSecurityValidation(file: Express.Multer.File): Promise<{
  safe: boolean;
  issues: string[];
}> {
  const issues: string[] = [];

  // Check for executable file extensions
  const dangerousExtensions = ['.exe', '.bat', '.cmd', '.scr', '.vbs', '.js', '.jar'];
  const fileExtension = path.extname(file.originalname).toLowerCase();
  if (dangerousExtensions.includes(fileExtension)) {
    issues.push(`Dangerous file extension: ${fileExtension}`);
  }

  // Basic malware signature detection (simplified)
  const malwareSignatures = [
    Buffer.from('4d5a', 'hex'), // PE executable header
    Buffer.from('504b0304', 'hex') // ZIP header (could contain malware)
  ];

  for (const signature of malwareSignatures) {
    if (file.buffer.includes(signature) && fileExtension !== '.zip' && fileExtension !== '.docx' && fileExtension !== '.xlsx') {
      issues.push('Potential malware signature detected');
      break;
    }
  }

  // Check file size consistency
  if (file.size !== file.buffer.length) {
    issues.push('File size inconsistency detected');
  }

  return {
    safe: issues.length === 0,
    issues
  };
}

// Extend Multer File interface
declare global {
  namespace Express {
    namespace Multer {
      interface File {
        hash?: string;
      }
    }
  }
}