import { Settings2 } from "lucide-react";
import type {
  QuestionType,
  Difficulty,
  DifficultyConfig,
  QuizConfig,
} from "@/lib/quiz/quizMockData";
import { QUESTION_TYPE_LABELS } from "@/lib/quiz/quizMockData";

const ALL_TYPES: QuestionType[] = [
  "SINGLE_CHOICE",
  "MULTIPLE_CHOICE",
  "TRUE_FALSE",
  "FILL_IN_THE_BLANK",
];
const DIFFICULTIES: Difficulty[] = ["EASY", "MEDIUM", "HARD"];
const DIFF_LABELS: Record<Difficulty, string> = {
  EASY: "Dễ",
  MEDIUM: "Trung bình",
  HARD: "Khó",
};

interface Props {
  selectedTypes: QuestionType[];
  config: QuizConfig;
  onToggleType: (type: QuestionType) => void;
  onCountChange: (type: QuestionType, diff: Difficulty, count: number) => void;
  totalQuestions: number;
}

export default function QuizConfiguration({
  selectedTypes,
  config,
  onToggleType,
  onCountChange,
  totalQuestions,
}: Props) {
  return (
    <div className="section-card space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Settings2 className="h-4 w-4 text-primary" />
          </div>
          <h2 className="text-lg font-semibold text-foreground">
            Cấu hình Quiz
          </h2>
        </div>
        <div className="flex items-center gap-2 rounded-full bg-secondary px-3 py-1">
          <span className="text-xs text-muted-foreground">Tổng câu hỏi:</span>
          <span className="text-sm font-bold text-primary">
            {totalQuestions}
          </span>
        </div>
      </div>

      <div className="space-y-3">
        <p className="text-sm font-medium text-muted-foreground">
          Chọn loại câu hỏi
        </p>
        <div className="grid grid-cols-2 gap-2">
          {ALL_TYPES.map((type) => {
            const active = selectedTypes.includes(type);
            return (
              <button
                key={type}
                onClick={() => onToggleType(type)}
                className={`rounded-lg border px-3 py-2.5 text-left text-sm transition-all ${
                  active
                    ? "border-primary bg-secondary text-secondary-foreground font-medium"
                    : "border-border text-muted-foreground hover:border-primary/40"
                }`}
              >
                {QUESTION_TYPE_LABELS[type]}
              </button>
            );
          })}
        </div>
      </div>

      {selectedTypes.length > 0 && (
        <div className="space-y-4 animate-slide-up">
          <p className="text-sm font-medium text-muted-foreground">
            Số câu hỏi theo độ khó
          </p>
          {selectedTypes.map((type) => {
            const diffConfig: DifficultyConfig = config[type] || {
              EASY: 0,
              MEDIUM: 0,
              HARD: 0,
            };
            return (
              <div
                key={type}
                className="rounded-lg border bg-muted/30 p-4 space-y-3"
              >
                <p className="text-sm font-semibold text-foreground">
                  {QUESTION_TYPE_LABELS[type]}
                </p>
                <div className="grid grid-cols-3 gap-3">
                  {DIFFICULTIES.map((diff) => (
                    <div key={diff} className="space-y-1">
                      <label
                        className={`text-xs font-medium ${
                          diff === "EASY"
                            ? "text-success"
                            : diff === "MEDIUM"
                              ? "text-warning"
                              : "text-destructive"
                        }`}
                      >
                        {DIFF_LABELS[diff]}
                      </label>
                      <input
                        type="number"
                        min={0}
                        max={20}
                        value={diffConfig[diff]}
                        onChange={(e) =>
                          onCountChange(
                            type,
                            diff,
                            Math.max(0, parseInt(e.target.value) || 0),
                          )
                        }
                        className="w-full rounded-md border bg-background px-2.5 py-1.5 text-sm text-center text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
