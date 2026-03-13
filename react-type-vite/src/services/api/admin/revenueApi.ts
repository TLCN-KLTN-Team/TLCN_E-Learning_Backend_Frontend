import axiosInstance from "../httpClient/axiosInstance";
import type { ApiResponse } from "../response/apiResponse";

import type { AdminRevenueResponse } from "../response/revenueResponse";

// ==================== API Functions ====================

/**
 * Get educational unit admin's revenue statistics
 * @returns Admin revenue data with breakdown by teachers and months
 */
export const getAdminRevenue = async (): Promise<AdminRevenueResponse> => {
  const response = await axiosInstance.get<ApiResponse<AdminRevenueResponse>>(
    "course-management/admin/revenue"
  );
  return response.data.result;
};

/**
 * Get admin's revenue within a specific date range
 * @param startDate - Start date (ISO format: yyyy-MM-dd)
 * @param endDate - End date (ISO format: yyyy-MM-dd)
 * @returns Admin revenue data filtered by date range
 */
export const getAdminRevenueByDateRange = async (
  startDate: string,
  endDate: string
): Promise<AdminRevenueResponse> => {
  const response = await axiosInstance.get<ApiResponse<AdminRevenueResponse>>(
    "course-management/admin/revenue/range",
    {
      params: { startDate, endDate }
    }
  );
  return response.data.result;
};
