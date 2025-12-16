import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { AuthContext } from "./context";
import type { AuthContextType, User, RegisterData } from "./types";

import { doSocialLogin, getMe } from "../../services/api/authApi";
import { doLogin, doRegister } from "../../services/api/authApi";
import { getAccessToken, getRefreshToken } from "@/utils/localStorageVariables";

// Define Provider props type
interface AuthProviderProps {
  children: ReactNode;
}

export default function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const isAuthenticated = !!user;

  useEffect(() => {
    const token = getAccessToken();

    if (token) {
      // Kiểm tra token có hết hạn không (expiryTime là timestamp)
      const fetchUser = async () => {
        setIsLoading(true);
        try {
          const fetchedUser = await getMe();
          setUser(fetchedUser);
        } catch (error) {
          // Nếu fetch user thất bại, clear localStorage
          console.error("Failed to fetch user data:", error);
          localStorage.removeItem("accessToken");
          localStorage.removeItem("refreshToken");
          setUser(null);
        } finally {
          setIsLoading(false);
        }
      };

      fetchUser();
    } else {
      // Token đã hết hạn, clear localStorage
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      setUser(null);
    }
  }, []);

  const login = async (email: string, password: string): Promise<void> => {
    setIsLoading(true);
    try {
      await doLogin(email, password);
      setUser(await getMe());
    } catch (error) {
      console.error("Login failed:", error);
      throw error; // Re-throw để component có thể handle
    } finally {
      setIsLoading(false);
    }
  };

  const socialLogin = async (code: string, provider: string): Promise<void> => {
    await doSocialLogin(code, provider);
    const userData = await getMe();
    setUser(userData);
  };

  const logout = (): void => {
    // Clear tất cả dữ liệu authentication
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("expiryTime");
    localStorage.removeItem("refreshExpiryTime");
    sessionStorage.clear(); // Xóa cả sessionStorage để reset first login flag
    setUser(null);
  };

  const register = async (userData: RegisterData): Promise<string> => {
    setIsLoading(true);
    try {
      const email: string = await doRegister(userData);
      return email;
    } catch (error) {
      console.error("Registration failed:", error);
      throw error; // Re-throw để component có thể handle
    } finally {
      setIsLoading(false);
    }
  };

  const refreshUser = async (): Promise<void> => {
    const token = getAccessToken();

    if (token) {
      setIsLoading(true);
      try {
        const fetchedUser = await getMe();
        setUser(fetchedUser);
      } catch (error) {
        console.error("Failed to refresh user data:", error);
        // Clear tất cả dữ liệu authentication
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("expiryTime");
        localStorage.removeItem("refreshExpiryTime");
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const checkAuth = (): boolean => {
    const refreshToken = getRefreshToken();
    if (!refreshToken) return false;

    return true; // Nếu có refreshToken, coi như đã xác thực
  };

  const value: AuthContextType = {
    user,
    isAuthenticated,
    isLoading,
    login,
    socialLogin,
    logout,
    register,
    refreshUser,
    checkAuth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
