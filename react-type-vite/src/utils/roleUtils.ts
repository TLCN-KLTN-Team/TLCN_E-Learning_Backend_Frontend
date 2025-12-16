import { getAuthInfo } from "./auth.utils";

/**
 * Lấy đường dẫn redirect dựa trên role từ JWT token
 * @param role - Role từ JWT (SUPER_ADMIN, ADMIN, TEACHER, STUDENT, USER)
 * @returns Đường dẫn tương ứng với role
 */
export const getRoleBasedRedirectPath = (role: string): string => {
  // Ưu tiên role theo thứ tự từ cao xuống thấp
  const roleRedirectMap: Record<string, string> = {
    SUPER_ADMIN: "/system-admin",
    ADMIN: "/admin",
    TEACHER: "/teacher/home",
    STUDENT: "/",
    USER: "/",
  };

  return roleRedirectMap[role] || "/login";
};

/**
 * Kiểm tra user có role cụ thể không
 * @param requiredRole - Role cần kiểm tra
 * @returns true nếu user có role đó
 */
export const hasRole = (requiredRole: string): boolean => {
  const auth = getAuthInfo();
  if (!auth) return false;
  return auth.role === requiredRole;
};

/**
 * Kiểm tra user có bất kỳ role nào trong danh sách không
 * @param requiredRoles - Danh sách role cần kiểm tra
 * @returns true nếu user có ít nhất 1 role
 */
export const hasAnyRole = (requiredRoles: string[]): boolean => {
  const auth = getAuthInfo();
  if (!auth) return false;
  return requiredRoles.includes(auth.role);
};

export const canAccessSystemAdmin = (role: string): boolean => {
  return role === "SUPER_ADMIN";
};

export const canAccessAdmin = (role: string): boolean => {
  return role === "SUPER_ADMIN" || role === "ADMIN";
};

export const canAccessTeacher = (role: string): boolean => {
  return role === "SUPER_ADMIN" || role === "TEACHER";
};

export const canAccessStudent = (role: string): boolean => {
  return (
    role === "SUPER_ADMIN" ||
    role === "ADMIN" ||
    role === "STUDENT" ||
    role === "USER"
  );
};

export const canAccessUser = (role: string): boolean => {
  return (
    role === "SUPER_ADMIN" ||
    role === "ADMIN" ||
    role === "TEACHER" ||
    role === "STUDENT" ||
    role === "USER"
  );
};
