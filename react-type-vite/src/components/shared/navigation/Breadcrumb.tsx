import { useMemo } from "react";
import { ChevronRightIcon, HomeIcon } from "@heroicons/react/24/outline";
import { Link } from "react-router-dom";
import { useTheme } from "@/context/theme-context/useTheme";
import type {
  BreadcrumbConfig,
  BreadcrumbItem,
} from "@/types/navigation.types";

interface BreadcrumbProps extends Partial<BreadcrumbConfig> {
  /** Array of breadcrumb items */
  items: BreadcrumbItem[];
}

const Breadcrumb = ({
  items,
  separator,
  maxItems = 4,
  showHomeIcon = true,
  homePath = "/",
  className = "",
}: BreadcrumbProps) => {
  const { resolvedTheme } = useTheme();

  // Handle breadcrumb truncation for long paths
  const displayItems = useMemo(() => {
    if (items.length <= maxItems) {
      return items;
    }

    const firstItem = items[0];
    const lastItems = items.slice(-2); // Keep last 2 items
    const truncatedItems = [
      firstItem,
      {
        id: "truncated",
        label: "...",
        isClickable: false,
      },
      ...lastItems,
    ];

    return truncatedItems;
  }, [items, maxItems]);

  const defaultSeparator = separator || (
    <ChevronRightIcon className="h-4 w-4 text-gray-400" />
  );

  const baseClasses = `
    flex items-center space-x-1 text-sm font-medium
    ${resolvedTheme === "dark" ? "text-gray-300" : "text-gray-600"}
    ${className}
  `.trim();

  return (
    <nav aria-label="Breadcrumb" className={baseClasses}>
      <ol className="flex items-center space-x-1">
        {/* Home Icon */}
        {showHomeIcon && (
          <li>
            <Link
              to={homePath}
              className={`
                inline-flex items-center p-1.5 rounded-md transition-colors duration-200
                ${
                  resolvedTheme === "dark"
                    ? "text-gray-400 hover:text-blue-400 hover:bg-slate-800"
                    : "text-gray-500 hover:text-blue-600 hover:bg-gray-100"
                }
              `.trim()}
              aria-label="Go to home"
            >
              <HomeIcon className="h-4 w-4" />
            </Link>
          </li>
        )}

        {/* Breadcrumb Items */}
        {displayItems.map((item, index) => {
          const isLast = index === displayItems.length - 1;
          const isClickable =
            item.isClickable !== false && item.href && !isLast;

          return (
            <li key={item.id} className="flex items-center">
              {/* Separator */}
              {(index > 0 || showHomeIcon) && (
                <span className="mx-2">{defaultSeparator}</span>
              )}

              {/* Breadcrumb Item */}
              <div className="flex items-center">
                {isClickable ? (
                  <Link
                    to={item.href!}
                    className={`
                      inline-flex items-center px-2 py-1 rounded-md transition-colors duration-200
                      ${
                        resolvedTheme === "dark"
                          ? "text-gray-300 hover:text-blue-400 hover:bg-slate-800"
                          : "text-gray-600 hover:text-blue-600 hover:bg-gray-100"
                      }
                    `.trim()}
                  >
                    {item.icon && (
                      <span className="mr-1.5 flex-shrink-0">{item.icon}</span>
                    )}
                    <span className="truncate max-w-xs">{item.label}</span>
                  </Link>
                ) : (
                  <span
                    className={`
                      inline-flex items-center px-2 py-1 rounded-md
                      ${
                        isLast
                          ? resolvedTheme === "dark"
                            ? "text-blue-400 bg-blue-900/20"
                            : "text-blue-600 bg-blue-50"
                          : resolvedTheme === "dark"
                          ? "text-gray-400"
                          : "text-gray-500"
                      }
                    `.trim()}
                    aria-current={isLast ? "page" : undefined}
                  >
                    {item.icon && (
                      <span className="mr-1.5 flex-shrink-0">{item.icon}</span>
                    )}
                    <span className="truncate max-w-xs">{item.label}</span>
                  </span>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

export default Breadcrumb;
