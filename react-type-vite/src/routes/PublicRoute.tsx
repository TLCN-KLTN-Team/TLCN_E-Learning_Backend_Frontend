import { Route } from "react-router-dom";
import Home from "../pages/student/home/Home";
import AuthPage from "../pages/auth/AuthPage";
import GoogleAuthenticate from "../pages/auth/GoogleAuthenticate";
import ForgotPasswordPage from "../pages/auth/ForgotPasswordPage";
import Contact from "../pages/student/home/Contact";
import EducationUnitRegistration from "../pages/student/home/EducationUnitRegistration";
import FacebookAuthenticate from "@/pages/auth/FacebookAuthenticate";
import Courses from "@/pages/user/Courses";
import CourseDetail from "@/pages/user/course/CourseDetail";
import DetailEducationalUnit from "@/pages/user/universitry/DetailEducationalUnit";
import WorkspacePage from "@/pages/workspace/WorkspacePage";

// Public routes - accessible by anonymous users
const PublicRoutes = [
  <Route key="home" path="/" element={<Home />} />,
  <Route key="login" path="/login" element={<AuthPage isLoggin={true} />} />,
  <Route
    key="register"
    path="/register"
    element={<AuthPage isLoggin={false} />}
  />,
  <Route
    key="google-auth-callback"
    path="/auth/google/callback/"
    element={<GoogleAuthenticate />}
  />,
  <Route
    key="facebook-auth-callback"
    path="/auth/facebook/callback/"
    element={<FacebookAuthenticate />}
  />,
  <Route
    key="forgot-password"
    path="/forgot-password"
    element={<ForgotPasswordPage />}
  />,
  <Route key="contact" path="/contact" element={<Contact />} />,
  <Route
    key="education-unit-registration"
    path="/register-education-unit"
    element={<EducationUnitRegistration />}
  />,

  // All user accessible routes can be added here
  <Route key="courses" path={`/courses`} element={<Courses />} />,
  <Route
    key="course-detail"
    path="/courses/course/:courseId"
    element={<CourseDetail />}
  />,
  <Route
    key="educational-unit-detail"
    path="/educational-unit/:id"
    element={<DetailEducationalUnit />}
  />,

  <Route key="workspace" path="/workspace" element={<WorkspacePage />} />,
  <Route
    key="workspace-with-params"
    path="/workspace/:workspaceId"
    element={<WorkspacePage />}
  />,
  <Route
    key="workspace-with-channel"
    path="/workspace/:workspaceId/:channelId"
    element={<WorkspacePage />}
  />,
];

export default PublicRoutes;
