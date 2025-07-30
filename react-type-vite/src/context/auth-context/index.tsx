import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { AuthContext } from "./context";
import type { AuthContextType, User, RegisterData } from "./types";

import { getMe } from "../../services/api/authApi";

// Define Provider props type
interface AuthProviderProps {
  children: ReactNode;
}

export default function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const isAuthenticated = !!user;

  useEffect(() => {
    const token = localStorage.getItem("jwt");
    if (token) {
      const fetchUser = async () => {
        setIsLoading(true);
        try {
          const fetchedUser = await getMe(); // Assuming getMe fetches the current user
          setUser(fetchedUser);
        } catch (error) {
          console.error("Failed to fetch user data:", error);
          setUser(null);
        } finally {
          setIsLoading(false);
        }
      };

      fetchUser();
    }
  }, []);

  const login = async (email: string, password: string): Promise<void> => {
    setIsLoading(true);
    try {
      // TODO: Implement actual login logic with your API
      console.log("Login attempt:", { email, password });

      // Mock user data - replace with actual API call
      const mockUser: User = {
        id: "1",
        username: "johndoe",
        email,
        firstName: "John Doe",
        lastName: "Doe",
        role: "student",
      };

      setUser(mockUser);
    } catch (error) {
      console.error("Login failed:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = (): void => {
    setUser(null);
    // TODO: Clear any stored tokens, localStorage, etc.
    localStorage.removeItem("authToken");
  };

  const register = async (userData: RegisterData): Promise<void> => {
    setIsLoading(true);
    try {
      // TODO: Implement actual registration logic with your API
      console.log("Register attempt:", userData);

      // Mock registration - replace with actual API call
      const newUser: User = {
        id: Date.now().toString(),
        email: userData.email,
        username: userData.username,
        firstName: userData.firstName,
        lastName: userData.lastName,
        role: "student", // Default role, adjust as needed
      };

      setUser(newUser);
    } catch (error) {
      console.error("Registration failed:", error);
      throw error;
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
