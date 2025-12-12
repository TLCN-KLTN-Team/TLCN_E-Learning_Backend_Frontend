import { Route } from "react-router-dom";
import ProtectedRoute from "./protected/ProtectedRoute";
import RoleProtectedRoute from "./protected/RoleProtectedRoute";
import StudentDashboard from "@/pages/student/dashboard/StudentDashboard";
import CourseDetail from "@/pages/student/course/CourseDetail";
import StudentEditProfile from "@/pages/student/dashboard/EditProfile";
import EditProfile from "@/pages/student/home/EditProfile";
import QuizTakingPage from "@/pages/student/quiz/QuizTakingPage";
import QuizResultPage from "@/pages/student/quiz/QuizResultPage";
import WorkspacePage from "@/pages/workspace/WorkspacePage";

// Student routes - protected routes for student role
const StudentRoutes = [
  <Route key="student-protected" element={<ProtectedRoute />}>
    <Route key="student-role-protected" element={<RoleProtectedRoute />}>
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
        path="/student/dashboard"
        element={<StudentDashboard />}
      />

      {/* Route to course detail */}
      <Route
        key="course-detail"
        path="/student/dashboard/course/classes/:id"
        element={<CourseDetail />}
      />

      {/* Thêm các student routes khác ở đây */}
    </Route>
    <Route
      path="/student/quiz/:quizId/attempt/:attemptId"
      element={<QuizTakingPage />}
    />
    <Route
      path="/student/quiz/:quizId/result/:attemptId"
      element={<QuizResultPage />}
    />

    <Route
      key="workspace"
      path="/student/workspaces"
      element={<WorkspacePage />}
    />
    <Route
      key="workspace-with-params"
      path="/student/workspaces/:workspaceId"
      element={<WorkspacePage />}
    />

    <Route
      key="workspace-with-channel"
      path="/student/workspaces/:workspaceId/:channelId"
      element={<WorkspacePage />}
    />
  </Route>,
];

export default StudentRoutes;
