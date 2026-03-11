import { Route } from "react-router-dom";
import ProtectedRoute from "./protected/ProtectedRoute";
import StudentDashboard from "@/pages/student/dashboard/StudentDashboard";
import CourseDetail from "@/pages/student/course/CourseDetail";
import StudentEditProfile from "@/pages/student/dashboard/EditProfile";
import EditProfile from "@/pages/student/home/EditProfile";
import QuizTakingPage from "@/pages/student/quiz/QuizTakingPage";
import QuizResultPage from "@/pages/student/quiz/QuizResultPage";
import {
  USER_ROUTES,
  STUDENT_ROUTES,
  ROUTE_PATTERNS,
} from "@/constants/routes";

// Student routes - protected routes for student role
const StudentRoutes = [
  <Route
    key="edit-profile"
    path={USER_ROUTES.EDIT_PROFILE}
    element={
      <ProtectedRoute allowedRoles={["STUDENT", "USER"]}>
        <EditProfile />
      </ProtectedRoute>
    }
  />,

  <Route
    key="student-edit-profile"
    path={STUDENT_ROUTES.EDIT_PROFILE}
    element={
      <ProtectedRoute allowedRoles={["STUDENT"]}>
        <StudentEditProfile />
      </ProtectedRoute>
    }
  />,

  <Route
    key="dashboard"
    path={STUDENT_ROUTES.DASHBOARD}
    element={
      <ProtectedRoute allowedRoles={["STUDENT"]}>
        <StudentDashboard />
      </ProtectedRoute>
    }
  />,

  <Route
    key="course-detail"
    path={ROUTE_PATTERNS.COURSE_DETAIL_STUDENT}
    element={
      <ProtectedRoute allowedRoles={["STUDENT"]}>
        <CourseDetail />
      </ProtectedRoute>
    }
  />,

  <Route
    path={ROUTE_PATTERNS.QUIZ_ATTEMPT}
    element={
      <ProtectedRoute allowedRoles={["STUDENT"]}>
        <QuizTakingPage />
      </ProtectedRoute>
    }
  />,

  <Route
    path={ROUTE_PATTERNS.QUIZ_RESULT}
    element={
      <ProtectedRoute allowedRoles={["STUDENT"]}>
        <QuizResultPage />
      </ProtectedRoute>
    }
  />,
];

export default StudentRoutes;
