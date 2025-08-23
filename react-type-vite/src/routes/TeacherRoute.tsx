import { Route } from "react-router-dom";
import TeacherHomePage from "../pages/teacher/home/Home";
import ProtectedRoute from "./protected/ProtectedRoute";
import RoleProtectedRoute from "./protected/RoleProtectedRoute";

// Teacher routes - protected routes for teacher role
const TeacherRoutes = [
  <Route key="teacher-protected" element={<ProtectedRoute />}>
    <Route key="teacher-role-protected" element={<RoleProtectedRoute />}>
      <Route
        key="teacher-home"
        path="/teacher/home"
        element={<TeacherHomePage />}
      />
      <Route
        key="teacher-dashboard"
        path="/teacher/dashboard"
        element={<TeacherHomePage />}
      />
      {/* Thêm các teacher routes khác ở đây */}
      {/* 
      <Route path="/teacher/courses" element={<TeacherCourses />} />
      <Route path="/teacher/students" element={<TeacherStudents />} />
      <Route path="/teacher/assignments" element={<TeacherAssignments />} />
      */}
    </Route>
  </Route>,
];

export default TeacherRoutes;
