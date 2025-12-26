import { Route } from "react-router-dom";
import ProtectedRoute from "./protected/ProtectedRoute";
import SystemAdminLayout from "@/components/system-admin/SystemAdminLayout";
import SystemAdminDashboardPage from "@/pages/system-admin/SystemAdminDashboardPage";
import TrainingUnitsPage from "@/pages/system-admin/TrainingUnitsPage";
import AccountManagementPage from "@/pages/system-admin/AccountManagementPage";
import CategoryManagementPage from "@/pages/system-admin/CategoryManagementPage";
import RevenueManagementPage from "@/pages/system-admin/RevenueManagementPage";
import SystemStatisticsPage from "@/pages/system-admin/SystemStatisticsPage";
import SystemAdminProfilePage from "@/pages/system-admin/SystemAdminProfilePage";

const SystemAdminRoutes = [
  <Route
    key="system-admin-layout"
    path="/system-admin/*"
    element={
      <ProtectedRoute allowedRoles={["SUPER_ADMIN"]}>
        <SystemAdminLayout />
      </ProtectedRoute>
    }
  >
    {/* Default route - shows dashboard */}
    <Route index element={<SystemAdminDashboardPage />} />
    <Route path="dashboard" element={<SystemAdminDashboardPage />} />

    {/* System Admin specific routes */}
    <Route path="training-units" element={<TrainingUnitsPage />} />
    <Route path="accounts" element={<AccountManagementPage />} />
    <Route path="categories" element={<CategoryManagementPage />} />
    <Route path="revenue" element={<RevenueManagementPage />} />
    <Route path="statistics" element={<SystemStatisticsPage />} />
    <Route path="profile" element={<SystemAdminProfilePage />} />
    <Route path="edit-profile" element={<SystemAdminProfilePage />} />
    <Route path="info" element={<SystemAdminProfilePage />} />
  </Route>,
];

export default SystemAdminRoutes;
