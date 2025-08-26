/**
 * Error codes tương ứng với backend ErrorCode enum
 * Đồng bộ với backend để đảm bảo consistency
 *
 * Note: Messages được backend xử lý và trả về trong response,
 * frontend chỉ cần sử dụng message từ backend
 */
export const ErrorCode = {
  // Success Response
  SUCCESS: "SYS_0000",

  // System Errors (SYS_xxxx)
  SYSTEM_ERROR: "SYS_9999",
  INVALID_REQUEST: "SYS_1001",

  // Authentication Errors (AUTH_xxxx)
  AUTH_INVALID_CREDENTIALS: "AUTH_1001",
  AUTH_REQUIRED: "AUTH_1002",
  AUTH_TOKEN_INVALID: "AUTH_1003",
  AUTH_TOKEN_EXPIRED: "AUTH_1004",
  AUTH_PERMISSION_DENIED: "AUTH_1005",

  // User Management Errors (USER_xxxx)
  USER_ALREADY_EXISTS: "USER_2001",
  USER_NOT_FOUND: "USER_2002",
  USER_EMAIL_EXISTED: "USER_2003",
  USER_USERNAME_EXISTED: "USER_2004",

  // Validation Errors (VALID_xxxx)
  VALID_EXCEPTION: "VALID_3000",
  VALID_USERNAME_REQUIRED: "VALID_3001",
  VALID_USERNAME_MIN_LENGTH: "VALID_3002",
  VALID_PASSWORD_REQUIRED: "VALID_3003",
  VALID_PASSWORD_MIN_LENGTH: "VALID_3004",
  VALID_EMAIL_REQUIRED: "VALID_3005",
  VALID_EMAIL_INVALID: "VALID_3006",
  VALID_DOB_INVALID: "VALID_3007",
  VALID_CONFIRM_PASSWORD_REQUIRED: "VALID_3008",
  VALID_CONFIRM_PASSWORD_MIN_LENGTH: "VALID_3009",
  VALID_PASSWORD_MISMATCH: "VALID_3010",
  VALID_PHONE_REQUIRED: "VALID_3011",
  VALID_PHONE_INVALID: "VALID_3012",

  // Business Logic Errors (BIZ_xxxx)
  BIZ_INSUFFICIENT_BALANCE: "BIZ_4001",
  BIZ_RESOURCE_NOT_FOUND: "BIZ_4002",
  BIZ_DUPLICATE_ENTRY: "BIZ_4003",

  // File Upload Errors (FILE_xxxx)
  FILE_SIZE_TOO_LARGE: "FILE_5001",
  FILE_FORMAT_INVALID: "FILE_5002",
  FILE_UPLOAD_FAILED: "FILE_5003",

  // Teacher Management Errors (TEACHER_xxxx)
  TEACHER_ALREADY_EXISTS: "TEACHER_6001",
  TEACHER_NOT_FOUND: "TEACHER_6002",

  // Role Management Errors (ROLE_xxxx)
  ROLE_NOT_FOUND: "ROLE_7001",
  ROLE_ALREADY_EXISTS: "ROLE_7002",
} as const;

export type ErrorCodeType = (typeof ErrorCode)[keyof typeof ErrorCode];

/**
 * Các error code yêu cầu logout user
 */
export const AUTH_ERROR_CODES: ErrorCodeType[] = [
  ErrorCode.AUTH_TOKEN_EXPIRED,
  ErrorCode.AUTH_TOKEN_INVALID,
  ErrorCode.AUTH_REQUIRED,
];

/**
 * Các error code cần redirect về login
 */
export const REDIRECT_TO_LOGIN_CODES: ErrorCodeType[] = [
  ErrorCode.AUTH_TOKEN_EXPIRED,
  ErrorCode.AUTH_TOKEN_INVALID,
  ErrorCode.AUTH_REQUIRED,
];
