import { Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { ThemeProvider } from "./context/theme-context";
import AuthProvider from "./context/auth-context";
import { Toaster } from "@/components/ui/toaster.tsx";
import NotFound from "./pages/NotFound";
import PublicRoutes from "./routes/PublicRoute";
import MainRoutes from "./routes/MainRoute";
import StudentRoutes from "./routes/StudentRoute";
import TeacherRoutes from "./routes/TeacherRoute";
import AdminRoutes from "./routes/AdminRoute";
import SystemAdminRoutes from "./routes/SystemAdminRoute";
import UserRoutes from "./routes/UserRoute";
import ExpertRoutes from "./routes/ExpertRoute";
import ProtectedRoute from "./routes/protected/ProtectedRoute";
import StudentNotificationsModal from "@/pages/student/notifications/StudentNotificationsModal";
import TeacherNotificationsModal from "@/pages/teacher/notifications/TeacherNotificationsModal";
import ExpertNotificationsModal from "@/pages/expert/notifications/ExpertNotificationsModal";
import AdminNotificationsModal from "@/pages/admin/notifications/AdminNotificationsModal";
import SystemAdminNotificationsModal from "@/pages/system-admin/notifications/SystemAdminNotificationsModal";
import { STUDENT_ROUTES } from "@/constants/routes";
import { TEACHER_ROUTES } from "@/constants/routes";
import { EXPERT_ROUTES } from "@/constants/routes";
import { ADMIN_ROUTES } from "@/constants/routes";
import { SYSTEM_ADMIN_ROUTES } from "@/constants/routes";
import { getAuthInfo, isTokenValid } from "./utils/auth.utils";
import { getRoleBasedRedirectPath } from "./utils/roleUtils";
import { useEffect } from "react";

function AppContent() {
  const navigate = useNavigate();
  const location = useLocation();

  // Support modal routes: when a navigation sets `state.background`,
  // render the previous location as background and the current route as modal overlay.
  // Convention: navigate(target, { state: { background: location } })
  const state = location.state as { background?: Location } | null;
  const backgroundLocation = state && state.background ? state.background : null;

  // Reset scroll position on every route change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

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
      "/about-us",
      "/contact",
      "/register-education-unit",
      "/courses",
      "/course",
      "/teacher",
      "/educational-units",
      "/certificate/verify",
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
    <>
      <Routes location={backgroundLocation || location}>
        {/* Public routes - accessible by anonymous users */}
        {PublicRoutes}
        {/* Main Routes - shared routes between multiple roles */}
        {MainRoutes}
        {/* User Routes */}
        {UserRoutes}
        {/* Student Routes */}
        {StudentRoutes}
        {/* Teacher Routes */}
        {TeacherRoutes}
        {/* Expert Routes */}
        {ExpertRoutes}
        {/* Admin Routes */}
        {AdminRoutes}
        {/* System Admin Routes */}
        {SystemAdminRoutes}
        {/* Add other routes as needed */}
        <Route path="*" element={<NotFound />} />
      </Routes>

      {/* If we have a background location, render the modal routes overlay for the current location */}
      {backgroundLocation && (
        <Routes>
          <Route
            path={STUDENT_ROUTES.NOTIFICATIONS}
            element={
              <ProtectedRoute allowedRoles={["STUDENT"]}>
                <StudentNotificationsModal
                  isOpen={true}
                  onClose={() => {
                    try {
                      if (window.history.length > 1) navigate(-1);
                      else navigate(STUDENT_ROUTES.DASHBOARD);
                    } catch (e) {
                      navigate(STUDENT_ROUTES.DASHBOARD);
                    }
                  }}
                  title="Thông báo học viên"
                />
              </ProtectedRoute>
            }
          />
          <Route
            path={TEACHER_ROUTES.NOTIFICATIONS}
            element={
              <ProtectedRoute allowedRoles={["TEACHER"]}>
                <TeacherNotificationsModal
                  isOpen={true}
                  onClose={() => {
                    try {
                      if (window.history.length > 1) navigate(-1);
                      else navigate(TEACHER_ROUTES.HOME);
                    } catch (e) {
                      navigate(TEACHER_ROUTES.HOME);
                    }
                  }}
                  title="Thông báo giảng viên"
                />
              </ProtectedRoute>
            }
          />
          <Route
            path={EXPERT_ROUTES.NOTIFICATIONS}
            element={
              <ProtectedRoute allowedRoles={["EXPERT", "SUPER_ADMIN"]}>
                <ExpertNotificationsModal
                  isOpen={true}
                  onClose={() => {
                    try {
                      if (window.history.length > 1) navigate(-1);
                      else navigate(EXPERT_ROUTES.COURSES);
                    } catch (e) {
                      navigate(EXPERT_ROUTES.COURSES);
                    }
                  }}
                  title="Thông báo chuyên gia"
                />
              </ProtectedRoute>
            }
          />
          <Route
            path={ADMIN_ROUTES.NOTIFICATIONS}
            element={
              <ProtectedRoute allowedRoles={["ADMIN", "EXPERT"]}>
                <AdminNotificationsModal
                  isOpen={true}
                  onClose={() => {
                    try {
                      if (window.history.length > 1) navigate(-1);
                      else navigate(ADMIN_ROUTES.DASHBOARD);
                    } catch (e) {
                      navigate(ADMIN_ROUTES.DASHBOARD);
                    }
                  }}
                  title="Thông báo quản trị"
                />
              </ProtectedRoute>
            }
          />
          <Route
            path={SYSTEM_ADMIN_ROUTES.NOTIFICATIONS}
            element={
              <ProtectedRoute allowedRoles={["SUPER_ADMIN"]}>
                <SystemAdminNotificationsModal
                  isOpen={true}
                  onClose={() => {
                    try {
                      if (window.history.length > 1) navigate(-1);
                      else navigate(SYSTEM_ADMIN_ROUTES.DASHBOARD);
                    } catch (e) {
                      navigate(SYSTEM_ADMIN_ROUTES.DASHBOARD);
                    }
                  }}
                  title="Thông báo hệ thống"
                />
              </ProtectedRoute>
            }
          />
        </Routes>
      )}
    </>
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
