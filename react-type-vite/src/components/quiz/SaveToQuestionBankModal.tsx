import { useState, useEffect } from "react";
import { Save, BookOpen, Loader2, CheckCircle2, XCircle } from "lucide-react";
import Modal from "@/components/ui/modal";
import { Label } from "@/components/ui/label";
import { toast } from "react-toastify";
import {
  getTeacherActiveClos,
  type CourseObjectiveResponse,
} from "@/services/api/teacher/courseObjectiveApi";
import {
  createLibraryQuestion,
  type QuestionLibraryRequest,
} from "@/services/api/teacher/questionLibraryApi";
import type { QuizQuestion } from "@/lib/quiz/quizMockData";

interface Props {
  isOpen: boolean;
  questions: QuizQuestion[];
  onClose: () => void;
  onSuccess: () => void;
}

function mapToLibraryRequest(q: QuizQuestion, cloId: number): QuestionLibraryRequest {
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

export default function SaveToQuestionBankModal({
  isOpen,
  questions,
  onClose,
  onSuccess,
}: Props) {
  const [availableClos, setAvailableClos] = useState<CourseObjectiveResponse[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);
  const [selectedCloId, setSelectedCloId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<{ success: number; failed: number } | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setResult(null);

    getTeacherActiveClos()
      .then((clos) => {
        setAvailableClos(clos);
        if (clos.length > 0) {
          const firstCourseId = clos[0].courseId;
          setSelectedCourseId(firstCourseId);
          const first = clos.find((c) => c.courseId === firstCourseId);
          if (first) setSelectedCloId(first.id);
        }
      })
      .catch(() => toast.error("Không thể tải danh sách chuẩn đầu ra"));
  }, [isOpen]);

  const availableCourses = Array.from(
    new Map(
      availableClos.map((c) => [
        c.courseId,
        { courseId: c.courseId, courseName: c.courseName || `Khóa học #${c.courseId}` },
      ])
    ).values()
  );

  const filteredClos = selectedCourseId
    ? availableClos.filter((c) => c.courseId === selectedCourseId)
    : [];

  const handleSave = async () => {
    if (!selectedCloId) {
      toast.error("Vui lòng chọn chuẩn đầu ra (CĐR)");
      return;
    }

    setSaving(true);
    let success = 0;
    let failed = 0;

    for (const q of questions) {
      try {
        await createLibraryQuestion(mapToLibraryRequest(q, selectedCloId));
        success++;
      } catch {
        failed++;
      }
    }

    setSaving(false);
    setResult({ success, failed });

    if (success > 0) {
      toast.success(`Đã lưu ${success}/${questions.length} câu hỏi vào ngân hàng`);
      onSuccess();
    }
    if (failed > 0) {
      toast.warning(`${failed} câu hỏi bị lỗi khi lưu`);
    }
  };

  const handleClose = () => {
    setResult(null);
    setSelectedCourseId(null);
    setSelectedCloId(null);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} maxWidth="max-w-lg">
      <div className="p-6 space-y-5">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <BookOpen className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">Lưu vào Ngân hàng câu hỏi</h2>
            <p className="text-sm text-muted-foreground">
              {questions.length} câu hỏi sẽ được lưu
            </p>
          </div>
        </div>

        {/* CLO selection */}
        <div className="rounded-lg border bg-muted/30 p-4 space-y-4">
          <p className="text-sm font-medium text-foreground">Chọn chuẩn đầu ra (CĐR) áp dụng</p>

          <div className="grid grid-cols-1 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="course-select" className="text-xs text-muted-foreground">
                Khóa học <span className="text-destructive">*</span>
              </Label>
              <select
                id="course-select"
                value={selectedCourseId ?? ""}
                onChange={(e) => {
                  const id = e.target.value ? Number(e.target.value) : null;
                  setSelectedCourseId(id);
                  if (id) {
                    const first = availableClos.find((c) => c.courseId === id);
                    setSelectedCloId(first?.id ?? null);
                  } else {
                    setSelectedCloId(null);
                  }
                }}
                className="w-full rounded-md border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">Chọn khóa học</option>
                {availableCourses.map((c) => (
                  <option key={c.courseId} value={c.courseId}>
                    {c.courseName}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="clo-select" className="text-xs text-muted-foreground">
                CĐR đánh giá <span className="text-destructive">*</span>
              </Label>
              <select
                id="clo-select"
                value={selectedCloId ?? ""}
                onChange={(e) => setSelectedCloId(e.target.value ? Number(e.target.value) : null)}
                disabled={!selectedCourseId}
                className="w-full rounded-md border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:bg-muted disabled:text-muted-foreground"
              >
                <option value="">
                  {selectedCourseId ? "Chọn CĐR" : "Vui lòng chọn khóa học trước"}
                </option>
                {filteredClos.map((clo) => (
                  <option key={clo.id} value={clo.id}>
                    {clo.code} — {clo.description ?? clo.courseName ?? `CLO #${clo.id}`}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Result summary */}
        {result && (
          <div className="space-y-2">
            {result.success > 0 && (
              <div className="flex items-center gap-2 rounded-lg bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-800">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                Thành công: {result.success} câu hỏi
              </div>
            )}
            {result.failed > 0 && (
              <div className="flex items-center gap-2 rounded-lg bg-destructive/5 border border-destructive/20 px-4 py-3 text-sm text-destructive">
                <XCircle className="h-4 w-4 shrink-0" />
                Lỗi: {result.failed} câu hỏi không lưu được
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-1">
          <button
            onClick={handleClose}
            className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors"
          >
            Đóng
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !selectedCloId}
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
                Lưu {questions.length} câu hỏi
              </>
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
}
