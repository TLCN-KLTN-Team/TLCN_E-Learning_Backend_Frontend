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
  description: string
  establishedYear: number
  status: string
  createdAt: Date
  adminAccountId?: string
}