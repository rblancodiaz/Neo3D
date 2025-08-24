import { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import { UploadError } from './errorHandler';
import { uploadConfig } from '../config/environment';
import logger from '../utils/logger';

// File validation middleware
export const validateImageFile = (req: Request, _res: Response, next: NextFunction) => {
  if (!req.file) {
    return next(new UploadError('No file uploaded'));
  }

  const file = req.file;
  const ext = path.extname(file.originalname).toLowerCase().replace('.', '');

  // Validate file extension
  if (!uploadConfig.allowedFileTypes.includes(ext)) {
    // Clean up uploaded file
    if (fs.existsSync(file.path)) {
      fs.unlinkSync(file.path);
    }
    return next(
      new UploadError(
        `Invalid file type. Only ${uploadConfig.allowedFileTypes.join(', ')} files are allowed`,
      ),
    );
  }

  // Validate MIME type
  const allowedMimeTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
  ];

  if (!allowedMimeTypes.includes(file.mimetype)) {
    // Clean up uploaded file
    if (fs.existsSync(file.path)) {
      fs.unlinkSync(file.path);
    }
    return next(new UploadError('Invalid file MIME type'));
  }

  // Validate file size
  if (file.size > uploadConfig.maxFileSize) {
    // Clean up uploaded file
    if (fs.existsSync(file.path)) {
      fs.unlinkSync(file.path);
    }
    return next(
      new UploadError(
        `File size exceeds maximum limit of ${uploadConfig.maxFileSize / 1024 / 1024}MB`,
      ),
    );
  }

  next();
};

// Multiple files validation middleware
export const validateMultipleImageFiles = (
  req: Request,
  _res: Response,
  next: NextFunction,
) => {
  const files = req.files as Express.Multer.File[];

  if (!files || files.length === 0) {
    return next(new UploadError('No files uploaded'));
  }

  const errors: string[] = [];
  const filesToCleanup: string[] = [];

  for (const file of files) {
    const ext = path.extname(file.originalname).toLowerCase().replace('.', '');

    // Validate file extension
    if (!uploadConfig.allowedFileTypes.includes(ext)) {
      errors.push(`Invalid file type for ${file.originalname}`);
      filesToCleanup.push(file.path);
      continue;
    }

    // Validate MIME type
    const allowedMimeTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/webp',
    ];

    if (!allowedMimeTypes.includes(file.mimetype)) {
      errors.push(`Invalid MIME type for ${file.originalname}`);
      filesToCleanup.push(file.path);
      continue;
    }

    // Validate file size
    if (file.size > uploadConfig.maxFileSize) {
      errors.push(
        `File ${file.originalname} exceeds maximum size of ${
          uploadConfig.maxFileSize / 1024 / 1024
        }MB`,
      );
      filesToCleanup.push(file.path);
    }
  }

  // Clean up invalid files
  if (filesToCleanup.length > 0) {
    for (const filePath of filesToCleanup) {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
  }

  if (errors.length > 0) {
    return next(new UploadError(errors.join(', ')));
  }

  next();
};

// Cleanup middleware for error cases
export const cleanupFiles = (error: Error, req: Request, _res: Response, next: NextFunction) => {
  // Clean up uploaded files if there's an error
  if (error) {
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
      logger.debug(`Cleaned up file: ${req.file.path}`);
    }

    if (req.files) {
      const files = Array.isArray(req.files) ? req.files : Object.values(req.files).flat();
      for (const file of files) {
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
          logger.debug(`Cleaned up file: ${file.path}`);
        }
      }
    }
  }

  next(error);
};

// Ensure upload directories exist
export const ensureUploadDirs = () => {
  const dirs = [
    uploadConfig.uploadPath,
    uploadConfig.tempPath,
    uploadConfig.processedPath,
    uploadConfig.thumbnailPath,
  ];

  for (const dir of dirs) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      logger.info(`Created upload directory: ${dir}`);
    }
  }
};

export default {
  validateImageFile,
  validateMultipleImageFiles,
  cleanupFiles,
  ensureUploadDirs,
};