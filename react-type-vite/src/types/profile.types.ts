// Profile related types
export interface ProfileFormData {
  fullName: string;
  bio: string;
  interests: string[];
}

export interface ProfileHeaderData {
  name: string;
  jobTitle: string;
  location?: string;
  company?: string;
  avatar?: string;
}

// Password change types
export interface ChangePasswordData {
  oldPassword: string;
  newPassword: string;
  confirmPassword: string;
}

// Payment history types
export interface PaymentHistoryItem {
  id: string;
  courseName: string;
  amount: number;
  date: string;
  status: "completed" | "failed" | "pending";
  paymentMethod: string;
}

export type PaymentStatus = "completed" | "failed" | "pending";
