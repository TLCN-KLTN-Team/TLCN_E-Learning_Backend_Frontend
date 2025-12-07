import type { TimeRange } from "@/types/revenue.types";

/**
 * Calculate date range based on time range selection
 * @param range - Time range type
 * @param selectedMonth - Selected month in "yyyy-MM" format (for select-month)
 * @param selectedYear - Selected year in "yyyy" format (for select-year)
 * @returns Object with startDate and endDate in "yyyy-MM-dd" format
 */
export const getDateRange = (
  range: TimeRange,
  selectedMonth?: string,
  selectedYear?: string
): { startDate: string; endDate: string } => {
  const end = new Date();
  const start = new Date();

  switch (range) {
    case "today":
      // Same day
      break;
    case "week":
      start.setDate(start.getDate() - 7);
      break;
    case "month":
      start.setDate(start.getDate() - 30);
      break;
    case "select-month":
      if (selectedMonth) {
        // selectedMonth format: "yyyy-MM"
        const [year, month] = selectedMonth.split("-");
        const monthStart = new Date(parseInt(year), parseInt(month) - 1, 1);
        const monthEnd = new Date(parseInt(year), parseInt(month), 0);
        return {
          startDate: monthStart.toISOString().split("T")[0],
          endDate: monthEnd.toISOString().split("T")[0],
        };
      }
      break;
    case "year":
      start.setDate(start.getDate() - 365);
      break;
    case "select-year":
      if (selectedYear) {
        // selectedYear format: "yyyy"
        const yearStart = new Date(parseInt(selectedYear), 0, 1);
        const yearEnd = new Date(parseInt(selectedYear), 11, 31);
        return {
          startDate: yearStart.toISOString().split("T")[0],
          endDate: yearEnd.toISOString().split("T")[0],
        };
      }
      break;
    case "all":
    case "custom":
    default:
      // For "all" or "custom", handled separately
      break;
  }

  const formatDate = (date: Date): string => {
    return date.toISOString().split("T")[0];
  };

  return {
    startDate: formatDate(start),
    endDate: formatDate(end),
  };
};

/**
 * Get current month in "yyyy-MM" format
 */
export const getCurrentMonth = (): string => {
  return new Date().toISOString().slice(0, 7);
};

/**
 * Get current year in "yyyy" format
 */
export const getCurrentYear = (): string => {
  return new Date().getFullYear().toString();
};
