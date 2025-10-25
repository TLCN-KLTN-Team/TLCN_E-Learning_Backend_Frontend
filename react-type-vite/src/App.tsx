import { Route, Routes } from "react-router-dom";
import { ThemeProvider } from "./context/theme-context";
import AuthProvider from "./context/auth-context";
import ScrollProgressBar from "./components/ui/ScrollProgressBar";
import NotFound from "./pages/NotFound";
import PublicRoutes from "./routes/PublicRoute";
import StudentRoutes from "./routes/StudentRoute";
import TeacherRoutes from "./routes/TeacherRoute";
import AdminRoutes from "./routes/AdminRoute";
import SystemAdminRoutes from "./routes/SystemAdminRoute";
import CreateCoursePage from "./pages/teacher/course/CreateCoursePage";

function App() {
  // Khởi tạo token expiry monitoring
  return (
    <ThemeProvider defaultTheme="system">
      <AuthProvider>
        <ScrollProgressBar />
        <Routes>
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
          {/* Add other routes as needed */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
