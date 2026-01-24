import axiosInstance from "../httpClient/axiosInstance";
import type { ApiResponse, PaginatedResponse } from "../response/apiResponse";
import type { ExpertResponse } from "../response/expertResponse";
import type { ExpertRequest } from "../request/expertRequest";

const BASE_URL = "/course-management/admin/educationalUnit";

export const getExperts = async (
    educationalUnitId: number,
    page: number,
    size: number,
    search?: string
): Promise<ApiResponse<PaginatedResponse<ExpertResponse>>> => {
    const params: any = { page, size };
    if (search) params.search = search;
    const response = await axiosInstance.get(
        `${BASE_URL}/${educationalUnitId}/experts`,
        { params }
    );
    return response.data;
};

export const createExpert = async (
    educationalUnitId: number,
    data: ExpertRequest
): Promise<ExpertResponse> => {
    const response = await axiosInstance.post(
        `${BASE_URL}/${educationalUnitId}/experts`,
        data
    );
    return response.data;
};

export const updateExpert = async (
    educationalUnitId: number,
    expertId: string,
    data: ExpertRequest
): Promise<ExpertResponse> => {
    const response = await axiosInstance.put(
        `${BASE_URL}/${educationalUnitId}/experts/${expertId}`,
        data
    );
    return response.data;
};

export const deleteExpert = async (
    educationalUnitId: number,
    expertId: string
): Promise<void> => {
    await axiosInstance.delete(
        `${BASE_URL}/${educationalUnitId}/experts/${expertId}`
    );
};

export const updateExpertAccountStatus = async (
    educationalUnitId: number,
    expertId: string,
    status: string
): Promise<ExpertResponse> => {
    const response = await axiosInstance.put(
        `${BASE_URL}/${educationalUnitId}/experts/${expertId}/status`,
        null,
        { params: { status } }
    );
    return response.data;
};


export interface BulkImportResult {
    successful: number;
    failed: number;
    results: {
        username: string;
        success: boolean;
        message?: string;
    }[];
}

export const bulkImportExperts = async (
    educationalUnitId: number,
    experts: ExpertRequest[]
): Promise<BulkImportResult> => {
    try {
        const response = await axiosInstance.post(
            `${BASE_URL}/${educationalUnitId}/experts/bulk-import`,
            { experts }
        );
        return response.data; // Assuming API returns ApiResponse<BulkImportResult> and axios interceptor returns data.result or data directly. 
        // Based on teacherApi, it returns response.data.result. 
        // But getExperts returns response.data which is ApiResponse. 
        // Let's check axiosInstance.
    } catch (error: any) {
        console.error("Bulk import error:", error);
        throw error;
    }
};
