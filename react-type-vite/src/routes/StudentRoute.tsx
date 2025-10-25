import { Route } from "react-router-dom";
import ProtectedRoute from "./protected/ProtectedRoute";
import WorkspacePage from "../pages/workspace/WorkspacePage";
import RoleProtectedRoute from "./protected/RoleProtectedRoute";
import StudentDashboard from "@/pages/student/dashboard/StudentDashboard";
import CourseDetail from "@/pages/student/course/CourseDetail";
import StudentEditProfile from "@/pages/student/dashboard/EditProfile";
import EditProfile from "@/pages/student/home/EditProfile";

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

      <Route
        key="student-edit-profile"
        path="/student/edit-profile"
        element={<StudentEditProfile />}
      />

      {/* Route to e-learning dashboard */}
      <Route
        key="dashboard"
        path="/student/e-learning"
        element={<StudentDashboard />}
      />

      {/* Route to course detail */}
      <Route
        key="course-detail"
        path="/student/course/:id"
        element={<CourseDetail />}
      />

      {/* Thêm các student routes khác ở đây */}
    </Route>
  </Route>,
];

export default StudentRoutes;
