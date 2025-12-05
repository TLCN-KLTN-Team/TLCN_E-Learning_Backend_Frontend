import { Route, Routes } from "react-router-dom";
import { ThemeProvider } from "./context/theme-context";
import AuthProvider from "./context/auth-context";
import ScrollProgressBar from "./components/ui/ScrollProgressBar";
import { Toaster } from "@/components/ui/toaster.tsx";
import NotFound from "./pages/NotFound";
import PublicRoutes from "./routes/PublicRoute";
import StudentRoutes from "./routes/StudentRoute";
import TeacherRoutes from "./routes/TeacherRoute";
import AdminRoutes from "./routes/AdminRoute";
import SystemAdminRoutes from "./routes/SystemAdminRoute";
import UserRoutes from "./routes/UserRoute";

function App() {
  // Khởi tạo token expiry monitoring
  return (
    <ThemeProvider defaultTheme="system">
      <AuthProvider>
        <ScrollProgressBar />
        <Routes>
          {/* A more descriptive route */}
          {/* Public routes - which accessible by anonymous users*/}
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
        <Toaster />
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
