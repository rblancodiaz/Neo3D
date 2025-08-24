import { Request, Response, NextFunction } from 'express';
import { ValidationError, UniqueConstraintError, ForeignKeyConstraintError } from 'sequelize';
import { ApiError, ErrorCode } from '../types/api';
import { sendError, sendValidationError } from '../utils/response';
import { logError } from '../utils/logger';
import { isDevelopment } from '../config/environment';

/**
 * Global error handler middleware
 */
export const errorHandler = (
  err: Error | ApiError,
  req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  // Log error
  logError(err, {
    method: req.method,
    url: req.url,
    body: req.body,
    params: req.params,
    query: req.query,
    ip: req.ip,
  });

  // Handle ApiError (custom errors)
  if (err instanceof ApiError) {
    sendError(res, err.message, err.statusCode, err.code, err.details);
    return;
  }

  // Handle Sequelize validation errors
  if (err instanceof ValidationError) {
    const errors = err.errors.map(e => ({
      field: e.path,
      message: e.message,
      value: e.value,
    }));
    
    sendValidationError(res, errors, 'Validation failed');
    return;
  }

  // Handle Sequelize unique constraint errors
  if (err instanceof UniqueConstraintError) {
    const field = err.errors[0]?.path || 'field';
    const message = `A record with this ${field} already exists`;
    
    sendError(res, message, 409, ErrorCode.DUPLICATE_ENTRY, {
      field,
      value: err.errors[0]?.value,
    });
    return;
  }

  // Handle Sequelize foreign key constraint errors
  if (err instanceof ForeignKeyConstraintError) {
    sendError(
      res,
      'Referenced resource does not exist or cannot be deleted due to existing references',
      409,
      ErrorCode.DATABASE_ERROR,
    );
    return;
  }

  // Handle multer file upload errors
  if (err.name === 'MulterError') {
    let message = 'File upload error';
    let statusCode = 400;

    switch ((err as any).code) {
      case 'LIMIT_FILE_SIZE':
        message = 'File size too large';
        break;
      case 'LIMIT_FILE_COUNT':
        message = 'Too many files';
        break;
      case 'LIMIT_UNEXPECTED_FILE':
        message = 'Unexpected file field';
        break;
      default:
        message = (err as any).message || message;
    }

    sendError(res, message, statusCode, ErrorCode.UPLOAD_ERROR);
    return;
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    sendError(res, 'Invalid token', 401, ErrorCode.UNAUTHORIZED);
    return;
  }

  if (err.name === 'TokenExpiredError') {
    sendError(res, 'Token expired', 401, ErrorCode.UNAUTHORIZED);
    return;
  }

  // Handle syntax errors (bad JSON)
  if (err instanceof SyntaxError && 'body' in err) {
    sendError(res, 'Invalid JSON payload', 400, ErrorCode.VALIDATION_ERROR);
    return;
  }

  // Default error response
  const message = isDevelopment ? err.message : 'Internal server error';
  const details = isDevelopment ? { stack: err.stack } : undefined;
  
  sendError(res, message, 500, ErrorCode.INTERNAL_ERROR, details);
};

/**
 * 404 Not Found handler
 */
export const notFoundHandler = (req: Request, res: Response): void => {
  sendError(
    res,
    `Route ${req.method} ${req.url} not found`,
    404,
    ErrorCode.NOT_FOUND,
  );
};

/**
 * Async error wrapper for routes
 * Alternative to asyncHandler utility
 */
export const wrapAsync = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Custom error classes for specific error types
 */
export class UnauthorizedError extends ApiError {
  constructor(message: string = 'Unauthorized', details?: any) {
    super(ErrorCode.UNAUTHORIZED, message, 401, details);
  }
}

export class ForbiddenError extends ApiError {
  constructor(message: string = 'Forbidden', details?: any) {
    super(ErrorCode.FORBIDDEN, message, 403, details);
  }
}

export class UploadError extends ApiError {
  constructor(message: string = 'Upload error', details?: any) {
    super(ErrorCode.UPLOAD_ERROR, message, 400, details);
  }
}