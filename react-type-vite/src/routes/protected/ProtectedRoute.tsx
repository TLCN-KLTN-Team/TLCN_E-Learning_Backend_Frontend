import { useAuth } from "@/context/auth-context/useAuth";
import { Navigate, Outlet } from "react-router-dom";
import type { ReactNode } from "react";
import { toast } from "react-toastify";
import { useEffect, useState } from "react";

// Cách 1: Sử dụng với Outlet (chuẩn React Router v6)
const ProtectedRoute = () => {
  const { checkAuth } = useAuth();
  const [shouldRedirect, setShouldRedirect] = useState(false);
  const isAuthenticated = checkAuth();

  useEffect(() => {
    if (!isAuthenticated && !shouldRedirect) {
      toast.warning("Bạn cần đăng nhập để tiếp tục", {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
      // Delay redirect để user có thể thấy toast
      setTimeout(() => {
        setShouldRedirect(true);
      }, 100);
    }
  }, [isAuthenticated, shouldRedirect]);

  if (!isAuthenticated) {
    return shouldRedirect ? <Navigate to="/login" replace /> : null;
  }

  return <Outlet />;
};

// Cách 2: Wrapper component với children
interface ProtectedWrapperProps {
  children: ReactNode;
}

export const ProtectedWrapper = ({ children }: ProtectedWrapperProps) => {
  const { checkAuth } = useAuth();
  const [shouldRedirect, setShouldRedirect] = useState(false);
  const isAuthenticated = checkAuth();

  useEffect(() => {
    if (!isAuthenticated && !shouldRedirect) {
      toast.error("Bạn cần đăng nhập để tiếp tục", {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
      // Delay redirect để user có thể thấy toast
      setTimeout(() => {
        setShouldRedirect(true);
      }, 100);
    }
  }, [isAuthenticated, shouldRedirect]);

  if (!isAuthenticated) {
    return shouldRedirect ? <Navigate to="/login" replace /> : null;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
