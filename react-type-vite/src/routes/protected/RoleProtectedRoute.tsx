import { useEffect, useState } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import {
  canAccessSystemAdmin,
  canAccessAdmin,
  canAccessTeacher,
  canAccessStudent,
  canAccessUser,
} from "@/utils/roleUtils";
import { getAuthInfo } from "@/utils/auth.utils";

/**
 * RoleProtectedRoute - Bảo vệ route dựa trên role từ JWT token
 * Tự động kiểm tra quyền dựa trên path prefix
 */
const RoleProtectedRoute = () => {
  const auth = getAuthInfo();
  const location = useLocation();
  const [shouldRedirect, setShouldRedirect] = useState(false);

  useEffect(() => {
    if (!auth) {
      toast.warning("Token không hợp lệ hoặc đã hết hạn!", {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
      setTimeout(() => setShouldRedirect(true), 100);
      return;
    }

    const currentPath = location.pathname;
    let hasAccess = false;

    // Kiểm tra quyền truy cập dựa vào đường dẫn hiện tại
    if (currentPath.startsWith("/system-admin")) {
      hasAccess = canAccessSystemAdmin(auth.role);
    } else if (currentPath.startsWith("/admin")) {
      hasAccess = canAccessAdmin(auth.role);
    } else if (currentPath.startsWith("/teacher")) {
      hasAccess = canAccessTeacher(auth.role);
    } else if (currentPath.startsWith("/student")) {
      hasAccess = canAccessStudent(auth.role);
    } else if (currentPath.startsWith("/")) {
      hasAccess = canAccessUser(auth.role);
    } else {
      // Mặc định cho phép truy cập các route khác nếu user có role
      hasAccess = true;
    }

    if (!hasAccess) {
      toast.warning("Bạn không có quyền truy cập vào trang này!", {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
      setTimeout(() => setShouldRedirect(true), 100);
    }
  }, [auth, location.pathname]);

  // Nếu không có auth hoặc không có quyền, redirect về login hoặc trang chính
  if (!auth) {
    return shouldRedirect ? <Navigate to="/login" replace /> : null;
  }

  if (shouldRedirect) {
    // Redirect về trang chính thay vì redirect cứng nhắc
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};

export default RoleProtectedRoute;
