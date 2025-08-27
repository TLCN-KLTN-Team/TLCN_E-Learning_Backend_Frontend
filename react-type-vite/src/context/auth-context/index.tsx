import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { AuthContext } from "./context";
import type { AuthContextType, User, RegisterData } from "./types";

import { getMe } from "../../services/api/authApi";
import { doLogin, doRegister } from "../../services/api/authApi";
import { getAccessToken, getExpiryTime } from "@/utils/localStorageVariables";

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
    const tokenExpiry = getExpiryTime();

    if (token && tokenExpiry) {
      // Kiểm tra token có hết hạn không (expiryTime là timestamp)
      if (Date.now() < tokenExpiry) {
        const fetchUser = async () => {
          setIsLoading(true);
          try {
            const fetchedUser = await getMe();
            setUser(fetchedUser);
          } catch (error) {
            // Nếu fetch user thất bại, clear localStorage
            console.error("Failed to fetch user data:", error);
            localStorage.clear();
            setUser(null);
          } finally {
            setIsLoading(false);
          }
        };

        fetchUser();
      } else {
        // Token đã hết hạn, clear localStorage
        localStorage.clear();
      }
    }
  }, []);

  const login = async (email: string, password: string): Promise<void> => {
    setIsLoading(true);
    try {
      await doLogin(email, password);

      // Fetch user data after successful login
      const userData = await getMe();
      setUser(userData);
    } catch (error) {
      console.error("Login failed:", error);
      throw error; // Re-throw để component có thể handle
    } finally {
      setIsLoading(false);
    }
  };

  const logout = (): void => {
    localStorage.clear();
    sessionStorage.clear(); // Xóa cả sessionStorage để reset first login flag
    setUser(null);
  };

  const register = async (userData: RegisterData): Promise<void> => {
    setIsLoading(true);
    try {
      await doRegister(userData);
    } catch (error) {
      console.error("Registration failed:", error);
      throw error; // Re-throw để component có thể handle
    } finally {
      setIsLoading(false);
    }
  };

  const refreshUser = async (): Promise<void> => {
    const token = getAccessToken();
    const tokenExpiry = getExpiryTime();

    if (token && tokenExpiry && Date.now() < tokenExpiry) {
      setIsLoading(true);
      try {
        const fetchedUser = await getMe();
        setUser(fetchedUser);
      } catch (error) {
        console.error("Failed to refresh user data:", error);
        localStorage.clear();
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const checkAuth = (): boolean => {
    const authorizationData = localStorage.getItem("authorizationData");
    if (!authorizationData) return false;

    return true; // Nếu có authorizationData, coi như đã xác thực
  };

  const value: AuthContextType = {
    user,
    isAuthenticated,
    isLoading,
    login,
    logout,
    register,
    refreshUser,
    checkAuth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}