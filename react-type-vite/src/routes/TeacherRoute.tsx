import { Route } from "react-router-dom"
import TeacherHomePage from "../pages/teacher/dashboard/TeacherDashboard"
import AssignedCoursesPage from "../pages/teacher/course/AssignedCoursesPage"
import EditCoursePage from "../pages/teacher/course/EditCoursePage"
import ProtectedRoute from "./protected/ProtectedRoute"
import RoleProtectedRoute from "./protected/RoleProtectedRoute"
import TeacherLayout from "../components/teacher/dashboard/TeacherLayout"

// Teacher routes - protected routes for teacher role
const TeacherRoutes = [
  <Route key="teacher-protected" element={<ProtectedRoute />}>
    <Route key="teacher-role-protected" element={<RoleProtectedRoute />}>
      <Route key="teacher-layout" element={<TeacherLayout />}>
        <Route key="teacher-home" path="/teacher/home" element={<TeacherHomePage />} />
        <Route key="teacher-dashboard" path="/teacher/dashboard" element={<TeacherHomePage />} />
        <Route key="teacher-assigned-courses" path="/teacher/assigned-courses" element={<AssignedCoursesPage />} />
        <Route key="teacher-edit-course" path="/teacher/courses/:courseId/edit" element={<EditCoursePage />} />
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
