// Export all types
export type { User, AuthContextType, RegisterData } from "./types";
export type { Theme, ThemeContextType } from "./context";

// Export contexts
export { AuthContext, ThemeContext } from "./context";

// Export hooks
export { useAuth } from "./useAuth";
export { useTheme } from "./useTheme";

// Export provider components
export { ThemeProvider } from "./ThemeProvider";
