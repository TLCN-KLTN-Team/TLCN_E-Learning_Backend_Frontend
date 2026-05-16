/**
 * Application Routes Constants
 * Centralized route definitions for easy maintenance
 * Use these constants in both route definitions and navigation links
 */

// ============================================
// PUBLIC ROUTES
// ============================================
export const PUBLIC_ROUTES = {
  HOME: "/",
  LOGIN: "/login",
  REGISTER: "/register",
  FORGOT_PASSWORD: "/forgot-password",
  CERTIFICATE_VERIFY_BASE: "/certificate/verify",
  ABOUT_US: "/about-us",
  CONTACT: "/contact",
  REGISTER_EDUCATION_UNIT: "/register-education-unit",

  // Auth Callbacks
  GOOGLE_AUTH_CALLBACK: "/auth/google/callback/",
  FACEBOOK_AUTH_CALLBACK: "/auth/facebook/callback/",

  // Courses (Public accessible)
  COURSES: "/courses",
} as const;

// ============================================
// STUDENT ROUTES
// ============================================
export const STUDENT_ROUTES = {
  DASHBOARD: "/student/dashboard",
  EDIT_PROFILE: "/student/edit-profile",
  WORKSPACE: "/student/workspace",
  NOTIFICATIONS: "/student/notifications",
} as const;

// ============================================
// TEACHER ROUTES
// ============================================
export const TEACHER_ROUTES = {
  BASE: "/teacher",
  HOME: "/teacher/assigned-courses",
  DASHBOARD: "/teacher/dashboard",
  NOTIFICATIONS: "/teacher/notifications",
  ASSIGNED_COURSES: "/teacher/assigned-courses",
  PUBLIC_COURSES: "/teacher/public-courses",
  QUESTION_BANK: "/teacher/question-bank",
  GENERATE_QUESTIONS: "/teacher/generate-questions",
  REVENUE: "/teacher/revenue",
  CREDIT_TRANSFERS: "/teacher/credit-transfers",
  INFO: "/teacher/info",
} as const;

// ============================================
// ADMIN ROUTES
// ============================================
export const ADMIN_ROUTES = {
  BASE: "/admin",
  DASHBOARD: "/admin/dashboard",
  NOTIFICATIONS: "/admin/notifications",
  EXPERTS: "/admin/experts",
  STUDENTS: "/admin/students",
  INSTRUCTORS: "/admin/instructors",
  DEPARTMENTS: "/admin/departments",
  REVENUE: "/admin/revenue",
  INFO: "/admin/info",
} as const;

// ============================================
// EXPERT ROUTES
// ============================================
export const EXPERT_ROUTES = {
  BASE: "/expert",
  COURSES: "/expert/courses",
  PUBLISHED_COURSES: "/expert/published-courses",
  NOTIFICATIONS: "/expert/notifications",
} as const;

// ============================================
// SYSTEM ADMIN ROUTES
// ============================================
export const SYSTEM_ADMIN_ROUTES = {
  BASE: "/system-admin",
  DASHBOARD: "/system-admin/dashboard",
  NOTIFICATIONS: "/system-admin/notifications",
  TRAINING_UNITS: "/system-admin/training-units",
  ACCOUNTS: "/system-admin/accounts",
  CATEGORIES: "/system-admin/categories",
  REVENUE: "/system-admin/revenue",
  STATISTICS: "/system-admin/statistics",
  PROFILE: "/system-admin/profile",
  EDIT_PROFILE: "/system-admin/edit-profile",
  INFO: "/system-admin/info",
} as const;

// ============================================
// USER ROUTES (Authenticated users)
// ============================================
export const USER_ROUTES = {
  EDIT_PROFILE: "/edit-profile",
  NOTIFICATIONS: "/notifications",
  CART: "/cart",
  WISHLIST: "/wishlist",
  MY_COURSES: "/my-courses",
  DOCUMENT_LIBRARY: "/document-library",
  PAYMENT_CHECKOUT: "/payment/checkout/express/course",
  VNPAY_RETURN: "/payment/checkout/express/vnpay/return",
  PAYPAL_RETURN: "/payment/checkout/express/paypal/return",
} as const;

// ============================================
// WORKSPACE ROUTES (Shared: Student & Teacher)
// ============================================
export const WORKSPACE_ROUTES = {
  BASE: "/workspaces",
} as const;

// ============================================
// FORUM ROUTES
// ============================================
export const FORUM_ROUTES = {
  HOME: "/forum",
  CREATE: "/forum/create",
  BOOKMARKS: "/forum/bookmarks",
} as const;

// ============================================
// DYNAMIC ROUTE GENERATORS
// Helper functions to generate routes with parameters
// ============================================
export const createRoute = {
  // Course Routes
  courseDetail: (courseId: string | number) => `/courses/${courseId}`,
  courseDetailStudent: (id: string | number) =>
    `/student/dashboard/course/classes/${id}`,
  courseLearning: (courseId: string | number) => `/course/${courseId}/learn`,
  courseEdit: (courseId: string | number) =>
    `/teacher/courses/${courseId}/edit`,
  courseManage: (courseId: string | number) =>
    `/teacher/courses/${courseId}/manage`,
  courseStudents: (courseId: string | number) =>
    `/teacher/public-courses/${courseId}/students`,

  // Teacher Routes
  teacherDetail: (teacherId: string | number) => `/teacher/${teacherId}`,

  // Educational Unit Routes
  educationalUnitDetail: (id: string | number) => `/educational-units/${id}`,

  // Workspace Routes
  workspace: (workspaceId?: string | number, channelId?: string | number) => {
    if (!workspaceId) return WORKSPACE_ROUTES.BASE;
    if (!channelId) return `${WORKSPACE_ROUTES.BASE}/${workspaceId}`;
    return `${WORKSPACE_ROUTES.BASE}/${workspaceId}/${channelId}`;
  },

  // Quiz Routes
  quizAttempt: (quizId: string | number, attemptId: string | number) =>
    `/student/quiz/${quizId}/attempt/${attemptId}`,
  quizResult: (quizId: string | number, attemptId: string | number) =>
    `/student/quiz/${quizId}/result/${attemptId}`,
  userQuiz: (quizId: string | number) => `/user/quiz/${quizId}`,

  // Student Quizzes & Assignments (Teacher view)
  studentQuizzes: (courseId: string | number, studentId: string | number) =>
    `/teacher/public-courses/${courseId}/students/${studentId}/quizzes`,
  studentAssignments: (courseId: string | number, studentId: string | number) =>
    `/teacher/public-courses/${courseId}/students/${studentId}/assignments`,

  // Forum Routes
  forumPostDetail: (id: string | number) => `/forum/posts/${id}`,

  // Certificate Routes
  certificateVerify: (code: string) => `/certificate/verify/${encodeURIComponent(code)}`,

  // Expert Routes
  publishedCourseDetail: (publishedCourseId: string | number) =>
    `/expert/published-courses/${publishedCourseId}`,
} as const;

// ============================================
// ROUTE PATTERNS (for React Router path definitions)
// Use these in Route components with :param syntax
// ============================================
export const ROUTE_PATTERNS = {
  // Course patterns
  COURSE_DETAIL: "/courses/:courseId",
  COURSE_DETAIL_STUDENT: "/student/dashboard/course/classes/:id",
  COURSE_LEARNING: "/course/:courseId/learn",
  COURSE_EDIT: "/teacher/courses/:courseId/edit",
  COURSE_MANAGE: "/teacher/courses/:courseId/manage",
  COURSE_STUDENTS: "/teacher/public-courses/:courseId/students",

  // Teacher patterns
  TEACHER_DETAIL: "/teacher/:teacherId",

  // Educational Unit patterns
  EDUCATIONAL_UNIT_DETAIL: "/educational-units/:id",

  // Workspace patterns
  WORKSPACE_WITH_ID: "/workspaces/:workspaceId",
  WORKSPACE_SECTION_CHANNEL: "/workspaces/:workspaceId/:sectionId/:channelId",
  WORKSPACE_WITH_CHANNEL: "/workspaces/:workspaceId/:channelId",

  // Quiz patterns
  QUIZ_ATTEMPT: "/student/quiz/:quizId/attempt/:attemptId",
  QUIZ_RESULT: "/student/quiz/:quizId/result/:attemptId",
  USER_QUIZ: "/user/quiz/:quizId",

  // Student management patterns (Teacher view)
  STUDENT_QUIZZES:
    "/teacher/public-courses/:courseId/students/:studentId/quizzes",
  STUDENT_ASSIGNMENTS:
    "/teacher/public-courses/:courseId/students/:studentId/assignments",

  // Forum patterns
  FORUM_POST_DETAIL: "/forum/posts/:id",

  // Certificate verification patterns
  CERTIFICATE_VERIFY: "/certificate/verify/:code",

  // Expert patterns
  PUBLISHED_COURSE_DETAIL: "/expert/published-courses/:publishedCourseId",
} as const;

// ============================================
// EXPORTS
// ============================================
export default {
  PUBLIC_ROUTES,
  STUDENT_ROUTES,
  TEACHER_ROUTES,
  ADMIN_ROUTES,
  EXPERT_ROUTES,
  SYSTEM_ADMIN_ROUTES,
  USER_ROUTES,
  WORKSPACE_ROUTES,
  FORUM_ROUTES,
  createRoute,
  ROUTE_PATTERNS,
};
