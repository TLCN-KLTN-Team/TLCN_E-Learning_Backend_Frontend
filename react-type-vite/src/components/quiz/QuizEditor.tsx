import { Pencil, RotateCcw, Save, Hash, Tag } from "lucide-react";
import type { QuizQuestion, Difficulty } from "@/lib/quiz/quizMockData";
import { QUESTION_TYPE_LABELS } from "@/lib/quiz/quizMockData";

const DIFFICULTIES: Difficulty[] = ["EASY", "MEDIUM", "HARD"];

interface Props {
  questions: QuizQuestion[];
  onUpdateQuestion: (id: string, updated: Partial<QuizQuestion>) => void;
  onRegenerate: () => void;
  onSave: () => void;
  loading: boolean;
}

export default function QuizEditor({
  questions,
  onUpdateQuestion,
  onRegenerate,
  onSave,
  loading,
}: Props) {
  if (questions.length === 0) return null;

  return (
    <div className="section-card space-y-5 animate-slide-up">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Pencil className="h-4 w-4 text-primary" />
          </div>
          <h2 className="text-lg font-semibold text-foreground">
            Chỉnh sửa Quiz ({questions.length} câu)
          </h2>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onRegenerate}
            disabled={loading}
            className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors disabled:opacity-50"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Tạo lại
          </button>
          <button
            onClick={onSave}
            disabled={loading}
            className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            <Save className="h-3.5 w-3.5" />
            Lưu vào ngân hàng
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {questions.map((q, index) => (
          <QuestionCard
            key={q.id}
            question={q}
            index={index}
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
  onUpdate,
}: {
  question: QuizQuestion;
  index: number;
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
    </div>
  );
}
