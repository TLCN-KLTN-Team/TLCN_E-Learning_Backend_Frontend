export interface ErrorResponse {
  code: string;
  message: string;
  errors?: Record<string, string>;
}

// Error codes từ backend
export const ErrorCodes = {
  SUCCESS: "SUCCESS",
  NETWORK_ERROR: "NETWORK_ERROR",
  VALIDATION_ERROR: "VALIDATION_ERROR",
  UNAUTHORIZED: "UNAUTHORIZED",
  FORBIDDEN: "FORBIDDEN",
  NOT_FOUND: "NOT_FOUND",
  CONFLICT: "CONFLICT",
  INTERNAL_SERVER_ERROR: "INTERNAL_SERVER_ERROR",
  BAD_REQUEST: "BAD_REQUEST",
  TOKEN_EXPIRED: "TOKEN_EXPIRED",
} as const;
