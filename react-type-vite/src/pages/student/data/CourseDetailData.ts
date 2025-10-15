import { Atom, BookOpen, Boxes, MessagesSquare, Rocket } from "lucide-react";

export const course_tabs = [
  {
    id: "content",
    label: "Nội dung khóa học",
    icon: BookOpen,
  },
  {
    id: "personal_assignments",
    label: "Bài tập cá nhân",
    icon: Rocket,
  },
  {
    id: "group_assignments",
    label: "Bài tập nhóm",
    icon: Boxes,
  },
  {
    id: "quiz",
    label: "Quiz và kiểm tra",
    icon: Atom,
  },
  {
    id: "score_feedback",
    label: "Điểm và phản hồi",
    icon: MessagesSquare,
  },
];
