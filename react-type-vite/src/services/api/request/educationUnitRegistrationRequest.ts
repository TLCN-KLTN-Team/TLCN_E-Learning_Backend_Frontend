export interface EducationUnitRegistrationRequest {
  // Education unit information
  name: string
  type: string
  address: string
  phone: string
  email: string
  website?: string
  description: string
  establishedYear: number

  // Admin account information
  adminName: string
  adminPassword: string
  adminConfirmPassword: string // Add this field to match backend

  // Representative information
  representativeName: string
  representativePosition: string
  representativePhone: string
  representativeEmail: string
}
