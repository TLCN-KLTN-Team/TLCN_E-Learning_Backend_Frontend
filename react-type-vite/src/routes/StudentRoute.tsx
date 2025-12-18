import { Route } from "react-router-dom";
import ProtectedRoute from "./protected/ProtectedRoute";
import StudentDashboard from "@/pages/student/dashboard/StudentDashboard";
import CourseDetail from "@/pages/student/course/CourseDetail";
import StudentEditProfile from "@/pages/student/dashboard/EditProfile";
import EditProfile from "@/pages/student/home/EditProfile";
import QuizTakingPage from "@/pages/student/quiz/QuizTakingPage";
import QuizResultPage from "@/pages/student/quiz/QuizResultPage";
import WorkspacePage from "@/pages/workspace/WorkspacePage";

// Student routes - protected routes for student role
const StudentRoutes = [
  <Route
    key="edit-profile"
    path="/edit-profile"
    element={
      <ProtectedRoute allowedRoles={["STUDENT", "USER"]}>
        <EditProfile />
      </ProtectedRoute>
    }
  />,

  <Route
    key="student-edit-profile"
    path="/student/edit-profile"
    element={
      <ProtectedRoute allowedRoles={["STUDENT"]}>
        <StudentEditProfile />
      </ProtectedRoute>
    }
  />,

  <Route
    key="dashboard"
    path="/student/dashboard"
    element={
      <ProtectedRoute allowedRoles={["STUDENT"]}>
        <StudentDashboard />
      </ProtectedRoute>
    }
  />,

  <Route
    key="course-detail"
    path="/student/dashboard/course/classes/:id"
    element={
      <ProtectedRoute allowedRoles={["STUDENT"]}>
        <CourseDetail />
      </ProtectedRoute>
    }
  />,

  <Route
    path="/student/quiz/:quizId/attempt/:attemptId"
    element={
      <ProtectedRoute allowedRoles={["STUDENT"]}>
        <QuizTakingPage />
      </ProtectedRoute>
    }
  />,

  <Route
    path="/student/quiz/:quizId/result/:attemptId"
    element={
      <ProtectedRoute allowedRoles={["STUDENT"]}>
        <QuizResultPage />
      </ProtectedRoute>
    }
  />,

  <Route
    key="workspace"
    path="/student/workspaces"
    element={
      <ProtectedRoute allowedRoles={["STUDENT", "TEACHER"]}>
        <WorkspacePage />
      </ProtectedRoute>
    }
  />,

  <Route
    key="workspace-with-params"
    path="/student/workspaces/:workspaceId"
    element={
      <ProtectedRoute allowedRoles={["STUDENT", "TEACHER"]}>
        <WorkspacePage />
      </ProtectedRoute>
    }
  />,

  <Route
    key="workspace-with-channel"
    path="/student/workspaces/:workspaceId/:channelId"
    element={
      <ProtectedRoute allowedRoles={["STUDENT", "TEACHER"]}>
        <WorkspacePage />
      </ProtectedRoute>
    }
  />,
];

export default StudentRoutes;
