import { Route } from "react-router-dom";
import TeacherHomePage from "../pages/teacher/dashboard/TeacherDashboard";
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

// Teacher routes - protected routes for teacher role
const TeacherRoutes = [
  <Route
    key="teacher-layout"
    path="/teacher/*"
    element={
      <ProtectedRoute allowedRoles={["TEACHER"]}>
        <TeacherLayout />
      </ProtectedRoute>
    }
  >
    <Route key="teacher-home" path="home" element={<TeacherHomePage />} />
    <Route
      key="teacher-dashboard"
      path="dashboard"
      element={<TeacherHomePage />}
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

    {/* Revenue Route */}
    <Route
      key="teacher-revenue"
      path="revenue"
      element={<TeacherRevenuePage />}
    />

    {/* Profile Route */}
    <Route key="teacher-info" path="info" element={<TeacherProfilePage />} />
  </Route>,
];

export default TeacherRoutes;
