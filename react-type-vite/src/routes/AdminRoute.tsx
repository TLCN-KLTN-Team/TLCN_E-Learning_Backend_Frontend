import { Route } from "react-router-dom";
import AdminDashboard from "../pages/admin/Home";
import ProtectedRoute from "./protected/ProtectedRoute";
import RoleProtectedRoute from "./protected/RoleProtectedRoute";

// Admin routes - protected routes for admin roles
const AdminRoutes = [
  <Route key="admin-protected" element={<ProtectedRoute />}>
    <Route key="admin-role-protected" element={<RoleProtectedRoute />}>
      <Route key="admin-dashboard" path="/admin" element={<AdminDashboard />} />
      <Route
        key="admin-home"
        path="/admin/dashboard"
        element={<AdminDashboard />}
      />
      {/* Thêm các admin routes khác ở đây */}
      {/* 
    <Route path="/admin/users" element={<AdminUsers />} />
    <Route path="/admin/courses" element={<AdminCourses />} />
    <Route path="/admin/reports" element={<AdminReports />} />
    */}
    </Route>
  </Route>,
];

export default AdminRoutes;
