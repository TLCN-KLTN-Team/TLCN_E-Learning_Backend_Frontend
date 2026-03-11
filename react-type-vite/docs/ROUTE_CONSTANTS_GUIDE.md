# Route Constants Guide

## Tổng quan

Hệ thống Route Constants giúp quản lý tất cả các routes trong ứng dụng một cách tập trung, dễ bảo trì và tránh lỗi khi thay đổi đường dẫn.

## Lợi ích

1. **Tập trung quản lý**: Tất cả routes được định nghĩa tại một nơi duy nhất
2. **Dễ bảo trì**: Khi cần đổi đường dẫn, chỉ cần sửa ở file constants
3. **Tránh lỗi typo**: Sử dụng TypeScript constants thay vì hardcoded strings
4. **IntelliSense support**: IDE sẽ gợi ý và autocomplete
5. **Type safety**: TypeScript sẽ báo lỗi nếu sử dụng sai

## Cấu trúc File

File constants được lưu tại: `src/constants/routes.ts`

### Các nhóm Routes

```typescript
// Public Routes - Routes công khai, không cần đăng nhập
PUBLIC_ROUTES;

// Student Routes - Routes dành cho học sinh
STUDENT_ROUTES;

// Teacher Routes - Routes dành cho giáo viên
TEACHER_ROUTES;

// Admin Routes - Routes dành cho admin
ADMIN_ROUTES;

// Expert Routes - Routes dành cho chuyên gia
EXPERT_ROUTES;

// System Admin Routes - Routes dành cho super admin
SYSTEM_ADMIN_ROUTES;

// User Routes - Routes dành cho người dùng đã đăng nhập
USER_ROUTES;

// Workspace Routes - Routes không gian làm việc (shared)
WORKSPACE_ROUTES;

// Forum Routes - Routes diễn đàn
FORUM_ROUTES;
```

## Cách sử dụng

### 1. Trong Route Definitions

**Trước đây (hardcoded):**

```tsx
<Route path="/student/dashboard" element={<StudentDashboard />} />
```

**Bây giờ (sử dụng constants):**

```tsx
import { STUDENT_ROUTES } from "@/constants/routes";

<Route path={STUDENT_ROUTES.DASHBOARD} element={<StudentDashboard />} />;
```

### 2. Trong Navigation Components

**Trước đây:**

```tsx
export const navigation = [
  { name: "Trang chủ", href: "/" },
  { name: "Khóa học", href: "/courses" },
  { name: "Dashboard", href: "/student/dashboard" },
];
```

**Bây giờ:**

```tsx
import { PUBLIC_ROUTES, STUDENT_ROUTES } from "@/constants/routes";

export const navigation = [
  { name: "Trang chủ", href: PUBLIC_ROUTES.HOME },
  { name: "Khóa học", href: PUBLIC_ROUTES.COURSES },
  { name: "Dashboard", href: STUDENT_ROUTES.DASHBOARD },
];
```

### 3. Trong Component Navigation (Link, useNavigate)

**Với React Router Link:**

```tsx
import { Link } from "react-router-dom";
import { STUDENT_ROUTES } from "@/constants/routes";

function MyComponent() {
  return <Link to={STUDENT_ROUTES.DASHBOARD}>Go to Dashboard</Link>;
}
```

**Với useNavigate:**

```tsx
import { useNavigate } from "react-router-dom";
import { STUDENT_ROUTES } from "@/constants/routes";

function MyComponent() {
  const navigate = useNavigate();

  const goToDashboard = () => {
    navigate(STUDENT_ROUTES.DASHBOARD);
  };

  return <button onClick={goToDashboard}>Go to Dashboard</button>;
}
```

### 4. Dynamic Routes (Routes với Parameters)

Để tạo routes động với parameters, sử dụng hàm helper `createRoute`:

**Route Patterns (cho React Router):**

```tsx
import { ROUTE_PATTERNS } from "@/constants/routes";

<Route path={ROUTE_PATTERNS.COURSE_DETAIL} element={<CourseDetail />} />;
// Tạo route: /courses/:courseId
```

**Generate URL với parameters:**

```tsx
import { createRoute } from "@/constants/routes";

// Tạo URL cụ thể
const courseUrl = createRoute.courseDetail(123);
// Result: "/courses/123"

const workspaceUrl = createRoute.workspace(456, 789);
// Result: "/workspaces/456/789"
```

**Ví dụ sử dụng trong component:**

```tsx
import { Link } from "react-router-dom";
import { createRoute } from "@/constants/routes";

function CourseList({ courses }) {
  return (
    <div>
      {courses.map((course) => (
        <Link key={course.id} to={createRoute.courseDetail(course.id)}>
          {course.name}
        </Link>
      ))}
    </div>
  );
}
```

## Danh sách Route Helpers

### Course Routes

- `createRoute.courseDetail(courseId)` - Chi tiết khóa học public
- `createRoute.courseDetailStudent(id)` - Chi tiết khóa học của student
- `createRoute.courseLearning(courseId)` - Trang học khóa học
- `createRoute.courseEdit(courseId)` - Chỉnh sửa khóa học (teacher)
- `createRoute.courseManage(courseId)` - Quản lý khóa học (teacher)
- `createRoute.courseStudents(courseId)` - Danh sách học sinh trong khóa học

### Teacher Routes

- `createRoute.teacherDetail(teacherId)` - Chi tiết giáo viên

### Educational Unit Routes

- `createRoute.educationalUnitDetail(id)` - Chi tiết cơ sở đào tạo

### Workspace Routes

- `createRoute.workspace()` - Danh sách workspace
- `createRoute.workspace(workspaceId)` - Workspace cụ thể
- `createRoute.workspace(workspaceId, channelId)` - Channel trong workspace

### Quiz Routes

- `createRoute.quizAttempt(quizId, attemptId)` - Làm bài quiz
- `createRoute.quizResult(quizId, attemptId)` - Kết quả quiz
- `createRoute.userQuiz(quizId)` - Quiz của user

### Student Management (Teacher View)

- `createRoute.studentQuizzes(courseId, studentId)` - Xem quiz của học sinh
- `createRoute.studentAssignments(courseId, studentId)` - Xem bài tập của học sinh

### Forum Routes

- `createRoute.forumPostDetail(id)` - Chi tiết bài đăng forum

### Expert Routes

- `createRoute.publishedCourseDetail(publishedCourseId)` - Chi tiết khóa học đã publish

## Best Practices

### 1. Luôn import constants thay vì hardcode

❌ **Không nên:**

```tsx
<Link to="/student/dashboard">Dashboard</Link>
```

✅ **Nên:**

```tsx
import { STUDENT_ROUTES } from "@/constants/routes";
<Link to={STUDENT_ROUTES.DASHBOARD}>Dashboard</Link>;
```

### 2. Sử dụng createRoute cho dynamic routes

❌ **Không nên:**

```tsx
<Link to={`/courses/${courseId}`}>View Course</Link>
```

✅ **Nên:**

```tsx
import { createRoute } from "@/constants/routes";
<Link to={createRoute.courseDetail(courseId)}>View Course</Link>;
```

### 3. Sử dụng ROUTE_PATTERNS cho Route definitions

❌ **Không nên:**

```tsx
<Route path="/courses/:courseId" element={<CourseDetail />} />
```

✅ **Nên:**

```tsx
import { ROUTE_PATTERNS } from "@/constants/routes";
<Route path={ROUTE_PATTERNS.COURSE_DETAIL} element={<CourseDetail />} />;
```

### 4. Tổ chức import hợp lý

```tsx
// Import nhiều constants cùng lúc
import {
  PUBLIC_ROUTES,
  STUDENT_ROUTES,
  createRoute,
  ROUTE_PATTERNS,
} from "@/constants/routes";
```

## Thêm Route Mới

Khi cần thêm route mới:

### 1. Thêm route tĩnh

Mở `src/constants/routes.ts` và thêm vào nhóm phù hợp:

```typescript
export const STUDENT_ROUTES = {
  DASHBOARD: "/student/dashboard",
  EDIT_PROFILE: "/student/edit-profile",
  NEW_ROUTE: "/student/new-route", // <-- Route mới
} as const;
```

### 2. Thêm route động

Thêm pattern vào `ROUTE_PATTERNS`:

```typescript
export const ROUTE_PATTERNS = {
  COURSE_DETAIL: "/courses/:courseId",
  NEW_DYNAMIC_ROUTE: "/student/course/:courseId/lesson/:lessonId", // <-- Pattern mới
} as const;
```

Thêm helper function vào `createRoute`:

```typescript
export const createRoute = {
  courseDetail: (courseId: string | number) => `/courses/${courseId}`,
  newDynamicRoute: (courseId: string | number, lessonId: string | number) =>
    `/student/course/${courseId}/lesson/${lessonId}`, // <-- Helper mới
} as const;
```

### 3. Sử dụng route mới

**Trong Route definition:**

```tsx
import { ROUTE_PATTERNS } from "@/constants/routes";
<Route path={ROUTE_PATTERNS.NEW_DYNAMIC_ROUTE} element={<NewPage />} />;
```

**Trong navigation:**

```tsx
import { createRoute } from "@/constants/routes";
<Link to={createRoute.newDynamicRoute(courseId, lessonId)}>Go to Lesson</Link>;
```

## Migration Notes

Tất cả các file routes đã được cập nhật để sử dụng constants:

- ✅ MainRoute.tsx
- ✅ PublicRoute.tsx
- ✅ StudentRoute.tsx
- ✅ TeacherRoute.tsx
- ✅ AdminRoute.tsx
- ✅ ExpertRoute.tsx
- ✅ SystemAdminRoute.tsx
- ✅ UserRoute.tsx
- ✅ pageNavigations.ts

Khi làm việc với các component khác, hãy dần chuyển sang sử dụng route constants.

## Troubleshooting

### Route không hoạt động sau khi đổi sang constants

**Kiểm tra:**

1. Đảm bảo đã import đúng constant
2. Kiểm tra spelling của constant name
3. Verify rằng route pattern khớp với component Route

### TypeScript báo lỗi khi sử dụng constant

**Nguyên nhân:** Có thể constant chưa được định nghĩa

**Giải pháp:** Thêm constant vào file `routes.ts` hoặc kiểm tra lại import

### Dynamic route không generate đúng URL

**Kiểm tra:**

1. Parameters truyền vào có đúng kiểu (string hoặc number)?
2. Thứ tự parameters có đúng không?
3. Có thiếu parameters nào không?

## Kết luận

Hệ thống Route Constants giúp code dễ đọc, dễ bảo trì và giảm thiểu lỗi. Hãy luôn sử dụng constants thay vì hardcoded strings khi làm việc với routes.
