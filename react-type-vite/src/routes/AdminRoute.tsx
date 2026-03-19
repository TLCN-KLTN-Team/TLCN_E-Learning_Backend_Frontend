import { Route } from "react-router-dom";
import AdminLayout from "@/components/admin/home/AdminLayout";
import AdminDashboardPage from "../pages/admin/AdminDashboardPage";
import ProtectedRoute from "./protected/ProtectedRoute";

import TeacherListPage from "@/pages/admin/TeacherListPage";
import DepartmentManagementPage from "@/pages/admin/DepartmentManagementPage";
import AdminRevenuePage from "@/pages/admin/revenue/AdminRevenuePage";
import AdminProfilePage from "@/pages/admin/AdminProfilePage";

import ExpertListPage from "@/pages/admin/ExpertListPage";
import StudentListPage from "@/pages/admin/StudentListPage";
import { ADMIN_ROUTES } from "@/constants/routes";
import AdminRefundPage from "@/pages/admin/revenue/AdminRefundPage";
import AdminNotificationsPage from "@/pages/admin/notifications/AdminNotificationsPage";

// Admin routes - protected routes for admin roles
const AdminRoutes = [
  <Route
    key="admin-layout"
    path={`${ADMIN_ROUTES.BASE}/*`}
    element={
      <ProtectedRoute allowedRoles={["ADMIN", "EXPERT"]}>
        <AdminLayout />
      </ProtectedRoute>
    }
  >
    {/* Default route - shows dashboard */}
    <Route index element={<AdminDashboardPage />} />
    <Route path="dashboard" element={<AdminDashboardPage />} />
    <Route path="notifications" element={<AdminNotificationsPage />} />

    {/* Other admin routes */}
    {/* <Route path="manage-earnings" element={<EarningsPage />} /> */}
    <Route path="experts" element={<ExpertListPage />} />
    <Route path="students" element={<StudentListPage />} />
    <Route path="instructors" element={<TeacherListPage />} />

    <Route path="departments" element={<DepartmentManagementPage />} />
    <Route path="revenue" element={<AdminRevenuePage />} />
    <Route path="refunds" element={<AdminRefundPage />} />
    <Route path="info" element={<AdminProfilePage />} />
  </Route>,
];

export default AdminRoutes;
