import type { ReactNode } from "react";
import type { BreadcrumbItem, RouteConfig } from "@/types/navigation.types";

// Icons constants - will be used by components that import these utils
export const BREADCRUMB_ICONS = {
  HOME: "HomeIcon",
  USER: "UserIcon",
  ACADEMIC: "AcademicCapIcon",
  COG: "CogIcon",
  DOCUMENT: "DocumentTextIcon",
  CHART: "ChartBarIcon",
  USERS: "UsersIcon",
} as const;

// Route configuration with breadcrumb metadata
export const ROUTE_CONFIG: Record<string, RouteConfig> = {
  // User routes
  "/": {
    path: "/",
    label: "Trang chủ",
    showInBreadcrumb: false,
  },
  "/edit profile": {
    path: "edit-profile",
    label: "Chỉnh sửa hồ sơ",
    parent: "/",
    showInBreadcrumb: true,
  },

  // Student routes
  "/student": {
    path: "/student",
    label: "Student Dashboard",
    parent: "/",
    showInBreadcrumb: true,
  },
  "/student/dashboard": {
    path: "/student/dashboard",
    label: "Dashboard",
    parent: "/student",
    showInBreadcrumb: true,
  },
  "/student/profile": {
    path: "/student/profile",
    label: "Hồ sơ cá nhân",
    parent: "/student",
    showInBreadcrumb: true,
  },
  "/student/profile/edit": {
    path: "/student/profile/edit",
    label: "Chỉnh sửa hồ sơ",
    parent: "/student/profile",
    showInBreadcrumb: true,
  },
  "/student/courses": {
    path: "/student/courses",
    label: "Khóa học của tôi",
    parent: "/student",
    showInBreadcrumb: true,
  },
  "/student/settings": {
    path: "/student/settings",
    label: "Cài đặt",
    parent: "/student",
    showInBreadcrumb: true,
  },

  // Teacher routes
  "/teacher": {
    path: "/teacher",
    label: "Teacher Dashboard",
    parent: "/",
    showInBreadcrumb: true,
  },
  "/teacher/courses": {
    path: "/teacher/courses",
    label: "Quản lý khóa học",
    parent: "/teacher",
    showInBreadcrumb: true,
  },

  // Admin routes
  "/admin": {
    path: "/admin",
    label: "Admin Dashboard",
    parent: "/",
    showInBreadcrumb: true,
  },
  "/admin/users": {
    path: "/admin/users",
    label: "Quản lý người dùng",
    parent: "/admin",
    showInBreadcrumb: true,
  },
};

/**
 * Generate breadcrumb items from current path
 */
export const generateBreadcrumbs = (
  currentPath: string,
  customLabels?: Record<string, string>
): BreadcrumbItem[] => {
  const breadcrumbs: BreadcrumbItem[] = [];

  // Build breadcrumb chain by traversing parent routes
  const buildBreadcrumbChain = (path: string): void => {
    const config = ROUTE_CONFIG[path];

    if (!config) {
      // Fallback for unknown routes
      const segments = path.split("/").filter(Boolean);
      const label = segments[segments.length - 1] || "Unknown";
      breadcrumbs.unshift({
        id: path,
        label: customLabels?.[path] || label,
        href: path,
        isActive: path === currentPath,
      });
      return;
    }

    // Add current route to breadcrumb
    if (config.showInBreadcrumb !== false) {
      breadcrumbs.unshift({
        id: config.path,
        label: customLabels?.[config.path] || config.label,
        href: config.path,
        icon: config.icon,
        isActive: config.path === currentPath,
      });
    }

    // Recursively build parent breadcrumbs
    if (config.parent && config.parent !== "/") {
      buildBreadcrumbChain(config.parent);
    }
  };

  buildBreadcrumbChain(currentPath);

  return breadcrumbs;
};

/**
 * Generate breadcrumb items with custom configuration
 */
export const createCustomBreadcrumbs = (
  items: Array<{
    label: string;
    href?: string;
    icon?: ReactNode;
    isActive?: boolean;
  }>
): BreadcrumbItem[] => {
  return items.map((item, index) => ({
    id: `custom-${index}`,
    label: item.label,
    href: item.href,
    icon: item.icon,
    isActive: item.isActive,
    isClickable: !!item.href,
  }));
};

/**
 * Get route configuration for a specific path
 */
export const getRouteConfig = (path: string): RouteConfig | undefined => {
  return ROUTE_CONFIG[path];
};

/**
 * Check if a route should be shown in breadcrumb
 */
export const shouldShowInBreadcrumb = (path: string): boolean => {
  const config = ROUTE_CONFIG[path];
  return config?.showInBreadcrumb !== false;
};

/**
 * Get parent route path
 */
export const getParentRoute = (path: string): string | undefined => {
  const config = ROUTE_CONFIG[path];
  return config?.parent;
};

/**
 * Generate breadcrumbs for student profile edit page
 */
export const getStudentProfileEditBreadcrumbs = (): BreadcrumbItem[] => {
  return generateBreadcrumbs("/student/profile/edit");
};

/**
 * Common breadcrumb presets for frequently used pages
 */
export const BREADCRUMB_PRESETS = {
  STUDENT_DASHBOARD: () => generateBreadcrumbs("/student/dashboard"),
  STUDENT_PROFILE: () => generateBreadcrumbs("/student/profile"),
  STUDENT_PROFILE_EDIT: () => generateBreadcrumbs("/student/profile/edit"),
  STUDENT_COURSES: () => generateBreadcrumbs("/student/courses"),
  STUDENT_SETTINGS: () => generateBreadcrumbs("/student/settings"),

  TEACHER_DASHBOARD: () => generateBreadcrumbs("/teacher/dashboard"),
  TEACHER_COURSES: () => generateBreadcrumbs("/teacher/courses"),

  ADMIN_DASHBOARD: () => generateBreadcrumbs("/admin/dashboard"),
  ADMIN_USERS: () => generateBreadcrumbs("/admin/users"),
} as const;
