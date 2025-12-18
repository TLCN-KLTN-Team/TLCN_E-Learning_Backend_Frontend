import axiosInstance from "../httpClient/axiosInstance";
import type { ApiResponse } from "../response/apiResponse";

/**
 * System Admin Revenue API
 * Handles all revenue-related endpoints for system administrators
 */

// ==================== Types ====================

export interface MonthlyRevenueDetail {
  month: string; // Format: "yyyy-MM"
  revenue: number;
  orderCount: number;
}

export interface TeacherRevenueDetail {
  teacherId: string;
  teacherName: string;
  revenue: number;
  courseCount: number;
  orderCount: number;
}

export interface CourseRevenueDetail {
  courseId: string;
  courseName: string;
  courseThumbnail: string;
  totalSales: number;
  totalStudents: number;
  averageRating: number;
  revenue: number;
}

export interface SystemRevenueResponse {
  totalRevenue: number;
  totalAccrued: number;
  totalSettled: number;
  totalPending: number;
  totalCoursesSold: number;
  totalStudents: number;
  totalOrders: number;
  sharePercentage: number;
  monthlyRevenueDetails: MonthlyRevenueDetail[];
}

export interface TeacherRevenueResponse {
  teacherId?: string;
  teacherName?: string;
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
 * Get system-wide revenue statistics (SUPER_ADMIN's 10% share)
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
    "/course-management/system-admin/revenue/range",
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
    "/course-management/system-admin/revenue/teachers"
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
    "/course-management/system-admin/revenue/teachers/range",
    {
      params: { startDate, endDate }
    }
  );
  return response.data.result;
};

/**
 * Get all courses revenue aggregated (for system admin overview)
 * This aggregates all courses from all teachers
 * @returns List of all courses with revenue statistics
 */
export const getAllCoursesRevenue = async (): Promise<CourseRevenueDetail[]> => {
  // Get all teachers revenue, then flatten their courseRevenueDetails
  const teachersRevenue = await getAllTeachersRevenue();
  
  // Flatten all courses from all teachers
  const allCourses = teachersRevenue.flatMap(
    teacher => teacher.courseRevenueDetails || []
  );
  
  // Group by courseId and aggregate
  const courseMap = new Map<string, CourseRevenueDetail>();
  
  allCourses.forEach(course => {
    if (courseMap.has(course.courseId)) {
      const existing = courseMap.get(course.courseId)!;
      existing.revenue += course.revenue;
      existing.totalSales += course.totalSales;
      existing.totalStudents += course.totalStudents;
      // Average rating: simple average (can be improved with weighted average)
      existing.averageRating = (existing.averageRating + course.averageRating) / 2;
    } else {
      courseMap.set(course.courseId, { ...course });
    }
  });
  
  return Array.from(courseMap.values());
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
  // Get all teachers revenue by date range, then flatten their courseRevenueDetails
  const teachersRevenue = await getAllTeachersRevenueByDateRange(startDate, endDate);
  
  // Flatten all courses from all teachers
  const allCourses = teachersRevenue.flatMap(
    teacher => teacher.courseRevenueDetails || []
  );
  
  // Group by courseId and aggregate
  const courseMap = new Map<string, CourseRevenueDetail>();
  
  allCourses.forEach(course => {
    if (courseMap.has(course.courseId)) {
      const existing = courseMap.get(course.courseId)!;
      existing.revenue += course.revenue;
      existing.totalSales += course.totalSales;
      existing.totalStudents += course.totalStudents;
      // Average rating: simple average (can be improved with weighted average)
      existing.averageRating = (existing.averageRating + course.averageRating) / 2;
    } else {
      courseMap.set(course.courseId, { ...course });
    }
  });
  
  return Array.from(courseMap.values());
};
