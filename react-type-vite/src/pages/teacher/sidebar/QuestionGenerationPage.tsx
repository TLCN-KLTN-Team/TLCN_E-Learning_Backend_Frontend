import { useState, useCallback, useMemo, useEffect } from "react";
import {
  Sparkles,
  Loader2,
  Brain,
  Target,
  BookOpen,
  ChevronDown,
} from "lucide-react";
import SourceSelection from "@/components/quiz/SourceSelection";
import QuizEditor from "@/components/quiz/QuizEditor";
import type { QuizQuestion, QuestionType, Difficulty } from "@/lib/quiz/quizMockData";
import {
  getTeacherActiveClos,
  type CourseObjectiveResponse,
} from "@/services/api/teacher/courseObjectiveApi";
import QuizApiService from "@/services/api/teacher/quizApi";
import {
  toUIQuizQuestion,
  type LearningOutcomeDto,
  type QuizQuestionConfigDto,
} from "@/types/quiz.type";
import { AppError } from "@/errors";
import { toast } from "react-toastify";

const ALL_TYPES: QuestionType[] = [
  "SINGLE_CHOICE",
  "MULTIPLE_CHOICE",
  "TRUE_FALSE",
  "FILL_IN_THE_BLANK",
];

const TYPE_LABELS: Record<QuestionType, string> = {
  SINGLE_CHOICE: "Một đáp án",
  MULTIPLE_CHOICE: "Nhiều đáp án",
  TRUE_FALSE: "Đúng / Sai",
  FILL_IN_THE_BLANK: "Điền vào chỗ trống",
};

const TYPE_COLORS: Record<QuestionType, string> = {
  SINGLE_CHOICE: "border-blue-300 bg-blue-50 text-blue-700",
  MULTIPLE_CHOICE: "border-violet-300 bg-violet-50 text-violet-700",
  TRUE_FALSE: "border-amber-300 bg-amber-50 text-amber-700",
  FILL_IN_THE_BLANK: "border-teal-300 bg-teal-50 text-teal-700",
};

const TYPE_SELECTED_RING: Record<QuestionType, string> = {
  SINGLE_CHOICE: "ring-blue-400 border-blue-400 bg-blue-100",
  MULTIPLE_CHOICE: "ring-violet-400 border-violet-400 bg-violet-100",
  TRUE_FALSE: "ring-amber-400 border-amber-400 bg-amber-100",
  FILL_IN_THE_BLANK: "ring-teal-400 border-teal-400 bg-teal-100",
};

const DIFFICULTIES: Difficulty[] = ["EASY", "MEDIUM", "HARD"];

const DIFF_LABELS: Record<Difficulty, string> = {
  EASY: "Dễ",
  MEDIUM: "Trung bình",
  HARD: "Khó",
};

const DIFF_HEADER_BG: Record<Difficulty, string> = {
  EASY: "bg-emerald-50 text-emerald-700 border-emerald-200",
  MEDIUM: "bg-amber-50 text-amber-700 border-amber-200",
  HARD: "bg-rose-50 text-rose-700 border-rose-200",
};

const DIFF_INPUT_BG: Record<Difficulty, string> = {
  EASY: "bg-emerald-50 border-emerald-200 focus:ring-emerald-300",
  MEDIUM: "bg-amber-50 border-amber-200 focus:ring-amber-300",
  HARD: "bg-rose-50 border-rose-200 focus:ring-rose-300",
};

type DifficultyConfig = Record<Difficulty, number>;

type CloConfig = {
  selectedTypes: Set<QuestionType>;
  typeConfig: Record<QuestionType, DifficultyConfig>;
};

const defaultDiffConfig = (): DifficultyConfig => ({ EASY: 0, MEDIUM: 0, HARD: 0 });

const QuestionGenerationPage = () => {
  const [sourceType, setSourceType] = useState<"document" | "topic">("document");
  const [summary, setSummary] = useState("");
  const [topic, setTopic] = useState("");
  const [fileName, setFileName] = useState("");

  const [allOutcomes, setAllOutcomes] = useState<CourseObjectiveResponse[]>([]);
  const [outcomesLoading, setOutcomesLoading] = useState(false);
  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);
  const [selectedOutcomeIds, setSelectedOutcomeIds] = useState<Set<number>>(new Set());
  const [cloConfigs, setCloConfigs] = useState<Record<number, CloConfig>>({});

  const [generatedQuiz, setGeneratedQuiz] = useState<QuizQuestion[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setOutcomesLoading(true);
    getTeacherActiveClos()
      .then(setAllOutcomes)
      .catch(() => toast.error("Không thể tải danh sách chuẩn đầu ra."))
      .finally(() => setOutcomesLoading(false));
  }, []);

  // Unique courses derived from CLOs
  const courses = useMemo(() => {
    const map = new Map<number, string>();
    allOutcomes.forEach((o) => {
      if (o.courseId && o.courseName) map.set(o.courseId, o.courseName);
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [allOutcomes]);

  // CLOs for the selected course
  const filteredOutcomes = useMemo(
    () =>
      selectedCourseId != null
        ? allOutcomes.filter((o) => o.courseId === selectedCourseId)
        : [],
    [allOutcomes, selectedCourseId],
  );

  const handleCourseChange = useCallback((courseId: number | null) => {
    setSelectedCourseId(courseId);
    setSelectedOutcomeIds(new Set());
    setCloConfigs({});
  }, []);

  const handleToggleOutcome = useCallback((id: number) => {
    setSelectedOutcomeIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
        setCloConfigs((cfg) => {
          const c = { ...cfg };
          delete c[id];
          return c;
        });
      } else {
        next.add(id);
        setCloConfigs((cfg) => ({
          ...cfg,
          [id]: { selectedTypes: new Set<QuestionType>(), typeConfig: {} },
        }));
      }
      return next;
    });
  }, []);

  const handleToggleType = useCallback((outcomeId: number, type: QuestionType) => {
    setCloConfigs((prev) => {
      const clo = prev[outcomeId] ?? {
        selectedTypes: new Set<QuestionType>(),
        typeConfig: {},
      };
      const types = new Set(clo.selectedTypes);
      const typeConfig = { ...clo.typeConfig };
      if (types.has(type)) {
        types.delete(type);
        delete typeConfig[type];
      } else {
        types.add(type);
        typeConfig[type] = defaultDiffConfig();
      }
      return { ...prev, [outcomeId]: { selectedTypes: types, typeConfig } };
    });
  }, []);

  const handleTypeCountChange = useCallback(
    (outcomeId: number, type: QuestionType, diff: Difficulty, count: number) => {
      setCloConfigs((prev) => {
        const clo = prev[outcomeId];
        if (!clo) return prev;
        return {
          ...prev,
          [outcomeId]: {
            ...clo,
            typeConfig: {
              ...clo.typeConfig,
              [type]: {
                ...(clo.typeConfig[type] || defaultDiffConfig()),
                [diff]: Math.max(0, count),
              },
            },
          },
        };
      });
    },
    [],
  );

  const totalQuestions = useMemo(() => {
    let total = 0;
    for (const cloId of selectedOutcomeIds) {
      const cfg = cloConfigs[cloId];
      if (!cfg) continue;
      for (const type of cfg.selectedTypes) {
        const dc = cfg.typeConfig[type];
        if (dc) total += dc.EASY + dc.MEDIUM + dc.HARD;
      }
    }
    return total;
  }, [selectedOutcomeIds, cloConfigs]);

  // Per-CLO total for display in the header badge
  const cloTotals = useMemo(() => {
    const result: Record<number, number> = {};
    for (const cloId of selectedOutcomeIds) {
      const cfg = cloConfigs[cloId];
      let total = 0;
      if (cfg) {
        for (const type of cfg.selectedTypes) {
          const dc = cfg.typeConfig[type];
          if (dc) total += dc.EASY + dc.MEDIUM + dc.HARD;
        }
      }
      result[cloId] = total;
    }
    return result;
  }, [selectedOutcomeIds, cloConfigs]);

  const handleGenerate = useCallback(async () => {
    const context = summary || topic;
    if (!context.trim()) {
      toast.error("Vui lòng nhập nguồn dữ liệu (tài liệu hoặc chủ đề).");
      return;
    }
    if (selectedOutcomeIds.size === 0) {
      toast.error("Vui lòng chọn ít nhất một chuẩn đầu ra.");
      return;
    }
    if (totalQuestions === 0) {
      toast.error("Vui lòng cấu hình số lượng câu hỏi cho ít nhất một chuẩn đầu ra.");
      return;
    }

    // Aggregate per-CLO configs into a single questions array
    const aggregated: Partial<Record<QuestionType, DifficultyConfig>> = {};
    for (const cloId of selectedOutcomeIds) {
      const cfg = cloConfigs[cloId];
      if (!cfg) continue;
      for (const type of cfg.selectedTypes) {
        const dc = cfg.typeConfig[type];
        if (!dc) continue;
        if (!aggregated[type]) aggregated[type] = defaultDiffConfig();
        aggregated[type]!.EASY += dc.EASY;
        aggregated[type]!.MEDIUM += dc.MEDIUM;
        aggregated[type]!.HARD += dc.HARD;
      }
    }

    const questions: QuizQuestionConfigDto[] = (
      Object.entries(aggregated) as [QuestionType, DifficultyConfig][]
    )
      .map(([type, dc]) => ({
        type,
        numberOfQuestions: DIFFICULTIES.filter((d) => dc[d] > 0).map((d) => ({
          difficulty: d,
          number: dc[d],
        })),
      }))
      .filter((q) => q.numberOfQuestions.length > 0);

    if (questions.length === 0) {
      toast.error("Vui lòng chọn ít nhất một loại câu hỏi.");
      return;
    }

    const learningOutcomes: LearningOutcomeDto[] = allOutcomes
      .filter((o) => selectedOutcomeIds.has(o.id))
      .map((o) => ({ id: String(o.id), title: o.code, content: o.description }));

    setLoading(true);
    try {
      const response = await QuizApiService.generateQuiz({
        context,
        learning_outcomes: learningOutcomes,
        questions,
        language: "vietnamese",
      });

      if (!response?.questions?.length) {
        throw new Error("AI không trả về câu hỏi nào. Hãy thử lại hoặc điều chỉnh cấu hình.");
      }

      const uiQuestions = response.questions.map((q, idx) => toUIQuizQuestion(q, idx + 1));
      setGeneratedQuiz(uiQuestions);
      toast.success(`Đã tạo ${uiQuestions.length} câu hỏi từ AI.`);
    } catch (err) {
      let msg = "Không thể tạo quiz. Vui lòng thử lại.";
      if (err instanceof AppError) msg = err.getDisplayMessage();
      else if (err instanceof Error && err.message) msg = err.message;
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, [allOutcomes, selectedOutcomeIds, cloConfigs, summary, topic, totalQuestions]);

  const handleUpdateQuestion = useCallback(
    (id: string, updated: Partial<QuizQuestion>) => {
      setGeneratedQuiz((prev) => prev.map((q) => (q.id === id ? { ...q, ...updated } : q)));
    },
    [],
  );

  const handleSave = useCallback(() => {
    console.log("Saved to question bank:", generatedQuiz);
    toast.success("Đã lưu vào ngân hàng câu hỏi!");
  }, [generatedQuiz]);

  const canGenerate =
    !loading &&
    (summary.trim() || topic.trim()) &&
    selectedOutcomeIds.size > 0 &&
    totalQuestions > 0;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="px-4 py-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center shadow-sm">
            <Brain className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">AI Quiz Generator</h1>
            <p className="text-sm text-muted-foreground">
              Tạo bài kiểm tra thông minh từ tài liệu hoặc chủ đề
            </p>
          </div>
        </div>
      </header>

      <main className="py-6 space-y-4">
        {/* Step 1: Source */}
        <SourceSelection
          sourceType={sourceType}
          summary={summary}
          topic={topic}
          fileName={fileName}
          onSourceTypeChange={(t) => {
            setSourceType(t);
            setSummary("");
            setFileName("");
            setTopic("");
          }}
          onSummaryChange={setSummary}
          onTopicChange={setTopic}
          onFileSelect={setFileName}
        />

        {/* Step 2: Course + CLOs */}
        <div className="section-card space-y-4">
          {/* Section header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Target className="h-4 w-4 text-primary" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-foreground">Chuẩn đầu ra</h2>
                <p className="text-xs text-muted-foreground">
                  Chọn khóa học rồi chọn CĐR để AI bám sát mục tiêu học tập
                </p>
              </div>
            </div>
            {selectedOutcomeIds.size > 0 && (
              <div className="flex items-center gap-1.5 rounded-full bg-primary/10 border border-primary/20 px-3 py-1">
                <span className="text-xs text-muted-foreground">Đã chọn</span>
                <span className="text-sm font-bold text-primary">{selectedOutcomeIds.size}</span>
              </div>
            )}
          </div>

          {/* Course dropdown */}
          {outcomesLoading ? (
            <div className="flex items-center gap-2 text-muted-foreground py-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm">Đang tải dữ liệu...</span>
            </div>
          ) : courses.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center gap-3">
              <div className="h-14 w-14 rounded-full bg-muted flex items-center justify-center">
                <BookOpen className="h-6 w-6 text-muted-foreground/40" />
              </div>
              <p className="text-sm text-muted-foreground">Không tìm thấy khóa học nào có chuẩn đầu ra.</p>
            </div>
          ) : (
            <>
              {/* Course select */}
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Khóa học</label>
                <div className="relative">
                  <select
                    value={selectedCourseId ?? ""}
                    onChange={(e) =>
                      handleCourseChange(e.target.value ? Number(e.target.value) : null)
                    }
                    className="w-full appearance-none rounded-xl border border-border bg-background px-3 py-2.5 pr-9 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-colors"
                  >
                    <option value="">-- Chọn khóa học --</option>
                    {courses.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                </div>
              </div>

              {/* CLO list */}
              {selectedCourseId != null && (
                <>
                  {filteredOutcomes.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-center gap-2">
                      <BookOpen className="h-6 w-6 text-muted-foreground/40" />
                      <p className="text-sm text-muted-foreground">
                        Khóa học này chưa có chuẩn đầu ra nào.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {filteredOutcomes.map((outcome) => {
                        const isSelected = selectedOutcomeIds.has(outcome.id);
                        const cfg = cloConfigs[outcome.id];
                        const cloTotal = cloTotals[outcome.id] ?? 0;

                        return (
                          <div
                            key={outcome.id}
                            className={`rounded-xl border overflow-hidden transition-all duration-200 ${
                              isSelected
                                ? "border-primary/40 shadow-sm"
                                : "border-border"
                            }`}
                          >
                            {/* CLO header row */}
                            <button
                              onClick={() => handleToggleOutcome(outcome.id)}
                              className={`w-full flex items-center gap-3 p-3 text-left transition-colors duration-150 ${
                                isSelected
                                  ? "bg-primary/5 hover:bg-primary/8"
                                  : "bg-card hover:bg-muted/30"
                              }`}
                            >
                              <div
                                className={`flex-shrink-0 h-5 w-5 rounded border-2 flex items-center justify-center transition-all duration-150 ${
                                  isSelected
                                    ? "border-primary bg-primary scale-105"
                                    : "border-border hover:border-primary/60"
                                }`}
                              >
                                {isSelected && (
                                  <svg
                                    className="h-3 w-3 text-primary-foreground"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                    strokeWidth={3}
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      d="M5 13l4 4L19 7"
                                    />
                                  </svg>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <span className="text-sm font-semibold text-foreground">
                                  {outcome.code}
                                </span>
                                {outcome.description && (
                                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                                    {outcome.description}
                                  </p>
                                )}
                              </div>
                              {isSelected && cloTotal > 0 && (
                                <span className="flex-shrink-0 text-xs font-semibold text-primary bg-primary/10 border border-primary/20 rounded-full px-2 py-0.5">
                                  {cloTotal} câu
                                </span>
                              )}
                            </button>

                            {/* Expanded config */}
                            {isSelected && cfg && (
                              <div className="border-t border-primary/10 bg-muted/20 p-3 space-y-3">
                                {/* Question type pills */}
                                <div className="space-y-1.5">
                                  <p className="text-xs font-medium text-muted-foreground">
                                    Loại câu hỏi
                                  </p>
                                  <div className="grid grid-cols-2 gap-2">
                                    {ALL_TYPES.map((type) => {
                                      const isTypeSelected = cfg.selectedTypes.has(type);
                                      return (
                                        <button
                                          key={type}
                                          onClick={() => handleToggleType(outcome.id, type)}
                                          className={`relative flex items-center gap-2 rounded-lg border-2 px-2.5 py-2 text-left transition-all duration-150 ${
                                            isTypeSelected
                                              ? `ring-1 ring-offset-1 ${TYPE_SELECTED_RING[type]}`
                                              : "border-border hover:border-primary/30 bg-card hover:bg-muted/30"
                                          }`}
                                        >
                                          <div
                                            className={`flex-shrink-0 h-3.5 w-3.5 rounded border-2 flex items-center justify-center transition-all duration-150 ${
                                              isTypeSelected
                                                ? "border-primary bg-primary"
                                                : "border-border"
                                            }`}
                                          >
                                            {isTypeSelected && (
                                              <svg
                                                className="h-2 w-2 text-primary-foreground"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                stroke="currentColor"
                                                strokeWidth={3.5}
                                              >
                                                <path
                                                  strokeLinecap="round"
                                                  strokeLinejoin="round"
                                                  d="M5 13l4 4L19 7"
                                                />
                                              </svg>
                                            )}
                                          </div>
                                          <span className="text-xs font-medium text-foreground">
                                            {TYPE_LABELS[type]}
                                          </span>
                                        </button>
                                      );
                                    })}
                                  </div>
                                </div>

                                {/* Difficulty count table */}
                                {cfg.selectedTypes.size > 0 && (
                                  <div className="space-y-1.5">
                                    <p className="text-xs font-medium text-muted-foreground">
                                      Số lượng theo độ khó
                                    </p>
                                    <div className="overflow-x-auto">
                                      <table className="w-full text-sm border-separate border-spacing-1">
                                        <thead>
                                          <tr>
                                            <th className="text-left text-xs font-medium text-muted-foreground pb-0.5 pl-1 w-32">
                                              Loại
                                            </th>
                                            {DIFFICULTIES.map((diff) => (
                                              <th key={diff} className="pb-0.5">
                                                <span
                                                  className={`inline-flex items-center justify-center rounded-md border px-2 py-0.5 text-xs font-semibold w-full ${DIFF_HEADER_BG[diff]}`}
                                                >
                                                  {DIFF_LABELS[diff]}
                                                </span>
                                              </th>
                                            ))}
                                            <th className="pb-0.5 text-right pr-1 text-xs font-medium text-muted-foreground">
                                              Tổng
                                            </th>
                                          </tr>
                                        </thead>
                                        <tbody>
                                          {Array.from(cfg.selectedTypes).map((type) => {
                                            const dc =
                                              cfg.typeConfig[type] || defaultDiffConfig();
                                            const subtotal =
                                              dc.EASY + dc.MEDIUM + dc.HARD;
                                            return (
                                              <tr key={type}>
                                                <td className="pl-1 pr-1">
                                                  <span
                                                    className={`inline-flex items-center rounded-md border px-1.5 py-0.5 text-xs font-semibold ${TYPE_COLORS[type]}`}
                                                  >
                                                    {TYPE_LABELS[type]}
                                                  </span>
                                                </td>
                                                {DIFFICULTIES.map((diff) => (
                                                  <td key={diff} className="text-center">
                                                    <input
                                                      type="number"
                                                      min={0}
                                                      max={20}
                                                      value={dc[diff]}
                                                      onChange={(e) =>
                                                        handleTypeCountChange(
                                                          outcome.id,
                                                          type,
                                                          diff,
                                                          parseInt(e.target.value) || 0,
                                                        )
                                                      }
                                                      className={`w-full rounded-md border px-1.5 py-1 text-xs text-center font-medium text-foreground focus:outline-none focus:ring-2 transition-colors ${DIFF_INPUT_BG[diff]}`}
                                                    />
                                                  </td>
                                                ))}
                                                <td className="text-right pr-1">
                                                  <span
                                                    className={`text-xs font-bold ${
                                                      subtotal > 0
                                                        ? "text-primary"
                                                        : "text-muted-foreground"
                                                    }`}
                                                  >
                                                    {subtotal}
                                                  </span>
                                                </td>
                                              </tr>
                                            );
                                          })}
                                        </tbody>
                                      </table>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </div>

        {/* Generate Button */}
        <button
          onClick={handleGenerate}
          disabled={!canGenerate}
          className={`w-full flex items-center justify-center gap-2 rounded-xl px-6 py-3.5 text-sm font-semibold transition-all duration-200 ${
            canGenerate
              ? "bg-primary text-primary-foreground hover:bg-primary/90 hover:shadow-md active:scale-[0.98]"
              : "bg-muted text-muted-foreground cursor-not-allowed"
          }`}
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Đang tạo quiz...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" />
              {totalQuestions > 0 ? `Tạo Quiz (${totalQuestions} câu)` : "Tạo Quiz"}
            </>
          )}
        </button>

        {/* Loading skeleton */}
        {loading && (
          <div className="section-card space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 rounded-xl bg-muted animate-pulse" />
            ))}
          </div>
        )}

        {/* Quiz Editor */}
        <QuizEditor
          questions={generatedQuiz}
          onUpdateQuestion={handleUpdateQuestion}
          onRegenerate={handleGenerate}
          onSave={handleSave}
          loading={loading}
        />
      </main>
    </div>
  );
};

export default QuestionGenerationPage;
