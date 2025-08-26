// Utility functions for role-based routing
export const getRoleBasedRedirectPath = (roles: string[]): string => {
  // Ưu tiên role theo thứ tự từ cao xuống thấp
  if (roles.includes("SUPERADMIN")) {
    return "/system-admin";
  }

  if (roles.includes("ADMIN")) {
    return "/admin";
  }

  if (roles.includes("TEACHER")) {
    return "/teacher/home";
  }

  // STUDENT hoặc USER vào trang chính
  if (roles.includes("STUDENT") || roles.includes("USER")) {
    return "/";
  }

  // Mặc định về trang chính nếu không có role phù hợp
  return "/";
};

export const hasRole = (userRoles: string[], requiredRole: string): boolean => {
  return userRoles.includes(requiredRole);
};

export const hasAnyRole = (
  userRoles: string[],
  requiredRoles: string[]
): boolean => {
  return requiredRoles.some((role) => userRoles.includes(role));
};

export const canAccessSystemAdmin = (userRoles: string[]): boolean => {
  return userRoles.includes("SUPERADMIN");
};

export const canAccessAdmin = (userRoles: string[]): boolean => {
  return userRoles.includes("SUPERADMIN") || userRoles.includes("ADMIN");
};

export const canAccessTeacher = (userRoles: string[]): boolean => {
  return userRoles.includes("SUPERADMIN") || userRoles.includes("TEACHER");
};

export const canAccessStudent = (userRoles: string[]): boolean => {
  return (
    userRoles.includes("SUPERADMIN") ||
    userRoles.includes("ADMIN") ||
    userRoles.includes("STUDENT") ||
    userRoles.includes("USER")
  );
};

export const canAccessUser = (userRoles: string[]): boolean => {
  return (
    userRoles.includes("SUPERADMIN") ||
    userRoles.includes("ADMIN") ||
    userRoles.includes("TEACHER") ||
    userRoles.includes("STUDENT") ||
    userRoles.includes("USER")
  );
};
