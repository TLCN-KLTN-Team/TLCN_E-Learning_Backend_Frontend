import axiosInstance from "../httpClient/axiosInstance";
import type { MarkLessonCompleteRequest } from "../request/markLessonCompleteRequest";
import type { ApiResponse } from "../response/apiResponse";
import type { CourseProgressDetailResponse } from "../response/courseProgressDetailResponse";
import type { ProgressStatsResponse } from "../response/progressStatsResponse";


const PROGRESS_API_BASE = "/course-management/student/progress";

// Lấy thống kê tiến độ của class
export const getClassProgress = async (
  classId: number
): Promise<ProgressStatsResponse> => {
  const response = await axiosInstance.get<ApiResponse<ProgressStatsResponse>>(
    `${PROGRESS_API_BASE}/class/${classId}/stats`
  );
  return response.data.result;
};

// Lấy chi tiết tiến độ khóa học
export const getCourseProgressDetail = async (
  classId: number
): Promise<CourseProgressDetailResponse> => {
  const response = await axiosInstance.get<
    ApiResponse<CourseProgressDetailResponse>
  >(`${PROGRESS_API_BASE}/class/${classId}/detail`);
  return response.data.result;
};

// Đánh dấu lesson đã hoàn thành
export const markLessonComplete = async (
  request: MarkLessonCompleteRequest
): Promise<CourseProgressDetailResponse> => {
  const response = await axiosInstance.post<
    ApiResponse<CourseProgressDetailResponse>
  >(`${PROGRESS_API_BASE}/lesson/complete`, request);
  return response.data.result;
};

