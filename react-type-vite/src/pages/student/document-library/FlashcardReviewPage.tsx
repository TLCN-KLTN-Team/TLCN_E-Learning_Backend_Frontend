import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Home,
  Loader2,
  RotateCcw,
  Shuffle,
  Sparkles,
  Tag,
} from "lucide-react";

import Header from "@/components/student/home/Header";
import flashcardApi from "@/services/api/user/flashcard.api";
import {
  toUIFlashcard,
  type FlashcardSetResponse,
  type UIFlashcard,
} from "@/types/flashcard.type";
import { useToast } from "@/hooks/use-toast";
import { USER_ROUTES } from "@/constants/routes";
import "@/styles/flashcard.css";

const DIFFICULTY_LABEL: Record<UIFlashcard["difficulty"], string> = {
  easy: "Dễ",
  medium: "Trung bình",
  hard: "Khó",
};

export default function FlashcardReviewPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [set, setSet] = useState<FlashcardSetResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const [cards, setCards] = useState<UIFlashcard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);

  useEffect(() => {
    let alive = true;

    const load = async () => {
      if (!id) return;
      try {
        setLoading(true);
        const data = await flashcardApi.getFlashcardSetById(id);
        if (!alive) return;
        setSet(data);
        const ui = (data.flashcards ?? []).map((c, idx) =>
          toUIFlashcard(c, `fc_review_${idx}`),
        );
        setCards(ui);
        setCurrentIndex(0);
        setFlipped(false);
      } catch (err) {
        console.error("Failed to load flashcard set:", err);
        toast({
          title: "Lỗi",
          description:
            "Không tải được bộ flashcards. Vui lòng quay lại kho và thử lại.",
          variant: "destructive",
        });
      } finally {
        if (alive) setLoading(false);
      }
    };

    load();
    return () => {
      alive = false;
    };
  }, [id, toast]);

  const currentCard = cards[currentIndex];

  const progress = useMemo(() => {
    if (cards.length === 0) return 0;
    return Math.round(((currentIndex + 1) / cards.length) * 100);
  }, [cards.length, currentIndex]);

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setFlipped(false);
    }
  };

  const handleNext = () => {
    if (currentIndex < cards.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setFlipped(false);
    }
  };

  const handleRestart = () => {
    setCurrentIndex(0);
    setFlipped(false);
  };

  const handleShuffle = () => {
    setCards((prev) => {
      const next = [...prev];
      for (let i = next.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [next[i], next[j]] = [next[j], next[i]];
      }
      return next;
    });
    setCurrentIndex(0);
    setFlipped(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="pt-16 lg:pt-20 flex items-center justify-center min-h-[calc(100vh-4rem)]">
          <div className="text-center">
            <Loader2 className="h-12 w-12 text-primary mx-auto mb-4 animate-spin" />
            <p className="text-muted-foreground">Đang tải bộ flashcards...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!set || cards.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-16 lg:pt-24 mx-auto max-w-3xl px-4 py-12 text-center">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4">
            <BookOpen className="h-7 w-7 text-muted-foreground" />
          </div>
          <h1 className="text-xl font-semibold text-foreground mb-2">
            Không tìm thấy bộ flashcards
          </h1>
          <p className="text-sm text-muted-foreground mb-6">
            Bộ flashcards có thể đã bị xóa hoặc không còn khả dụng.
          </p>
          <button
            onClick={() => navigate(USER_ROUTES.DOCUMENT_LIBRARY)}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Quay lại kho tài liệu
          </button>
        </main>
      </div>
    );
  }

  const setName = set.name?.trim() || "Bộ Flashcards";

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />

      <main className="pt-16 lg:pt-24 mx-auto max-w-5xl px-4 py-8 space-y-6">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb">
          <ol className="flex items-center gap-1.5 text-sm">
            <li>
              <Link
                to="/"
                className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              >
                <Home className="h-3.5 w-3.5" />
                Trang chủ
              </Link>
            </li>
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
            <li>
              <Link
                to={USER_ROUTES.DOCUMENT_LIBRARY}
                className="rounded-md px-2 py-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              >
                Kho tài liệu
              </Link>
            </li>
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
            <li
              aria-current="page"
              className="rounded-md bg-primary/10 px-2 py-1 font-medium text-primary truncate max-w-[60vw]"
            >
              {setName}
            </li>
          </ol>
        </nav>

        {/* Title section */}
        <section className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-blue-500/10 via-cyan-500/10 to-primary/10 p-6">
          <div className="absolute -top-12 -right-12 h-40 w-40 rounded-full bg-blue-500/20 blur-3xl pointer-events-none" />
          <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="space-y-2 min-w-0">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-background/70 backdrop-blur px-3 py-1 text-xs font-medium text-blue-600 dark:text-blue-400">
                <BookOpen className="h-3.5 w-3.5" />
                Ôn tập Flashcards
              </div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight truncate">
                {setName}
              </h1>
              <p className="text-sm text-muted-foreground">
                {cards.length} thẻ · Lật thẻ để xem đáp án và ôn từng câu một.
              </p>
            </div>
            <Link
              to={USER_ROUTES.DOCUMENT_LIBRARY}
              className="inline-flex w-fit items-center gap-2 rounded-lg border border-border bg-background px-3.5 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Về kho tài liệu
            </Link>
          </div>
        </section>

        {/* Progress bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              Thẻ{" "}
              <span className="font-semibold text-foreground tabular-nums">
                {currentIndex + 1}
              </span>{" "}
              / {cards.length}
            </span>
            <span className="tabular-nums">{progress}%</span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 transition-[width] duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Flashcard viewer */}
        <div className="flashcard-container">
          <div className="flashcard-header">
            <div className="flashcard-title">
              <div className="flashcard-title-icon">
                <BookOpen className="h-5 w-5" />
              </div>
              <span className="hidden md:inline">Học Flashcards</span>
              <span
                className={`flashcard-difficulty difficulty-${currentCard.difficulty}`}
              >
                {DIFFICULTY_LABEL[currentCard.difficulty]}
              </span>
            </div>
            <div className="flashcard-actions">
              <button onClick={handleShuffle} className="flashcard-btn">
                <Shuffle className="h-4 w-4" />
                Trộn thẻ
              </button>
              <button onClick={handleRestart} className="flashcard-btn">
                <RotateCcw className="h-4 w-4" />
                Bắt đầu lại
              </button>
            </div>
          </div>

          {/* Card flip */}
          <div className="flashcard-flip-container">
            <div
              className={`flashcard-flip-inner ${flipped ? "flipped" : ""}`}
              onClick={() => setFlipped((f) => !f)}
            >
              <div className="flashcard-face flashcard-face-front">
                <div className="flashcard-label">Mặt trước</div>
                <div className="flashcard-content">
                  <Sparkles className="flashcard-icon" />
                  <p className="flashcard-text">{currentCard.front}</p>
                </div>
                <p className="flashcard-hint">Click để lật thẻ</p>
              </div>
              <div className="flashcard-face flashcard-face-back">
                <div className="flashcard-label">Mặt sau</div>
                <div className="flashcard-content">
                  <p className="flashcard-text flashcard-text-back">
                    {currentCard.back}
                  </p>
                </div>
                <p className="flashcard-hint">Click để lật lại</p>
              </div>
            </div>
          </div>

          {currentCard.tags.length > 0 && (
            <div className="flashcard-tags">
              <Tag className="h-3.5 w-3.5 text-muted-foreground" />
              {currentCard.tags.map((tag) => (
                <span key={tag} className="flashcard-tag">
                  #{tag}
                </span>
              ))}
            </div>
          )}

          <div className="flashcard-navigation">
            <div className="flashcard-nav-controls">
              <button
                onClick={handlePrev}
                disabled={currentIndex === 0}
                className="flashcard-nav-btn"
              >
                <ChevronLeft className="h-4 w-4" />
                <span>Trước</span>
              </button>
              <div className="flashcard-counter">
                {currentIndex + 1} / {cards.length}
              </div>
              <button
                onClick={handleNext}
                disabled={currentIndex === cards.length - 1}
                className="flashcard-nav-btn"
              >
                <span>Tiếp</span>
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            <div className="flashcard-progress">
              {cards.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setCurrentIndex(idx);
                    setFlipped(false);
                  }}
                  className={`flashcard-dot ${idx === currentIndex ? "active" : ""}`}
                  aria-label={`Đi tới thẻ ${idx + 1}`}
                />
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
