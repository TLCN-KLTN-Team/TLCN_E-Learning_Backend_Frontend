# Auth Context Documentation

## Cấu trúc files

```
src/context/auth-context/
├── index.tsx          # AuthProvider component
├── context.ts         # React Context definition
├── types.ts           # TypeScript type definitions
├── useAuth.ts         # Custom hook for using auth context
├── exports.ts         # Barrel exports
├── example-usage.tsx  # Usage examples
└── README.md          # This documentation
```

## Cách sử dụng

### 1. Wrap app với AuthProvider

```tsx
// main.tsx hoặc App.tsx
import AuthProvider from "./context/auth-context";

function App() {
  return (
    <AuthProvider>
      <YourAppComponents />
    </AuthProvider>
  );
}
```

### 2. Sử dụng useAuth hook trong components

```tsx
import { useAuth } from "./context/auth-context/useAuth";

function LoginComponent() {
  const { user, isAuthenticated, isLoading, login, logout, register } =
    useAuth();

  const handleLogin = async () => {
    try {
      await login("user@example.com", "password123");
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  return (
    <div>
      {isAuthenticated ? (
        <div>
          <h2>Welcome, {user?.name}!</h2>
          <button onClick={logout}>Logout</button>
        </div>
      ) : (
        <button onClick={handleLogin} disabled={isLoading}>
          {isLoading ? "Logging in..." : "Login"}
        </button>
      )}
    </div>
  );
}
```

## Types

### User

```tsx
interface User {
  id: string;
  email: string;
  name: string;
  role: "student" | "educator" | "admin";
  avatar?: string;
}
```

### AuthContextType

```tsx
interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  register: (userData: RegisterData) => Promise<void>;
}
```

### RegisterData

```tsx
interface RegisterData {
  email: string;
  password: string;
  name: string;
  role: "student" | "educator";
}
```

## API Methods

### login(email: string, password: string): Promise<void>

- Đăng nhập user với email và password
- Cập nhật user state khi thành công
- Throw error nếu thất bại

### logout(): void

- Đăng xuất user hiện tại
- Clear user state và localStorage

### register(userData: RegisterData): Promise<void>

- Đăng ký user mới
- Tự động login sau khi đăng ký thành công

## TODO

- [ ] Implement actual API calls
- [ ] Add token management
- [ ] Add password reset functionality
- [ ] Add remember me functionality
- [ ] Add user profile update
- [ ] Add role-based access control
- [ ] Add session timeout handling
