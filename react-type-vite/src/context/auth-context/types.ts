// Define User type
export interface User {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  dob?: Date;
  avatar?: File;
  avatarUrl?: string;
  isVerified?: boolean;
  roles: string[]; // e.g., "student", "educator", "admin"
  bio?: string;
}

export interface Role {
  name: string;
  description: string;
  permissions: string[]; // hoặc kiểu phù hợp
}

// Define Auth Context type
export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  socialLogin: (code: string, provider: string) => Promise<void>;
  logout: () => void;
  register: (userData: RegisterData) => Promise<void>;
  refreshUser: () => Promise<void>;
  checkAuth: () => boolean;
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
