export interface EducationUnitRegistrationResponse {
  id: string
  name: string
  type: string
  address: string
  phone: string
  email: string
  website?: string
  logo?: string
  businessLicense?: string
  businessLicenseOriginal?: string
  businessLicenseSigned?: string
  businessLicenseOriginalHash?: string
  businessLicenseSignedHash?: string
  signatureStatus?: string
  signatureErrorCode?: string
  signatureErrorReason?: string
  signatureWarning?: string
  signatureRevocationStatus?: string
  signatureVerifiedAt?: Date
  certificateExpiryDate?: Date
  description: string
  establishedYear: number
  status: string
  createdAt: Date
  adminAccountId?: string
}