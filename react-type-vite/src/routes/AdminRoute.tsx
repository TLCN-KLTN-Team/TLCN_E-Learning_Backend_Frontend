import { Route } from "react-router-dom";
import AdminLayout from "@/components/admin/home/AdminLayout"; // Create this layout component
import AdminDashboardPage from "../pages/admin/AdminDashboardPage";
import ProtectedRoute from "./protected/ProtectedRoute";
import RoleProtectedRoute from "./protected/RoleProtectedRoute";
import CourseListPage from "@/pages/admin/CourseListPage";
import StudentListPage from "@/pages/admin/StudentListPage";
import TeacherListPage from "@/pages/admin/TeacherListPage";

// Admin routes - protected routes for admin roles
const AdminRoutes = [
  <Route key="admin-protected" element={<ProtectedRoute />}>
    <Route key="admin-role-protected" element={<RoleProtectedRoute />}>
      {/* Admin Layout wrapper */}
      <Route path="/admin" element={<AdminLayout />}>
        {/* Default route - shows dashboard */}
        <Route index element={<AdminDashboardPage />} />
        <Route path="dashboard" element={<AdminDashboardPage />} />
        
        {/* Other admin routes */}
        <Route path="courses" element={<CourseListPage />} />
        <Route path="students" element={<StudentListPage />} />
        <Route path="instructors" element={<TeacherListPage />} />
      </Route>
    </Route>
  </Route>,
];

export default AdminRoutes;