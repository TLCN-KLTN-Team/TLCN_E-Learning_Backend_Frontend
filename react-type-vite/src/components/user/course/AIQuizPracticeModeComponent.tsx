import { useState, useCallback, useMemo } from "react";
import {
  Sparkles,
  Loader2,
  BookOpen,
  Brain,
  Layers,
  Upload,
  FileText,
  CheckCircle,
  Eye,
  Send,
  XCircle,
  AlertCircle,
  Target,
  Wand2,
  ListChecks,
  CircleDot,
  CheckCheck,
  ToggleLeft,
  PenLine,
} from "lucide-react";
import "@/styles/ai-study-mode.css";
import FlashcardViewer from "@/components/flashcard/FlashcardViewer";
import FlashcardEditor from "@/components/flashcard/FlashcardEditor";
import QuizEditor from "@/components/quiz/QuizEditor";
import DocumentUpload from "@/components/quiz/DocumentUpload";
import {
  generateFlashcards,
  saveFlashcardSet,
} from "@/services/api/user/flashcard.api";
import {
  type UIFlashcard,
  toUIFlashcard,
  DifficultyLevel,
  type FlashCardRequest,
  type SaveFlashcardSetRequest,
} from "@/types/flashcard.type";
import {
  type QuizQuestion,
  type QuestionType,
  type Difficulty,
  type QuizConfig,
  QUESTION_TYPE_LABELS,
} from "@/lib/quiz/quizMockData";
import { generateQuizForUser, saveQuizSet } from "@/services/api/user/quiz.api";
import {
  toUIQuizQuestion,
  toApiQuizQuestion,
  type GenerateQuizUserRequest,
  type SaveQuizSetRequest,
} from "@/types/quiz.type";
import type { Chapter, ReviewMode } from "@/lib/reviewMockData";
import { getContextForChapters } from "@/lib/reviewMockData";
import {
  submitAIStudyContent,
  cancelAIStudyRequest,
  type AIStudySubmitResponse,
} from "@/services/api/aiStudyApi";
import { AppError } from "@/errors";
import { toast } from "react-toastify";
import { useAuth } from "@/context/auth-context/useAuth";

// Utility function to generate content-based hash ID
function generateContentHash(content: string): string {
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36);
}

// Generate unique ID based on flashcard content
function generateFlashcardSetId(flashcards: UIFlashcard[]): string {
  const content = flashcards
    .map((card) => `${card.front}|${card.back}|${card.difficulty}`)
    .sort() // Sort to ensure consistent ordering
    .join("::");

  const hash = generateContentHash(content);
  return `fc_${hash}_${flashcards.length}`;
}

// Generate unique ID based on quiz content
function generateQuizSetId(questions: QuizQuestion[]): string {
  const content = questions
    .map(
      (q) =>
        `${q.question}|${q.questionType}|${JSON.stringify(q.options || [])}`,
    )
    .sort() // Sort to ensure consistent ordering
    .join("::");

  const hash = generateContentHash(content);
  return `qz_${hash}_${questions.length}`;
}

interface LearningOutcome {
  id: string;
  chapterId: string;
  title: string;
  content: string;
}

interface OutcomeFlashcardConfig {
  easy: number;
  medium: number;
  hard: number;
}

interface Props {
  chapters: Chapter[];
  selectedChapterIds: string[];
  onOpenSidebar: () => void;
}

export default function ReviewMain({
  chapters,
  selectedChapterIds,
  onOpenSidebar,
}: Props) {
  const { user } = useAuth();

  const [mode, setMode] = useState<ReviewMode>("flashcard");
  const [generating, setGenerating] = useState(false);

  // External info (uploaded document)
  const [uploadedFileName, setUploadedFileName] = useState("");
  const [externalInfo, setExternalInfo] = useState("");

  // Internal info (chapter context)
  const internalInfoDefault = useMemo(
    () => getContextForChapters(chapters, selectedChapterIds),
    [chapters, selectedChapterIds],
  );
  const [internalInfoOverride, setInternalInfoOverride] = useState<
    string | null
  >(null);
  const internalInfo = internalInfoOverride ?? internalInfoDefault;

  // AI Study Mode state
  const [showMergedPreview, setShowMergedPreview] = useState(false);
  const [aiSubmitting, setAiSubmitting] = useState(false);
  const [aiRequestId, setAiRequestId] = useState<string | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiSuccess, setAiSuccess] = useState<AIStudySubmitResponse | null>(
    null,
  );

  // Merged content for AI Study Mode
  const mergedContent = useMemo(() => {
    const parts: string[] = [];

    if (internalInfo.trim()) {
      parts.push("=== NỘI DUNG TỪ CÁC CHƯƠNG ===\n\n" + internalInfo);
    }

    if (externalInfo.trim()) {
      parts.push("=== TÀI LIỆU BỔ SUNG ===\n\n" + externalInfo);
    }

    return parts.join("\n\n" + "=".repeat(50) + "\n\n");
  }, [internalInfo, externalInfo]);

  // Reset override when selection changes
  const [prevSelectedIds, setPrevSelectedIds] = useState(selectedChapterIds);
  if (prevSelectedIds !== selectedChapterIds) {
    setPrevSelectedIds(selectedChapterIds);
    setInternalInfoOverride(null);
  }

  // Flashcard state
  const [flashcards, setFlashcards] = useState<UIFlashcard[]>([]);
  const [editingFlashcards, setEditingFlashcards] = useState(false);
  // Per-outcome flashcard configs (keyed by outcome id). Existence in this map
  // means the outcome is checked.
  const [outcomeConfigs, setOutcomeConfigs] = useState<
    Record<string, OutcomeFlashcardConfig>
  >({});

  // Quiz state
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<QuestionType[]>([]);
  const [quizConfig, setQuizConfig] = useState<QuizConfig>({});
  // Per-quiz outcome selection (set of outcome ids). Mirrors the flashcard
  // flow: pick CĐR -> pick question types -> set counts.
  const [quizOutcomeIds, setQuizOutcomeIds] = useState<Set<string>>(new Set());

  const selectedChapterNames = useMemo(
    () =>
      chapters
        .filter((c) => selectedChapterIds.includes(c.id))
        .map((c) => c.title),
    [chapters, selectedChapterIds],
  );

  const totalQuizQuestions = useMemo(
    () =>
      Object.values(quizConfig).reduce(
        (sum, dc) => sum + dc.EASY + dc.MEDIUM + dc.HARD,
        0,
      ),
    [quizConfig],
  );

  // Learning outcomes (chuẩn đầu ra) derived from the selected chapters.
  // One outcome per selected chapter; checking it pulls that chapter's
  // content into the LLM prompt and exposes per-difficulty count controls.
  const learningOutcomes = useMemo<LearningOutcome[]>(
    () =>
      chapters
        .filter((c) => selectedChapterIds.includes(c.id))
        .slice()
        .sort((a, b) => a.order - b.order)
        .map((chapter) => ({
          id: `lo_${chapter.id}`,
          chapterId: chapter.id,
          title: chapter.title,
          content: chapter.description,
        })),
    [chapters, selectedChapterIds],
  );

  // Reset outcome configs when the underlying outcome list changes (e.g. user
  // (un)ticks chapters in the sidebar).
  const outcomeIdsKey = learningOutcomes.map((o) => o.id).join("|");
  const [prevOutcomeIdsKey, setPrevOutcomeIdsKey] = useState(outcomeIdsKey);
  if (prevOutcomeIdsKey !== outcomeIdsKey) {
    setPrevOutcomeIdsKey(outcomeIdsKey);
    setOutcomeConfigs((prev) => {
      const next: Record<string, OutcomeFlashcardConfig> = {};
      for (const o of learningOutcomes) {
        if (prev[o.id]) next[o.id] = prev[o.id];
      }
      return next;
    });
    setQuizOutcomeIds((prev) => {
      const next = new Set<string>();
      for (const o of learningOutcomes) {
        if (prev.has(o.id)) next.add(o.id);
      }
      return next;
    });
  }

  const checkedOutcomes = useMemo(
    () => learningOutcomes.filter((o) => outcomeConfigs[o.id]),
    [learningOutcomes, outcomeConfigs],
  );

  const totalFlashcards = useMemo(
    () =>
      Object.values(outcomeConfigs).reduce(
        (sum, c) => sum + c.easy + c.medium + c.hard,
        0,
      ),
    [outcomeConfigs],
  );

  const handleToggleOutcome = useCallback((outcomeId: string) => {
    setOutcomeConfigs((prev) => {
      const next = { ...prev };
      if (next[outcomeId]) {
        delete next[outcomeId];
      } else {
        next[outcomeId] = { easy: 3, medium: 2, hard: 0 };
      }
      return next;
    });
  }, []);

  const handleOutcomeCountChange = useCallback(
    (
      outcomeId: string,
      difficulty: keyof OutcomeFlashcardConfig,
      count: number,
    ) => {
      setOutcomeConfigs((prev) => {
        if (!prev[outcomeId]) return prev;
        const clamped = Math.max(0, Math.min(30, count || 0));
        return {
          ...prev,
          [outcomeId]: { ...prev[outcomeId], [difficulty]: clamped },
        };
      });
    },
    [],
  );

  const handleGenerateFlashcards = useCallback(async () => {
    if (checkedOutcomes.length === 0 || totalFlashcards === 0) {
      setAiError(
        "Vui lòng chọn ít nhất một chuẩn đầu ra và nhập số lượng thẻ.",
      );
      return;
    }

    setGenerating(true);
    setAiError(null);

    try {
      // Build the internal document from the ticked outcomes only, so the LLM
      // is fed exactly the content the user opted in to. Fall back to the
      // override text (which may include user edits) when present.
      const outcomeBased = checkedOutcomes
        .map((o) => `=== ${o.title} ===\n\n${o.content}`)
        .join("\n\n");
      const internalDoc = internalInfoOverride ?? outcomeBased ?? internalInfo;

      // Aggregate the per-outcome configs into a single cardsPerDifficulty
      // payload that the Python backend already understands.
      const totals = checkedOutcomes.reduce(
        (acc, o) => {
          const cfg = outcomeConfigs[o.id];
          acc.easy += cfg.easy;
          acc.medium += cfg.medium;
          acc.hard += cfg.hard;
          return acc;
        },
        { easy: 0, medium: 0, hard: 0 },
      );

      const request: FlashCardRequest = {
        internalDocument: internalDoc,
        externalDocument: externalInfo || null,
        cardsPerDifficulty: [
          { difficulty: DifficultyLevel.EASY, numberOfCards: totals.easy },
          { difficulty: DifficultyLevel.MEDIUM, numberOfCards: totals.medium },
          { difficulty: DifficultyLevel.HARD, numberOfCards: totals.hard },
        ].filter((c) => c.numberOfCards > 0),
        language: "vietnamese",
      };

      const response = await generateFlashcards(request);
      console.log("Flashcards generated:", response);

      let idCounter = 0;
      const uiFlashcards = response.cards.map((card) =>
        toUIFlashcard(card, `fc_${++idCounter}_${Date.now()}`),
      );

      setFlashcards(uiFlashcards);
      setEditingFlashcards(false);
    } catch (err) {
      console.error("Error generating flashcards:", err);
      setAiError(
        err instanceof Error
          ? err.message
          : "Không thể tạo flashcards. Vui lòng thử lại.",
      );
    } finally {
      setGenerating(false);
    }
  }, [
    checkedOutcomes,
    outcomeConfigs,
    totalFlashcards,
    internalInfo,
    internalInfoOverride,
    externalInfo,
  ]);

  // Outcomes whose content will feed the quiz prompt.
  const checkedQuizOutcomes = useMemo(
    () => learningOutcomes.filter((o) => quizOutcomeIds.has(o.id)),
    [learningOutcomes, quizOutcomeIds],
  );

  const handleToggleQuizOutcome = useCallback((outcomeId: string) => {
    setQuizOutcomeIds((prev) => {
      const next = new Set(prev);
      if (next.has(outcomeId)) next.delete(outcomeId);
      else next.add(outcomeId);
      return next;
    });
  }, []);

  const handleGenerateQuiz = useCallback(async () => {
    if (checkedQuizOutcomes.length === 0) {
      setAiError("Vui lòng chọn ít nhất một chuẩn đầu ra.");
      return;
    }
    if (selectedTypes.length === 0) {
      setAiError("Vui lòng chọn ít nhất một loại câu hỏi.");
      return;
    }
    if (totalQuizQuestions === 0) {
      setAiError(
        "Tổng số câu hỏi đang là 0. Hãy cấu hình số lượng cho ít nhất một độ khó.",
      );
      return;
    }

    setAiError(null);
    setGenerating(true);

    try {
      // Build a context the LLM can read even if it ignores learning_outcomes —
      // each CĐR is marked with its title so chunks remain attributable.
      const outcomeContext = checkedQuizOutcomes
        .map((o) => `=== ${o.title} ===\n\n${o.content ?? ""}`)
        .join("\n\n");
      const context = externalInfo
        ? `${outcomeContext}\n\n=== TÀI LIỆU BỔ SUNG ===\n\n${externalInfo}`
        : outcomeContext;

      const payload: GenerateQuizUserRequest = {
        context,
        learning_outcomes: checkedQuizOutcomes.map((o) => ({
          id: o.id,
          title: o.title,
          content: o.content ?? "",
          chapterId: o.chapterId,
        })),
        questions: selectedTypes.map((type) => {
          const cfg = quizConfig[type] || { EASY: 0, MEDIUM: 0, HARD: 0 };
          return {
            type,
            numberOfQuestions: (
              ["EASY", "MEDIUM", "HARD"] as Difficulty[]
            )
              .map((d) => ({ difficulty: d, number: cfg[d] ?? 0 }))
              .filter((c) => c.number > 0),
          };
        }),
        language: "vietnamese",
      };

      const data = await generateQuizForUser(payload);

      if (!data?.questions || data.questions.length === 0) {
        throw new Error(
          "AI không trả về câu hỏi nào. Hãy thử lại hoặc giảm số câu cấu hình.",
        );
      }

      const uiQuestions = data.questions.map((q, idx) =>
        toUIQuizQuestion(q, idx + 1),
      );
      setQuizQuestions(uiQuestions);
      toast.success(`Đã tạo ${uiQuestions.length} câu hỏi từ AI.`);
    } catch (err) {
      console.error("Error generating quiz:", err);
      let message = "Không thể tạo quiz. Vui lòng thử lại.";
      if (err instanceof AppError) {
        message = err.getDisplayMessage();
      } else if (err instanceof Error && err.message) {
        message = err.message;
      }
      setAiError(message);
      toast.error(message);
    } finally {
      setGenerating(false);
    }
  }, [
    checkedQuizOutcomes,
    externalInfo,
    quizConfig,
    selectedTypes,
    totalQuizQuestions,
  ]);

  const handleToggleType = useCallback((type: QuestionType) => {
    setSelectedTypes((prev) => {
      const next = prev.includes(type)
        ? prev.filter((t) => t !== type)
        : [...prev, type];
      setQuizConfig((cfg) => {
        const c = { ...cfg };
        if (!c[type]) c[type] = { EASY: 1, MEDIUM: 1, HARD: 0 };
        if (!next.includes(type)) delete c[type];
        return c;
      });
      return next;
    });
  }, []);

  const handleCountChange = useCallback(
    (type: QuestionType, diff: Difficulty, count: number) => {
      setQuizConfig((cfg) => ({
        ...cfg,
        [type]: { ...cfg[type], [diff]: count },
      }));
    },
    [],
  );

  const handleUpdateFlashcard = useCallback(
    (id: string, updated: Partial<UIFlashcard>) => {
      setFlashcards((prev) =>
        prev.map((c) => (c.id === id ? { ...c, ...updated } : c)),
      );
    },
    [],
  );

  const handleUpdateQuestion = useCallback(
    (id: string, updated: Partial<QuizQuestion>) => {
      setQuizQuestions((prev) =>
        prev.map((q) => (q.id === id ? { ...q, ...updated } : q)),
      );
    },
    [],
  );

  const handleSaveFlashcardSet = useCallback(async () => {
    if (flashcards.length === 0) return;
    if (!user?.id) {
      toast.error("Bạn cần đăng nhập để lưu bộ flashcards.");
      return;
    }

    const contentBasedId = generateFlashcardSetId(flashcards);

    const payload: SaveFlashcardSetRequest = {
      flashcardSetId: contentBasedId,
      flashcards: flashcards.map((c) => ({
        front: c.front,
        back: c.back,
        tags: c.tags,
        difficulty: c.difficulty.toUpperCase() as DifficultyLevel,
      })),
      internalDocument: internalInfo,
      externalDocument: externalInfo || null,
      authorId: user.id,
      language: "vietnamese",
    };

    try {
      const saved = await saveFlashcardSet(payload);
      console.log("Saved flashcard set:", saved);
      toast.success("Đã lưu bộ flashcards vào kho!");
    } catch (err) {
      console.error("Save flashcard set failed:", err);
      const message =
        err instanceof AppError
          ? err.getDisplayMessage()
          : err instanceof Error && err.message
            ? err.message
            : "Lưu bộ flashcards thất bại. Vui lòng thử lại.";
      toast.error(message);
    }
  }, [flashcards, internalInfo, externalInfo, user]);

  const handleSaveQuizSet = useCallback(async () => {
    if (quizQuestions.length === 0) return;
    if (!user?.id) {
      toast.error("Bạn cần đăng nhập để lưu bộ quiz.");
      return;
    }

    const contentBasedId = generateQuizSetId(quizQuestions);

    const payload: SaveQuizSetRequest = {
      quizSetId: contentBasedId,
      quizSetName: `Quiz - ${selectedChapterNames.slice(0, 2).join(", ")}${
        selectedChapterNames.length > 2 ? "..." : ""
      }`,
      questions: quizQuestions.map(toApiQuizQuestion),
      context: internalInfo,
      externalDocument: externalInfo || null,
      authorId: user.id,
      language: "vietnamese",
    };

    try {
      const saved = await saveQuizSet(payload);
      console.log("Saved quiz set:", saved);
      toast.success("Đã lưu bộ quiz vào kho!");
    } catch (err) {
      console.error("Save quiz set failed:", err);
      const message =
        err instanceof AppError
          ? err.getDisplayMessage()
          : err instanceof Error && err.message
            ? err.message
            : "Lưu bộ quiz thất bại. Vui lòng thử lại.";
      toast.error(message);
    }
  }, [
    quizQuestions,
    selectedChapterNames,
    user,
    internalInfo,
    externalInfo,
  ]);

  // AI Study Mode handlers
  const handleSubmitToAI = useCallback(async () => {
    if (!mergedContent.trim()) {
      setAiError(
        "Vui lòng chọn chương hoặc upload tài liệu để có nội dung gửi lên AI",
      );
      return;
    }

    setAiSubmitting(true);
    setAiError(null);
    setAiSuccess(null);

    try {
      const response = await submitAIStudyContent({
        chapterIds: selectedChapterIds,
        internalContent: internalInfo,
        externalContent: externalInfo,
        mergedContent: mergedContent,
        mode: "study",
      });

      if (response.success) {
        setAiSuccess(response);
        if (response.data?.studyPlanId) {
          setAiRequestId(response.data.studyPlanId);
        }
      } else {
        setAiError(response.message || "Có lỗi xảy ra khi gửi nội dung");
      }
    } catch (error) {
      if (error instanceof AppError) {
        setAiError(error.message);
      } else {
        setAiError("Không thể kết nối tới server AI. Vui lòng thử lại sau.");
      }
    } finally {
      setAiSubmitting(false);
    }
  }, [mergedContent, selectedChapterIds, internalInfo, externalInfo]);

  const handleCancelAIRequest = useCallback(async () => {
    if (!aiRequestId) return;

    try {
      await cancelAIStudyRequest(aiRequestId);
      setAiRequestId(null);
      setAiSubmitting(false);
      setAiError("Đã hủy yêu cầu");
    } catch {
      setAiError("Không thể hủy yêu cầu");
    }
  }, [aiRequestId]);

  const canGenerate = selectedChapterIds.length > 0;
  const canSubmitAI =
    (internalInfo.trim() || externalInfo.trim()) && !aiSubmitting;

  return (
    <main className="flex-1 min-h-0">
      <div className="px-4 sm:px-6 pb-6 space-y-6">
        {/* Selected chapters info */}
        {selectedChapterIds.length > 0 ? (
          <div className="section-card space-y-3">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Layers className="h-4 w-4 text-primary" />
              </div>
              <h2 className="text-lg font-semibold text-foreground">
                Chương đã chọn
              </h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {selectedChapterNames.map((name) => (
                <span key={name} className="ai-chapter-badge">
                  {name}
                </span>
              ))}
            </div>
          </div>
        ) : (
          <div className="section-card flex flex-col items-center justify-center py-12 text-center">
            <BookOpen className="h-12 w-12 text-muted-foreground/30 mb-4" />
            <h2 className="text-lg font-semibold text-foreground mb-1">
              Chọn chương để bắt đầu ôn tập
            </h2>
            <p className="text-sm text-muted-foreground max-w-md">
              Tick chọn một hoặc nhiều chương từ sidebar bên phải để AI tạo
              flashcards hoặc quiz ôn tập cho bạn.
            </p>
            <button
              onClick={onOpenSidebar}
              className="mt-4 lg:hidden rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Mở danh sách chương
            </button>
          </div>
        )}

        {/* External Information - Upload */}
        {canGenerate && (
          <DocumentUpload
            fileName={uploadedFileName}
            summary={externalInfo}
            onFileSelect={setUploadedFileName}
            onSummaryChange={setExternalInfo}
            title="Thông tin bổ sung"
            description="External Information — tài liệu từ bên ngoài"
            icon={<Upload className="h-4 w-4" />}
            showTextarea={true}
            textareaRows={5}
          />
        )}

        {/* Mode selector - NOW WITH 3 OPTIONS */}
        {canGenerate && (
          <div className="ai-section-card space-y-4">
            <p className="text-sm font-medium text-muted-foreground">
              Chọn chế độ ôn tập
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                onClick={() => setMode("flashcard")}
                className={`ai-mode-card ${mode === "flashcard" ? "selected" : ""}`}
              >
                <BookOpen className="ai-mode-icon" />
                <div>
                  <p className="ai-mode-title">Flashcards</p>
                  <p className="ai-mode-description">Học bằng thẻ ghi nhớ</p>
                </div>
              </button>
              <button
                onClick={() => setMode("quiz")}
                className={`ai-mode-card ${mode === "quiz" ? "selected" : ""}`}
              >
                <Brain className="ai-mode-icon" />
                <div>
                  <p className="ai-mode-title">Quiz</p>
                  <p className="ai-mode-description">Kiểm tra kiến thức</p>
                </div>
              </button>
              <button
                onClick={() => setMode("ai-study")}
                className={`ai-mode-card ${mode === "ai-study" ? "selected" : ""}`}
              >
                <Sparkles className="ai-mode-icon" />
                <div>
                  <p className="ai-mode-title">AI Study</p>
                  <p className="ai-mode-description">Gửi nội dung cho AI</p>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* Internal Information - Chapter context */}
        {canGenerate && (
          <div className="ai-section-card space-y-4">
            <div className="flex items-center gap-2">
              <div className="ai-header-icon">
                <FileText className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-foreground">
                  Nội dung chương học
                </h2>
                <p className="text-xs text-muted-foreground">
                  Internal Information — trích xuất từ các chương đã chọn
                </p>
              </div>
            </div>
            <textarea
              value={internalInfo}
              onChange={(e) => setInternalInfoOverride(e.target.value)}
              rows={6}
              placeholder="Nội dung sẽ được trích xuất từ các chương bạn đã chọn..."
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-y"
            />
            <p className="text-xs text-muted-foreground">
              Bạn có thể chỉnh sửa nội dung trước khi tạo flashcards hoặc quiz.
            </p>
          </div>
        )}

        {/* ============================================ */}
        {/* AI STUDY MODE - NEW FEATURE */}
        {/* ============================================ */}
        {canGenerate && mode === "ai-study" && (
          <>
            {/* Merged Content Preview */}
            <div className="ai-section-card space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="ai-header-icon">
                    <Eye className="h-4 w-4" />
                  </div>
                  <h2 className="text-lg font-semibold text-foreground">
                    Nội dung tổng hợp
                  </h2>
                </div>
                <button
                  onClick={() => setShowMergedPreview(!showMergedPreview)}
                  className="ai-toggle-button"
                >
                  {showMergedPreview ? "Ẩn" : "Xem"} chi tiết
                </button>
              </div>

              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Nội dung sau đây sẽ được gửi tới AI để phân tích và tạo kế
                  hoạch học tập:
                </p>
                <div className="ai-preview-card">
                  <div className="ai-stat-item">
                    <span>
                      📚 Nội dung chương:{" "}
                      <span className="ai-stat-value">
                        {internalInfo.length} ký tự
                      </span>
                    </span>
                  </div>
                  <div className="ai-stat-item mt-2">
                    <span>
                      📄 Tài liệu bổ sung:{" "}
                      <span className="ai-stat-value">
                        {externalInfo.length} ký tự
                      </span>
                    </span>
                  </div>
                  <div className="ai-stat-item mt-2 pt-2 border-t border-border">
                    <span className="font-medium">
                      📦 Tổng cộng:{" "}
                      <span className="ai-stat-value font-bold">
                        {mergedContent.length} ký tự
                      </span>
                    </span>
                  </div>
                </div>

                {showMergedPreview && (
                  <div className="space-y-2 animate-slide-up">
                    <label className="text-sm font-medium text-muted-foreground">
                      Xem trước nội dung tổng hợp
                    </label>
                    <div className="ai-merged-preview">
                      <pre>{mergedContent || "(Chưa có nội dung)"}</pre>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* AI Submission Section */}
            <div className="ai-section-card space-y-4">
              <div className="flex items-center gap-2">
                <div className="ai-header-icon">
                  <Sparkles className="h-4 w-4" />
                </div>
                <h2 className="text-lg font-semibold text-foreground">
                  Gửi cho AI phân tích
                </h2>
              </div>

              <p className="text-sm text-muted-foreground">
                AI sẽ phân tích nội dung và tạo kế hoạch học tập tối ưu cho bạn
                dựa trên các chương đã chọn và tài liệu bổ sung.
              </p>

              {/* Error Display */}
              {aiError && (
                <div className="flex items-start gap-3 rounded-lg border border-destructive/50 bg-destructive/10 p-4">
                  <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-destructive">
                      Có lỗi xảy ra
                    </p>
                    <p className="text-sm text-destructive/90 mt-1">
                      {aiError}
                    </p>
                  </div>
                  <button
                    onClick={() => setAiError(null)}
                    className="text-destructive hover:text-destructive/80"
                  >
                    <XCircle className="h-4 w-4" />
                  </button>
                </div>
              )}

              {/* Success Display */}
              {aiSuccess && (
                <div className="ai-success-box">
                  <CheckCircle className="h-5 w-5 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm ai-success-title">Gửi thành công!</p>
                    <p className="text-sm text-foreground mt-1">
                      {aiSuccess.message}
                    </p>
                    {aiSuccess.data && (
                      <div className="mt-3 space-y-2">
                        {aiSuccess.data.recommendations &&
                          aiSuccess.data.recommendations.length > 0 && (
                            <div>
                              <p className="text-xs font-medium text-muted-foreground mb-1">
                                Đề xuất từ AI:
                              </p>
                              <ul className="space-y-1">
                                {aiSuccess.data.recommendations.map(
                                  (rec, idx) => (
                                    <li
                                      key={idx}
                                      className="text-sm text-foreground flex items-start gap-2"
                                    >
                                      <span className="text-primary">•</span>
                                      {rec}
                                    </li>
                                  ),
                                )}
                              </ul>
                            </div>
                          )}
                        {aiSuccess.data.estimatedTime && (
                          <p className="text-xs text-muted-foreground">
                            ⏱️ Thời gian ước tính:{" "}
                            {aiSuccess.data.estimatedTime} phút
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <div className="flex gap-3">
                <button
                  onClick={handleSubmitToAI}
                  disabled={!canSubmitAI}
                  className="flex-1 ai-button-primary"
                >
                  {aiSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Đang gửi...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      Gửi cho AI phân tích
                    </>
                  )}
                </button>
                {aiSubmitting && aiRequestId && (
                  <button
                    onClick={handleCancelAIRequest}
                    className="rounded-xl border-2 border-destructive px-4 py-3.5 text-sm font-semibold text-destructive hover:bg-destructive/10 transition-all"
                  >
                    <XCircle className="h-4 w-4 inline mr-1" />
                    Hủy
                  </button>
                )}
              </div>
            </div>
          </>
        )}

        {/* Flashcard mode */}
        {canGenerate && mode === "flashcard" && (
          <>
            <div className="ai-section-card space-y-4">
              <div className="flex items-center gap-2">
                <div className="ai-header-icon">
                  <Target className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-foreground">
                    Chuẩn đầu ra của bộ Flashcards
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Tích chọn các chuẩn đầu ra để nội dung liên quan được nạp
                    vào AI, sau đó cấu hình số lượng thẻ theo độ khó.
                  </p>
                </div>
              </div>

              {learningOutcomes.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Chưa có chuẩn đầu ra nào — hãy chọn ít nhất một chương ở
                  sidebar.
                </p>
              ) : (
                <div className="space-y-3">
                  {learningOutcomes.map((outcome, idx) => {
                    const cfg = outcomeConfigs[outcome.id];
                    const isChecked = Boolean(cfg);
                    return (
                      <div
                        key={outcome.id}
                        className={`outcome-card ${isChecked ? "checked" : ""}`}
                      >
                        <label className="flex items-start gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleToggleOutcome(outcome.id)}
                            className="mt-1 h-4 w-4 accent-teal-500 cursor-pointer"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="outcome-index">
                                CĐR {idx + 1}
                              </span>
                              <p className="font-medium text-sm text-foreground truncate">
                                {outcome.title}
                              </p>
                            </div>
                            {outcome.content && (
                              <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                                {outcome.content}
                              </p>
                            )}
                          </div>
                        </label>

                        {isChecked && (
                          <div className="outcome-config animate-ai-slide-up">
                            {(
                              [
                                {
                                  key: "easy" as const,
                                  label: "Dễ",
                                  tone: "easy",
                                },
                                {
                                  key: "medium" as const,
                                  label: "Trung bình",
                                  tone: "medium",
                                },
                                {
                                  key: "hard" as const,
                                  label: "Khó",
                                  tone: "hard",
                                },
                              ]
                            ).map(({ key, label, tone }) => (
                              <div
                                key={key}
                                className={`quiz-difficulty-cell tone-${tone}`}
                              >
                                <label className="quiz-difficulty-label">
                                  {label}
                                </label>
                                <select
                                  value={cfg[key]}
                                  onChange={(e) =>
                                    handleOutcomeCountChange(
                                      outcome.id,
                                      key,
                                      parseInt(e.target.value, 10),
                                    )
                                  }
                                  className="outcome-difficulty-select quiz-difficulty-select"
                                >
                                  {Array.from({ length: 11 }).map((_, n) => (
                                    <option key={n} value={n}>
                                      {n} thẻ
                                    </option>
                                  ))}
                                </select>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {checkedOutcomes.length > 0 && (
                    <div className="flex items-center justify-between pt-2 border-t border-border text-sm">
                      <span className="text-muted-foreground">
                        Đã chọn{" "}
                        <span className="font-semibold text-foreground">
                          {checkedOutcomes.length}
                        </span>{" "}
                        / {learningOutcomes.length} chuẩn đầu ra
                      </span>
                      <span className="ai-stat-value">
                        Tổng {totalFlashcards} thẻ
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>

            <button
              onClick={handleGenerateFlashcards}
              disabled={
                generating ||
                checkedOutcomes.length === 0 ||
                totalFlashcards === 0
              }
              className="w-full ai-button-primary"
            >
              {generating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Đang tạo flashcards...
                </>
              ) : (
                <>
                  <Wand2 className="h-4 w-4" />
                  Tạo Flashcards ({totalFlashcards} thẻ)
                </>
              )}
            </button>

            {generating && (
              <div className="flashcard-generating-stage">
                <div className="flashcard-orbit">
                  <div className="flashcard-orbit-card flashcard-orbit-card-1">
                    <Sparkles className="h-4 w-4" />
                  </div>
                  <div className="flashcard-orbit-card flashcard-orbit-card-2">
                    <BookOpen className="h-4 w-4" />
                  </div>
                  <div className="flashcard-orbit-card flashcard-orbit-card-3">
                    <Brain className="h-4 w-4" />
                  </div>
                  <div className="flashcard-orbit-core">
                    <Wand2 className="h-5 w-5" />
                  </div>
                </div>
                <div className="flashcard-generating-text">
                  <p className="flashcard-generating-title">
                    AI đang chế tạo flashcards của bạn...
                  </p>
                  <p className="flashcard-generating-subtitle">
                    Đang phân tích nội dung và tinh chỉnh từng câu hỏi theo
                    chuẩn đầu ra đã chọn.
                  </p>
                </div>
                <div className="flashcard-generating-bar">
                  <span />
                </div>
              </div>
            )}

            {!editingFlashcards && (
              <div className="ai-section-card space-y-2">
                <FlashcardViewer
                  cards={flashcards}
                  onRegenerate={handleGenerateFlashcards}
                  onSave={handleSaveFlashcardSet}
                  loading={generating}
                  onEdit={() => setEditingFlashcards(true)}
                  editing={editingFlashcards}
                />
              </div>
            )}

            {editingFlashcards && (
              <>
                <div className="flex justify-end">
                  <button
                    onClick={() => setEditingFlashcards(false)}
                    className="rounded-lg border border-border px-3 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors"
                  >
                    ← Quay lại học
                  </button>
                </div>
                <FlashcardEditor
                  cards={flashcards}
                  onUpdateCard={handleUpdateFlashcard}
                />
              </>
            )}
          </>
        )}

        {/* Quiz mode */}
        {canGenerate && mode === "quiz" && (
          <>
            {/* Step 1: Pick learning outcomes (chuẩn đầu ra) for the quiz */}
            <div className="ai-section-card space-y-4">
              <div className="flex items-center gap-2">
                <div className="ai-header-icon">
                  <Target className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-foreground">
                    Chuẩn đầu ra của bộ Quiz
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Bước 1 — tích chọn các chuẩn đầu ra để nội dung tương ứng
                    được nạp vào AI khi tạo quiz.
                  </p>
                </div>
              </div>

              {learningOutcomes.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Chưa có chuẩn đầu ra nào — hãy chọn ít nhất một chương ở
                  sidebar.
                </p>
              ) : (
                <div className="space-y-3">
                  {learningOutcomes.map((outcome, idx) => {
                    const isChecked = quizOutcomeIds.has(outcome.id);
                    return (
                      <div
                        key={outcome.id}
                        className={`outcome-card ${isChecked ? "checked" : ""}`}
                      >
                        <label className="flex items-start gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() =>
                              handleToggleQuizOutcome(outcome.id)
                            }
                            className="mt-1 h-4 w-4 accent-teal-500 cursor-pointer"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="outcome-index">
                                CĐR {idx + 1}
                              </span>
                              <p className="font-medium text-sm text-foreground truncate">
                                {outcome.title}
                              </p>
                            </div>
                            {outcome.content && (
                              <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                                {outcome.content}
                              </p>
                            )}
                          </div>
                        </label>
                      </div>
                    );
                  })}

                  {checkedQuizOutcomes.length > 0 && (
                    <div className="flex items-center justify-between pt-2 border-t border-border text-sm">
                      <span className="text-muted-foreground">
                        Đã chọn{" "}
                        <span className="font-semibold text-foreground">
                          {checkedQuizOutcomes.length}
                        </span>{" "}
                        / {learningOutcomes.length} chuẩn đầu ra
                      </span>
                      <span className="ai-stat-value">
                        Tổng {totalQuizQuestions} câu
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Step 2: Pick question types (only after at least one outcome is chosen) */}
            {checkedQuizOutcomes.length > 0 && (
              <div className="ai-section-card space-y-4 animate-ai-slide-up">
                <div className="flex items-center gap-2">
                  <div className="ai-header-icon">
                    <ListChecks className="h-4 w-4" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-foreground">
                      Loại câu hỏi
                    </h2>
                    <p className="text-xs text-muted-foreground">
                      Bước 2 — chọn các dạng câu hỏi bạn muốn AI tạo cho bộ
                      quiz.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {(
                    [
                      {
                        type: "SINGLE_CHOICE" as QuestionType,
                        icon: CircleDot,
                      },
                      {
                        type: "MULTIPLE_CHOICE" as QuestionType,
                        icon: CheckCheck,
                      },
                      {
                        type: "TRUE_FALSE" as QuestionType,
                        icon: ToggleLeft,
                      },
                      {
                        type: "FILL_IN_THE_BLANK" as QuestionType,
                        icon: PenLine,
                      },
                    ]
                  ).map(({ type, icon: Icon }) => {
                    const active = selectedTypes.includes(type);
                    return (
                      <button
                        key={type}
                        type="button"
                        onClick={() => handleToggleType(type)}
                        className={`quiz-type-card ${active ? "selected" : ""}`}
                      >
                        <Icon className="quiz-type-icon" />
                        <span className="quiz-type-label">
                          {QUESTION_TYPE_LABELS[type]}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Step 3: Counts per (type, difficulty) — only once a type is picked */}
            {checkedQuizOutcomes.length > 0 && selectedTypes.length > 0 && (
              <div className="ai-section-card space-y-4 animate-ai-slide-up">
                <div className="flex items-center gap-2">
                  <div className="ai-header-icon">
                    <Wand2 className="h-4 w-4" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-foreground">
                      Số lượng câu hỏi theo độ khó
                    </h2>
                    <p className="text-xs text-muted-foreground">
                      Bước 3 — cấu hình số câu hỏi cho từng loại / độ khó để
                      tạo sinh.
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  {selectedTypes.map((type) => {
                    const diffConfig = quizConfig[type] || {
                      EASY: 0,
                      MEDIUM: 0,
                      HARD: 0,
                    };
                    return (
                      <div key={type} className="quiz-type-config">
                        <p className="quiz-type-config-title">
                          {QUESTION_TYPE_LABELS[type]}
                        </p>
                        <div className="quiz-difficulty-row">
                          {(
                            [
                              {
                                key: "EASY" as Difficulty,
                                label: "Dễ",
                                tone: "easy",
                              },
                              {
                                key: "MEDIUM" as Difficulty,
                                label: "Trung bình",
                                tone: "medium",
                              },
                              {
                                key: "HARD" as Difficulty,
                                label: "Khó",
                                tone: "hard",
                              },
                            ]
                          ).map(({ key, label, tone }) => (
                            <div
                              key={key}
                              className={`quiz-difficulty-cell tone-${tone}`}
                            >
                              <label className="quiz-difficulty-label">
                                {label}
                              </label>
                              <select
                                value={diffConfig[key]}
                                onChange={(e) =>
                                  handleCountChange(
                                    type,
                                    key,
                                    parseInt(e.target.value, 10),
                                  )
                                }
                                className="outcome-difficulty-select quiz-difficulty-select"
                              >
                                {Array.from({ length: 21 }).map((_, n) => (
                                  <option key={n} value={n}>
                                    {n} câu
                                  </option>
                                ))}
                              </select>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <button
              onClick={handleGenerateQuiz}
              disabled={
                generating ||
                checkedQuizOutcomes.length === 0 ||
                totalQuizQuestions === 0
              }
              className="w-full ai-button-primary"
            >
              {generating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Đang tạo quiz...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Tạo Quiz ({totalQuizQuestions} câu)
                </>
              )}
            </button>

            {generating && (
              <div className="flashcard-generating-stage">
                <div className="flashcard-orbit">
                  <div className="flashcard-orbit-card flashcard-orbit-card-1">
                    <Sparkles className="h-4 w-4" />
                  </div>
                  <div className="flashcard-orbit-card flashcard-orbit-card-2">
                    <Brain className="h-4 w-4" />
                  </div>
                  <div className="flashcard-orbit-card flashcard-orbit-card-3">
                    <ListChecks className="h-4 w-4" />
                  </div>
                  <div className="flashcard-orbit-core">
                    <Wand2 className="h-5 w-5" />
                  </div>
                </div>
                <div className="flashcard-generating-text">
                  <p className="flashcard-generating-title">
                    AI đang chế tạo bộ quiz của bạn...
                  </p>
                  <p className="flashcard-generating-subtitle">
                    Đang phân tích nội dung và sinh câu hỏi theo chuẩn đầu ra
                    bạn đã chọn.
                  </p>
                </div>
                <div className="flashcard-generating-bar">
                  <span />
                </div>
              </div>
            )}

            <QuizEditor
              questions={quizQuestions}
              onUpdateQuestion={handleUpdateQuestion}
              onRegenerate={handleGenerateQuiz}
              onSave={handleSaveQuizSet}
              loading={generating}
            />
          </>
        )}

      </div>
    </main>
  );
}
