import type { ReactNode } from "react";
import {
  HomeIcon,
  UserIcon,
  AcademicCapIcon,
  CogIcon,
  DocumentTextIcon,
  ChartBarIcon,
  UsersIcon,
} from "@heroicons/react/24/outline";

import Breadcrumb from "./Breadcrumb";
import { generateBreadcrumbs, ROUTE_CONFIG } from "@/utils/breadcrumbUtils";
import type { BreadcrumbItem } from "@/types/navigation.types";

interface SmartBreadcrumbProps {
  /** Current route path */
  currentPath: string;
  /** Custom breadcrumb items (overrides auto-generation) */
  customItems?: BreadcrumbItem[];
  /** Custom labels for specific paths */
  customLabels?: Record<string, string>;
  /** Maximum number of items to show */
  maxItems?: number;
  /** Whether to show home icon */
  showHomeIcon?: boolean;
  /** Custom home path */
  homePath?: string;
  /** Additional CSS classes */
  className?: string;
}

// Icon mapping
const ICON_MAP: Record<string, ReactNode> = {
  HomeIcon: <HomeIcon className="h-4 w-4" />,
  UserIcon: <UserIcon className="h-4 w-4" />,
  AcademicCapIcon: <AcademicCapIcon className="h-4 w-4" />,
  CogIcon: <CogIcon className="h-4 w-4" />,
  DocumentTextIcon: <DocumentTextIcon className="h-4 w-4" />,
  ChartBarIcon: <ChartBarIcon className="h-4 w-4" />,
  UsersIcon: <UsersIcon className="h-4 w-4" />,
};

// Get icon for a specific path
const getIconForPath = (path: string): ReactNode => {
  const config = ROUTE_CONFIG[path];
  if (!config) return null;

  // Map path to appropriate icon
  if (path === "/") return ICON_MAP.HomeIcon;
  if (path.includes("/profile")) return ICON_MAP.UserIcon;
  if (path.includes("/courses")) return ICON_MAP.AcademicCapIcon;
  if (path.includes("/settings")) return ICON_MAP.CogIcon;
  if (path.includes("/edit")) return ICON_MAP.DocumentTextIcon;
  if (path.includes("/dashboard")) return ICON_MAP.ChartBarIcon;
  if (path.includes("/users")) return ICON_MAP.UsersIcon;

  return null;
};

const SmartBreadcrumb = ({
  currentPath,
  customItems,
  customLabels,
  maxItems = 4,
  showHomeIcon = true,
  homePath = "/",
  className = "",
}: SmartBreadcrumbProps) => {
  // Use custom items if provided, otherwise generate from path
  const breadcrumbItems =
    customItems || generateBreadcrumbs(currentPath, customLabels);

  // Add icons to generated items
  const itemsWithIcons = breadcrumbItems.map((item) => ({
    ...item,
    icon: item.icon || getIconForPath(item.href || item.id),
  }));

  return (
    <Breadcrumb
      items={itemsWithIcons}
      maxItems={maxItems}
      showHomeIcon={showHomeIcon}
      homePath={homePath}
      className={className}
    />
  );
};

export default SmartBreadcrumb;
