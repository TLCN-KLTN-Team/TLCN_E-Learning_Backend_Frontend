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
import TeacherDetail from "@/pages/user/course/TeacherDetail";
import DetailEducationalUnit from "@/pages/user/universitry/DetailEducationalUnit";
import AboutUs from "@/pages/user/home/AboutUs";
import ForumHome from "@/pages/forum/ForumHome";
import ForumCreatePost from "@/pages/forum/ForumCreatePost";
import ForumPostDetail from "@/pages/forum/ForumPostDetail";

import ForumLayout from "@/layouts/ForumLayout";

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
  <Route key="about-us" path="/about-us" element={<AboutUs />} />,
  <Route key="contact" path="/contact" element={<Contact />} />,
  <Route
    key="education-unit-registration"
    path="/register-education-unit"
    element={<EducationUnitRegistration />}
  />,

  // All user accessible routes can be added here
  <Route key="courses" path={`/courses`} element={<Courses />} />,
  <Route
    key="course-detail-alt"
    path="/courses/:courseId"
    element={<CourseDetail />}
  />,
  <Route
    key="teacher-detail"
    path="/teacher/:teacherId"
    element={<TeacherDetail />}
  />,
  <Route
    key="educational-unit-detail"
    path="/educational-units/:id"
    element={<DetailEducationalUnit />}
  />,

  // Forum Routes
  <Route key="forum-layout" element={<ForumLayout />}>
    <Route path="/forum" element={<ForumHome />} />
    <Route path="/forum/create" element={<ForumCreatePost />} />
    <Route path="/forum/posts/:id" element={<ForumPostDetail />} />
  </Route>,
];

export default PublicRoutes;
