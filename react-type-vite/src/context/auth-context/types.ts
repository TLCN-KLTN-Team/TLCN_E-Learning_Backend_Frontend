// Define User type
export interface User {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  dob?: Date;
  avatar?: string;
  isVerified?: boolean;
  role: string; // e.g., "student", "educator", "admin"
}

// Define Auth Context type
export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  register: (userData: RegisterData) => Promise<void>;
}

// Define Register data type
export interface RegisterData {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  dob?: Date;
  agreeToTerms: boolean;
}
