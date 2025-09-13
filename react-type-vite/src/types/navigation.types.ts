import type { ReactNode } from "react";

export interface BreadcrumbItem {
  /** Unique identifier for the breadcrumb item */
  id: string;
  /** Display text for the breadcrumb */
  label: string;
  /** Navigation path for the breadcrumb */
  href?: string;
  /** Icon to display before the label */
  icon?: ReactNode;
  /** Whether this is the current/active item */
  isActive?: boolean;
  /** Whether the item is clickable */
  isClickable?: boolean;
}

export interface BreadcrumbConfig {
  /** Array of breadcrumb items */
  items: BreadcrumbItem[];
  /** Custom separator between items */
  separator?: ReactNode;
  /** Maximum number of items to show before truncating */
  maxItems?: number;
  /** Whether to show home icon at the beginning */
  showHomeIcon?: boolean;
  /** Custom home path */
  homePath?: string;
  /** Additional CSS classes */
  className?: string;
}

export interface RouteConfig {
  /** Route path pattern */
  path: string;
  /** Breadcrumb label for this route */
  label: string;
  /** Parent route path */
  parent?: string;
  /** Icon for this route */
  icon?: ReactNode;
  /** Whether this route should be included in breadcrumbs */
  showInBreadcrumb?: boolean;
}

export interface NavigationContext {
  /** Current route path */
  currentPath: string;
  /** Route configuration map */
  routes: Record<string, RouteConfig>;
  /** Custom breadcrumb overrides */
  customBreadcrumbs?: BreadcrumbItem[];
}

// Route constants for the application
export const ROUTES = {
  HOME: "/",
  USER: {
    ROOT: "/",
    EDIT_PROFILE: "/profile/edit",
  },
  STUDENT: {
    ROOT: "/student",
    DASHBOARD: "/student/dashboard",
    PROFILE: "/student/profile",
    EDIT_PROFILE: "/student/profile/edit",
    COURSES: "/student/courses",
    COURSE_DETAIL: "/student/courses/:id",
    SETTINGS: "/student/settings",
  },
  TEACHER: {
    ROOT: "/teacher",
    DASHBOARD: "/teacher/dashboard",
    COURSES: "/teacher/courses",
  },
  ADMIN: {
    ROOT: "/admin",
    DASHBOARD: "/admin/dashboard",
    USERS: "/admin/users",
  },
} as const;

// Type for route paths
export type RoutePath = (typeof ROUTES)[keyof typeof ROUTES] | string;
