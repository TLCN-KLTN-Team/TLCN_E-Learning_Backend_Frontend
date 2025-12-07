import axiosInstance from "../httpClient/axiosInstance";
import type { ApiResponse } from "../response/apiResponse";

/**
 * Teacher Revenue API
 * Handles all revenue-related endpoints for teachers
 */

// ==================== Types ====================

export interface CourseRevenueDetail {
  courseId: string;
  courseName: string;
  courseThumbnail: string;
  totalSales: number;
  totalStudents: number;
  averageRating: number;
  revenue: number;
}

export interface MonthlyRevenueDetail {
  month: string; // Format: "yyyy-MM"
  revenue: number;
  orderCount: number;
}

export interface TeacherRevenueResponse {
  totalRevenue: number;
  totalAccrued: number;
  totalSettled: number;
  totalPending: number;
  totalCoursesSold: number;
  totalStudents: number;
  totalOrders: number;
  sharePercentage: number;
  courseRevenueDetails: CourseRevenueDetail[];
  monthlyRevenueDetails: MonthlyRevenueDetail[];
}

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
