import axiosClient from "@/services/api/httpClient/axiosInstance";



import type { CreateCreditTransferRequest } from "../request/creditTransferRequest";
import type { EquivalentCourseResponse } from "../response/equivalentCourseResponse";
import type { CreditTransferResponse } from "../response/creditTransferResponse";
import type { ApiResponse, PaginatedResponse } from "../response/apiResponse";

export const getMyRequests = async (params?: any): Promise<PaginatedResponse<CreditTransferResponse>> => {
    const url = '/course-management/student/credit-transfers';
    const response = await axiosClient.get<ApiResponse<PaginatedResponse<CreditTransferResponse>>>(url, { params });
    return response.data.result;
};

export const createRequest = async (data: CreateCreditTransferRequest): Promise<CreditTransferResponse> => {
    const url = '/course-management/student/credit-transfers';
    const response = await axiosClient.post<ApiResponse<CreditTransferResponse>>(url, data);
    return response.data.result;
};

export const getEquivalentCourses = async (params?: any): Promise<PaginatedResponse<EquivalentCourseResponse>> => {
    const url = '/course-management/student/credit-transfers/equivalent-courses';
    const response = await axiosClient.get<ApiResponse<PaginatedResponse<EquivalentCourseResponse>>>(url, { params });
    return response.data.result;
};
