import axiosInstance from "../httpClient/axiosInstance";

const PREFIX = "/course-management/system-admin/education-unit-management";

export const approveEducationalUnit = async (unitId: string): Promise<void> => {
  const formData = new FormData();
  formData.append("unitId", unitId);
  await axiosInstance.put(`${PREFIX}/approve`, formData);
};

export const sendFeedbackToEducationalUnit = async (
  unitId: string,
  feedback: string
): Promise<void> => {
  const formData = new FormData();
  formData.append("unitId", unitId);
  formData.append("feedback", feedback);

  await axiosInstance.post(`${PREFIX}/send-feedback`, formData);
};
