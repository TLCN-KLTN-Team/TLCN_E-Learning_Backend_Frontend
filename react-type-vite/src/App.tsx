import { Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { ThemeProvider } from "./context/theme-context";
import AuthProvider from "./context/auth-context";
import { Toaster } from "@/components/ui/toaster.tsx";
import NotFound from "./pages/NotFound";
import PublicRoutes from "./routes/PublicRoute";
import StudentRoutes from "./routes/StudentRoute";
import TeacherRoutes from "./routes/TeacherRoute";
import AdminRoutes from "./routes/AdminRoute";
import SystemAdminRoutes from "./routes/SystemAdminRoute";
import UserRoutes from "./routes/UserRoute";
import { getAuthInfo, isTokenValid } from "./utils/auth.utils";
import { getRoleBasedRedirectPath } from "./utils/roleUtils";
import { useEffect } from "react";

function AppContent() {
  const navigate = useNavigate();
  const location = useLocation();

  // Auto redirect khi app load - CỰC KỲ QUAN TRỌNG
  useEffect(() => {
    const auth = getAuthInfo();

    // Bỏ qua redirect nếu đang ở trang public (login, register, etc.)
    const publicPaths = [
      "/",
      "/login",
      "/register",
      "/forgot-password",
      "/verify-email",
      "/contact",
      "/register-education-unit",
      "/courses",
      "/course",
      "/teacher",
      "/educational-units",
      "/auth/google/callback",
      "/auth/facebook/callback",
    ];
    const isPublicPath = publicPaths.some((path) =>
      location.pathname.startsWith(path)
    );

    if (isPublicPath) {
      // Nếu đã đăng nhập và đang ở root path "/", redirect về dashboard tương ứng
      if (auth && isTokenValid() && location.pathname === "/") {
        const redirectPath = getRoleBasedRedirectPath(auth.role);
        navigate(redirectPath, { replace: true });
      }
      return; // Không redirect nếu đang ở trang public
    }

    // Nếu không có token hoặc token không hợp lệ, redirect về trang chủ
    if (!auth || !isTokenValid()) {
      navigate("/", { replace: true });
      return;
    }
  }, [navigate, location.pathname]);

  return (
    <Routes>
      {/* Public routes - accessible by anonymous users */}
      {PublicRoutes}
      {/* User Routes */}
      {UserRoutes}
      {/* Student Routes */}
      {StudentRoutes}
      {/* Teacher Routes */}
      {TeacherRoutes}
      {/* Admin Routes */}
      {AdminRoutes}
      {/* System Admin Routes */}
      {SystemAdminRoutes}
      {/* Add other routes as needed */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

function App() {
  return (
    <ThemeProvider defaultTheme="system">
      <AuthProvider>
        <AppContent />
        <Toaster />
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
