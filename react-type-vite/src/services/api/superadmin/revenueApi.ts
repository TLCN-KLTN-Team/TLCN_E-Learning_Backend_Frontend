import axiosInstance from "../httpClient/axiosInstance";
import type { ApiResponse } from "../response/apiResponse";

/**
 * System Admin Revenue API
 * Handles all revenue-related endpoints for system administrators
 */

import type {
  SystemRevenueResponse,
  TeacherRevenueResponse,
  CourseRevenueDetail
} from "../response/revenueResponse";

// ==================== API Functions ====================

/**
 * Get system-wide revenue statistics (SUPER_ADMIN's platform share)
 * @returns System revenue data with monthly breakdown
 */
export const getSystemRevenue = async (): Promise<SystemRevenueResponse> => {
  const response = await axiosInstance.get<ApiResponse<SystemRevenueResponse>>(
    "/course-management/super-admin/revenue"
  );
  return response.data.result;
};

/**
 * Get system revenue within a specific date range
 * @param startDate - Start date (ISO format: yyyy-MM-dd)
 * @param endDate - End date (ISO format: yyyy-MM-dd)
 * @returns System revenue data filtered by date range
 */
export const getSystemRevenueByDateRange = async (
  startDate: string,
  endDate: string
): Promise<SystemRevenueResponse> => {
  const response = await axiosInstance.get<ApiResponse<SystemRevenueResponse>>(
    "/course-management/super-admin/revenue/range",
    {
      params: { startDate, endDate }
    }
  );
  return response.data.result;
};

/**
 * Get all teachers revenue (for system admin overview)
 * @returns List of all teachers with their revenue statistics
 */
export const getAllTeachersRevenue = async (): Promise<TeacherRevenueResponse[]> => {
  const response = await axiosInstance.get<ApiResponse<TeacherRevenueResponse[]>>(
    "/course-management/super-admin/revenue/teachers"
  );
  return response.data.result;
};

/**
 * Get all teachers revenue by date range
 * @param startDate - Start date (ISO format: yyyy-MM-dd)
 * @param endDate - End date (ISO format: yyyy-MM-dd)
 * @returns List of all teachers with their revenue statistics filtered by date range
 */
export const getAllTeachersRevenueByDateRange = async (
  startDate: string,
  endDate: string
): Promise<TeacherRevenueResponse[]> => {
  const response = await axiosInstance.get<ApiResponse<TeacherRevenueResponse[]>>(
    "/course-management/super-admin/revenue/teachers/range",
    {
      params: { startDate, endDate }
    }
  );
  return response.data.result;
};

/**
 * Get all courses revenue aggregated (backend-calculated)
 * @returns List of all courses with revenue statistics
 */
export const getAllCoursesRevenue = async (): Promise<CourseRevenueDetail[]> => {
  const response = await axiosInstance.get<ApiResponse<CourseRevenueDetail[]>>(
    "/course-management/super-admin/revenue/courses"
  );
  return response.data.result;
};

/**
 * Get all courses revenue by date range
 * @param startDate - Start date (ISO format: yyyy-MM-dd)
 * @param endDate - End date (ISO format: yyyy-MM-dd)
 * @returns List of all courses with revenue statistics filtered by date range
 */
export const getAllCoursesRevenueByDateRange = async (
  startDate: string,
  endDate: string
): Promise<CourseRevenueDetail[]> => {
  const response = await axiosInstance.get<ApiResponse<CourseRevenueDetail[]>>(
    "/course-management/super-admin/revenue/courses/range",
    {
      params: { startDate, endDate }
    }
  );
  return response.data.result;
};
