/**
 * Example: Cách setup Global Error Handler trong App.tsx
 */

import { useEffect } from "react";
import { Route, Routes } from "react-router-dom";
import { useGlobalErrorHandler, GlobalErrorBoundary } from "@/errors";
import { useTokenExpiry } from "./hooks/useTokenExpiry";
import { ThemeProvider } from "./context/theme-context";
import AuthProvider from "./context/auth-context";

function App() {
  // Setup Global Error Handler
  const { setupErrorHandler } = useGlobalErrorHandler();

  // Khởi tạo token expiry monitoring
  useTokenExpiry();

  // Setup error handler callbacks khi app mount
  useEffect(() => {
    setupErrorHandler();
  }, [setupErrorHandler]);

  return (
    <ThemeProvider defaultTheme="system">
      <AuthProvider>
        {/* Wrap toàn bộ app với GlobalErrorBoundary */}
        <GlobalErrorBoundary>
          <Routes>{/* Your routes here */}</Routes>
        </GlobalErrorBoundary>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;

/**
 * Example: Cách sử dụng trong component thông thường
 */

import { useState } from "react";
import { useAsyncOperation, api } from "@/errors";

function UserManagement() {
  const [users, setUsers] = useState([]);
  const { executeAsync } = useAsyncOperation();

  // Tự động handle error, hiển thị toast
  const loadUsers = () => {
    executeAsync(() => api.get("/users"), {
      onSuccess: (result) => setUsers(result.content),
      successMessage: "Tải danh sách user thành công!",
    });
  };

  const deleteUser = (id: string) => {
    executeAsync(() => api.delete(`/users/${id}`), {
      onSuccess: () => {
        setUsers((prev) => prev.filter((u) => u.id !== id));
      },
      successMessage: "Xóa user thành công!",
    });
  };

  return (
    <div>
      <button onClick={loadUsers}>Load Users</button>
      {/* User list with delete buttons */}
    </div>
  );
}

/**
 * Example: Cách sử dụng cho form submission với validation
 */

import { useState } from "react";
import { useFormSubmission, api } from "@/errors";

function LoginForm() {
  const [credentials, setCredentials] = useState({ email: "", password: "" });
  const [fieldErrors, setFieldErrors] = useState({});
  const { submitForm } = useFormSubmission();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    submitForm(() => api.post("/auth/login", credentials), {
      successMessage: "Đăng nhập thành công!",
      onValidationError: setFieldErrors, // Tự động set field errors
      onSuccess: (result) => {
        // Store token và redirect
        localStorage.setItem("authorizationData", JSON.stringify(result));
        window.location.href = "/dashboard";
      },
      resetForm: () => {
        setCredentials({ email: "", password: "" });
        setFieldErrors({});
      },
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="email"
        value={credentials.email}
        onChange={(e) =>
          setCredentials((prev) => ({ ...prev, email: e.target.value }))
        }
      />
      {fieldErrors.email && <span className="error">{fieldErrors.email}</span>}

      <input
        type="password"
        value={credentials.password}
        onChange={(e) =>
          setCredentials((prev) => ({ ...prev, password: e.target.value }))
        }
      />
      {fieldErrors.password && (
        <span className="error">{fieldErrors.password}</span>
      )}

      <button type="submit">Đăng nhập</button>
    </form>
  );
}

/**
 * Example: Cách sử dụng manual error handling khi cần
 */

import { useGlobalErrorHandler, api } from "@/errors";

function AdvancedComponent() {
  const { handleError, showSuccess } = useGlobalErrorHandler();

  const complexOperation = async () => {
    try {
      const result = await api.post("/complex-operation", data);

      // Custom success handling
      showSuccess("Thao tác phức tạp hoàn thành!");

      // Additional processing...
    } catch (error) {
      // Manual error handling nếu cần logic đặc biệt
      const appError = handleError(error);

      if (appError.getErrorCode() === "SPECIFIC_ERROR") {
        // Handle specific error case
      }
    }
  };

  return <button onClick={complexOperation}>Complex Operation</button>;
}
