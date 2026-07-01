import { useState, useEffect } from "react";
import {
  Pencil,
  RotateCcw,
  Save,
  Hash,
  Tag,
  BookOpen,
  Loader2,
  Target,
} from "lucide-react";
import { toast } from "react-toastify";
import type { QuizQuestion, Difficulty } from "@/lib/quiz/quizMockData";
import { QUESTION_TYPE_LABELS } from "@/lib/quiz/quizMockData";
import {
  getTeacherClosByCourse,
  type CourseObjectiveResponse,
} from "@/services/api/teacher/courseObjectiveApi";
import {
  createLibraryQuestion,
  type QuestionLibraryRequest,
} from "@/services/api/teacher/questionLibraryApi";
import {
  getTeacherCourseCards,
  type CourseCardResponse,
} from "@/services/api/teacher/teacherCourseApi";
import { getTeacherByUserId } from "@/services/api/teacher/teacherApi";
import { useAuth } from "@/context/auth-context/useAuth";

const DIFFICULTIES: Difficulty[] = ["EASY", "MEDIUM", "HARD"];

function mapToLibraryRequest(
  q: QuizQuestion,
  cloId: number,
): QuestionLibraryRequest {
  const base: QuestionLibraryRequest = {
    questionText: q.question,
    questionType: q.questionType,
    score: q.score,
    difficultyLevel: q.difficulty,
    tags: q.tags.length > 0 ? q.tags.join(", ") : undefined,
    cloId,
    answers: [],
  };

  if (q.questionType === "FILL_IN_THE_BLANK") {
    base.answers = (q.answers ?? []).map((ans, idx) => ({
      content: ans,
      isCorrect: true,
      orderIndex: idx + 1,
    }));
  } else {
    base.answers = (q.options ?? []).map((opt, idx) => ({
      content: opt.text,
      isCorrect: opt.isCorrect,
      orderIndex: idx + 1,
    }));
  }

  return base;
}

interface Props {
  questions: QuizQuestion[];
  onUpdateQuestion: (id: string, updated: Partial<QuizQuestion>) => void;
  onRegenerate: () => void;
  onSaveComplete: () => void;
  loading: boolean;
}

export default function TeacherQuizEditor({
  questions,
  onUpdateQuestion,
  onRegenerate,
  onSaveComplete,
  loading,
}: Props) {
  const { user } = useAuth();
  const [courses, setCourses] = useState<CourseCardResponse[]>([]);
  const [clos, setClos] = useState<CourseObjectiveResponse[]>([]);
  const [closLoading, setClosLoading] = useState(false);
  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user?.id) return;
    const load = async () => {
      const teacherResponse = await getTeacherByUserId(user.id);
      const courseCards = await getTeacherCourseCards(
        teacherResponse.teacherId,
      );
      setCourses(courseCards);
    };
    load().catch(() => toast.error("Không thể tải danh sách khóa học"));
  }, [user?.id]);

  const assignedCount = questions.filter((q) => q.cloId).length;
  const allAssigned =
    questions.length > 0 && assignedCount === questions.length;

  const handleCourseChange = async (courseId: number | null) => {
    setSelectedCourseId(courseId);
    questions.forEach((q) => onUpdateQuestion(q.id, { cloId: undefined }));
    if (!courseId) {
      setClos([]);
      return;
    }
    setClosLoading(true);
    try {
      const data = await getTeacherClosByCourse(courseId);
      setClos(data);
      if (data.length === 0) {
        toast.info("Khóa học này chưa có chuẩn đầu ra nào được kích hoạt.");
      }
    } catch {
      toast.error("Không thể tải chuẩn đầu ra cho khóa học này.");
      setClos([]);
    } finally {
      setClosLoading(false);
    }
  };

  const handleSave = async () => {
    if (!selectedCourseId) {
      toast.error("Vui lòng chọn khóa học trước khi lưu.");
      return;
    }

    const uncovered = questions.filter((q) => !q.cloId);
    if (uncovered.length > 0) {
      toast.error(
        `${uncovered.length} câu hỏi chưa được gán chuẩn đầu ra. Vui lòng gán cho toàn bộ câu hỏi trước khi lưu.`,
      );
      return;
    }

    setSaving(true);
    let success = 0;
    let failed = 0;

    for (const q of questions) {
      try {
        await createLibraryQuestion(mapToLibraryRequest(q, q.cloId!));
        success++;
      } catch {
        failed++;
      }
    }

    setSaving(false);

    if (success > 0) {
      toast.success(
        `Đã lưu ${success}/${questions.length} câu hỏi vào ngân hàng.`,
      );
      onSaveComplete();
    }
    if (failed > 0) {
      toast.warning(`${failed} câu hỏi bị lỗi khi lưu.`);
    }
  };

  if (questions.length === 0) return null;

  return (
    <div className="section-card space-y-5 animate-slide-up">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Pencil className="h-4 w-4 text-primary" />
          </div>
          <h2 className="text-lg font-semibold text-foreground">
            Chỉnh sửa Quiz ({questions.length} câu)
          </h2>
          {selectedCourseId && (
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                allAssigned
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-amber-100 text-amber-700"
              }`}
            >
              {assignedCount}/{questions.length} câu đã gán CĐR
            </span>
          )}
        </div>
        <div className="flex gap-2">
          <button
            onClick={onRegenerate}
            disabled={loading || saving}
            className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors disabled:opacity-50"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Tạo lại
          </button>
          <button
            onClick={handleSave}
            disabled={loading || saving}
            className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {saving ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Đang lưu...
              </>
            ) : (
              <>
                <Save className="h-3.5 w-3.5" />
                Lưu vào ngân hàng
              </>
            )}
          </button>
        </div>
      </div>

      {/* Course selection */}
      <div className="rounded-lg border bg-muted/30 p-4 space-y-2">
        <div className="flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-primary" />
          <p className="text-sm font-medium text-foreground">
            Chọn khóa học để gán chuẩn đầu ra
          </p>
        </div>
        <select
          value={selectedCourseId ?? ""}
          onChange={(e) =>
            handleCourseChange(e.target.value ? Number(e.target.value) : null)
          }
          className="w-full rounded-md border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="">Chọn khóa học</option>
          {courses.map((c) => (
            <option key={c.courseId} value={c.courseId}>
              {c.courseName}
            </option>
          ))}
        </select>
        {selectedCourseId && (
          <p className="text-xs text-muted-foreground">
            {closLoading
              ? "Đang tải chuẩn đầu ra..."
              : `${clos.length} chuẩn đầu ra — gán cho từng câu hỏi bên dưới`}
          </p>
        )}
      </div>

      {/* Question cards */}
      <div className="space-y-4">
        {questions.map((q, index) => (
          <QuestionCard
            key={q.id}
            question={q}
            index={index}
            clos={clos}
            courseSelected={!!selectedCourseId}
            onUpdate={(updated) => onUpdateQuestion(q.id, updated)}
          />
        ))}
      </div>
    </div>
  );
}

function QuestionCard({
  question: q,
  index,
  clos,
  courseSelected,
  onUpdate,
}: {
  question: QuizQuestion;
  index: number;
  clos: CourseObjectiveResponse[];
  courseSelected: boolean;
  onUpdate: (updated: Partial<QuizQuestion>) => void;
}) {
  const diffBadge =
    q.difficulty === "EASY"
      ? "badge-easy"
      : q.difficulty === "MEDIUM"
        ? "badge-medium"
        : "badge-hard";

  return (
    <div className="rounded-lg border bg-muted/20 p-4 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="flex items-center justify-center h-6 w-6 rounded-full bg-primary text-primary-foreground text-xs font-bold">
            {index + 1}
          </span>
          <span className="text-xs font-medium text-muted-foreground">
            {QUESTION_TYPE_LABELS[q.questionType]}
          </span>
          <span className={diffBadge}>{q.difficulty}</span>
        </div>
      </div>

      {/* Question text */}
      <textarea
        value={q.question}
        onChange={(e) => onUpdate({ question: e.target.value })}
        rows={2}
        className="w-full rounded-md border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
      />

      {/* Options for SINGLE / MULTIPLE / TRUE_FALSE */}
      {(q.questionType === "SINGLE_CHOICE" ||
        q.questionType === "MULTIPLE_CHOICE" ||
        q.questionType === "TRUE_FALSE") && (
        <div className="space-y-2">
          {q.options.map((opt, oi) => (
            <div key={opt.id} className="flex items-center gap-2">
              {q.questionType === "MULTIPLE_CHOICE" ? (
                <input
                  type="checkbox"
                  checked={opt.isCorrect}
                  onChange={() => {
                    const newOpts = q.options.map((o, i) =>
                      i === oi ? { ...o, isCorrect: !o.isCorrect } : o,
                    );
                    onUpdate({ options: newOpts });
                  }}
                  className="h-4 w-4 rounded border-border text-primary accent-primary"
                />
              ) : (
                <input
                  type="radio"
                  name={`q_${q.id}`}
                  checked={opt.isCorrect}
                  onChange={() => {
                    const newOpts = q.options.map((o, i) => ({
                      ...o,
                      isCorrect: i === oi,
                    }));
                    onUpdate({ options: newOpts });
                  }}
                  className="h-4 w-4 border-border text-primary accent-primary"
                />
              )}
              <input
                type="text"
                value={opt.text}
                onChange={(e) => {
                  const newOpts = [...q.options];
                  newOpts[oi] = { ...newOpts[oi], text: e.target.value };
                  onUpdate({ options: newOpts });
                }}
                className={`flex-1 rounded-md border px-2.5 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring ${
                  opt.isCorrect
                    ? "bg-success/5 border-success/30"
                    : "bg-background"
                }`}
              />
            </div>
          ))}
        </div>
      )}

      {/* FILL_IN_THE_BLANK answers */}
      {q.questionType === "FILL_IN_THE_BLANK" && (
        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground">
            Đáp án (mỗi dòng một đáp án)
          </label>
          <textarea
            value={(q.answers || []).join("\n")}
            onChange={(e) =>
              onUpdate({ answers: e.target.value.split("\n").filter(Boolean) })
            }
            rows={2}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none font-mono"
          />
        </div>
      )}

      {/* Meta: difficulty, score, tags */}
      <div className="grid grid-cols-3 gap-3 pt-2 border-t border-border">
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Độ khó</label>
          <select
            value={q.difficulty}
            onChange={(e) =>
              onUpdate({ difficulty: e.target.value as Difficulty })
            }
            className="w-full rounded-md border bg-background px-2 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          >
            {DIFFICULTIES.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <label className="flex items-center gap-1 text-xs text-muted-foreground">
            <Hash className="h-3 w-3" /> Điểm
          </label>
          <input
            type="number"
            min={1}
            value={q.score}
            onChange={(e) => onUpdate({ score: parseInt(e.target.value) || 1 })}
            className="w-full rounded-md border bg-background px-2 py-1.5 text-sm text-center text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div className="space-y-1">
          <label className="flex items-center gap-1 text-xs text-muted-foreground">
            <Tag className="h-3 w-3" /> Tags
          </label>
          <input
            type="text"
            value={q.tags.join(", ")}
            onChange={(e) =>
              onUpdate({
                tags: e.target.value
                  .split(",")
                  .map((t) => t.trim())
                  .filter(Boolean),
              })
            }
            className="w-full rounded-md border bg-background px-2 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      </div>

      {/* CLO selection per question */}
      <div className="space-y-1 pt-1">
        <label className="flex items-center gap-1 text-xs text-muted-foreground">
          <Target className="h-3 w-3" />
          Chuẩn đầu ra (CĐR)
          {!q.cloId && <span className="text-destructive ml-0.5">*</span>}
        </label>
        <select
          value={q.cloId ?? ""}
          onChange={(e) =>
            onUpdate({
              cloId: e.target.value ? Number(e.target.value) : undefined,
            })
          }
          disabled={!courseSelected}
          className={`w-full rounded-md border px-2.5 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring ${
            !courseSelected
              ? "bg-muted text-muted-foreground cursor-not-allowed"
              : q.cloId
                ? "bg-background border-border"
                : "bg-destructive/5 border-destructive/40"
          }`}
        >
          <option value="">
            {!courseSelected ? "Chọn khóa học trước" : "Chọn chuẩn đầu ra"}
          </option>
          {clos.map((clo) => (
            <option key={clo.id} value={clo.id}>
              {clo.code} — {clo.description ?? `CLO #${clo.id}`}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
