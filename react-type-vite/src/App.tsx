import { Route, Routes } from "react-router-dom";
import Home from "./pages/student/home/Home";
import AuthPage from "./pages/student/auth/AuthPage";
import { useTokenExpiry } from "./hooks/useTokenExpiry";
import Authenticate from "./pages/student/auth/Authenticate";
import { ThemeProvider } from "./context/theme-context";
import TeacherHomePage from "./pages/teacher/home/Home";
import AuthProvider from "./context/auth-context";
import ScrollProgressBar from "./components/ui/ScrollProgressBar";
import NotFound from "./pages/NotFound";
import ForgotPasswordPage from "./pages/student/auth/ForgotPasswordPage";
import AdminDashboard from "./pages/admin/Home"
import SystemAdminDashboard from "./pages/system-admin/SystemAdminDashboard"

function App() {
  // Khởi tạo token expiry monitoring
  useTokenExpiry();
  console.log("Có vào trong App.tsx");
  return (
    <ThemeProvider defaultTheme="system">
      <AuthProvider>
        <ScrollProgressBar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<AuthPage isLoggin={true} />} />
          <Route path="/register" element={<AuthPage isLoggin={false} />} />
          <Route path="/auth/callback" element={<Authenticate />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/teacher/home" element={<TeacherHomePage />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/system-admin" element={<SystemAdminDashboard />} />
          {/* Add other routes as needed */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
