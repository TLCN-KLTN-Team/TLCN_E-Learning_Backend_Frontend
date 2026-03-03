import { useState, useCallback, useMemo } from "react";
import {
  Sparkles,
  Loader2,
  BookOpen,
  Brain,
  Layers,
  Menu,
  Upload,
  FileText,
  CheckCircle,
  Archive,
  Trash2,
  Eye,
  Send,
  XCircle,
  AlertCircle,
} from "lucide-react";
import "@/styles/ai-study-mode.css";
import FlashcardViewer from "@/components/flashcard/FlashcardViewer";
import FlashcardEditor from "@/components/flashcard/FlashcardEditor";
import QuizConfiguration from "@/components/quiz/QuizConfiguration";
import QuizEditor from "@/components/quiz/QuizEditor";
import {
  generateMockFlashcards,
  type Flashcard,
} from "@/lib/flashcardMockData";
import {
  generateMockQuiz,
  type QuizQuestion,
  type QuestionType,
  type Difficulty,
  type QuizConfig,
} from "@/lib/quiz/quizMockData";
import type { Chapter, ReviewMode } from "@/lib/reviewMockData";
import { getContextForChapters } from "@/lib/reviewMockData";
import {
  submitAIStudyContent,
  cancelAIStudyRequest,
  type AIStudySubmitResponse,
} from "@/services/api/aiStudyApi";
import { AppError } from "@/errors";

interface SavedSet {
  id: string;
  type: "flashcard" | "quiz";
  name: string;
  count: number;
  createdAt: Date;
  flashcards?: Flashcard[];
  quizQuestions?: QuizQuestion[];
}

interface Props {
  chapters: Chapter[];
  selectedChapterIds: string[];
  onOpenSidebar: () => void;
  courseTitle: string;
  courseProgress: number;
}

export default function ReviewMain({
  chapters,
  selectedChapterIds,
  onOpenSidebar,
  courseTitle,
  courseProgress,
}: Props) {
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

  // Saved sets storage
  const [savedSets, setSavedSets] = useState<SavedSet[]>([]);

  // Flashcard state
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [editingFlashcards, setEditingFlashcards] = useState(false);
  const [flashcardCount, setFlashcardCount] = useState(10);

  // Quiz state
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<QuestionType[]>([]);
  const [quizConfig, setQuizConfig] = useState<QuizConfig>({});
  const [quizSource, setQuizSource] = useState<"context" | "flashcard">(
    "context",
  );

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

  const handleGenerateFlashcards = useCallback(() => {
    setGenerating(true);
    setTimeout(() => {
      const cards = generateMockFlashcards(flashcardCount);
      setFlashcards(cards);
      setEditingFlashcards(false);
      setGenerating(false);
    }, 2000);
  }, [flashcardCount]);

  const handleGenerateQuiz = useCallback(() => {
    setGenerating(true);
    setTimeout(() => {
      const quiz = generateMockQuiz(quizConfig);
      setQuizQuestions(quiz);
      setGenerating(false);
    }, 2000);
  }, [quizConfig]);

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
    (id: string, updated: Partial<Flashcard>) => {
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

  const handleFileUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        setUploadedFileName(file.name);
        // Mock: simulate text extraction
        setTimeout(() => {
          setExternalInfo(
            `Nội dung trích xuất từ "${file.name}":\n\nĐây là nội dung mô phỏng được trích xuất từ tài liệu. Trong thực tế, hệ thống sẽ sử dụng AI để phân tích và trích xuất nội dung từ file PDF, DOC, hoặc các định dạng khác.`,
          );
        }, 600);
      }
    },
    [],
  );

  const handleSaveFlashcardSet = useCallback(() => {
    if (flashcards.length === 0) return;
    const newSet: SavedSet = {
      id: `fc_${Date.now()}`,
      type: "flashcard",
      name: `Flashcards - ${selectedChapterNames.slice(0, 2).join(", ")}${selectedChapterNames.length > 2 ? "..." : ""}`,
      count: flashcards.length,
      createdAt: new Date(),
      flashcards: [...flashcards],
    };
    setSavedSets((prev) => [newSet, ...prev]);
  }, [flashcards, selectedChapterNames]);

  const handleSaveQuizSet = useCallback(() => {
    if (quizQuestions.length === 0) return;
    const newSet: SavedSet = {
      id: `qz_${Date.now()}`,
      type: "quiz",
      name: `Quiz - ${selectedChapterNames.slice(0, 2).join(", ")}${selectedChapterNames.length > 2 ? "..." : ""}`,
      count: quizQuestions.length,
      createdAt: new Date(),
      quizQuestions: [...quizQuestions],
    };
    setSavedSets((prev) => [newSet, ...prev]);
  }, [quizQuestions, selectedChapterNames]);

  const handleDeleteSet = useCallback((id: string) => {
    setSavedSets((prev) => prev.filter((s) => s.id !== id));
  }, []);

  const handleLoadSet = useCallback((set: SavedSet) => {
    if (set.type === "flashcard" && set.flashcards) {
      setMode("flashcard");
      setFlashcards(set.flashcards);
      setEditingFlashcards(false);
    } else if (set.type === "quiz" && set.quizQuestions) {
      setMode("quiz");
      setQuizQuestions(set.quizQuestions);
    }
  }, []);

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
    } catch (error) {
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
          <div className="ai-section-card space-y-4">
            <div className="flex items-center gap-2">
              <div className="ai-header-icon">
                <Upload className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-foreground">
                  Thông tin bổ sung
                </h2>
                <p className="text-xs text-muted-foreground">
                  External Information — tài liệu từ bên ngoài
                </p>
              </div>
            </div>

            <label
              className={`ai-upload-area ${uploadedFileName ? "uploaded" : ""}`}
            >
              {uploadedFileName ? (
                <>
                  <CheckCircle className="h-7 w-7 text-primary" />
                  <span className="text-sm font-medium text-foreground">
                    {uploadedFileName}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    Đã chọn file — nhấn để đổi
                  </span>
                </>
              ) : (
                <>
                  <Upload className="h-7 w-7 text-muted-foreground" />
                  <span className="text-sm font-medium text-foreground">
                    Upload tài liệu bổ sung
                  </span>
                  <span className="text-xs text-muted-foreground">
                    PDF, DOC, DOCX, TXT
                  </span>
                </>
              )}
              <input
                type="file"
                accept=".pdf,.doc,.docx,.txt"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>

            {externalInfo && (
              <div className="space-y-2 animate-slide-up">
                <label className="text-sm font-medium text-muted-foreground">
                  Nội dung trích xuất (có thể chỉnh sửa)
                </label>
                <textarea
                  value={externalInfo}
                  onChange={(e) => setExternalInfo(e.target.value)}
                  rows={5}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-y"
                />
              </div>
            )}
          </div>
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
                  <Layers className="h-4 w-4" />
                </div>
                <h2 className="text-lg font-semibold text-foreground">
                  Cấu hình Flashcards
                </h2>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">
                  Số lượng thẻ
                </label>
                <input
                  type="number"
                  min={1}
                  max={30}
                  value={flashcardCount}
                  onChange={(e) =>
                    setFlashcardCount(
                      Math.max(1, Math.min(30, parseInt(e.target.value) || 1)),
                    )
                  }
                  className="w-24 rounded-lg border bg-background px-3 py-2 text-sm text-center text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </div>

            <button
              onClick={handleGenerateFlashcards}
              disabled={generating}
              className="w-full ai-button-primary"
            >
              {generating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Đang tạo flashcards...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Tạo Flashcards ({flashcardCount} thẻ)
                </>
              )}
            </button>

            {generating && (
              <div className="ai-section-card space-y-3 animate-pulse-gentle">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-20 rounded-lg bg-muted" />
                ))}
              </div>
            )}

            {!editingFlashcards && (
              <FlashcardViewer
                cards={flashcards}
                onRegenerate={handleGenerateFlashcards}
                onSave={() => {
                  handleSaveFlashcardSet();
                  alert("Đã lưu bộ flashcards vào kho!");
                }}
                loading={generating}
                onEdit={() => setEditingFlashcards(true)}
                editing={editingFlashcards}
              />
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
            <div className="ai-section-card space-y-4">
              <p className="text-sm font-medium text-muted-foreground">
                Nguồn dữ liệu quiz
              </p>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setQuizSource("context")}
                  className={`rounded-lg border px-3 py-2.5 text-left text-sm transition-all ${
                    quizSource === "context"
                      ? "border-primary bg-secondary text-secondary-foreground font-medium"
                      : "border-border text-muted-foreground hover:border-primary/40"
                  }`}
                >
                  📄 Từ nội dung chương
                </button>
                <button
                  onClick={() => setQuizSource("flashcard")}
                  disabled={flashcards.length === 0}
                  className={`rounded-lg border px-3 py-2.5 text-left text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
                    quizSource === "flashcard"
                      ? "border-primary bg-secondary text-secondary-foreground font-medium"
                      : "border-border text-muted-foreground hover:border-primary/40"
                  }`}
                >
                  🃏 Từ flashcards đã ôn
                  {flashcards.length === 0 && (
                    <span className="block text-xs mt-0.5">
                      Tạo flashcards trước
                    </span>
                  )}
                </button>
              </div>
            </div>

            <QuizConfiguration
              selectedTypes={selectedTypes}
              config={quizConfig}
              onToggleType={handleToggleType}
              onCountChange={handleCountChange}
              totalQuestions={totalQuizQuestions}
            />

            <button
              onClick={handleGenerateQuiz}
              disabled={totalQuizQuestions === 0 || generating}
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
              <div className="ai-section-card space-y-3 animate-pulse-gentle">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-20 rounded-lg bg-muted" />
                ))}
              </div>
            )}

            <QuizEditor
              questions={quizQuestions}
              onUpdateQuestion={handleUpdateQuestion}
              onRegenerate={handleGenerateQuiz}
              onSave={() => {
                handleSaveQuizSet();
                alert("Đã lưu bộ quiz vào kho!");
              }}
              loading={generating}
            />
          </>
        )}

        {/* Saved sets storage */}
        {savedSets.length > 0 && (
          <div className="ai-section-card space-y-4">
            <div className="flex items-center gap-2">
              <div className="ai-header-icon">
                <Archive className="h-4 w-4" />
              </div>
              <h2 className="text-lg font-semibold text-foreground">
                Kho lưu trữ
              </h2>
              <span className="ml-auto text-xs text-muted-foreground">
                {savedSets.length} bộ
              </span>
            </div>
            <div className="space-y-2">
              {savedSets.map((set) => (
                <div
                  key={set.id}
                  className="flex items-center gap-3 rounded-lg border border-border p-3 hover:bg-muted/50 transition-colors"
                >
                  <div className="ai-archive-icon shrink-0">
                    {set.type === "flashcard" ? (
                      <BookOpen className="h-4 w-4" />
                    ) : (
                      <Brain className="h-4 w-4" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {set.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {set.count} {set.type === "flashcard" ? "thẻ" : "câu"} •{" "}
                      {set.createdAt.toLocaleString("vi-VN")}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => handleLoadSet(set)}
                      className="ai-button-primary text-xs px-3 py-1.5"
                    >
                      Mở
                    </button>
                    <button
                      onClick={() => handleDeleteSet(set.id)}
                      className="rounded-lg p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
