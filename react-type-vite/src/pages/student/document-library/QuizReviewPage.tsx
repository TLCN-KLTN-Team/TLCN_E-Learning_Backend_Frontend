import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Brain,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  Home,
  Loader2,
  RotateCcw,
  XCircle,
} from "lucide-react";

import Header from "@/components/student/home/Header";
import { useToast } from "@/hooks/use-toast";
import quizApi from "@/services/api/user/quiz.api";
import {
  toUIQuizQuestion,
  type QuizSetResponse,
} from "@/types/quiz.type";
import {
  QUESTION_TYPE_LABELS,
  type QuizQuestion,
} from "@/lib/quiz/quizMockData";
import { USER_ROUTES } from "@/constants/routes";

const DIFFICULTY_LABEL: Record<QuizQuestion["difficulty"], string> = {
  EASY: "Dễ",
  MEDIUM: "Trung bình",
  HARD: "Khó",
};

const DIFFICULTY_TONE: Record<QuizQuestion["difficulty"], string> = {
  EASY: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
  MEDIUM:
    "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30",
  HARD: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30",
};

type Answer =
  | { kind: "choice"; selected: Set<string> }
  | { kind: "fill"; values: string[] };

function buildBlankInitial(q: QuizQuestion): Answer {
  if (q.questionType === "FILL_IN_THE_BLANK") {
    return { kind: "fill", values: (q.answers ?? []).map(() => "") };
  }
  return { kind: "choice", selected: new Set<string>() };
}

function normalize(value: string) {
  return value.trim().toLowerCase();
}

export default function QuizReviewPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [set, setSet] = useState<QuizSetResponse | null>(null);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, Answer>>({});
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});

  useEffect(() => {
    let alive = true;
    const load = async () => {
      if (!id) return;
      try {
        setLoading(true);
        const data = await quizApi.getQuizSetById(id);
        if (!alive) return;
        setSet(data);
        const ui = (data.questions ?? []).map((q, idx) =>
          toUIQuizQuestion(q, idx + 1),
        );
        setQuestions(ui);
        const init: Record<string, Answer> = {};
        ui.forEach((q) => {
          init[q.id] = buildBlankInitial(q);
        });
        setAnswers(init);
        setRevealed({});
        setCurrentIndex(0);
      } catch (err) {
        console.error("Failed to load quiz set:", err);
        toast({
          title: "Lỗi",
          description:
            "Không tải được bộ quiz. Vui lòng quay lại kho và thử lại.",
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

  const currentQuestion = questions[currentIndex];

  const progress = useMemo(() => {
    if (questions.length === 0) return 0;
    return Math.round(((currentIndex + 1) / questions.length) * 100);
  }, [questions.length, currentIndex]);

  const answeredCount = useMemo(() => {
    return questions.reduce((count, q) => {
      const a = answers[q.id];
      if (!a) return count;
      if (a.kind === "choice") return count + (a.selected.size > 0 ? 1 : 0);
      return count + (a.values.some((v) => v.trim().length > 0) ? 1 : 0);
    }, 0);
  }, [questions, answers]);

  const isCorrect = (q: QuizQuestion, a: Answer | undefined): boolean => {
    if (!a) return false;
    if (a.kind === "choice") {
      const correctIds = new Set(
        q.options.filter((o) => o.isCorrect).map((o) => o.id),
      );
      if (correctIds.size !== a.selected.size) return false;
      for (const id of correctIds) if (!a.selected.has(id)) return false;
      return true;
    }
    if (!q.answers || q.answers.length === 0) return false;
    if (a.values.length !== q.answers.length) return false;
    return q.answers.every((ans, idx) => normalize(a.values[idx]) === normalize(ans));
  };

  const handleToggleChoice = (q: QuizQuestion, optionId: string) => {
    setAnswers((prev) => {
      const current = prev[q.id];
      const selected =
        current && current.kind === "choice"
          ? new Set(current.selected)
          : new Set<string>();
      if (q.questionType === "MULTIPLE_CHOICE") {
        if (selected.has(optionId)) selected.delete(optionId);
        else selected.add(optionId);
      } else {
        selected.clear();
        selected.add(optionId);
      }
      return { ...prev, [q.id]: { kind: "choice", selected } };
    });
  };

  const handleFillChange = (q: QuizQuestion, idx: number, value: string) => {
    setAnswers((prev) => {
      const current = prev[q.id];
      const values =
        current && current.kind === "fill"
          ? [...current.values]
          : (q.answers ?? []).map(() => "");
      values[idx] = value;
      return { ...prev, [q.id]: { kind: "fill", values } };
    });
  };

  const handleReveal = (qid: string) => {
    setRevealed((prev) => ({ ...prev, [qid]: !prev[qid] }));
  };

  const handleRestart = () => {
    const init: Record<string, Answer> = {};
    questions.forEach((q) => {
      init[q.id] = buildBlankInitial(q);
    });
    setAnswers(init);
    setRevealed({});
    setCurrentIndex(0);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="pt-16 lg:pt-20 flex items-center justify-center min-h-[calc(100vh-4rem)]">
          <div className="text-center">
            <Loader2 className="h-12 w-12 text-primary mx-auto mb-4 animate-spin" />
            <p className="text-muted-foreground">Đang tải bộ quiz...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!set || questions.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-16 lg:pt-24 mx-auto max-w-3xl px-4 py-12 text-center">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4">
            <Brain className="h-7 w-7 text-muted-foreground" />
          </div>
          <h1 className="text-xl font-semibold text-foreground mb-2">
            Không tìm thấy bộ quiz
          </h1>
          <p className="text-sm text-muted-foreground mb-6">
            Bộ quiz có thể đã bị xóa hoặc không còn khả dụng.
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

  const q = currentQuestion;
  const setName = set.name?.trim() || "Bộ Quiz";
  const userAnswer = answers[q.id];
  const isRevealed = !!revealed[q.id];
  const correct = isRevealed ? isCorrect(q, userAnswer) : null;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />

      <main className="pt-16 lg:pt-24 mx-auto max-w-4xl px-4 py-8 space-y-6">
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

        {/* Title */}
        <section className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-purple-500/10 via-pink-500/10 to-primary/10 p-6">
          <div className="absolute -top-12 -right-12 h-40 w-40 rounded-full bg-purple-500/20 blur-3xl pointer-events-none" />
          <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="space-y-2 min-w-0">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-background/70 backdrop-blur px-3 py-1 text-xs font-medium text-purple-600 dark:text-purple-400">
                <Brain className="h-3.5 w-3.5" />
                Ôn tập Quiz
              </div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight truncate">
                {setName}
              </h1>
              <p className="text-sm text-muted-foreground">
                {questions.length} câu hỏi · Đã trả lời {answeredCount}/
                {questions.length}.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={handleRestart}
                className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors"
              >
                <RotateCcw className="h-4 w-4" />
                Làm lại
              </button>
              <Link
                to={USER_ROUTES.DOCUMENT_LIBRARY}
                className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                Về kho
              </Link>
            </div>
          </div>
        </section>

        {/* Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              Câu{" "}
              <span className="font-semibold text-foreground tabular-nums">
                {currentIndex + 1}
              </span>{" "}
              / {questions.length}
            </span>
            <span className="tabular-nums">{progress}%</span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-[width] duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Question card */}
        <article className="rounded-2xl border-2 border-border bg-card p-5 md:p-6 space-y-5 shadow-sm">
          <header className="flex items-start justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center justify-center h-7 w-7 rounded-full bg-primary text-primary-foreground text-xs font-bold tabular-nums">
                {currentIndex + 1}
              </span>
              <span className="text-xs font-medium text-muted-foreground">
                {QUESTION_TYPE_LABELS[q.questionType]}
              </span>
              <span
                className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium ${DIFFICULTY_TONE[q.difficulty]}`}
              >
                {DIFFICULTY_LABEL[q.difficulty]}
              </span>
            </div>
            <button
              onClick={() => handleReveal(q.id)}
              className="inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1 text-xs font-medium text-foreground hover:bg-muted transition-colors"
            >
              {isRevealed ? (
                <>
                  <EyeOff className="h-3.5 w-3.5" />
                  Ẩn đáp án
                </>
              ) : (
                <>
                  <Eye className="h-3.5 w-3.5" />
                  Xem đáp án
                </>
              )}
            </button>
          </header>

          <p className="text-base md:text-lg font-medium text-foreground whitespace-pre-wrap">
            {q.question}
          </p>

          {/* Options */}
          {(q.questionType === "SINGLE_CHOICE" ||
            q.questionType === "MULTIPLE_CHOICE" ||
            q.questionType === "TRUE_FALSE") && (
            <ul className="space-y-2">
              {q.options.map((opt) => {
                const selected =
                  userAnswer?.kind === "choice" &&
                  userAnswer.selected.has(opt.id);
                const showCorrect = isRevealed && opt.isCorrect;
                const showWrong = isRevealed && selected && !opt.isCorrect;
                const base =
                  "flex items-start gap-3 rounded-xl border-2 px-4 py-3 cursor-pointer transition-all";
                let tone = "border-border bg-background hover:border-primary/40";
                if (showCorrect)
                  tone =
                    "border-emerald-500/50 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300";
                else if (showWrong)
                  tone =
                    "border-rose-500/50 bg-rose-500/10 text-rose-700 dark:text-rose-300";
                else if (selected)
                  tone = "border-primary bg-primary/5 text-foreground";

                return (
                  <li key={opt.id}>
                    <label className={`${base} ${tone}`}>
                      <input
                        type={
                          q.questionType === "MULTIPLE_CHOICE"
                            ? "checkbox"
                            : "radio"
                        }
                        checked={selected}
                        onChange={() => handleToggleChoice(q, opt.id)}
                        className="mt-1 h-4 w-4 accent-primary cursor-pointer"
                        name={`q_${q.id}`}
                      />
                      <span className="flex-1 text-sm md:text-base">
                        {opt.text}
                      </span>
                      {isRevealed && opt.isCorrect && (
                        <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                      )}
                      {isRevealed && selected && !opt.isCorrect && (
                        <XCircle className="h-4 w-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                      )}
                    </label>
                  </li>
                );
              })}
            </ul>
          )}

          {/* Fill-in-the-blank */}
          {q.questionType === "FILL_IN_THE_BLANK" && (
            <div className="space-y-3">
              {(q.answers ?? []).map((ans, idx) => {
                const userValue =
                  userAnswer?.kind === "fill"
                    ? userAnswer.values[idx] ?? ""
                    : "";
                const matches =
                  isRevealed && normalize(userValue) === normalize(ans);
                return (
                  <div key={idx} className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">
                      Chỗ trống {idx + 1}
                    </label>
                    <input
                      type="text"
                      value={userValue}
                      onChange={(e) => handleFillChange(q, idx, e.target.value)}
                      placeholder="Nhập đáp án..."
                      className={`w-full rounded-lg border-2 px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring transition-colors ${
                        isRevealed
                          ? matches
                            ? "border-emerald-500/50 bg-emerald-500/5"
                            : "border-rose-500/50 bg-rose-500/5"
                          : "border-border"
                      }`}
                    />
                    {isRevealed && !matches && (
                      <p className="text-xs text-emerald-600 dark:text-emerald-400">
                        Đáp án đúng: <span className="font-semibold">{ans}</span>
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Reveal feedback */}
          {isRevealed && (
            <div
              className={`flex items-start gap-2 rounded-lg border px-3 py-2 text-sm ${
                correct
                  ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                  : "border-rose-500/40 bg-rose-500/10 text-rose-700 dark:text-rose-300"
              }`}
            >
              {correct ? (
                <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" />
              ) : (
                <XCircle className="h-4 w-4 mt-0.5 shrink-0" />
              )}
              <span className="font-medium">
                {correct ? "Tuyệt vời, đáp án chính xác!" : "Chưa đúng — đáp án đã được hiển thị."}
              </span>
            </div>
          )}

          {/* Tags */}
          {q.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-2 border-t border-border">
              {q.tags.map((t) => (
                <span
                  key={t}
                  className="rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground"
                >
                  #{t}
                </span>
              ))}
            </div>
          )}
        </article>

        {/* Footer navigation */}
        <div className="flex items-center justify-between gap-3">
          <button
            onClick={() =>
              setCurrentIndex((i) => Math.max(0, i - 1))
            }
            disabled={currentIndex === 0}
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-3.5 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="h-4 w-4" />
            Câu trước
          </button>

          <div className="flex flex-wrap items-center justify-center gap-1.5 max-w-[55vw]">
            {questions.map((qq, idx) => {
              const a = answers[qq.id];
              const hasAnswer =
                (a?.kind === "choice" && a.selected.size > 0) ||
                (a?.kind === "fill" &&
                  a.values.some((v) => v.trim().length > 0));
              const active = idx === currentIndex;
              return (
                <button
                  key={qq.id}
                  onClick={() => setCurrentIndex(idx)}
                  className={`h-7 w-7 rounded-md text-xs font-semibold tabular-nums transition-colors ${
                    active
                      ? "bg-primary text-primary-foreground"
                      : hasAnswer
                        ? "bg-primary/15 text-primary hover:bg-primary/25"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                  aria-label={`Đi tới câu ${idx + 1}`}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>

          <button
            onClick={() =>
              setCurrentIndex((i) => Math.min(questions.length - 1, i + 1))
            }
            disabled={currentIndex === questions.length - 1}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-3.5 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Câu sau
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </main>
    </div>
  );
}
