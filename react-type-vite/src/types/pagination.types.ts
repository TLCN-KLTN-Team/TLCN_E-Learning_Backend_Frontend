// --- Pagination Types ---
export interface PaginationResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first?: boolean;
  last?: boolean;
  hasNext?: boolean;
  hasPrevious?: boolean;
}

export interface PaginationRequest {
  page: number;
  size: number;
}

export interface UseServerPaginationProps<T> {
  fetchFn: (params: PaginationRequest) => Promise<PaginationResponse<T>>;
  initialPage?: number;
  initialSize?: number;
}

export interface UseServerPaginationReturn<T> {
  data: T[];
  loading: boolean;
  error: Error | null;
  pagination: Omit<PaginationResponse<T>, "content"> | null;
  currentPage: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
  startIndex: number;
  endIndex: number;
  goToPage: (page: number) => void;
  changePageSize: (size: number) => void;
  nextPage: () => void;
  previousPage: () => void;
  refresh: () => void;
  triggerFetch: () => void;
  getPageNumbers: () => (number | string)[];
}
