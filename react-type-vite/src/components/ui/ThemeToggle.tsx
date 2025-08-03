import React from "react";
import { Sun, Moon, Monitor, ChevronDown } from "lucide-react";
import { useTheme } from "../../context/theme-context";
import type { Theme } from "../../context/theme-context";

interface ThemeToggleProps {
  className?: string;
  showLabel?: boolean;
}

export function ThemeToggle({
  className = "",
  showLabel = false,
}: ThemeToggleProps) {
  const { theme, setTheme } = useTheme();
  const [isOpen, setIsOpen] = React.useState(false);

  const themes: Array<{
    value: Theme;
    label: string;
    icon: React.ReactNode;
    color: string;
  }> = [
    {
      value: "light",
      label: "Light",
      icon: <Sun className="w-4 h-4" />,
      color: "text-amber-500",
    },
    {
      value: "dark",
      label: "Dark",
      icon: <Moon className="w-4 h-4" />,
      color: "text-blue-400",
    },
    {
      value: "system",
      label: "System",
      icon: <Monitor className="w-4 h-4" />,
      color: "text-white",
    },
  ];

  const currentTheme = themes.find((t) => t.value === theme) || themes[0];

  // Chỉ có dropdown, không có toggle tự động
  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="
          inline-flex items-center justify-center gap-2
          p-2 rounded-lg transition-all duration-200
          text-muted-foreground hover:text-foreground
          hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring
        "
        title="Change theme"
      >
        <div className={currentTheme.color}>{currentTheme.icon}</div>
        {showLabel && (
          <span className="text-sm font-medium">{currentTheme.label}</span>
        )}
        <ChevronDown className="w-3 h-3" />
      </button>

      {isOpen && (
        <div
          className="
          absolute right-0 mt-2 py-1 w-36
          bg-gray-500 text-white border rounded-lg shadow-lg
          z-[9999]
        "
          style={{ zIndex: 9999 }}
        >
          {themes.map((themeOption) => (
            <button
              key={themeOption.value}
              onClick={() => {
                setTheme(themeOption.value);
                setIsOpen(false);
              }}
              className={`
                w-full flex items-center px-3 py-2 text-sm gap-3
                hover:bg-muted transition-colors duration-150
                ${
                  theme === themeOption.value
                    ? "text-foreground bg-muted"
                    : "text-muted-foreground"
                }
              `}
            >
              <div className={themeOption.color}>{themeOption.icon}</div>
              {themeOption.label}
              {theme === themeOption.value && (
                <div className="w-2 h-2 rounded-full bg-primary ml-auto" />
              )}
            </button>
          ))}
        </div>
      )}

      {/* Backdrop to close dropdown */}
      {isOpen && (
        <div
          className="fixed inset-0 z-[9998]"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}
