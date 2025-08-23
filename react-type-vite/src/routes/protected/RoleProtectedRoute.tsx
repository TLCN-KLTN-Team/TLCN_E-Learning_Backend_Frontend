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
import { getRoles } from "@/utils/localStorageVariables";

// Sử dụng Outlet để render các role protected routes
const RoleProtectedRoute = () => {
  const roles = getRoles();
  const location = useLocation();
  const [shouldRedirect, setShouldRedirect] = useState(false);

  useEffect(() => {
    if (!roles || roles.length === 0) {
      toast.warning("Tài khoản của bạn không có quyền truy cập!", {
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
      hasAccess = canAccessSystemAdmin(roles);
    } else if (currentPath.startsWith("/admin")) {
      hasAccess = canAccessAdmin(roles);
    } else if (currentPath.startsWith("/teacher")) {
      hasAccess = canAccessTeacher(roles);
    } else if (currentPath.startsWith("/student")) {
      hasAccess = canAccessStudent(roles);
    } else if (currentPath.startsWith("/")) {
      hasAccess = canAccessUser(roles);
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
  }, [roles, location.pathname]);

  // Nếu không có role hoặc không có quyền, redirect về login hoặc trang chính
  if (!roles || roles.length === 0) {
    return shouldRedirect ? <Navigate to="/login" replace /> : null;
  }

  if (shouldRedirect) {
    // Redirect về trang chính thay vì redirect cứng nhắc
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};

export default RoleProtectedRoute;
