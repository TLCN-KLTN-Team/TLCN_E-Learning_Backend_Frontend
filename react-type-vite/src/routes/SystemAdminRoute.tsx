import { Route } from "react-router-dom";
import ProtectedRoute from "./protected/ProtectedRoute";
import RoleProtectedRoute from "./protected/RoleProtectedRoute";
import SystemAdminDashboard from "@/pages/system-admin/SystemAdminDashboard";

const SystemAdminRoutes = [
  <Route key="system-admin-protected" element={<ProtectedRoute />}>
    <Route key="system-admin-role-protected" element={<RoleProtectedRoute />}>
      <Route
        key="system-admin-dashboard"
        path="/system-admin"
        element={<SystemAdminDashboard />}
      />
      <Route
        key="system-admin-home"
        path="/system-admin/dashboard"
        element={<SystemAdminDashboard />}
      />
      {/* Thêm các system admin routes khác ở đây */}
      {/* 
      <Route path="/system-admin/settings" element={<SystemSettings />} />
      <Route path="/system-admin/monitoring" element={<SystemMonitoring />} />
      */}
    </Route>
  </Route>,
];

export default SystemAdminRoutes;
