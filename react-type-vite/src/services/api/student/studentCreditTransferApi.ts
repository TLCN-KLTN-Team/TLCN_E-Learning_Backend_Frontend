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

export const createRequestWithAttachment = async (
    data: Omit<CreateCreditTransferRequest, 'attachmentUrl'>,
    attachmentFile: File
): Promise<CreditTransferResponse> => {
    const url = '/course-management/student/credit-transfers/with-attachment';
    const formData = new FormData();

    const dataBlob = new Blob([
        JSON.stringify({
            ...data,
            attachmentUrl: "",
        }),
    ], {
        type: 'application/json',
    });

    formData.append('data', dataBlob);
    formData.append('attachmentFile', attachmentFile);

    const response = await axiosClient.post<ApiResponse<CreditTransferResponse>>(url, formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });

    return response.data.result;
};

export const getEquivalentCourses = async (params?: any): Promise<PaginatedResponse<EquivalentCourseResponse>> => {
    const url = '/course-management/student/credit-transfers/equivalent-courses';
    const response = await axiosClient.get<ApiResponse<PaginatedResponse<EquivalentCourseResponse>>>(url, { params });
    return response.data.result;
};
