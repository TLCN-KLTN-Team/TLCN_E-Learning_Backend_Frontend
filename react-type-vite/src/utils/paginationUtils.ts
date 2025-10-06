/**
 * Pagination Utilities Module
 * Provides comprehensive pagination functionality for React applications
 */

// Types
export interface PaginationState {
  currentPage: number;
  pageSize: number;
  totalPages: number;
  totalElements: number;
  hasPrevious: boolean;
  hasNext: boolean;
}

export interface PaginationConfig {
  maxVisiblePages?: number;
  defaultPageSize?: number;
  pageSizeOptions?: number[];
}

export interface PageNumbersResult {
  pages: number[];
  showStartEllipsis: boolean;
  showEndEllipsis: boolean;
}

// Default configuration
const DEFAULT_CONFIG: Required<PaginationConfig> = {
  maxVisiblePages: 5,
  defaultPageSize: 10,
  pageSizeOptions: [5, 10, 20, 50, 100],
};

/**
 * Generate visible page numbers with ellipsis logic
 */
const generatePageNumbers = (
  currentPage: number,
  totalPages: number,
  maxVisible: number = DEFAULT_CONFIG.maxVisiblePages
): PageNumbersResult => {
  const pages: number[] = [];
  let showStartEllipsis = false;
  let showEndEllipsis = false;

  if (totalPages <= maxVisible) {
    // Show all pages if total is less than max visible
    for (let i = 0; i < totalPages; i++) {
      pages.push(i);
    }
  } else {
    const halfMax = Math.floor(maxVisible / 2);
    let start = Math.max(0, currentPage - halfMax);
    const end = Math.min(totalPages - 1, start + maxVisible - 1);

    // Adjust start if we're near the end
    if (end - start + 1 < maxVisible) {
      start = Math.max(0, end - maxVisible + 1);
    }

    // Always show first page
    if (start > 0) {
      pages.push(0);
      showStartEllipsis = start > 1;
    }

    // Add middle pages
    for (let i = start; i <= end; i++) {
      if (i > 0 && i < totalPages - 1) {
        pages.push(i);
      }
    }

    // Always show last page
    if (end < totalPages - 1) {
      showEndEllipsis = end < totalPages - 2;
      pages.push(totalPages - 1);
    }

    // Remove duplicates and sort
    const uniquePages = [...new Set(pages)].sort((a, b) => a - b);
    pages.splice(0, pages.length, ...uniquePages);
  }

  return { pages, showStartEllipsis, showEndEllipsis };
};

/**
 * Validate page change request
 */
const canChangePage = (newPage: number, totalPages: number): boolean => {
  return newPage >= 0 && newPage < totalPages;
};

/**
 * Calculate pagination state from API response
 */
const calculatePaginationState = (
  currentPage: number,
  pageSize: number,
  totalElements: number
): PaginationState => {
  const totalPages = Math.ceil(totalElements / pageSize);

  return {
    currentPage,
    pageSize,
    totalPages,
    totalElements,
    hasPrevious: currentPage > 0,
    hasNext: currentPage < totalPages - 1,
  };
};

/**
 * Get pagination display text
 */
const getPaginationText = (state: PaginationState): string => {
  const start = state.currentPage * state.pageSize + 1;
  const end = Math.min(
    (state.currentPage + 1) * state.pageSize,
    state.totalElements
  );

  return `Hiển thị ${start}-${end} của ${state.totalElements} kết quả`;
};

/**
 * Get safe page size from user input
 */
const getSafePageSize = (
  requestedSize: number,
  config: PaginationConfig = {}
): number => {
  const { pageSizeOptions = DEFAULT_CONFIG.pageSizeOptions } = config;

  if (pageSizeOptions.includes(requestedSize)) {
    return requestedSize;
  }

  return config.defaultPageSize || DEFAULT_CONFIG.defaultPageSize;
};

/**
 * Create pagination handlers
 */
const createPaginationHandlers = (
  setCurrentPage: (page: number) => void,
  setPageSize: (size: number) => void,
  onPageChange?: (page: number) => void | Promise<void>,
  onPageSizeChange?: (size: number) => void | Promise<void>
) => {
  const handlePageChange = async (newPage: number, totalPages: number) => {
    if (!canChangePage(newPage, totalPages)) return;

    setCurrentPage(newPage);
    if (onPageChange) {
      await onPageChange(newPage);
    }
  };

  const handlePageSizeChange = async (
    newSize: number,
    config?: PaginationConfig
  ) => {
    const safeSize = getSafePageSize(newSize, config);
    setPageSize(safeSize);
    setCurrentPage(0); // Reset to first page when changing page size

    if (onPageSizeChange) {
      await onPageSizeChange(safeSize);
    }
  };

  const handleFirstPage = async (totalPages: number) => {
    await handlePageChange(0, totalPages);
  };

  const handleLastPage = async (totalPages: number) => {
    await handlePageChange(totalPages - 1, totalPages);
  };

  const handlePreviousPage = async (
    currentPage: number,
    totalPages: number
  ) => {
    await handlePageChange(currentPage - 1, totalPages);
  };

  const handleNextPage = async (currentPage: number, totalPages: number) => {
    await handlePageChange(currentPage + 1, totalPages);
  };

  return {
    handlePageChange,
    handlePageSizeChange,
    handleFirstPage,
    handleLastPage,
    handlePreviousPage,
    handleNextPage,
  };
};

/**
 * Create pagination state manager hook data
 */
const createPaginationStateManager = (
  initialPageSize: number = DEFAULT_CONFIG.defaultPageSize
) => {
  return {
    currentPage: 0,
    pageSize: initialPageSize,
    totalPages: 0,
    totalElements: 0,
    hasPrevious: false,
    hasNext: false,
  };
};

// Export main pagination utilities object
export const paginationUtils = {
  generatePageNumbers,
  canChangePage,
  calculatePaginationState,
  getPaginationText,
  getSafePageSize,
  createPaginationHandlers,
  createPaginationStateManager,
  DEFAULT_CONFIG,
};

// Export individual functions for tree-shaking
export {
  generatePageNumbers,
  canChangePage,
  calculatePaginationState,
  getPaginationText,
  getSafePageSize,
  createPaginationHandlers,
  createPaginationStateManager,
};
