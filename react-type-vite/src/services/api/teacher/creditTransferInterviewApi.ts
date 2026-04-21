import axiosInstance from "../httpClient/axiosInstance";
import type {
  ScheduleCreditTransferInterviewRequest,
  SubmitCreditTransferInterviewScoreRequest,
} from "../request/creditTransferRequest";
import type { ApiResponse, PaginatedResponse } from "../response/apiResponse";
import type { CreditTransferResponse } from "../response/creditTransferResponse";

const BASE_URL = "/course-management/teacher/credit-transfers";

export type TeacherCreditTransferStatus = "PENDING" | "INTERVIEW_SCHEDULED" | "INTERVIEW_SCORED" | "PENDING_EXPERT_REVIEW" | "APPROVED" | "REJECTED";

export const searchTeacherCreditTransfers = async (
  status?: TeacherCreditTransferStatus,
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

export const getTeacherCreditTransferDetail = async (id: number): Promise<CreditTransferResponse> => {
  const response = await axiosInstance.get<ApiResponse<CreditTransferResponse>>(`${BASE_URL}/${id}`);
  return response.data.result;
};

export const scheduleCreditTransferInterview = async (
  id: number,
  payload: ScheduleCreditTransferInterviewRequest
): Promise<void> => {
  await axiosInstance.post(`${BASE_URL}/${id}/interview/schedule`, payload);
};

export const submitCreditTransferInterviewScore = async (
  id: number,
  payload: SubmitCreditTransferInterviewScoreRequest
): Promise<void> => {
  await axiosInstance.post(`${BASE_URL}/${id}/interview/score`, payload);
};

export const uploadTeacherCreditTransferEvidence = async (id: number, file: File): Promise<string> => {
  const formData = new FormData();
  formData.append("file", file);

  const response = await axiosInstance.post<ApiResponse<string>>(
    `${BASE_URL}/${id}/interview/evidence/upload`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );

  return response.data.result;
};
