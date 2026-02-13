/**
 * User-friendly error messages for investment flow errors
 * Maps technical error codes to actionable user messages
 */

export interface InvestmentError {
  code: string;
  title: string;
  message: string;
  action?: string;
  recoverable: boolean;
}

/**
 * Known investment error codes and their user-friendly messages
 */
export const INVESTMENT_ERRORS: Record<string, InvestmentError> = {
  // Permit errors
  PERMIT_EXPIRED: {
    code: "PERMIT_EXPIRED",
    title: "Signature Expired",
    message: "The permit signature has expired. Please try again.",
    action: "Retry Investment",
    recoverable: true,
  },
  PERMIT_INVALID: {
    code: "PERMIT_INVALID",
    title: "Invalid Signature",
    message:
      "The signature could not be verified. Make sure you're signing with the correct wallet.",
    action: "Try Again",
    recoverable: true,
  },
  PERMIT_NONCE_INVALID: {
    code: "PERMIT_NONCE_INVALID",
    title: "Transaction Already Processed",
    message: "This transaction was already processed. Please start a new investment.",
    action: "Start Over",
    recoverable: true,
  },

  // Balance errors
  INSUFFICIENT_BALANCE: {
    code: "INSUFFICIENT_BALANCE",
    title: "Insufficient Balance",
    message: "You don't have enough USDC for this investment.",
    recoverable: false,
  },
  INSUFFICIENT_ALLOWANCE: {
    code: "INSUFFICIENT_ALLOWANCE",
    title: "Approval Required",
    message: "Please approve the pool to spend your USDC first.",
    action: "Approve",
    recoverable: true,
  },

  // Pool errors
  POOL_NOT_ACTIVE: {
    code: "POOL_NOT_ACTIVE",
    title: "Pool Unavailable",
    message: "This investment pool is currently not accepting investments.",
    recoverable: false,
  },
  POOL_CAPACITY_REACHED: {
    code: "POOL_CAPACITY_REACHED",
    title: "Pool Full",
    message: "This pool has reached its maximum capacity.",
    recoverable: false,
  },
  AMOUNT_BELOW_MINIMUM: {
    code: "AMOUNT_BELOW_MINIMUM",
    title: "Amount Too Low",
    message: "The investment amount is below the minimum required.",
    recoverable: false,
  },
  AMOUNT_ABOVE_MAXIMUM: {
    code: "AMOUNT_ABOVE_MAXIMUM",
    title: "Amount Too High",
    message: "The investment amount exceeds the maximum allowed.",
    recoverable: false,
  },

  // Relayer errors
  RELAYER_UNAVAILABLE: {
    code: "RELAYER_UNAVAILABLE",
    title: "Service Temporarily Unavailable",
    message:
      "Our gas-free service is temporarily unavailable. Please try again in a few minutes.",
    action: "Retry",
    recoverable: true,
  },
  RELAYER_RATE_LIMITED: {
    code: "RELAYER_RATE_LIMITED",
    title: "Too Many Requests",
    message: "Please wait a moment before trying again.",
    action: "Wait and Retry",
    recoverable: true,
  },
  RELAYER_BALANCE_LOW: {
    code: "RELAYER_BALANCE_LOW",
    title: "Service Temporarily Unavailable",
    message: "The gas sponsorship service is currently unavailable. Please try again later.",
    recoverable: false,
  },

  // Bundler/UserOp errors
  BUNDLER_TIMEOUT: {
    code: "BUNDLER_TIMEOUT",
    title: "Transaction Pending",
    message:
      "Your transaction is taking longer than expected. Check your wallet for status.",
    recoverable: false,
  },
  BUNDLER_REJECTED: {
    code: "BUNDLER_REJECTED",
    title: "Transaction Rejected",
    message: "The transaction was rejected by the network. Please try again.",
    action: "Retry",
    recoverable: true,
  },
  NONCE_CONFLICT: {
    code: "NONCE_CONFLICT",
    title: "Transaction Conflict",
    message: "A previous transaction is still processing. Please wait a moment and try again.",
    action: "Retry",
    recoverable: true,
  },
  USEROP_VALIDATION_FAILED: {
    code: "USEROP_VALIDATION_FAILED",
    title: "Validation Failed",
    message: "The transaction could not be validated. Please try again.",
    action: "Retry",
    recoverable: true,
  },
  PAYMASTER_DEPOSIT_LOW: {
    code: "PAYMASTER_DEPOSIT_LOW",
    title: "Gas Sponsorship Unavailable",
    message:
      "The gas sponsorship service is temporarily unavailable. Please try again later.",
    recoverable: false,
  },

  // Authentication errors
  WEBAUTHN_CANCELLED: {
    code: "WEBAUTHN_CANCELLED",
    title: "Authentication Cancelled",
    message: "You cancelled the biometric authentication.",
    action: "Try Again",
    recoverable: true,
  },
  WEBAUTHN_NOT_SUPPORTED: {
    code: "WEBAUTHN_NOT_SUPPORTED",
    title: "Biometrics Not Supported",
    message: "Your device doesn't support biometric authentication.",
    recoverable: false,
  },
  WEBAUTHN_FAILED: {
    code: "WEBAUTHN_FAILED",
    title: "Authentication Failed",
    message: "Biometric authentication failed. Please try again.",
    action: "Try Again",
    recoverable: true,
  },
  WALLET_NOT_CONNECTED: {
    code: "WALLET_NOT_CONNECTED",
    title: "Wallet Not Connected",
    message: "Please connect your wallet to continue.",
    action: "Connect Wallet",
    recoverable: true,
  },
  WALLET_REJECTED: {
    code: "WALLET_REJECTED",
    title: "Transaction Rejected",
    message: "You rejected the transaction in your wallet.",
    action: "Try Again",
    recoverable: true,
  },

  // Network errors
  NETWORK_ERROR: {
    code: "NETWORK_ERROR",
    title: "Connection Error",
    message: "Could not connect to the network. Please check your internet connection.",
    action: "Retry",
    recoverable: true,
  },
  CHAIN_MISMATCH: {
    code: "CHAIN_MISMATCH",
    title: "Wrong Network",
    message: "Please switch to the correct network in your wallet.",
    action: "Switch Network",
    recoverable: true,
  },

  // Transaction errors
  TX_REVERTED: {
    code: "TX_REVERTED",
    title: "Transaction Failed",
    message: "The transaction was reverted by the blockchain.",
    action: "Retry",
    recoverable: true,
  },
  TX_TIMEOUT: {
    code: "TX_TIMEOUT",
    title: "Transaction Timeout",
    message:
      "The transaction is taking longer than expected. It may still complete.",
    recoverable: false,
  },

  // Generic errors
  UNKNOWN: {
    code: "UNKNOWN",
    title: "Something Went Wrong",
    message: "An unexpected error occurred. Please try again.",
    action: "Retry",
    recoverable: true,
  },
};

/**
 * Parse an error from various sources into a user-friendly InvestmentError
 */
export function parseInvestmentError(error: unknown): InvestmentError {
  // Handle string errors
  if (typeof error === "string") {
    // Check for known error codes in the string
    for (const [code, investmentError] of Object.entries(INVESTMENT_ERRORS)) {
      if (error.toLowerCase().includes(code.toLowerCase())) {
        return investmentError;
      }
    }

    // Check for common error patterns
    if (error.includes("expired")) {
      return INVESTMENT_ERRORS.PERMIT_EXPIRED;
    }
    if (error.includes("insufficient") || error.includes("balance")) {
      return INVESTMENT_ERRORS.INSUFFICIENT_BALANCE;
    }
    if (error.includes("rejected") || error.includes("denied")) {
      return INVESTMENT_ERRORS.WALLET_REJECTED;
    }
    if (error.includes("cancelled") || error.includes("canceled")) {
      return INVESTMENT_ERRORS.WEBAUTHN_CANCELLED;
    }
    if (error.includes("timeout")) {
      return INVESTMENT_ERRORS.TX_TIMEOUT;
    }
    if (error.includes("network")) {
      return INVESTMENT_ERRORS.NETWORK_ERROR;
    }
  }

  // Handle Error objects
  if (error instanceof Error) {
    const message = error.message.toLowerCase();

    // WebAuthn errors
    if (message.includes("notallowederror") || message.includes("cancelled")) {
      return INVESTMENT_ERRORS.WEBAUTHN_CANCELLED;
    }
    if (message.includes("notsupportederror")) {
      return INVESTMENT_ERRORS.WEBAUTHN_NOT_SUPPORTED;
    }

    // Wallet errors
    if (message.includes("user rejected") || message.includes("user denied")) {
      return INVESTMENT_ERRORS.WALLET_REJECTED;
    }

    // Network errors
    if (message.includes("fetch") || message.includes("network")) {
      return INVESTMENT_ERRORS.NETWORK_ERROR;
    }

    // Recursively check the message
    return parseInvestmentError(error.message);
  }

  // Handle objects with error code
  if (typeof error === "object" && error !== null) {
    const obj = error as Record<string, unknown>;

    if (typeof obj.code === "string" && INVESTMENT_ERRORS[obj.code]) {
      return INVESTMENT_ERRORS[obj.code];
    }

    if (typeof obj.message === "string") {
      return parseInvestmentError(obj.message);
    }
  }

  return INVESTMENT_ERRORS.UNKNOWN;
}

/**
 * Get error by code
 */
export function getInvestmentError(code: string): InvestmentError {
  return INVESTMENT_ERRORS[code] || INVESTMENT_ERRORS.UNKNOWN;
}

/**
 * Check if an error is recoverable (user can retry)
 */
export function isRecoverableError(error: unknown): boolean {
  const parsed = parseInvestmentError(error);
  return parsed.recoverable;
}
