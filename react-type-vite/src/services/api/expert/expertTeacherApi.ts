import axiosInstance from "../httpClient/axiosInstance";
import type { ApiResponse, PaginatedResponse } from "../response/apiResponse";
import type { TeacherResponse } from "../response/teacherResponse";

export const getTeachers = async (
    educationalUnitId: number,
    page: number = 0,
    size: number = 20,
    search?: string
): Promise<PaginatedResponse<TeacherResponse>> => {
    let url = `/course-management/expert/educational-unit/${educationalUnitId}/teachers?page=${page}&size=${size}`;
    if (search && search.trim()) {
        url += `&search=${encodeURIComponent(search.trim())}`;
    }
    const response = await axiosInstance.get<ApiResponse<PaginatedResponse<TeacherResponse>>>(url);
    return response.data.result;
};
