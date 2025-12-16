import { Navigate } from "react-router-dom";
import type { ReactNode } from "react";
import { getAuthInfo } from "@/utils/auth.utils";
import { useEffect } from "react";
import { toast } from "react-toastify";

interface RequireRoleProps {
  allowedRoles: string[];
  children: ReactNode;
  redirectTo?: string;
}

/**
 * Component bảo vệ route theo role từ JWT token
 * @param allowedRoles - Danh sách các role được phép truy cập
 * @param children - Component con được render nếu có quyền
 * @param redirectTo - Đường dẫn redirect nếu không có quyền (mặc định: /403)
 */
const RequireRole = ({
  allowedRoles,
  children,
  redirectTo = "/403",
}: RequireRoleProps) => {
  const auth = getAuthInfo();

  useEffect(() => {
    if (!auth) {
      toast.error("Vui lòng đăng nhập để tiếp tục", {
        position: "top-right",
        autoClose: 3000,
      });
    } else if (!allowedRoles.includes(auth.role)) {
      toast.warning("Bạn không có quyền truy cập vào trang này!", {
        position: "top-right",
        autoClose: 3000,
      });
    }
  }, [auth, allowedRoles]);

  // Nếu không có token hoặc token không hợp lệ, redirect về login
  if (!auth) {
    return <Navigate to="/login" replace />;
  }

  // Nếu role không nằm trong danh sách allowedRoles, redirect về trang 403 hoặc trang chỉ định
  if (!allowedRoles.includes(auth.role)) {
    return <Navigate to={redirectTo} replace />;
  }

  return <>{children}</>;
};

export default RequireRole;
