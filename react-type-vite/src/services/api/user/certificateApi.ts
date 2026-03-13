import axiosInstance from "../httpClient/axiosInstance";
import type { ApiResponse } from "../response/apiResponse";
import type { CertificateResponse } from "../response/certificateResponse";

const API_PREFIX = "/course-management/user/certificates";

export const getMyCertificate = async (
    courseId: number
): Promise<CertificateResponse | null> => {
    try {
        const response = await axiosInstance.get<ApiResponse<CertificateResponse>>(
            `${API_PREFIX}/published-course/${courseId}`
        );
        return response.data.result;
    } catch (error) {
        return null;
    }
};

export const verifyCertificate = async (
    code: string
): Promise<CertificateResponse | null> => {
    try {
        const response = await axiosInstance.get<ApiResponse<CertificateResponse>>(
            `${API_PREFIX}/verify/${code}`
        );
        return response.data.result;
    } catch (error) {
        return null;
    }
};

export const claimCertificate = async (
    courseId: number
): Promise<void> => {
    await axiosInstance.post(`${API_PREFIX}/claim/${courseId}`);
};
