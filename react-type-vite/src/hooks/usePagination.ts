import { useMemo, useState } from "react";

interface PaginationProps {
  page: number;
  size: number;
  totalPages: number;
  totalElements: number;
}

interface PaginationReturn {
  currentPage: number;
  totalPages: number;
  itemsPerPage: number;
  startIndex: number;
  endIndex: number;
  goToPage: (page: number) => void;
  nextPage: () => void;
  previousPage: () => void;
  canGoNext: boolean;
  canGoPrevious: boolean;
  pageNumbers: number[];
}

export const usePagination = ({
  page,
  size,
  totalElements,
  totalPages,
}: PaginationProps): PaginationReturn => {
  const [currentPage, setCurrentPage] = useState(page);

  const startIndex = useMemo(() => {
    return currentPage * size;
  }, [currentPage, size]);

  const endIndex = useMemo(() => {
    return Math.min(startIndex + size, totalElements);
  }, [startIndex, size, totalElements]);

  const pageNumbers = useMemo(() => {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }, [totalPages]);

  const goToPage = (page: number) => {
    const pageNumber = Math.max(0, Math.min(page, totalPages));
    setCurrentPage(pageNumber);
  };

  const nextPage = () => {
    goToPage(currentPage + 1);
  };

  const previousPage = () => {
    goToPage(currentPage - 1);
  };

  return {
    currentPage,
    totalPages,
    itemsPerPage: size,
    startIndex,
    endIndex,
    goToPage,
    nextPage,
    previousPage,
    canGoNext: currentPage < totalPages - 1,
    canGoPrevious: currentPage > 0,
    pageNumbers,
  };
};
