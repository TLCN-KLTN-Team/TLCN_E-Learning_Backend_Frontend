import axiosInstance from "../httpClient/axiosInstance";
import type { EquivalentCourseRequest } from "../request/equivalentCourseRequest";
import type { EquivalentCourseResponse } from "../response/equivalentCourseResponse";
import type { ApiResponse, PaginatedResponse } from "../response/apiResponse";

export const getEquivalentCourses = async (
    keyword?: string,
    targetCourseId?: number,
    page: number = 0,
    size: number = 20
): Promise<PaginatedResponse<EquivalentCourseResponse>> => {
    let url = `/course-management/expert/equivalent-courses?page=${page}&size=${size}`;
    if (keyword && keyword.trim()) {
        url += `&keyword=${encodeURIComponent(keyword.trim())}`;
    }
    if (targetCourseId) {
        url += `&targetCourseId=${targetCourseId}`;
    }

    const response = await axiosInstance.get<ApiResponse<any>>(url);

    const result = response.data.result || response.data;

    return {
        content: result.content,
        page: result.number,
        size: result.size,
        totalElements: result.totalElements,
        totalPages: result.totalPages,
        first: result.first,
        last: result.last,
        hasNext: !result.last,
        hasPrevious: !result.first,
    };
};

export const createEquivalentCourse = async (
    data: EquivalentCourseRequest
): Promise<EquivalentCourseResponse> => {
    const response = await axiosInstance.post<ApiResponse<EquivalentCourseResponse>>(
        `/course-management/expert/equivalent-courses`,
        data
    );
    return response.data.result;
};

export const updateEquivalentCourse = async (
    id: number,
    data: EquivalentCourseRequest
): Promise<EquivalentCourseResponse> => {
    const response = await axiosInstance.put<ApiResponse<EquivalentCourseResponse>>(
        `/course-management/expert/equivalent-courses/${id}`,
        data
    );
    return response.data.result;
};

export const deleteEquivalentCourse = async (id: number): Promise<void> => {
    await axiosInstance.delete(`/course-management/expert/equivalent-courses/${id}`);
};
