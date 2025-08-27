export interface ApiResponse<T> {
  code: string;
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
