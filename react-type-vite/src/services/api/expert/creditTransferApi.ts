import axiosInstance from "../httpClient/axiosInstance";
import type { ApiResponse, PaginatedResponse } from "../response/apiResponse";
import type { CreditTransferResponse } from "../response/creditTransferResponse";

const BASE_URL = "/course-management/expert/credit-transfers";

export const searchCreditTransfers = async (
    status?: string,
    keyword?: string,
    page: number = 0,
    size: number = 10
): Promise<PaginatedResponse<CreditTransferResponse>> => {
    const params = new URLSearchParams({
        page: page.toString(),
        size: size.toString(),
    });
    if (status) params.append("status", status);
    if (keyword) params.append("keyword", keyword);

    const response = await axiosInstance.get<ApiResponse<PaginatedResponse<CreditTransferResponse>>>(
        `${BASE_URL}?${params.toString()}`
    );
    return response.data.result;
};

export const getCreditTransferById = async (id: number): Promise<CreditTransferResponse> => {
    const response = await axiosInstance.get<ApiResponse<CreditTransferResponse>>(
        `${BASE_URL}/${id}`
    );
    return response.data.result;
};

export const approveCreditTransfer = async (id: number, note?: string): Promise<void> => {
    await axiosInstance.post(`${BASE_URL}/${id}/approve`, { note });
};

export const rejectCreditTransfer = async (id: number, reason: string): Promise<void> => {
    await axiosInstance.post(`${BASE_URL}/${id}/reject`, { rejectionReason: reason });
};
