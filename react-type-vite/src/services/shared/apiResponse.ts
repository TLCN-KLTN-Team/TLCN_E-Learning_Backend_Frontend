export interface ApiResponse<T> {
  code: number;
  message: string;
  result: T;
  errors?: Record<string, string>;
}

export interface PaginatedResponse<T> {
  content: T[];
  pageNumber: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
}

export interface ErrorResponse {
  code: number;
  message: string;
  errors?: Record<string, string>;
}

// Error codes từ backend
export const ErrorCodes = {
  SUCCESS: 1000,
  USER_NOT_EXISTED: 1005,
  INVALID_CREDENTIALS: 1006,
  UNAUTHENTICATED: 1007,
  UNAUTHORIZED: 1008,
  TOKEN_EXPIRED: 1009,
  INVALID_TOKEN: 1010,
} as const;
