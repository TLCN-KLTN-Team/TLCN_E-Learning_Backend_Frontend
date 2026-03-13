import axiosInstance from "../httpClient/axiosInstance";
import type { ApiResponse } from "../response/apiResponse";

/**
 * Teacher Revenue API
 * Handles all revenue-related endpoints for teachers
 */

import type { TeacherRevenueResponse } from "../response/revenueResponse";

// ==================== API Functions ====================

/**
 * Get teacher's revenue statistics
 * @returns Teacher revenue data with breakdown by courses and months
 */
export const getTeacherRevenue = async (): Promise<TeacherRevenueResponse> => {
  const response = await axiosInstance.get<ApiResponse<TeacherRevenueResponse>>(
    "/course-management/teacher/revenue"
  );
  return response.data.result;
};

/**
 * Get teacher's revenue within a specific date range
 * @param startDate - Start date (ISO format: yyyy-MM-dd)
 * @param endDate - End date (ISO format: yyyy-MM-dd)
 * @returns Teacher revenue data filtered by date range
 */
export const getTeacherRevenueByDateRange = async (
  startDate: string,
  endDate: string
): Promise<TeacherRevenueResponse> => {
  const response = await axiosInstance.get<ApiResponse<TeacherRevenueResponse>>(
    "/course-management/teacher/revenue/range",
    {
      params: { startDate, endDate }
    }
  );
  return response.data.result;
};
