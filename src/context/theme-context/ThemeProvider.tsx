import React, { createContext, useEffect, useState } from "react";

export type Theme = "light" | "dark" | "system";

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  resolvedTheme: "light" | "dark"; // The actual theme being used
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export { ThemeContext };

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: Theme;
}

export function ThemeProvider({
  children,
  defaultTheme = "system",
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(() => {
    // Check localStorage first
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("theme") as Theme;
      if (stored && ["light", "dark", "system"].includes(stored)) {
        return stored;
      }
    }
    return defaultTheme;
  });

  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">("light");

  // Function to get the actual theme based on system preference
  const getResolvedTheme = (currentTheme: Theme): "light" | "dark" => {
    if (currentTheme === "system") {
      return window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
    }
    return currentTheme;
  };

  // Apply theme to DOM
  const applyTheme = (resolvedTheme: "light" | "dark") => {
    const root = document.documentElement;

    // Remove existing theme classes
    root.classList.remove("light", "dark");

    // Add new theme class
    root.classList.add(resolvedTheme);

    // Update data-bs-theme for Bootstrap compatibility
    root.setAttribute("data-bs-theme", resolvedTheme);

    // Update meta theme-color for mobile browsers
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      const themeColor = resolvedTheme === "dark" ? "#212529" : "#ffffff";
      metaThemeColor.setAttribute("content", themeColor);
    }
  };

  // Handle theme changes
  useEffect(() => {
    const newResolvedTheme = getResolvedTheme(theme);
    setResolvedTheme(newResolvedTheme);
    applyTheme(newResolvedTheme);

    // Save to localStorage
    localStorage.setItem("theme", theme);
  }, [theme]);

  // Listen for system theme changes when theme is 'system'
  useEffect(() => {
    if (theme !== "system") return;

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const handleSystemThemeChange = (e: MediaQueryListEvent) => {
      const newResolvedTheme = e.matches ? "dark" : "light";
      setResolvedTheme(newResolvedTheme);
      applyTheme(newResolvedTheme);
    };

    mediaQuery.addEventListener("change", handleSystemThemeChange);

    return () => {
      mediaQuery.removeEventListener("change", handleSystemThemeChange);
    };
  }, [theme]);

  // Initialize theme on mount (run once)
  useEffect(() => {
    const initialResolvedTheme = getResolvedTheme(theme);
    setResolvedTheme(initialResolvedTheme);
    applyTheme(initialResolvedTheme);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run on mount

  const value: ThemeContextType = {
    theme,
    setTheme,
    resolvedTheme,
  };

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}
