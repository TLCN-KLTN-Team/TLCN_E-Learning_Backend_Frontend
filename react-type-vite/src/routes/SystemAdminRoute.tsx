import { Route } from "react-router-dom";
import ProtectedRoute from "./protected/ProtectedRoute";
import RoleProtectedRoute from "./protected/RoleProtectedRoute";
import SystemAdminLayout from "@/components/system-admin/SystemAdminLayout";
import SystemAdminDashboardPage from "@/pages/system-admin/SystemAdminDashboardPage";
import TrainingUnitsPage from "@/pages/system-admin/TrainingUnitsPage";
import AccountManagementPage from "@/pages/system-admin/AccountManagementPage";
import CategoryManagementPage from "@/pages/system-admin/CategoryManagementPage";
import RevenueManagementPage from "@/pages/system-admin/RevenueManagementPage";
import SystemStatisticsPage from "@/pages/system-admin/SystemStatisticsPage";
import SystemAdminProfilePage from "@/pages/system-admin/SystemAdminProfilePage";

const SystemAdminRoutes = [
  <Route key="system-admin-protected" element={<ProtectedRoute />}>
    <Route key="system-admin-role-protected" element={<RoleProtectedRoute />}>
      {/* System Admin Layout wrapper */}
      <Route path="/system-admin" element={<SystemAdminLayout />}>
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
      </Route>
    </Route>
  </Route>,
];

export default SystemAdminRoutes;
