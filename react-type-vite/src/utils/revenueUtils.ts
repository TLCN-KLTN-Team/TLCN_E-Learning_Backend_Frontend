import type { TimeRange } from "@/types/revenue.types";

/**
 * Format date to "yyyy-MM-dd" using local date (not UTC)
 * Avoids timezone issues with toISOString()
 */
export const formatDateLocal = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

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
      // First day of current month
      start.setDate(1);
      break;
    case "select-month":
      if (selectedMonth) {
        // selectedMonth format: "yyyy-MM"
        const [year, month] = selectedMonth.split("-");
        const monthStart = new Date(parseInt(year), parseInt(month) - 1, 1);
        // Get last day of month: create first day of next month, then subtract 1 day
        const firstOfNextMonth = new Date(parseInt(year), parseInt(month), 1);
        const monthEnd = new Date(firstOfNextMonth.getTime() - 24 * 60 * 60 * 1000);
        return {
          startDate: formatDateLocal(monthStart),
          endDate: formatDateLocal(monthEnd),
        };
      }
      break;
    case "year":
      // First day and last day of current year
      start.setMonth(0, 1);
      end.setMonth(11, 31);
      break;
    case "select-year":
      if (selectedYear) {
        // selectedYear format: "yyyy"
        const yearStart = new Date(parseInt(selectedYear), 0, 1);
        const yearEnd = new Date(parseInt(selectedYear), 11, 31);
        return {
          startDate: formatDateLocal(yearStart),
          endDate: formatDateLocal(yearEnd),
        };
      }
      break;
    case "all":
    case "custom":
    default:
      // For "all" or "custom", handled separately
      break;
  }

  return {
    startDate: formatDateLocal(start),
    endDate: formatDateLocal(end),
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

/**
 * Chart granularity type
 */
export type ChartGranularity = 'day' | 'month' | 'year';

/**
 * Determine chart granularity based on date range
 * @param startDate - Start date in "yyyy-MM-dd" format
 * @param endDate - End date in "yyyy-MM-dd" format
 * @param timeRange - Time range selection
 * @returns Granularity type: 'day', 'month', or 'year'
 */
export const determineChartGranularity = (
  startDate: string,
  endDate: string,
  timeRange: TimeRange
): ChartGranularity => {
  // For specific time range selections, use predetermined granularity
  if (timeRange === 'today' || timeRange === 'week') {
    return 'day';
  }
  if (timeRange === 'select-month' || timeRange === 'month') {
    return 'day';
  }
  if (timeRange === 'select-year') {
    return 'month';
  }
  if (timeRange === 'all') {
    return 'year';
  }
  
  // For custom ranges, calculate based on day difference
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  
  if (diffDays <= 31) {
    return 'day';
  } else if (diffDays <= 365) {
    return 'month';
  } else {
    return 'year';
  }
};

/**
 * Transform monthly revenue data based on granularity
 * Backend always returns monthly data (yyyy-MM format)
 * This function aggregates or expands data as needed
 */
export const transformRevenueDataByGranularity = <T extends { month: string; [key: string]: any }>(
  monthlyData: T[],
  granularity: ChartGranularity,
  startDate: string,
  endDate: string
): (Omit<T, 'month'> & { period: string })[] => {
  if (granularity === 'month') {
    // Keep as-is, just rename 'month' to 'period'
    return monthlyData.map(item => {
      const { month, ...rest } = item;
      return { ...rest, period: month } as any;
    });
  }
  
  if (granularity === 'year') {
    // Group by year
    const yearMap = new Map<string, any>();
    
    monthlyData.forEach(item => {
      const year = item.month.split('-')[0];
      
      if (!yearMap.has(year)) {
        const { month, ...rest } = item;
        yearMap.set(year, { ...rest, period: year });
      } else {
        const existing = yearMap.get(year);
        const { month, ...rest } = item;
        
        // Sum up numeric values
        Object.keys(rest).forEach(key => {
          if (typeof rest[key] === 'number') {
            existing[key] = (existing[key] || 0) + rest[key];
          }
        });
      }
    });
    
    return Array.from(yearMap.values()).sort((a, b) => a.period.localeCompare(b.period));
  }
  
  if (granularity === 'day') {
    // If backend already returns daily periods (yyyy-MM-dd), use directly
    const hasDailyPeriods = monthlyData.some(item => /^\d{4}-\d{2}-\d{2}$/.test(item.month));
    if (hasDailyPeriods) {
      return monthlyData.map(item => {
        const { month, ...rest } = item;
        return { ...rest, period: month } as any;
      }).sort((a, b) => a.period.localeCompare(b.period));
    }

    // Expand monthly data to daily data
    // Since backend only provides monthly aggregates, we'll distribute evenly
    // For a more accurate implementation, backend should support daily granularity
    const result: any[] = [];
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    // Get monthly data as a map
    const monthlyMap = new Map<string, T>();
    monthlyData.forEach(item => {
      monthlyMap.set(item.month, item);
    });
    
    // Generate daily entries
    const current = new Date(start);
    while (current <= end) {
      const monthKey = current.toISOString().slice(0, 7); // yyyy-MM
      const dayKey = current.toISOString().slice(0, 10); // yyyy-MM-dd
      
      const monthData = monthlyMap.get(monthKey);
      
      if (monthData) {
        // Calculate number of days in this month
        const daysInMonth = new Date(
          current.getFullYear(),
          current.getMonth() + 1,
          0
        ).getDate();
        
        const { month, ...rest } = monthData;
        const dailyData: any = { period: dayKey };
        
        // Divide monthly values by days in month
        Object.keys(rest).forEach(key => {
          if (typeof rest[key] === 'number') {
            dailyData[key] = Math.round(rest[key] / daysInMonth);
          } else {
            dailyData[key] = rest[key];
          }
        });
        
        result.push(dailyData);
      } else {
        // No data for this day, use zeros
        const { month, ...template } = monthlyData[0] || {};
        const emptyData: any = { period: dayKey };
        
        if (template) {
          Object.keys(template).forEach(key => {
            emptyData[key] = typeof template[key] === 'number' ? 0 : null;
          });
        }
        
        result.push(emptyData);
      }
      
      current.setDate(current.getDate() + 1);
    }
    
    return result;
  }
  
  return monthlyData.map(item => {
    const { month, ...rest } = item;
    return { ...rest, period: month } as any;
  });
};

/**
 * Format chart label based on granularity
 */
export const formatChartLabel = (period: string, granularity: ChartGranularity): string => {
  if (granularity === 'day') {
    // yyyy-MM-dd -> dd/MM
    const [, month, day] = period.split('-');
    return `${day}/${month}`;
  }
  
  if (granularity === 'month') {
    // yyyy-MM -> MM/yyyy
    const [year, month] = period.split('-');
    return `${month}/${year}`;
  }
  
  if (granularity === 'year') {
    // yyyy -> yyyy
    return period;
  }
  
  return period;
};

/**
 * Get chart title based on granularity
 */
export const getChartTitle = (granularity: ChartGranularity): string => {
  switch (granularity) {
    case 'day':
      return 'Biểu đồ doanh thu theo ngày';
    case 'month':
      return 'Biểu đồ doanh thu theo tháng';
    case 'year':
      return 'Biểu đồ doanh thu theo năm';
    default:
      return 'Biểu đồ doanh thu';
  }
};
