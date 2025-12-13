/**
 * Centralized Error Handler
 * Provides consistent error handling and user-friendly messages across the application
 */

import toast from 'react-hot-toast';

export class ApiError extends Error {
  public readonly statusCode: number;
  public readonly details?: any;

  constructor(message: string, statusCode: number = 500, details?: any) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.details = details;
  }
}

export interface ErrorResponse {
  message: string;
  statusCode: number;
  isDeveloperVisible: boolean;
  userMessage: string;
}

/**
 * Extract error message from various error formats
 */
export function extractErrorMessage(error: any): string {
  if (error instanceof ApiError) {
    return error.message;
  }

  if (error?.response?.data?.error) {
    return error.response.data.error;
  }

  if (error?.response?.data?.message) {
    return error.response.data.message;
  }

  if (error?.message) {
    return error.message;
  }

  if (typeof error === 'string') {
    return error;
  }

  return 'An unexpected error occurred';
}

/**
 * Extract HTTP status code from error
 */
export function extractStatusCode(error: any): number {
  if (error instanceof ApiError) {
    return error.statusCode;
  }

  if (error?.response?.status) {
    return error.response.status;
  }

  return 500;
}

/**
 * Convert error to user-friendly message
 */
export function getUserFriendlyMessage(error: any): string {
  const statusCode = extractStatusCode(error);
  const message = extractErrorMessage(error);

  // Map common errors to user-friendly messages
  const errorMap: Record<number, (msg: string) => string> = {
    400: () => 'The data you provided is invalid. Please check your input.',
    401: () => 'Your session has expired. Please log in again.',
    403: () => 'You do not have permission to perform this action.',
    404: () => 'The requested item was not found.',
    409: () => 'A conflict occurred. This item may already exist.',
    422: () => 'The data validation failed. Please review your input.',
    429: () => 'Too many requests. Please wait a moment and try again.',
    500: () => 'A server error occurred. Please try again later.',
    503: () => 'The service is temporarily unavailable. Please try again later.',
  };

  const messageMapper = errorMap[statusCode];
  return messageMapper ? messageMapper(message) : message;
}

/**
 * Handle and display errors consistently
 */
export function handleError(
  error: any,
  context: string = 'Operation',
  showToast: boolean = true
): ErrorResponse {
  const statusCode = extractStatusCode(error);
  const message = extractErrorMessage(error);
  const userMessage = getUserFriendlyMessage(error);

  // Log for debugging (in development)
  if (import.meta.env.DEV) {
    console.error(`[${context}]`, {
      statusCode,
      message,
      originalError: error,
    });
  }

  // Show toast notification if requested
  if (showToast) {
    toast.error(userMessage);
  }

  return {
    message,
    statusCode,
    isDeveloperVisible: import.meta.env.DEV,
    userMessage,
  };
}

/**
 * Validation error handler - format multiple validation errors
 */
export function handleValidationError(
  validationErrors: Record<string, string[]>,
  showToast: boolean = true
): string {
  const errorMessages = Object.entries(validationErrors)
    .map(([field, errors]) => `${field}: ${errors.join(', ')}`)
    .join('\n');

  if (showToast) {
    toast.error(
      validationErrors ? 'Please fix validation errors' : 'Validation failed'
    );
  }

  return errorMessages;
}

/**
 * Network error handler - distinguish network vs server errors
 */
export function handleNetworkError(error: any, showToast: boolean = true): string {
  let message = 'Network error';

  if (error?.message === 'Network Error' || !error?.response) {
    message = 'Unable to connect to the server. Please check your internet connection.';
  } else if (error?.code === 'ECONNABORTED') {
    message = 'Request timeout. Please try again.';
  }

  if (showToast) {
    toast.error(message);
  }

  return message;
}

/**
 * Safe async wrapper - catches and handles errors gracefully
 */
export async function tryCatch<T>(
  fn: () => Promise<T>,
  context: string = 'Operation',
  onError?: (error: ErrorResponse) => void
): Promise<{ success: boolean; data?: T; error?: ErrorResponse }> {
  try {
    const data = await fn();
    return { success: true, data };
  } catch (error: any) {
    const errorResponse = handleError(error, context);
    onError?.(errorResponse);
    return { success: false, error: errorResponse };
  }
}

/**
 * Retry logic for transient failures
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  delayMs: number = 1000
): Promise<T> {
  let lastError: any;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Don't retry on client errors (4xx)
      if (extractStatusCode(error) < 500) {
        throw error;
      }

      // Wait before retrying (exponential backoff)
      if (attempt < maxRetries) {
        const delay = delayMs * Math.pow(2, attempt - 1);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError;
}
