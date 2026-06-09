import {
  PUBLIC_ROUTES,
  STUDENT_ROUTES,
  FORUM_ROUTES,
  WORKSPACE_ROUTES,
} from "@/constants/routes";

export const navigation = [
  { name: "Trang chủ", href: PUBLIC_ROUTES.HOME },
  {
    name: "Khóa học",
    href: "/courses",
    features: [
      { name: "Tất cả khóa học", href: PUBLIC_ROUTES.COURSES },
      { name: "Trang học tập số", href: STUDENT_ROUTES.DASHBOARD },
      { name: "Không gian học tập", href: WORKSPACE_ROUTES.BASE },
    ],
  },
  { name: "Diễn đàn", href: FORUM_ROUTES.HOME },
  { name: "Xác minh chứng chỉ", href: PUBLIC_ROUTES.CERTIFICATE_VERIFY_BASE },
  { name: "Về chúng tôi", href: PUBLIC_ROUTES.ABOUT_US },
  { name: "Liên hệ", href: PUBLIC_ROUTES.CONTACT },
];
