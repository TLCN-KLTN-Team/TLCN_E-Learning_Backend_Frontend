import axiosInstance from "../httpClient/axiosInstance";
import type { ApiResponse } from "../response/apiResponse";
import type {
  DashboardFilterRequest,
  DashboardResponse,
  PeriodType,
  EducationType,
} from "@/types/dashboard.types";

/**
 * System Admin Dashboard API Service
 * Handles all dashboard-related API calls for system administrators
 */
class DashboardApiService {
  private static readonly BASE_PATH =
    "/course-management/super-admin/dashboard";

  /**
   * Get dashboard overview with optional filters
   * @param periodType - Time period filter (WEEK, MONTH, YEAR, CUSTOM)
   * @param educationType - Education type filter (UNIVERSITY, COLLEGE, INTERMEDIATE, ALL)
   * @returns Dashboard statistics
   */
  static async getOverview(
    periodType?: PeriodType,
    educationType?: EducationType
  ): Promise<DashboardResponse> {
    const params: Record<string, string> = {};

    if (periodType) {
      params.periodType = periodType;
    }
    if (educationType) {
      params.educationType = educationType;
    }

    const response = await axiosInstance.get<ApiResponse<DashboardResponse>>(
      `${this.BASE_PATH}/overview`,
      { params }
    );

    return response.data.result;
  }

  /**
   * Get comprehensive dashboard statistics (GET method)
   * @param period - Time period filter (default: MONTH)
   * @param educationType - Education type filter (default: ALL)
   * @param from - Custom period start date (required if period=CUSTOM)
   * @param to - Custom period end date (required if period=CUSTOM)
   * @returns Comprehensive dashboard statistics
   */
  static async getDashboardStatistics(
    period?: PeriodType,
    educationType?: EducationType,
    from?: string,
    to?: string
  ): Promise<DashboardResponse> {
    const params: Record<string, string> = {};

    if (period) {
      params.period = period;
    }
    if (educationType) {
      params.educationType = educationType;
    }
    if (from) {
      params.from = from;
    }
    if (to) {
      params.to = to;
    }

    const response = await axiosInstance.get<ApiResponse<DashboardResponse>>(
      `${this.BASE_PATH}/statistics`,
      { params }
    );

    return response.data.result;
  }

  /**
   * Get dashboard statistics using POST method with filter in request body
   * @param filter - Dashboard filter request object
   * @returns Dashboard statistics
   */
  static async getDashboardStatisticsPost(
    filter: DashboardFilterRequest
  ): Promise<DashboardResponse> {
    const response = await axiosInstance.post<ApiResponse<DashboardResponse>>(
      `${this.BASE_PATH}/statistics`,
      filter
    );

    return response.data.result;
  }

  /**
   * Health check endpoint
   * @returns Health status message
   */
  static async healthCheck(): Promise<string> {
    const response = await axiosInstance.get<ApiResponse<string>>(
      `${this.BASE_PATH}/health`
    );

    return response.data.result;
  }
}

export default DashboardApiService;
