import { Response } from 'express';
import { ApiResponse } from '../types/api';

// Success response helper
export const sendSuccess = <T = any>(
  res: Response,
  data: T,
  statusCode = 200,
  meta?: ApiResponse['meta'],
): Response => {
  const response: ApiResponse<T> = {
    success: true,
    data,
  };

  if (meta) {
    response.meta = meta;
  }

  return res.status(statusCode).json(response);
};

// Error response helper
export const sendError = (
  res: Response,
  message: string,
  statusCode = 500,
  code?: string,
  details?: any,
): Response => {
  const response: ApiResponse = {
    success: false,
    error: {
      code: code || 'ERROR',
      message,
      details,
    },
  };

  return res.status(statusCode).json(response);
};

// Paginated response helper
export const sendPaginated = <T = any>(
  res: Response,
  data: T[],
  page: number,
  limit: number,
  total: number,
  statusCode = 200,
): Response => {
  const totalPages = Math.ceil(total / limit);

  return sendSuccess(
    res,
    data,
    statusCode,
    {
      page,
      limit,
      total,
      totalPages,
    },
  );
};

// Created response helper
export const sendCreated = <T = any>(res: Response, data: T): Response => {
  return sendSuccess(res, data, 201);
};

// No content response helper
export const sendNoContent = (res: Response): Response => {
  return res.status(204).send();
};

// Not found response helper
export const sendNotFound = (res: Response, resource = 'Resource'): Response => {
  return sendError(res, `${resource} not found`, 404, 'NOT_FOUND');
};

// Validation error response helper
export const sendValidationError = (
  res: Response,
  details: any,
  message = 'Validation failed',
): Response => {
  return sendError(res, message, 400, 'VALIDATION_ERROR', details);
};

// Conflict error response helper
export const sendConflict = (
  res: Response,
  message: string,
  details?: any,
): Response => {
  return sendError(res, message, 409, 'CONFLICT', details);
};

// Unauthorized response helper
export const sendUnauthorized = (
  res: Response,
  message = 'Unauthorized',
): Response => {
  return sendError(res, message, 401, 'UNAUTHORIZED');
};

// Forbidden response helper
export const sendForbidden = (
  res: Response,
  message = 'Forbidden',
): Response => {
  return sendError(res, message, 403, 'FORBIDDEN');
};

// Internal server error response helper
export const sendServerError = (
  res: Response,
  message = 'Internal server error',
  details?: any,
): Response => {
  return sendError(res, message, 500, 'INTERNAL_ERROR', details);
};