// Navigation components
export { default as Breadcrumb } from "./Breadcrumb";
export { default as SmartBreadcrumb } from "./SmartBreadcrumb";

// Re-export types for convenience
export type {
  BreadcrumbItem,
  BreadcrumbConfig,
  RouteConfig,
  NavigationContext,
} from "@/types/navigation.types";

// Re-export utilities
export {
  generateBreadcrumbs,
  createCustomBreadcrumbs,
  getRouteConfig,
  shouldShowInBreadcrumb,
  getParentRoute,
  getStudentProfileEditBreadcrumbs,
  BREADCRUMB_PRESETS,
  ROUTE_CONFIG,
  BREADCRUMB_ICONS,
} from "@/utils/breadcrumbUtils";
