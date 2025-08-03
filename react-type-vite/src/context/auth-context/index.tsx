import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { AuthContext } from "./context";
import type { AuthContextType, User, RegisterData } from "./types";

import { getMe } from "../../services/api/authApi";
import { doLogin, doRegister } from "../../services/api/authApi";
import { useNavigate } from "react-router-dom";

// Define Provider props type
interface AuthProviderProps {
  children: ReactNode;
}

export default function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const navigate = useNavigate();

  const isAuthenticated = !!user;

  useEffect(() => {
    const authorizationDataJson = localStorage.getItem("authorizationData");
    const authorizationData: {
      accessToken?: string;
      expiryTime?: number;
    } = JSON.parse(authorizationDataJson || "{}");
    const token = authorizationData.accessToken;
    const tokenExpiry = authorizationData.expiryTime;

    if (token && tokenExpiry) {
      // Kiểm tra token có hết hạn không (expiryTime là timestamp)
      if (Date.now() < tokenExpiry) {
        const fetchUser = async () => {
          setIsLoading(true);
          try {
            const fetchedUser = await getMe();
            setUser(fetchedUser);
          } catch (error) {
            console.error("Failed to fetch user data:", error);
            // Nếu fetch user thất bại, clear localStorage
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
      console.log("Login attempt:", { email, password });
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
    setUser(null);
    // navigate("/login"); // Tạm comment để test
  };

  const register = async (userData: RegisterData): Promise<void> => {
    setIsLoading(true);
    try {
      console.log("Register attempt:", userData);

      const registeredData = await doRegister(userData);
      setUser(registeredData);
    } catch (error) {
      console.error("Registration failed:", error);
      throw error; // Re-throw để component có thể handle
    } finally {
      setIsLoading(false);
    }
  };

  const value: AuthContextType = {
    user,
    isAuthenticated,
    isLoading,
    login,
    logout,
    register,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
