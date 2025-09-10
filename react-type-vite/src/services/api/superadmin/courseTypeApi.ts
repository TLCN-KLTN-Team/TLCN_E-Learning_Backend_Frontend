import axiosInstance from "../httpClient/axiosInstance";
import type { ApiResponse, PaginatedResponse } from "../response/apiResponse";
import type { CourseCategoryResponse } from "../response/courseTypeResponse";

const PREFIX = "/course-management/super-admin";

export const getCourseTypes = async (
  page: number = 0,
  size: number = 10
): Promise<PaginatedResponse<CourseCategoryResponse>> => {
  const response = await axiosInstance.get<
    ApiResponse<PaginatedResponse<CourseCategoryResponse>>
  >(`${PREFIX}/course-categories?page=${page}&size=${size}`);

  return response.data.result;
};

export const createCourseType = async (
  name: string,
  description: string
): Promise<CourseCategoryResponse> => {
  const response = await axiosInstance.post<
    ApiResponse<CourseCategoryResponse>
  >(`${PREFIX}/course-categories/create`, {
    courseTypeName: name,
    description,
  });
  return response.data.result;
};

export const updateCourseType = async (
  id: number,
  data: {
    name: string;
    description: string;
  }
): Promise<CourseCategoryResponse> => {
  const response = await axiosInstance.put<ApiResponse<CourseCategoryResponse>>(
    `${PREFIX}/course-categories/${id}/update`,
    data
  );
  return response.data.result;
};

export const disableCourseType = async (id: number): Promise<void> => {
  await axiosInstance.put(`${PREFIX}/course-categories/${id}/disable`);
};
