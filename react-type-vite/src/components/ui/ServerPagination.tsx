import React from "react";
import { Button } from "./button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalElements: number;
  startIndex: number;
  endIndex: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  onNext: () => void;
  onPrevious: () => void;
  getPageNumbers: () => (number | string)[];
  className?: string;
}

export const ServerPagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  totalElements,
  startIndex,
  endIndex,
  pageSize,
  onPageChange,
  onPageSizeChange,
  onNext,
  onPrevious,
  getPageNumbers,
  className = "",
}) => {
  const pageNumbers = getPageNumbers();

  if (totalPages <= 1) {
    return null;
  }

  return (
    <div className={`flex flex-col gap-4 animate-fade-in ${className}`}>
      {/* Results info */}
      <div className="flex justify-between items-center text-sm text-gray-600">
        <div>
          Showing {startIndex} to {endIndex} of {totalElements} results
        </div>

        {onPageSizeChange && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Show</span>
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className="border border-gray-300 rounded px-3 py-1.5 text-sm transition-all duration-300 hover:border-blue-300 hover:shadow-md hover:bg-blue-50 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none cursor-pointer"
            >
              <option value={6}>6</option>
              <option value={12}>12</option>
              <option value={24}>24</option>
              <option value={48}>48</option>
            </select>
            <span className="text-sm text-gray-600">per page</span>
          </div>
        )}
      </div>

      {/* Pagination controls */}
      <div className="flex justify-center items-center gap-2">
        {/* Previous button */}
        <Button
          variant="outline"
          size="sm"
          onClick={onPrevious}
          disabled={currentPage === 0}
          className="flex items-center gap-1 transition-all duration-300 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300 hover:shadow-md hover:scale-105 hover:-translate-y-0.5 disabled:hover:transform-none disabled:hover:bg-white disabled:hover:text-gray-400 disabled:hover:border-gray-200 disabled:hover:shadow-none active:scale-95 group"
        >
          <ChevronLeft className="w-4 h-4 transition-transform duration-200 group-hover:scale-110 group-hover:-translate-x-0.5" />
          <span className="transition-transform duration-200 group-hover:scale-105">
            Previous
          </span>
        </Button>

        {/* Page numbers */}
        <div className="flex items-center gap-1">
          {pageNumbers.map((page, index) => (
            <React.Fragment key={index}>
              {page === "..." ? (
                <span
                  className="px-2 py-1 text-gray-500 animate-fade-in"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  ...
                </span>
              ) : (
                <Button
                  variant={currentPage === page ? "default" : "outline"}
                  size="sm"
                  onClick={() => onPageChange(page as number)}
                  className={`min-w-[36px] h-9 relative overflow-hidden transition-all duration-300 transform animate-fade-in ${
                    currentPage === page
                      ? "bg-blue-500 text-white shadow-lg scale-105 ring-2 ring-blue-200"
                      : "bg-white text-gray-800 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300 hover:shadow-md hover:scale-105 hover:-translate-y-0.5"
                  } active:scale-95 group`}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <span className="relative z-10 transition-transform duration-200 group-hover:scale-110">
                    {(page as number) + 1}
                  </span>
                  {/* Hover background effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-blue-600 opacity-0 group-hover:opacity-20 transition-opacity duration-300" />
                  {/* Ripple effect on hover */}
                  <div className="absolute inset-0 rounded-md border-2 border-blue-300 opacity-0 group-hover:opacity-100 group-hover:animate-ping transition-opacity duration-300" />
                </Button>
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Next button */}
        <Button
          variant="outline"
          size="sm"
          onClick={onNext}
          disabled={currentPage === totalPages - 1}
          className={`flex items-center gap-1 transition-all duration-300 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300 hover:shadow-md hover:scale-105 hover:-translate-y-0.5 disabled:hover:transform-none disabled:hover:bg-white disabled:hover:text-gray-400 disabled:hover:border-gray-200 disabled:hover:shadow-none active:scale-95 group
            `}
        >
          <span className="transition-transform duration-200 group-hover:scale-105">
            Next
          </span>
          <ChevronRight className="w-4 h-4 transition-transform duration-200 group-hover:scale-110 group-hover:translate-x-0.5" />
        </Button>
      </div>

      {/* Mobile pagination (simplified) */}
      <div className="md:hidden flex justify-between items-center">
        <Button
          variant="outline"
          size="sm"
          onClick={onPrevious}
          disabled={currentPage === 0}
          className="transition-all duration-300 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300 hover:shadow-md hover:scale-110 disabled:hover:transform-none disabled:hover:bg-white disabled:hover:text-gray-400 disabled:hover:border-gray-200 disabled:hover:shadow-none active:scale-95 group"
        >
          <ChevronLeft className="w-4 h-4 transition-transform duration-200 group-hover:scale-110 group-hover:-translate-x-0.5" />
        </Button>

        <span className="text-sm text-gray-600 font-medium">
          Page {currentPage + 1} of {totalPages}
        </span>

        <Button
          variant="outline"
          size="sm"
          onClick={onNext}
          disabled={currentPage === totalPages - 1}
          className="transition-all duration-300 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300 hover:shadow-md hover:scale-110 disabled:hover:transform-none disabled:hover:bg-white disabled:hover:text-gray-400 disabled:hover:border-gray-200 disabled:hover:shadow-none active:scale-95 group"
        >
          <ChevronRight className="w-4 h-4 transition-transform duration-200 group-hover:scale-110 group-hover:translate-x-0.5" />
        </Button>
      </div>
    </div>
  );
};
