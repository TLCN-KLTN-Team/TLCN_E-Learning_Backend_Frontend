import { Route } from "react-router-dom"
import TeacherHomePage from "../pages/teacher/dashboard/TeacherDashboard"
import AssignedCoursesPage from "../pages/teacher/course/AssignedCoursesPage"
import EditCoursePage from "../pages/teacher/course/EditCoursePage"
import ProtectedRoute from "./protected/ProtectedRoute"
import RoleProtectedRoute from "./protected/RoleProtectedRoute"
import TeacherLayout from "../components/teacher/dashboard/TeacherLayout"
import CoursePackagingPage from "@/pages/teacher/course/CoursePackagingPage"
import PublicCoursesPage from "@/pages/teacher/public/PublicCoursesPage"
import CourseStudentsPage from "@/pages/teacher/public/CourseUsersPage"
import StudentQuizzesPage from "@/pages/teacher/public/UserQuizzesPage"
import StudentAssignmentsPage from "@/pages/teacher/public/UserAssignmentsPage"
import TeacherRevenuePage from "@/pages/teacher/revenue/TeacherRevenuePage"

// Teacher routes - protected routes for teacher role
const TeacherRoutes = [
  <Route key="teacher-protected" element={<ProtectedRoute />}>
    <Route key="teacher-role-protected" element={<RoleProtectedRoute />}>
      <Route key="teacher-layout" element={<TeacherLayout />}>
        <Route key="teacher-home" path="/teacher/home" element={<TeacherHomePage />} />
        <Route key="teacher-dashboard" path="/teacher/dashboard" element={<TeacherHomePage />} />
        <Route key="teacher-assigned-courses" path="/teacher/assigned-courses" element={<AssignedCoursesPage />} />
        <Route key="teacher-edit-course" path="/teacher/courses/:courseId/edit" element={<EditCoursePage />} />
        <Route key="teacher-package-course" path="/teacher/courses/:courseId/manage" element={<CoursePackagingPage />} />
        
        {/* Public Courses Routes */}
        <Route key="teacher-public-courses" path="/teacher/public-courses" element={<PublicCoursesPage />} />
        <Route key="teacher-public-course-students" path="/teacher/public-courses/:courseId/students" element={<CourseStudentsPage />} />
        <Route key="teacher-student-quizzes" path="/teacher/public-courses/:courseId/students/:studentId/quizzes" element={<StudentQuizzesPage />} />
        <Route key="teacher-student-assignments" path="/teacher/public-courses/:courseId/students/:studentId/assignments" element={<StudentAssignmentsPage />} />
        
        {/* Revenue Route */}
        <Route key="teacher-revenue" path="/teacher/revenue" element={<TeacherRevenuePage />} />
        
        {/* Thêm các teacher routes khác ở đây */}
        {/* 
        <Route path="/teacher/students" element={<TeacherStudents />} />
        <Route path="/teacher/assignments" element={<TeacherAssignments />} />
        */}
      </Route>
    </Route>
  </Route>,
]

export default TeacherRoutes
