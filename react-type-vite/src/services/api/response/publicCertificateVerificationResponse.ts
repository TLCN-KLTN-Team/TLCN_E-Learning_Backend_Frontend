import type { CertificateResponse } from "./certificateResponse";

export interface PublicCertificateVerificationResponse {
  found: boolean;
  certificate: CertificateResponse | null;

  onChainChecked: boolean;
  onChainValid: boolean | null;
  dataMatched: boolean | null;

  onChainUserId: string | null;
  onChainPublishedCourseId: number | null;
  onChainIssueDate: string | null;

  message: string;
}
