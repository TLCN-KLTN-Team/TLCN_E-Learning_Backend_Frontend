import { useAuth } from "@/context/auth-context/useAuth";
import { Navigate } from "react-router-dom";
import type { ReactNode } from "react";
import { toast } from "react-toastify";
import { useEffect, useState } from "react";
import { getAuthInfo } from "@/utils/auth.utils";

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: string[];
}

const ProtectedRoute = ({ children, allowedRoles }: ProtectedRouteProps) => {
  const { checkAuth } = useAuth();
  const [shouldRedirect, setShouldRedirect] = useState(false);
  const isAuthenticated = checkAuth();
  const auth = getAuthInfo();

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

  // Kiểm tra authentication
  if (!isAuthenticated) {
    return shouldRedirect ? <Navigate to="/login" replace /> : null;
  }

  // Kiểm tra role authorization nếu có allowedRoles
  if (allowedRoles && allowedRoles.length > 0 && auth) {
    const hasPermission = allowedRoles.includes(auth.role);

    if (!hasPermission) {
      toast.error("Bạn không có quyền truy cập trang này", {
        position: "top-right",
        autoClose: 3000,
      });
      return <Navigate to="/" replace />;
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;
