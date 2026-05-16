import { Route, Navigate } from "react-router-dom";
import AssignedCoursesPage from "../pages/teacher/course/AssignedCoursesPage";
import EditCoursePage from "../pages/teacher/course/EditCoursePage";
import ProtectedRoute from "./protected/ProtectedRoute";
import TeacherLayout from "../components/teacher/dashboard/TeacherLayout";
import CoursePackagingPage from "@/pages/teacher/course/CoursePackagingPage";
import PublicCoursesPage from "@/pages/teacher/public/PublicCoursesPage";
import CourseStudentsPage from "@/pages/teacher/public/CourseUsersPage";
import StudentQuizzesPage from "@/pages/teacher/public/UserQuizzesPage";
import StudentAssignmentsPage from "@/pages/teacher/public/UserAssignmentsPage";
import TeacherRevenuePage from "@/pages/teacher/revenue/TeacherRevenuePage";
import TeacherProfilePage from "@/pages/teacher/TeacherProfilePage";
import QuestionBankPage from "@/pages/teacher/QuestionBankPage";
import QuestionGenerationPage from "@/pages/teacher/sidebar/QuestionGenerationPage";
import { TEACHER_ROUTES } from "@/constants/routes";
import TeacherOrderListPage from "@/pages/teacher/revenue/TeacherOrderListPage";
import TeacherNotificationsModal from "@/pages/teacher/notifications/TeacherNotificationsModal";
import TeacherCreditTransferPage from "@/pages/teacher/creditTransfer/TeacherCreditTransferPage";

// Teacher routes - protected routes for teacher role
const TeacherRoutes = [
  <Route
    key="teacher-layout"
    path={`${TEACHER_ROUTES.BASE}/*`}
    element={
      <ProtectedRoute allowedRoles={["TEACHER"]}>
        <TeacherLayout />
      </ProtectedRoute>
    }
  >
    <Route index element={<Navigate to="assigned-courses" replace />} />
    <Route
      key="teacher-notifications"
      path="notifications"
      element={
        <TeacherNotificationsModal
          isOpen={true}
          onClose={() => window.history.back()}
          title="Thông báo giảng viên"
        />
      }
    />
    <Route
      key="teacher-assigned-courses"
      path="assigned-courses"
      element={<AssignedCoursesPage />}
    />
    <Route
      key="teacher-edit-course"
      path="courses/:courseId/edit"
      element={<EditCoursePage />}
    />
    <Route
      key="teacher-package-course"
      path="courses/:courseId/manage"
      element={<CoursePackagingPage />}
    />

    {/* Public Courses Routes */}
    <Route
      key="teacher-public-courses"
      path="public-courses"
      element={<PublicCoursesPage />}
    />
    <Route
      key="teacher-public-course-students"
      path="public-courses/:courseId/students"
      element={<CourseStudentsPage />}
    />
    <Route
      key="teacher-student-quizzes"
      path="public-courses/:courseId/students/:studentId/quizzes"
      element={<StudentQuizzesPage />}
    />
    <Route
      key="teacher-student-assignments"
      path="public-courses/:courseId/students/:studentId/assignments"
      element={<StudentAssignmentsPage />}
    />

    {/* Question Bank Route */}
    <Route
      key="teacher-question-bank"
      path="question-bank"
      element={<QuestionBankPage />}
    />
    {/* Question Bank Route */}
    <Route
      key="teacher-generate-questions"
      path="generate-questions"
      element={<QuestionGenerationPage />}
    />

    {/* Revenue Route */}
    <Route
      key="teacher-revenue"
      path="revenue"
      element={<TeacherRevenuePage />}
    />

    {/* Order List Route */}
    <Route
      key="teacher-orders"
      path="orders"
      element={<TeacherOrderListPage />}
    />

    <Route
      key="teacher-credit-transfers"
      path="credit-transfers"
      element={<TeacherCreditTransferPage />}
    />

    {/* Profile Route */}
    <Route key="teacher-info" path="info" element={<TeacherProfilePage />} />
  </Route>,
];

export default TeacherRoutes;
