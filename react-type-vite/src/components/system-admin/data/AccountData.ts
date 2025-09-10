import type { UserResponse } from "@/services/api/response/userResponse";
import { Shield, User, GraduationCap, UserStar } from "lucide-react";

// Role Configuration
export const ROLE_CONFIG = {
  SYSTEM_ADMIN: {
    label: "Quản trị hệ thống",
    color: "bg-red-100 text-red-800",
    icon: Shield,
  },
  ADMIN: {
    label: "Quản lý đơn vị",
    color: "bg-purple-100 text-purple-800",
    icon: UserStar,
  },
  TEACHER: {
    label: "Giảng viên",
    color: "bg-blue-100 text-blue-800",
    icon: GraduationCap,
  },
  STUDENT: {
    label: "Học viên",
    color: "bg-green-100 text-green-800",
    icon: User,
  },
} as const;

// Filter Options
export const ROLE_FILTER_OPTIONS = [
  { value: "USER", label: "Tất cả vai trò" },
  { value: "SYSTEM_ADMIN", label: "Quản trị hệ thống" },
  { value: "ADMIN", label: "Quản lý đơn vị" },
  { value: "TEACHER", label: "Giảng viên" },
  { value: "STUDENT", label: "Sinh viên" },
];

// Status Configuration
export const STATUS_CONFIG = {
  ACTIVE: {
    label: "Hoạt động",
    color: "bg-green-100 text-green-800",
  },
  INACTIVE: {
    label: "Tạm khóa",
    color: "bg-red-100 text-red-800",
  },
  PENDING: {
    label: "Chờ duyệt",
    color: "bg-yellow-100 text-yellow-800",
  },
} as const;

// Table Headers
export const TABLE_HEADERS = [
  "Thông tin tài khoản",
  "Vai trò",
  "Ngày sinh",
  "Trạng thái",
  "Thao tác",
];

// CSS Classes
export const CSS_CLASSES = {
  headerStyles:
    "px-6 py-3 text-left text-sm font-bold text-gray-900 uppercase tracking-wider",
  tableRow: "hover:bg-gray-50",
  cell: "px-6 py-4 whitespace-nowrap",
  avatar: "h-10 w-10 rounded-full object-cover",
  avatarFallback:
    "h-10 w-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center",
  roleBadge:
    "inline-flex items-start gap-1 px-2 py-1 text-xs font-semibold rounded-full",
  button: "flex items-center gap-1",
};

// Utility Functions
export const getUserFullName = (user: UserResponse): string => {
  return (
    `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.username
  );
};

export const getInitials = (user: UserResponse): string => {
  if (user.firstName && user.lastName) {
    return `${user.firstName.charAt(0)}${user.lastName.charAt(
      0
    )}`.toUpperCase();
  }
  return user.username.charAt(0).toUpperCase();
};

export const getRoleName = (roles: string[]): string => {
  const primaryRole = roles[0] || "STUDENT";
  return (
    ROLE_CONFIG[primaryRole as keyof typeof ROLE_CONFIG]?.label || primaryRole
  );
};

export const getRoleIcon = (roles: string[]) => {
  const primaryRole = roles[0] || "STUDENT";
  const IconComponent =
    ROLE_CONFIG[primaryRole as keyof typeof ROLE_CONFIG]?.icon || User;
  return IconComponent;
};

export const getRoleColor = (roles: string[]): string => {
  const primaryRole = roles[0] || "STUDENT";
  return (
    ROLE_CONFIG[primaryRole as keyof typeof ROLE_CONFIG]?.color ||
    "bg-gray-100 text-gray-800"
  );
};

export const formatDate = (dateString: string): string => {
  return dateString
    ? new Date(dateString).toLocaleDateString("vi-VN")
    : "Chưa cập nhật";
};

export const filterAccountsByRole = (
  accounts: UserResponse[],
  selectedRole: string
): UserResponse[] => {
  return selectedRole === "USER"
    ? accounts
    : accounts.filter((account) => account.roles.includes(selectedRole));
};
