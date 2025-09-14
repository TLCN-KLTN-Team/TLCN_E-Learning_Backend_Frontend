import { Route } from "react-router-dom";
import ProtectedRoute from "./protected/ProtectedRoute";
import WorkspacePage from "../pages/workspace/WorkspacePage";
import EditProfile from "../pages/student/home/EditProfile";
import RoleProtectedRoute from "./protected/RoleProtectedRoute";
import StudentDashboard from "@/pages/student/dashboard/StudentDashboard";

// Student routes - protected routes for student role
const StudentRoutes = [
  <Route key="student-protected" element={<ProtectedRoute />}>
    <Route key="student-role-protected" element={<RoleProtectedRoute />}>
      <Route key="workspace" path="/workspace" element={<WorkspacePage />} />
      <Route
        key="edit-profile"
        path="/edit-profile"
        element={<EditProfile />}
      />

      {/* Route to e-learning dashboard */}
      <Route
        key="dashboard"
        path="/student/e-learning"
        element={<StudentDashboard />}
      />

      {/* Thêm các student routes khác ở đây */}
    </Route>
  </Route>,
];

export default StudentRoutes;
