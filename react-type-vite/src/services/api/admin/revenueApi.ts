import axiosInstance from "../httpClient/axiosInstance";
import type { ApiResponse } from "../response/apiResponse";

/**
 * Admin Revenue API
 * Handles all revenue-related endpoints for educational unit admins
 */

// ==================== Types ====================

export interface TeacherRevenueDetail {
  teacherId: string;
  teacherName: string;
  courseCount: number;
  studentCount: number;
  averageRating: number;
  revenue: number;
}

export interface MonthlyRevenueDetail {
  month: string; // Format: "yyyy-MM"
  revenue: number;
  orderCount: number;
}

export interface AdminRevenueResponse {
  educationalUnitId: string;
  educationalUnitName: string;
  totalRevenue: number;
  totalAccrued: number;
  totalSettled: number;
  totalPending: number;
  totalTeachers: number;
  totalCourses: number;
  totalStudents: number;
  totalOrders: number;
  sharePercentage: number;
  teacherRevenueDetails: TeacherRevenueDetail[];
  monthlyRevenueDetails: MonthlyRevenueDetail[];
}

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
