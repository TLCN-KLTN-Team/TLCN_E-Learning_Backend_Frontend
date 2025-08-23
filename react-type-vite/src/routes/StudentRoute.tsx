import { Route } from "react-router-dom";
import ProtectedRoute from "./protected/ProtectedRoute";
import WorkspacePage from "../pages/workspace/WorkspacePage";
import EditProfile from "../pages/student/home/EditProfile";
import RoleProtectedRoute from "./protected/RoleProtectedRoute";

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
      {/* Thêm các student routes khác ở đây */}
    </Route>
  </Route>,
];

export default StudentRoutes;
