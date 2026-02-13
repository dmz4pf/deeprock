/**
 * Error handling utilities for the Deeprock application
 */

export interface AppError {
  code: string;
  message: string;
  details?: string;
  statusCode?: number;
}

/**
 * Standardized error codes
 */
export const ErrorCodes = {
  // Network errors
  NETWORK_ERROR: "NETWORK_ERROR",
  TIMEOUT: "TIMEOUT",
  SERVER_ERROR: "SERVER_ERROR",

  // Authentication errors
  UNAUTHORIZED: "UNAUTHORIZED",
  SESSION_EXPIRED: "SESSION_EXPIRED",
  INVALID_CREDENTIALS: "INVALID_CREDENTIALS",
  WEBAUTHN_FAILED: "WEBAUTHN_FAILED",
  WEBAUTHN_NOT_SUPPORTED: "WEBAUTHN_NOT_SUPPORTED",
  WEBAUTHN_CANCELLED: "WEBAUTHN_CANCELLED",

  // Transaction errors
  INSUFFICIENT_BALANCE: "INSUFFICIENT_BALANCE",
  TRANSACTION_FAILED: "TRANSACTION_FAILED",
  TRANSACTION_REJECTED: "TRANSACTION_REJECTED",
  GAS_ESTIMATION_FAILED: "GAS_ESTIMATION_FAILED",

  // Validation errors
  VALIDATION_ERROR: "VALIDATION_ERROR",
  INVALID_INPUT: "INVALID_INPUT",
  AMOUNT_TOO_LOW: "AMOUNT_TOO_LOW",
  AMOUNT_TOO_HIGH: "AMOUNT_TOO_HIGH",

  // Document errors
  DOCUMENT_TOO_LARGE: "DOCUMENT_TOO_LARGE",
  INVALID_DOCUMENT: "INVALID_DOCUMENT",
  ALREADY_SEALED: "ALREADY_SEALED",

  // General errors
  UNKNOWN_ERROR: "UNKNOWN_ERROR",
  NOT_FOUND: "NOT_FOUND",
  RATE_LIMITED: "RATE_LIMITED",
} as const;

/**
 * User-friendly error messages
 */
const errorMessages: Record<string, string> = {
  [ErrorCodes.NETWORK_ERROR]: "Unable to connect to the server. Please check your internet connection.",
  [ErrorCodes.TIMEOUT]: "The request took too long. Please try again.",
  [ErrorCodes.SERVER_ERROR]: "Something went wrong on our end. Please try again later.",
  [ErrorCodes.UNAUTHORIZED]: "Please log in to continue.",
  [ErrorCodes.SESSION_EXPIRED]: "Your session has expired. Please log in again.",
  [ErrorCodes.INVALID_CREDENTIALS]: "Invalid email or password.",
  [ErrorCodes.WEBAUTHN_FAILED]: "Biometric authentication failed. Please try again.",
  [ErrorCodes.WEBAUTHN_NOT_SUPPORTED]: "Your device doesn't support biometric authentication.",
  [ErrorCodes.WEBAUTHN_CANCELLED]: "Authentication was cancelled. Please try again.",
  [ErrorCodes.INSUFFICIENT_BALANCE]: "Insufficient balance to complete this transaction.",
  [ErrorCodes.TRANSACTION_FAILED]: "The transaction failed. Please try again.",
  [ErrorCodes.TRANSACTION_REJECTED]: "The transaction was rejected.",
  [ErrorCodes.GAS_ESTIMATION_FAILED]: "Unable to estimate transaction fees.",
  [ErrorCodes.VALIDATION_ERROR]: "Please check your input and try again.",
  [ErrorCodes.INVALID_INPUT]: "The provided input is invalid.",
  [ErrorCodes.AMOUNT_TOO_LOW]: "The amount is below the minimum required.",
  [ErrorCodes.AMOUNT_TOO_HIGH]: "The amount exceeds the maximum allowed.",
  [ErrorCodes.DOCUMENT_TOO_LARGE]: "The document is too large. Maximum size is 10MB.",
  [ErrorCodes.INVALID_DOCUMENT]: "The document format is not supported.",
  [ErrorCodes.ALREADY_SEALED]: "This document has already been sealed.",
  [ErrorCodes.UNKNOWN_ERROR]: "An unexpected error occurred. Please try again.",
  [ErrorCodes.NOT_FOUND]: "The requested resource was not found.",
  [ErrorCodes.RATE_LIMITED]: "Too many requests. Please wait a moment before trying again.",
};

/**
 * Parse an error into a standardized AppError
 */
export function parseError(error: unknown): AppError {
  // Already an AppError
  if (isAppError(error)) {
    return error;
  }

  // Fetch/API error response
  if (error instanceof Response || (typeof error === "object" && error !== null && "status" in error)) {
    const response = error as Response;
    return parseHttpError(response.status);
  }

  // WebAuthn errors
  if (error instanceof Error) {
    if (error.name === "NotAllowedError") {
      return {
        code: ErrorCodes.WEBAUTHN_CANCELLED,
        message: errorMessages[ErrorCodes.WEBAUTHN_CANCELLED],
      };
    }
    if (error.name === "NotSupportedError") {
      return {
        code: ErrorCodes.WEBAUTHN_NOT_SUPPORTED,
        message: errorMessages[ErrorCodes.WEBAUTHN_NOT_SUPPORTED],
      };
    }
    if (error.message.includes("network") || error.message.includes("fetch")) {
      return {
        code: ErrorCodes.NETWORK_ERROR,
        message: errorMessages[ErrorCodes.NETWORK_ERROR],
        details: error.message,
      };
    }
    if (error.message.includes("timeout")) {
      return {
        code: ErrorCodes.TIMEOUT,
        message: errorMessages[ErrorCodes.TIMEOUT],
      };
    }

    // Generic error with message
    return {
      code: ErrorCodes.UNKNOWN_ERROR,
      message: error.message || errorMessages[ErrorCodes.UNKNOWN_ERROR],
      details: error.stack,
    };
  }

  // String error
  if (typeof error === "string") {
    return {
      code: ErrorCodes.UNKNOWN_ERROR,
      message: error,
    };
  }

  // Unknown error type
  return {
    code: ErrorCodes.UNKNOWN_ERROR,
    message: errorMessages[ErrorCodes.UNKNOWN_ERROR],
  };
}

/**
 * Parse HTTP status code into AppError
 */
function parseHttpError(statusCode: number): AppError {
  switch (statusCode) {
    case 400:
      return {
        code: ErrorCodes.VALIDATION_ERROR,
        message: errorMessages[ErrorCodes.VALIDATION_ERROR],
        statusCode,
      };
    case 401:
      return {
        code: ErrorCodes.UNAUTHORIZED,
        message: errorMessages[ErrorCodes.UNAUTHORIZED],
        statusCode,
      };
    case 403:
      return {
        code: ErrorCodes.UNAUTHORIZED,
        message: "You don't have permission to perform this action.",
        statusCode,
      };
    case 404:
      return {
        code: ErrorCodes.NOT_FOUND,
        message: errorMessages[ErrorCodes.NOT_FOUND],
        statusCode,
      };
    case 429:
      return {
        code: ErrorCodes.RATE_LIMITED,
        message: errorMessages[ErrorCodes.RATE_LIMITED],
        statusCode,
      };
    case 500:
    case 502:
    case 503:
    case 504:
      return {
        code: ErrorCodes.SERVER_ERROR,
        message: errorMessages[ErrorCodes.SERVER_ERROR],
        statusCode,
      };
    default:
      return {
        code: ErrorCodes.UNKNOWN_ERROR,
        message: errorMessages[ErrorCodes.UNKNOWN_ERROR],
        statusCode,
      };
  }
}

/**
 * Type guard for AppError
 */
export function isAppError(error: unknown): error is AppError {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    "message" in error &&
    typeof (error as AppError).code === "string" &&
    typeof (error as AppError).message === "string"
  );
}

/**
 * Get a user-friendly message for an error code
 */
export function getErrorMessage(code: string): string {
  return errorMessages[code] || errorMessages[ErrorCodes.UNKNOWN_ERROR];
}

/**
 * Helper to create an AppError with a specific code
 */
export function createError(code: string, customMessage?: string, details?: string): AppError {
  return {
    code,
    message: customMessage || errorMessages[code] || errorMessages[ErrorCodes.UNKNOWN_ERROR],
    details,
  };
}

/**
 * Helper to handle async errors with a callback
 */
export async function withErrorHandling<T>(
  fn: () => Promise<T>,
  onError?: (error: AppError) => void
): Promise<T | null> {
  try {
    return await fn();
  } catch (error) {
    const appError = parseError(error);
    if (onError) {
      onError(appError);
    }
    return null;
  }
}
