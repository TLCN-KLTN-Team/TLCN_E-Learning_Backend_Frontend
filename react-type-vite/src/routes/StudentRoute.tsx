import { Route, useNavigate } from "react-router-dom";
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
import StudentCreditTransferPage from "@/pages/student/StudentCreditTransferPage";
import StudentNotificationsModal from "@/pages/student/notifications/StudentNotificationsModal";
import { useState } from "react";

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

  <Route
    path={STUDENT_ROUTES.NOTIFICATIONS}
    element={
      <ProtectedRoute allowedRoles={["STUDENT"]}>
        {/** Render modal in-route; navigate back to dashboard on close */}
        {(() => {
          const NotificationsModalWrapper = () => {
            const [open, setOpen] = useState(true);
            const navigate = useNavigate();
            const handleClose = () => {
              setOpen(false);
              try {
                if (window.history.length > 1) {
                  navigate(-1);
                } else {
                  navigate(STUDENT_ROUTES.DASHBOARD);
                }
              } catch (e) {
                navigate(STUDENT_ROUTES.DASHBOARD);
              }
            };

            return (
              <StudentNotificationsModal
                isOpen={open}
                onClose={handleClose}
                title="Thông báo học viên"
              />
            );
          };

          return <NotificationsModalWrapper />;
        })()}
      </ProtectedRoute>
    }
  />,

  <Route
    path="/student/credit-transfers"
    element={
      <ProtectedRoute allowedRoles={["STUDENT"]}>
        <StudentCreditTransferPage />
      </ProtectedRoute>
    }
  />,
];

export default StudentRoutes;
