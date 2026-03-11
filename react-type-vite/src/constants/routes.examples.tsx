/**
 * ROUTE CONSTANTS - USAGE EXAMPLES
 *
 * File này chứa các ví dụ thực tế về cách sử dụng route constants
 * trong ứng dụng E-Learning
 */

import { Link, useNavigate } from "react-router-dom";
import {
  PUBLIC_ROUTES,
  STUDENT_ROUTES,
  TEACHER_ROUTES,
  ADMIN_ROUTES,
  USER_ROUTES,
  FORUM_ROUTES,
  WORKSPACE_ROUTES,
  createRoute,
  ROUTE_PATTERNS,
} from "@/constants/routes";

// ============================================
// 1. STATIC ROUTES - Navigation Links
// ============================================

/**
 * Ví dụ: Navigation menu công khai
 */
export const PublicNavigation = () => {
  return (
    <nav>
      <Link to={PUBLIC_ROUTES.HOME}>Trang chủ</Link>
      <Link to={PUBLIC_ROUTES.COURSES}>Khóa học</Link>
      <Link to={FORUM_ROUTES.HOME}>Diễn đàn</Link>
      <Link to={PUBLIC_ROUTES.ABOUT_US}>Về chúng tôi</Link>
      <Link to={PUBLIC_ROUTES.CONTACT}>Liên hệ</Link>
    </nav>
  );
};

/**
 * Ví dụ: Student Dashboard Navigation
 */
export const StudentNavigation = () => {
  return (
    <nav>
      <Link to={STUDENT_ROUTES.DASHBOARD}>Dashboard</Link>
      <Link to={USER_ROUTES.MY_COURSES}>Khóa học của tôi</Link>
      <Link to={USER_ROUTES.DOCUMENT_LIBRARY}>Thư viện tài liệu</Link>
      <Link to={WORKSPACE_ROUTES.BASE}>Workspace</Link>
    </nav>
  );
};

/**
 * Ví dụ: Teacher Dashboard Navigation
 */
export const TeacherNavigation = () => {
  return (
    <nav>
      <Link to={TEACHER_ROUTES.DASHBOARD}>Dashboard</Link>
      <Link to={TEACHER_ROUTES.ASSIGNED_COURSES}>Khóa học được giao</Link>
      <Link to={TEACHER_ROUTES.PUBLIC_COURSES}>Khóa học công khai</Link>
      <Link to={TEACHER_ROUTES.QUESTION_BANK}>Ngân hàng câu hỏi</Link>
      <Link to={TEACHER_ROUTES.REVENUE}>Doanh thu</Link>
    </nav>
  );
};

// ============================================
// 2. DYNAMIC ROUTES - Với Parameters
// ============================================

/**
 * Ví dụ: Course Card - Navigate to course detail
 */
interface Course {
  id: number;
  name: string;
  teacher: {
    id: number;
    name: string;
  };
}

export const CourseCard = ({ course }: { course: Course }) => {
  return (
    <div className="course-card">
      <h3>{course.name}</h3>

      {/* Link đến chi tiết khóa học */}
      <Link to={createRoute.courseDetail(course.id)}>Xem chi tiết</Link>

      {/* Link đến profile giáo viên */}
      <Link to={createRoute.teacherDetail(course.teacher.id)}>
        {course.teacher.name}
      </Link>
    </div>
  );
};

/**
 * Ví dụ: Quiz List - Link to quiz attempts and results
 */
interface Quiz {
  id: number;
  name: string;
  attemptId?: number;
}

export const QuizList = ({ quizzes }: { quizzes: Quiz[] }) => {
  return (
    <div>
      {quizzes.map((quiz) => (
        <div key={quiz.id}>
          <h4>{quiz.name}</h4>

          {/* Link đến làm bài quiz */}
          {quiz.attemptId ? (
            <>
              <Link to={createRoute.quizAttempt(quiz.id, quiz.attemptId)}>
                Tiếp tục làm bài
              </Link>
              <Link to={createRoute.quizResult(quiz.id, quiz.attemptId)}>
                Xem kết quả
              </Link>
            </>
          ) : (
            <Link to={createRoute.userQuiz(quiz.id)}>Bắt đầu làm bài</Link>
          )}
        </div>
      ))}
    </div>
  );
};

/**
 * Ví dụ: Workspace Navigation - Có thể có hoặc không có channel
 */
interface WorkspaceNavProps {
  workspaceId?: number;
  channelId?: number;
}

export const WorkspaceNav = ({ workspaceId, channelId }: WorkspaceNavProps) => {
  return (
    <nav>
      {/* Link đến danh sách workspace */}
      <Link to={createRoute.workspace()}>Tất cả Workspace</Link>

      {/* Link đến workspace cụ thể */}
      {workspaceId && (
        <Link to={createRoute.workspace(workspaceId)}>Workspace hiện tại</Link>
      )}

      {/* Link đến channel trong workspace */}
      {workspaceId && channelId && (
        <Link to={createRoute.workspace(workspaceId, channelId)}>
          Channel hiện tại
        </Link>
      )}
    </nav>
  );
};

// ============================================
// 3. PROGRAMMATIC NAVIGATION - useNavigate
// ============================================

/**
 * Ví dụ: Login Form - Navigate sau khi login thành công
 */
export const LoginForm = () => {
  const navigate = useNavigate();

  const handleLogin = async (role: string) => {
    // ... login logic

    // Navigate dựa trên role
    switch (role) {
      case "STUDENT":
        navigate(STUDENT_ROUTES.DASHBOARD);
        break;
      case "TEACHER":
        navigate(TEACHER_ROUTES.DASHBOARD);
        break;
      case "ADMIN":
        navigate(ADMIN_ROUTES.DASHBOARD);
        break;
      default:
        navigate(PUBLIC_ROUTES.HOME);
    }
  };

  return <div>{/* Login form */}</div>;
};

/**
 * Ví dụ: Course Enrollment - Navigate to course learning after enrollment
 */
export const CourseEnrollButton = ({ courseId }: { courseId: number }) => {
  const navigate = useNavigate();

  const handleEnroll = async () => {
    // ... enrollment logic

    // Navigate đến trang học
    navigate(createRoute.courseLearning(courseId));
  };

  return <button onClick={handleEnroll}>Đăng ký ngay</button>;
};

/**
 * Ví dụ: Teacher - View Student Progress
 */
export const StudentProgressButton = ({
  courseId,
  studentId,
}: {
  courseId: number;
  studentId: number;
}) => {
  const navigate = useNavigate();

  const viewQuizzes = () => {
    navigate(createRoute.studentQuizzes(courseId, studentId));
  };

  const viewAssignments = () => {
    navigate(createRoute.studentAssignments(courseId, studentId));
  };

  return (
    <div>
      <button onClick={viewQuizzes}>Xem Quiz</button>
      <button onClick={viewAssignments}>Xem Bài tập</button>
    </div>
  );
};

// ============================================
// 4. CONDITIONAL NAVIGATION - Dựa trên state
// ============================================

/**
 * Ví dụ: User Profile Button - Navigate dựa trên role
 */
interface User {
  role: string;
  id: number;
}

export const UserProfileButton = ({ user }: { user: User }) => {
  const getProfileRoute = () => {
    switch (user.role) {
      case "STUDENT":
        return STUDENT_ROUTES.EDIT_PROFILE;
      case "TEACHER":
        return TEACHER_ROUTES.INFO;
      case "ADMIN":
        return ADMIN_ROUTES.INFO;
      default:
        return USER_ROUTES.EDIT_PROFILE;
    }
  };

  return <Link to={getProfileRoute()}>Hồ sơ của tôi</Link>;
};

/**
 * Ví dụ: Shopping Cart - Navigate to payment or login
 */
export const CheckoutButton = ({ isLoggedIn }: { isLoggedIn: boolean }) => {
  const navigate = useNavigate();

  const handleCheckout = () => {
    if (isLoggedIn) {
      navigate(USER_ROUTES.PAYMENT_CHECKOUT);
    } else {
      // Redirect to login, sau đó quay lại payment
      navigate(PUBLIC_ROUTES.LOGIN, {
        state: { returnUrl: USER_ROUTES.PAYMENT_CHECKOUT },
      });
    }
  };

  return <button onClick={handleCheckout}>Thanh toán</button>;
};

// ============================================
// 5. BREADCRUMBS - Sử dụng route constants
// ============================================

/**
 * Ví dụ: Breadcrumb Navigation
 */
export const CourseBreadcrumbs = ({
  courseId,
  courseName,
}: {
  courseId: number;
  courseName: string;
}) => {
  return (
    <nav aria-label="Breadcrumb">
      <ol>
        <li>
          <Link to={PUBLIC_ROUTES.HOME}>Trang chủ</Link>
        </li>
        <li>
          <Link to={PUBLIC_ROUTES.COURSES}>Khóa học</Link>
        </li>
        <li>
          <Link to={createRoute.courseDetail(courseId)}>{courseName}</Link>
        </li>
      </ol>
    </nav>
  );
};

// ============================================
// 6. ROUTE DATA ARRAYS - Cho sidebar, menu, etc.
// ============================================

/**
 * Ví dụ: Student Sidebar Menu
 */
export const studentSidebarMenu = [
  {
    title: "Dashboard",
    icon: "HomeIcon",
    route: STUDENT_ROUTES.DASHBOARD,
  },
  {
    title: "Khóa học của tôi",
    icon: "BookIcon",
    route: USER_ROUTES.MY_COURSES,
  },
  {
    title: "Thư viện",
    icon: "LibraryIcon",
    route: USER_ROUTES.DOCUMENT_LIBRARY,
  },
  {
    title: "Workspace",
    icon: "WorkspaceIcon",
    route: WORKSPACE_ROUTES.BASE,
  },
  {
    title: "Giỏ hàng",
    icon: "CartIcon",
    route: USER_ROUTES.CART,
  },
  {
    title: "Wishlist",
    icon: "HeartIcon",
    route: USER_ROUTES.WISHLIST,
  },
];

/**
 * Ví dụ: Teacher Sidebar Menu
 */
export const teacherSidebarMenu = [
  {
    title: "Dashboard",
    icon: "HomeIcon",
    route: TEACHER_ROUTES.DASHBOARD,
  },
  {
    title: "Khóa học được giao",
    icon: "BookIcon",
    route: TEACHER_ROUTES.ASSIGNED_COURSES,
  },
  {
    title: "Khóa học công khai",
    icon: "GlobeIcon",
    route: TEACHER_ROUTES.PUBLIC_COURSES,
  },
  {
    title: "Ngân hàng câu hỏi",
    icon: "QuestionIcon",
    route: TEACHER_ROUTES.QUESTION_BANK,
  },
  {
    title: "Tạo câu hỏi AI",
    icon: "SparklesIcon",
    route: TEACHER_ROUTES.GENERATE_QUESTIONS,
  },
  {
    title: "Doanh thu",
    icon: "DollarIcon",
    route: TEACHER_ROUTES.REVENUE,
  },
];

// ============================================
// 7. UTILITY FUNCTIONS
// ============================================

/**
 * Ví dụ: Check if current route matches
 */
export const isActiveRoute = (
  currentPath: string,
  targetRoute: string,
): boolean => {
  return currentPath === targetRoute;
};

/**
 * Ví dụ: Get dashboard route by role
 */
export const getDashboardRoute = (role: string): string => {
  const routeMap: Record<string, string> = {
    STUDENT: STUDENT_ROUTES.DASHBOARD,
    TEACHER: TEACHER_ROUTES.DASHBOARD,
    ADMIN: ADMIN_ROUTES.DASHBOARD,
    SUPER_ADMIN: "/system-admin/dashboard",
    EXPERT: "/expert",
  };

  return routeMap[role] || PUBLIC_ROUTES.HOME;
};

/**
 * Ví dụ: Validate and redirect after payment
 */
export const handlePaymentReturn = (
  navigate: ReturnType<typeof useNavigate>,
  paymentMethod: "vnpay" | "paypal",
  success: boolean,
) => {
  if (success) {
    navigate(USER_ROUTES.MY_COURSES);
  } else {
    navigate(USER_ROUTES.CART);
  }
};

// ============================================
// 8. ROUTE ACCESS CONTROL
// ============================================

/**
 * Ví dụ: Check if user can access route
 */
export const canAccessRoute = (route: string, userRole: string): boolean => {
  const roleRoutes: Record<string, string[]> = {
    STUDENT: [
      STUDENT_ROUTES.DASHBOARD,
      STUDENT_ROUTES.EDIT_PROFILE,
      USER_ROUTES.MY_COURSES,
      USER_ROUTES.DOCUMENT_LIBRARY,
      WORKSPACE_ROUTES.BASE,
    ],
    TEACHER: [
      TEACHER_ROUTES.DASHBOARD,
      TEACHER_ROUTES.ASSIGNED_COURSES,
      TEACHER_ROUTES.PUBLIC_COURSES,
      WORKSPACE_ROUTES.BASE,
    ],
    ADMIN: [
      ADMIN_ROUTES.DASHBOARD,
      ADMIN_ROUTES.STUDENTS,
      ADMIN_ROUTES.INSTRUCTORS,
    ],
  };

  return roleRoutes[userRole]?.includes(route) ?? false;
};

/**
 * NOTE: Đây chỉ là các ví dụ để tham khảo cách sử dụng.
 * Trong code thực tế, bạn sẽ implement tương tự nhưng phù hợp với logic của component.
 */
