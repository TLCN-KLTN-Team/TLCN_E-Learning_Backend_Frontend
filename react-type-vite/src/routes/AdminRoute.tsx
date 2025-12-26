import { Route } from "react-router-dom";
import AdminLayout from "@/components/admin/home/AdminLayout";
import AdminDashboardPage from "../pages/admin/AdminDashboardPage";
import ProtectedRoute from "./protected/ProtectedRoute";
import CourseListPage from "@/pages/admin/CourseListPage";
import StudentListPage from "@/pages/admin/StudentListPage";
import TeacherListPage from "@/pages/admin/TeacherListPage";
import PendingCoursesPage from "@/pages/admin/PendingCoursesPage";
import CourseApprovalDetailPage from "@/pages/admin/CourseApprovalDetailPage";
import DepartmentManagementPage from "@/pages/admin/DepartmentManagementPage";
import AdminRevenuePage from "@/pages/admin/revenue/AdminRevenuePage";
import AdminProfilePage from "@/pages/admin/AdminProfilePage";

// Admin routes - protected routes for admin roles
const AdminRoutes = [
  <Route
    key="admin-layout"
    path="/admin/*"
    element={
      <ProtectedRoute allowedRoles={["ADMIN"]}>
        <AdminLayout />
      </ProtectedRoute>
    }
  >
    {/* Default route - shows dashboard */}
    <Route index element={<AdminDashboardPage />} />
    <Route path="dashboard" element={<AdminDashboardPage />} />

    {/* Other admin routes */}
    <Route path="courses" element={<CourseListPage />} />
    <Route path="students" element={<StudentListPage />} />
    <Route path="instructors" element={<TeacherListPage />} />
    <Route path="published-courses" element={<PendingCoursesPage />} />
    <Route
      path="published-courses/:publishedCourseId"
      element={<CourseApprovalDetailPage />}
    />
    <Route path="departments" element={<DepartmentManagementPage />} />
    <Route path="revenue" element={<AdminRevenuePage />} />
    <Route path="info" element={<AdminProfilePage />} />
  </Route>,
];

export default AdminRoutes;
