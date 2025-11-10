import { useState, useEffect, useCallback } from "react";
import type {
  UseServerPaginationProps,
  UseServerPaginationReturn,
  PaginationResponse,
} from "../types/pagination.types";

export const useServerPagination = <T>({
  fetchFn,
  initialPage = 0,
  initialSize = 10,
}: UseServerPaginationProps<T>): UseServerPaginationReturn<T> => {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [pageSize, setPageSize] = useState(initialSize);
  const [pagination, setPagination] = useState<Omit<
    PaginationResponse<T>,
    "content"
  > | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetchFn({ page: currentPage, size: pageSize });

      setData(response.content);
      setPagination({
        first: response.first,
        hasNext: response.hasNext,
        hasPrevious: response.hasPrevious,
        last: response.last,
        page: response.page,
        size: response.size,
        totalElements: response.totalElements,
        totalPages: response.totalPages,
      });
    } catch (err) {
      setError(err as Error);
      setData([]);
      setPagination(null);
    } finally {
      setLoading(false);
    }
  }, [fetchFn, currentPage, pageSize]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Manual fetch method that can be triggered externally
  const triggerFetch = useCallback(() => {
    fetchData();
  }, [fetchData]);

  const goToPage = useCallback(
    (page: number) => {
      if (pagination && page >= 0 && page < pagination.totalPages) {
        setCurrentPage(page);
      }
    },
    [pagination]
  );

  const nextPage = useCallback(() => {
    if (pagination?.hasNext) {
      setCurrentPage((prev) => prev + 1);
    }
  }, [pagination]);

  const previousPage = useCallback(() => {
    if (pagination?.hasPrevious) {
      setCurrentPage((prev) => prev - 1);
    }
  }, [pagination]);

  const changePageSize = useCallback((size: number) => {
    setPageSize(size);
    setCurrentPage(0); // Reset về trang đầu khi đổi size
  }, []);

  const refresh = useCallback(() => {
    fetchData();
  }, [fetchData]);

  const getPageNumbers = useCallback(() => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;
    const totalPages = pagination?.totalPages || 0;

    if (totalPages <= maxVisible) {
      for (let i = 0; i < totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(0);

      let start = Math.max(1, currentPage - 1);
      let end = Math.min(totalPages - 2, currentPage + 1);

      if (currentPage <= 2) {
        end = 3;
      } else if (currentPage >= totalPages - 3) {
        start = totalPages - 4;
      }

      if (start > 1) pages.push("...");

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (end < totalPages - 2) pages.push("...");

      pages.push(totalPages - 1);
    }

    return pages;
  }, [currentPage, pagination?.totalPages]);

  // Calculate display info
  const totalElements = pagination?.totalElements || 0;
  const startIndex = currentPage * pageSize + 1;
  const endIndex = Math.min((currentPage + 1) * pageSize, totalElements);

  return {
    data,
    loading,
    error,
    pagination,
    currentPage,
    pageSize,
    totalElements,
    totalPages: pagination?.totalPages || 0,
    startIndex,
    endIndex,
    goToPage,
    changePageSize,
    nextPage,
    previousPage,
    refresh,
    triggerFetch,
    getPageNumbers,
  };
};
