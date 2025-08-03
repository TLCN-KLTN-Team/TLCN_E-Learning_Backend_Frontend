import { createContext } from "react";
import type { AuthContextType } from "./types";

// Theme types
export type Theme = "light" | "dark" | "system";

export interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  resolvedTheme: "light" | "dark";
}

// Create contexts with proper typing
export const AuthContext = createContext<AuthContextType | undefined>(
  undefined
);

export const ThemeContext = createContext<ThemeContextType | undefined>(
  undefined
);
