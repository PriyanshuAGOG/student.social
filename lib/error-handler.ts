/**
 * COMPREHENSIVE ERROR HANDLING UTILITY
 * Production-ready error management with logging, retry logic, and user-friendly messages
 */

import { AppwriteException } from 'appwrite';

export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export enum ErrorCategory {
  AUTHENTICATION = 'authentication',
  AUTHORIZATION = 'authorization',
  VALIDATION = 'validation',
  NETWORK = 'network',
  DATABASE = 'database',
  STORAGE = 'storage',
  BUSINESS_LOGIC = 'business_logic',
  EXTERNAL_API = 'external_api',
  UNKNOWN = 'unknown',
}

export interface ErrorDetails {
  code: string;
  message: string;
  userMessage: string;
  severity: ErrorSeverity;
  category: ErrorCategory;
  originalError?: unknown;
  context?: Record<string, unknown>;
  timestamp: string;
  retry: boolean;
  maxRetries: number;
}

export class AppError extends Error {
  public readonly code: string;
  public readonly userMessage: string;
  public readonly severity: ErrorSeverity;
  public readonly category: ErrorCategory;
  public readonly context?: Record<string, unknown>;
  public readonly timestamp: string;
  public readonly retry: boolean;
  public readonly maxRetries: number;

  constructor(details: Partial<ErrorDetails> & { message: string }) {
    super(details.message);
    this.name = 'AppError';
    this.code = details.code || 'UNKNOWN_ERROR';
    this.userMessage = details.userMessage || 'An unexpected error occurred. Please try again.';
    this.severity = details.severity || ErrorSeverity.MEDIUM;
    this.category = details.category || ErrorCategory.UNKNOWN;
    this.context = details.context;
    this.timestamp = details.timestamp || new Date().toISOString();
    this.retry = details.retry ?? false;
    this.maxRetries = details.maxRetries ?? 3;
  }
}

/**
 * Parse Appwrite errors into structured format
 */
export function parseAppwriteError(error: unknown): ErrorDetails {
  const timestamp = new Date().toISOString();

  // Handle Appwrite-specific errors
  if (error instanceof AppwriteException || (error as any)?.code) {
    const code = (error as any).code || (error as any).type || 'APPWRITE_ERROR';
    const message = (error as any).message || 'An error occurred with the database';

    // Authentication errors
    if (code === 401 || message.includes('Unauthorized') || message.includes('Invalid credentials')) {
      return {
        code: 'AUTH_UNAUTHORIZED',
        message,
        userMessage: 'Please log in to continue',
        severity: ErrorSeverity.HIGH,
        category: ErrorCategory.AUTHENTICATION,
        originalError: error,
        timestamp,
        retry: false,
        maxRetries: 0,
      };
    }

    // Document not found
    if (code === 404 || message.includes('not found') || message.includes('Document not found')) {
      return {
        code: 'RESOURCE_NOT_FOUND',
        message,
        userMessage: 'The requested item could not be found',
        severity: ErrorSeverity.MEDIUM,
        category: ErrorCategory.DATABASE,
        originalError: error,
        timestamp,
        retry: false,
        maxRetries: 0,
      };
    }

    // Permission/Authorization errors
    if (code === 403 || message.includes('permission') || message.includes('Forbidden')) {
      return {
        code: 'AUTH_FORBIDDEN',
        message,
        userMessage: 'You do not have permission to perform this action',
        severity: ErrorSeverity.MEDIUM,
        category: ErrorCategory.AUTHORIZATION,
        originalError: error,
        timestamp,
        retry: false,
        maxRetries: 0,
      };
    }

    // Rate limiting
    if (code === 429 || message.includes('rate limit') || message.includes('Too many requests')) {
      return {
        code: 'RATE_LIMIT_EXCEEDED',
        message,
        userMessage: 'Too many requests. Please wait a moment and try again',
        severity: ErrorSeverity.MEDIUM,
        category: ErrorCategory.NETWORK,
        originalError: error,
        timestamp,
        retry: true,
        maxRetries: 3,
      };
    }

    // Network errors
    if (code === 500 || code === 502 || code === 503 || message.includes('network') || message.includes('timeout')) {
      return {
        code: 'NETWORK_ERROR',
        message,
        userMessage: 'Network error. Please check your connection and try again',
        severity: ErrorSeverity.HIGH,
        category: ErrorCategory.NETWORK,
        originalError: error,
        timestamp,
        retry: true,
        maxRetries: 3,
      };
    }

    // Validation errors
    if (code === 400 || message.includes('Invalid') || message.includes('required')) {
      return {
        code: 'VALIDATION_ERROR',
        message,
        userMessage: 'Invalid input. Please check your data and try again',
        severity: ErrorSeverity.LOW,
        category: ErrorCategory.VALIDATION,
        originalError: error,
        timestamp,
        retry: false,
        maxRetries: 0,
      };
    }

    // Storage errors
    if (message.includes('storage') || message.includes('file')) {
      return {
        code: 'STORAGE_ERROR',
        message,
        userMessage: 'Error uploading or accessing files. Please try again',
        severity: ErrorSeverity.MEDIUM,
        category: ErrorCategory.STORAGE,
        originalError: error,
        timestamp,
        retry: true,
        maxRetries: 2,
      };
    }

    return {
      code,
      message,
      userMessage: 'An error occurred. Please try again',
      severity: ErrorSeverity.MEDIUM,
      category: ErrorCategory.DATABASE,
      originalError: error,
      timestamp,
      retry: true,
      maxRetries: 2,
    };
  }

  // Handle standard JavaScript errors
  if (error instanceof Error) {
    return {
      code: 'JAVASCRIPT_ERROR',
      message: error.message,
      userMessage: 'An unexpected error occurred. Please try again',
      severity: ErrorSeverity.MEDIUM,
      category: ErrorCategory.UNKNOWN,
      originalError: error,
      timestamp,
      retry: false,
      maxRetries: 0,
    };
  }

  // Handle unknown errors
  return {
    code: 'UNKNOWN_ERROR',
    message: String(error),
    userMessage: 'An unexpected error occurred. Please try again',
    severity: ErrorSeverity.MEDIUM,
    category: ErrorCategory.UNKNOWN,
    originalError: error,
    timestamp,
    retry: false,
    maxRetries: 0,
  };
}

/**
 * Retry function with exponential backoff
 */
export async function retryOperation<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delayMs: number = 1000,
  backoffMultiplier: number = 2
): Promise<T> {
  let lastError: any;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      const errorDetails = parseAppwriteError(error);

      // Don't retry if error is not retryable
      if (!errorDetails.retry || attempt === maxRetries) {
        throw error;
      }

      // Calculate delay with exponential backoff
      const delay = delayMs * Math.pow(backoffMultiplier, attempt);
      console.log(`Retry attempt ${attempt + 1}/${maxRetries} after ${delay}ms...`);

      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}

/**
 * Log errors to console (can be extended to send to monitoring service)
 */
export function logError(error: ErrorDetails | AppError, context?: Record<string, any>) {
  const errorData = {
    ...(error instanceof AppError ? {
      code: error.code,
      message: error.message,
      userMessage: error.userMessage,
      severity: error.severity,
      category: error.category,
      timestamp: error.timestamp,
    } : error),
    ...context,
  };

  if (errorData.severity === ErrorSeverity.CRITICAL || errorData.severity === ErrorSeverity.HIGH) {
    console.error('🚨 CRITICAL ERROR:', errorData);
  } else if (errorData.severity === ErrorSeverity.MEDIUM) {
    console.warn('⚠️  ERROR:', errorData);
  } else {
    console.log('ℹ️  ERROR:', errorData);
  }

  // In production, send to monitoring service (e.g., Sentry, DataDog)
  // if (process.env.NODE_ENV === 'production') {
  //   sendToMonitoringService(errorData);
  // }
}

/**
 * Wrap async operations with error handling
 */
export async function withErrorHandling<T>(
  operation: () => Promise<T>,
  context?: Record<string, any>,
  options?: {
    retry?: boolean;
    maxRetries?: number;
    onError?: (error: ErrorDetails) => void;
  }
): Promise<{ data?: T; error?: ErrorDetails }> {
  try {
    const result = options?.retry
      ? await retryOperation(operation, options.maxRetries)
      : await operation();

    return { data: result };
  } catch (error) {
    const errorDetails = parseAppwriteError(error);
    logError(errorDetails, context);

    if (options?.onError) {
      options.onError(errorDetails);
    }

    return { error: errorDetails };
  }
}

/**
 * Validate input and throw user-friendly errors
 */
export function validateInput(
  data: Record<string, any>,
  rules: Record<string, { required?: boolean; minLength?: number; maxLength?: number; pattern?: RegExp; custom?: (value: any) => boolean | string }>
): void {
  for (const [field, rule] of Object.entries(rules)) {
    const value = data[field];

    // Required check
    if (rule.required && (value === undefined || value === null || value === '')) {
      throw new AppError({
        code: 'VALIDATION_ERROR',
        message: `Field '${field}' is required`,
        userMessage: `Please provide a valid ${field}`,
        severity: ErrorSeverity.LOW,
        category: ErrorCategory.VALIDATION,
        context: { field, value },
      });
    }

    // Skip further validation if value is empty and not required
    if (!value && !rule.required) continue;

    // Min length check
    if (rule.minLength && String(value).length < rule.minLength) {
      throw new AppError({
        code: 'VALIDATION_ERROR',
        message: `Field '${field}' must be at least ${rule.minLength} characters`,
        userMessage: `${field} must be at least ${rule.minLength} characters long`,
        severity: ErrorSeverity.LOW,
        category: ErrorCategory.VALIDATION,
        context: { field, value, minLength: rule.minLength },
      });
    }

    // Max length check
    if (rule.maxLength && String(value).length > rule.maxLength) {
      throw new AppError({
        code: 'VALIDATION_ERROR',
        message: `Field '${field}' must not exceed ${rule.maxLength} characters`,
        userMessage: `${field} must not exceed ${rule.maxLength} characters`,
        severity: ErrorSeverity.LOW,
        category: ErrorCategory.VALIDATION,
        context: { field, value, maxLength: rule.maxLength },
      });
    }

    // Pattern check
    if (rule.pattern && !rule.pattern.test(String(value))) {
      throw new AppError({
        code: 'VALIDATION_ERROR',
        message: `Field '${field}' has invalid format`,
        userMessage: `Please provide a valid ${field}`,
        severity: ErrorSeverity.LOW,
        category: ErrorCategory.VALIDATION,
        context: { field, value },
      });
    }

    // Custom validation
    if (rule.custom) {
      const result = rule.custom(value);
      if (result !== true) {
        throw new AppError({
          code: 'VALIDATION_ERROR',
          message: typeof result === 'string' ? result : `Field '${field}' is invalid`,
          userMessage: typeof result === 'string' ? result : `Please provide a valid ${field}`,
          severity: ErrorSeverity.LOW,
          category: ErrorCategory.VALIDATION,
          context: { field, value },
        });
      }
    }
  }
}

/**
 * Safe operation wrapper for UI components
 */
export function createSafeOperation<T extends any[], R>(
  operation: (...args: T) => Promise<R>,
  errorCallback?: (error: ErrorDetails) => void
) {
  return async (...args: T): Promise<R | null> => {
    try {
      return await operation(...args);
    } catch (error) {
      const errorDetails = parseAppwriteError(error);
      logError(errorDetails, { operation: operation.name, args });

      if (errorCallback) {
        errorCallback(errorDetails);
      }

      return null;
    }
  };
}

export default {
  AppError,
  parseAppwriteError,
  retryOperation,
  logError,
  withErrorHandling,
  validateInput,
  createSafeOperation,
  ErrorSeverity,
  ErrorCategory,
};
