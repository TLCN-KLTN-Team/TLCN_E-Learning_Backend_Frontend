import type { ApiResponse } from "../response/apiResponse";
import type { PublicCertificateVerificationResponse } from "../response/publicCertificateVerificationResponse";
import publicAxiosInstance from "../httpClient/publicAxiosInstance";

const CERTIFICATE_PUBLIC_ENDPOINT = "/course-management/anonymous/certificates";

export const verifyPublicCertificate = async (
  code: string
): Promise<PublicCertificateVerificationResponse> => {
  const response = await publicAxiosInstance.get<
    ApiResponse<PublicCertificateVerificationResponse>
  >(`${CERTIFICATE_PUBLIC_ENDPOINT}/verify/${encodeURIComponent(code)}`);
  return response.data.result;
};
