import { Route, Routes } from "react-router-dom";
import { useTokenExpiry } from "./hooks/useTokenExpiry";
import { ThemeProvider } from "./context/theme-context";
import AuthProvider from "./context/auth-context";
import ScrollProgressBar from "./components/ui/ScrollProgressBar";
import NotFound from "./pages/NotFound";
<<<<<<< HEAD
import PublicRoutes from "./routes/PublicRoute";
import StudentRoutes from "./routes/StudentRoute";
import TeacherRoutes from "./routes/TeacherRoute";
import AdminRoutes from "./routes/AdminRoute";
import SystemAdminRoutes from "./routes/SystemAdminRoute";
<<<<<<< HEAD
=======
import ForgotPasswordPage from "./pages/student/auth/ForgotPasswordPage";
import AdminDashboard from "./pages/admin/Home"
import SystemAdminDashboard from "./pages/system-admin/SystemAdminDashboard"
import WorkspacePage from "./pages/workspace/WorkspacePage";
import Authenticate from "./pages/student/auth/Authenticate";
import ProtectedRoute from "./routes/ProtectedRoute";
import EditProfile from "./pages/student/home/EditProfile";
import Contact from "./pages/student/home/Contact";
>>>>>>> 836d972 (update UI for add course page)
=======
>>>>>>> f632bb4 (fix: rebase for this branch)
import CreateCoursePage from "./pages/teacher/course/CreateCoursePage";

function App() {
  // Khởi tạo token expiry monitoring
  useTokenExpiry();
  return (
    <ThemeProvider defaultTheme="system">
      <AuthProvider>
        <ScrollProgressBar />
        <Routes>
<<<<<<< HEAD
<<<<<<< HEAD
=======
>>>>>>> f632bb4 (fix: rebase for this branch)
          <Route path="/teacher/create-course" element={<CreateCoursePage />} />
          <Route
            path="/teacher/course/:courseId/build"
            element={<CreateCoursePage />}
          />{" "}
          {/* A more descriptive route */}
          {/* Public routes - which accessible by anonymous users*/}
          {PublicRoutes}
          {/* Student Routes */}
          {StudentRoutes}
          {/* Teacher Routes */}
          {TeacherRoutes}
          {/* Admin Routes */}
          {AdminRoutes}
          {/* System Admin Routes */}
          {SystemAdminRoutes}
<<<<<<< HEAD
=======
          {/* Public routes */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<AuthPage isLoggin={true} />} />
          <Route path="/register" element={<AuthPage isLoggin={false} />} />
          <Route path="/auth/callback" element={<Authenticate />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />

          <Route path="/teacher/home" element={<TeacherHomePage />} />
          <Route path="/teacher/create-course" element={<CreateCoursePage />} />
          <Route path="/teacher/course/:courseId/build" element={<CreateCoursePage />} /> {/* A more descriptive route */}
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/system-admin" element={<SystemAdminDashboard />} />
>>>>>>> 836d972 (update UI for add course page)
=======
>>>>>>> f632bb4 (fix: rebase for this branch)
          {/* Add other routes as needed */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
