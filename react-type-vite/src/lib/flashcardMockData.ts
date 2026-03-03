export interface Flashcard {
  id: string;
  front: string;
  back: string;
  tags: string[];
  difficulty: "easy" | "medium" | "hard";
}

let flashcardIdCounter = 0;
const genId = () => `fc_${++flashcardIdCounter}_${Date.now()}`;

const mockFlashcardPool: Omit<Flashcard, "id">[] = [
  {
    front: "React là gì?",
    back: "React là một thư viện JavaScript mã nguồn mở được phát triển bởi Meta (Facebook) để xây dựng giao diện người dùng, đặc biệt là các ứng dụng single-page.",
    tags: ["react", "framework"],
    difficulty: "easy",
  },
  {
    front: "Virtual DOM hoạt động như thế nào?",
    back: "Virtual DOM là một bản sao nhẹ của DOM thực. React tạo Virtual DOM trong bộ nhớ, so sánh với DOM thực, và chỉ cập nhật những phần thay đổi. Điều này giúp tối ưu hiệu suất.",
    tags: ["react", "virtual-dom"],
    difficulty: "medium",
  },
  {
    front: "useState hook dùng để làm gì?",
    back: "useState là một React Hook cho phép bạn thêm state vào functional components. Nó trả về một array với giá trị hiện tại và hàm để cập nhật giá trị đó.",
    tags: ["react", "hooks"],
    difficulty: "easy",
  },
  {
    front: "useEffect có lifecycle nào?",
    back: "useEffect chạy sau mỗi render. Với dependency array rỗng [], nó chạy một lần khi mount. Với dependencies, nó chạy khi dependencies thay đổi. Return function là cleanup.",
    tags: ["react", "hooks", "lifecycle"],
    difficulty: "medium",
  },
  {
    front: "Props và State khác nhau như thế nào?",
    back: "Props được truyền từ parent xuống child và không thể thay đổi (immutable). State được quản lý bên trong component và có thể thay đổi (mutable).",
    tags: ["react", "concepts"],
    difficulty: "easy",
  },
  {
    front: "Context API được sử dụng khi nào?",
    back: "Context API được dùng để chia sẻ data giữa nhiều components mà không cần truyền props qua nhiều cấp (prop drilling). Thích hợp cho theme, auth, localization.",
    tags: ["react", "context"],
    difficulty: "medium",
  },
  {
    front: "Reducer pattern trong React là gì?",
    back: "Reducer là một pure function nhận state hiện tại và action, trả về state mới. useReducer hook giúp quản lý state phức tạp với logic cập nhật tập trung.",
    tags: ["react", "reducer", "patterns"],
    difficulty: "hard",
  },
  {
    front: "Memoization trong React?",
    back: "React.memo, useMemo, và useCallback được dùng để tối ưu hiệu suất bằng cách lưu cache kết quả và tránh re-render/re-compute không cần thiết.",
    tags: ["react", "optimization"],
    difficulty: "medium",
  },
  {
    front: "Custom Hook là gì?",
    back: 'Custom Hook là một JavaScript function bắt đầu với "use" và có thể gọi các hooks khác. Dùng để tái sử dụng stateful logic giữa các components.',
    tags: ["react", "hooks", "custom"],
    difficulty: "medium",
  },
  {
    front: "React.Fragment dùng để làm gì?",
    back: "React.Fragment (hoặc <>) cho phép nhóm nhiều elements mà không tạo thêm DOM node. Hữu ích khi component cần return nhiều elements.",
    tags: ["react", "jsx"],
    difficulty: "easy",
  },
];

export function generateMockFlashcards(count: number): Flashcard[] {
  const selected = mockFlashcardPool
    .sort(() => Math.random() - 0.5)
    .slice(0, Math.min(count, mockFlashcardPool.length));

  return selected.map((card) => ({
    ...card,
    id: genId(),
  }));
}
