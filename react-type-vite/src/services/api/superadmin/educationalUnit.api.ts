import axiosInstance from "../httpClient/axiosInstance";
import type { ApiResponse, PaginatedResponse } from "../response/apiResponse";
import type { EducationalUnitResponse } from "../response/educationalUnitResponse";

const PREFIX = "/course-management/super-admin/education-unit-management";

const getAllEducationalUnits = async (): Promise<
  PaginatedResponse<EducationalUnitResponse>
> => {
  const response = await axiosInstance.get<
    ApiResponse<PaginatedResponse<EducationalUnitResponse>>
  >(`${PREFIX}/get-all`);

  return response.data.result;
};

export const approveEducationalUnit = async (unitId: number): Promise<void> => {
  const formData = new FormData();
  await axiosInstance.put(`${PREFIX}/approve/${unitId}`, formData);
};

export const reverifyEducationalUnitSignature = async (
  unitId: number
): Promise<void> => {
  await axiosInstance.put(`${PREFIX}/reverify-signature/${unitId}`);
};

export const rejectEducationalUnit = async (
  unitId: number,
  reason: string
): Promise<void> => {
  const formData = new FormData();
  formData.append("reason", reason);

  await axiosInstance.put(`${PREFIX}/reject/${unitId}`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
};

export const sendFeedbackToEducationalUnit = async (
  unitId: number,
  feedback: string
): Promise<void> => {
  const formData = new FormData();
  formData.append("feedback", feedback);

  await axiosInstance.post(`${PREFIX}/send-feedback/${unitId}`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
};

export const changeEducationalUnitStatus = async (
  unitId: number,
  status: "suspend" | "reactive",
  reason: string,
  unitName: string,
  representativeEmail: string
): Promise<void> => {
  const backendStatus = status === "suspend" ? "SUSPENDED" : "REACTIVATE";
  await axiosInstance.put(`${PREFIX}/update-status/${unitId}`, {
    status: backendStatus,
    reason,
    unitId,
    unitName,
    representativeEmail,
  });
};

const updateEducationalUnitStatus = async (
  unitId: number,
  status: string,
  reason: string,
  unitName: string,
  representativeEmail: string
): Promise<string> => {
  const response = await axiosInstance.put<ApiResponse<void>>(
    `${PREFIX}/update-status/${unitId}`,
    {
      status,
      reason,
      unitId,
      unitName,
      representativeEmail,
    }
  );

  return response.data.message;
};

export default {
  getAllEducationalUnits,
  approveEducationalUnit,
  reverifyEducationalUnitSignature,
  rejectEducationalUnit,
  sendFeedbackToEducationalUnit,
  changeEducationalUnitStatus,
  updateEducationalUnitStatus,
};
