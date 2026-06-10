import { Settings2, CircleDot, ListChecks, ToggleLeft, PenLine, Check } from "lucide-react";
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

const TYPE_META: Record<
  QuestionType,
  {
    icon: React.ReactNode;
    label: string;
    // inactive state
    border: string;
    text: string;
    hoverBg: string;
    // active state
    activeBorder: string;
    activeBg: string;
    activeText: string;
    activeCheck: string;
    // card accent
    cardBorder: string;
    cardBg: string;
    badge: string;
    badgeText: string;
    // diff header tint
    headerBg: string;
    headerText: string;
  }
> = {
  SINGLE_CHOICE: {
    icon: <CircleDot className="h-4 w-4" />,
    label: QUESTION_TYPE_LABELS["SINGLE_CHOICE"],
    border: "border-blue-200",
    text: "text-blue-700",
    hoverBg: "hover:bg-blue-50",
    activeBorder: "border-blue-500",
    activeBg: "bg-blue-500",
    activeText: "text-blue-700",
    activeCheck: "bg-blue-500 border-blue-500",
    cardBorder: "border-blue-200",
    cardBg: "bg-blue-50/60",
    badge: "bg-blue-100 border-blue-200",
    badgeText: "text-blue-700",
    headerBg: "bg-blue-500",
    headerText: "text-white",
  },
  MULTIPLE_CHOICE: {
    icon: <ListChecks className="h-4 w-4" />,
    label: QUESTION_TYPE_LABELS["MULTIPLE_CHOICE"],
    border: "border-violet-200",
    text: "text-violet-700",
    hoverBg: "hover:bg-violet-50",
    activeBorder: "border-violet-500",
    activeBg: "bg-violet-500",
    activeText: "text-violet-700",
    activeCheck: "bg-violet-500 border-violet-500",
    cardBorder: "border-violet-200",
    cardBg: "bg-violet-50/60",
    badge: "bg-violet-100 border-violet-200",
    badgeText: "text-violet-700",
    headerBg: "bg-violet-500",
    headerText: "text-white",
  },
  TRUE_FALSE: {
    icon: <ToggleLeft className="h-4 w-4" />,
    label: QUESTION_TYPE_LABELS["TRUE_FALSE"],
    border: "border-amber-200",
    text: "text-amber-700",
    hoverBg: "hover:bg-amber-50",
    activeBorder: "border-amber-500",
    activeBg: "bg-amber-500",
    activeText: "text-amber-700",
    activeCheck: "bg-amber-500 border-amber-500",
    cardBorder: "border-amber-200",
    cardBg: "bg-amber-50/60",
    badge: "bg-amber-100 border-amber-200",
    badgeText: "text-amber-700",
    headerBg: "bg-amber-500",
    headerText: "text-white",
  },
  FILL_IN_THE_BLANK: {
    icon: <PenLine className="h-4 w-4" />,
    label: QUESTION_TYPE_LABELS["FILL_IN_THE_BLANK"],
    border: "border-teal-200",
    text: "text-teal-700",
    hoverBg: "hover:bg-teal-50",
    activeBorder: "border-teal-500",
    activeBg: "bg-teal-500",
    activeText: "text-teal-700",
    activeCheck: "bg-teal-500 border-teal-500",
    cardBorder: "border-teal-200",
    cardBg: "bg-teal-50/60",
    badge: "bg-teal-100 border-teal-200",
    badgeText: "text-teal-700",
    headerBg: "bg-teal-500",
    headerText: "text-white",
  },
};

const DIFF_STYLE: Record<
  Difficulty,
  { label: string; labelColor: string; inputBg: string; inputBorder: string; inputRing: string }
> = {
  EASY: {
    label: "Dễ",
    labelColor: "text-emerald-600",
    inputBg: "bg-emerald-50",
    inputBorder: "border-emerald-200",
    inputRing: "focus:ring-emerald-300",
  },
  MEDIUM: {
    label: "Trung bình",
    labelColor: "text-amber-600",
    inputBg: "bg-amber-50",
    inputBorder: "border-amber-200",
    inputRing: "focus:ring-amber-300",
  },
  HARD: {
    label: "Khó",
    labelColor: "text-rose-600",
    inputBg: "bg-rose-50",
    inputBorder: "border-rose-200",
    inputRing: "focus:ring-rose-300",
  },
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Settings2 className="h-4 w-4 text-primary" />
          </div>
          <h2 className="text-lg font-semibold text-foreground">Cấu hình Quiz</h2>
        </div>
        <div
          className={`flex items-center gap-1.5 rounded-full border px-3 py-1 transition-colors ${
            totalQuestions > 0
              ? "bg-primary/10 border-primary/20"
              : "bg-secondary border-border"
          }`}
        >
          <span className="text-xs text-muted-foreground">Tổng:</span>
          <span
            className={`text-sm font-bold ${
              totalQuestions > 0 ? "text-primary" : "text-muted-foreground"
            }`}
          >
            {totalQuestions} câu
          </span>
        </div>
      </div>

      {/* Question type selector */}
      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Chọn loại câu hỏi
        </p>
        <div className="grid grid-cols-2 gap-2">
          {ALL_TYPES.map((type) => {
            const meta = TYPE_META[type];
            const active = selectedTypes.includes(type);
            return (
              <button
                key={type}
                onClick={() => onToggleType(type)}
                className={`relative flex items-center gap-2.5 rounded-xl border-2 px-3 py-2.5 text-left transition-all duration-150 active:scale-[0.97] ${
                  active
                    ? `${meta.activeBorder} ${meta.cardBg} shadow-sm`
                    : `${meta.border} bg-card ${meta.hoverBg} hover:${meta.activeBorder}`
                }`}
              >
                {/* Color indicator / check */}
                <div
                  className={`flex-shrink-0 h-5 w-5 rounded-full flex items-center justify-center transition-all duration-150 ${
                    active ? meta.activeCheck : "border-2 border-border bg-background"
                  }`}
                >
                  {active && <Check className="h-3 w-3 text-white" strokeWidth={3} />}
                </div>

                {/* Icon */}
                <span className={`flex-shrink-0 ${active ? meta.activeText : "text-muted-foreground"}`}>
                  {meta.icon}
                </span>

                {/* Label */}
                <span
                  className={`text-xs font-semibold leading-tight ${
                    active ? meta.activeText : "text-muted-foreground"
                  }`}
                >
                  {meta.label}
                </span>

                {/* Count badge when active */}
                {active && (config[type]?.EASY + config[type]?.MEDIUM + config[type]?.HARD) > 0 && (
                  <span
                    className={`ml-auto flex-shrink-0 rounded-full border px-1.5 py-0.5 text-xs font-bold ${meta.badge} ${meta.badgeText}`}
                  >
                    {(config[type]?.EASY ?? 0) + (config[type]?.MEDIUM ?? 0) + (config[type]?.HARD ?? 0)}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Difficulty count config */}
      {selectedTypes.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Số câu theo độ khó
          </p>
          {selectedTypes.map((type) => {
            const meta = TYPE_META[type];
            const diffConfig: DifficultyConfig = config[type] || { EASY: 0, MEDIUM: 0, HARD: 0 };
            const subtotal = diffConfig.EASY + diffConfig.MEDIUM + diffConfig.HARD;

            return (
              <div
                key={type}
                className={`rounded-xl border-2 overflow-hidden ${meta.cardBorder}`}
              >
                {/* Card header */}
                <div className={`flex items-center justify-between px-3 py-2 ${meta.headerBg}`}>
                  <div className="flex items-center gap-2">
                    <span className={meta.headerText}>{meta.icon}</span>
                    <span className={`text-xs font-bold ${meta.headerText}`}>{meta.label}</span>
                  </div>
                  {subtotal > 0 && (
                    <span className="rounded-full bg-white/20 px-2 py-0.5 text-xs font-bold text-white">
                      {subtotal} câu
                    </span>
                  )}
                </div>

                {/* Difficulty inputs */}
                <div className={`grid grid-cols-3 gap-3 p-3 ${meta.cardBg}`}>
                  {DIFFICULTIES.map((diff) => {
                    const ds = DIFF_STYLE[diff];
                    return (
                      <div key={diff} className="space-y-1">
                        <label className={`block text-center text-xs font-semibold ${ds.labelColor}`}>
                          {ds.label}
                        </label>
                        <input
                          type="number"
                          min={0}
                          max={20}
                          value={diffConfig[diff]}
                          onChange={(e) =>
                            onCountChange(type, diff, Math.max(0, parseInt(e.target.value) || 0))
                          }
                          className={`w-full rounded-lg border px-2 py-1.5 text-sm font-semibold text-center text-foreground focus:outline-none focus:ring-2 transition-colors ${ds.inputBg} ${ds.inputBorder} ${ds.inputRing}`}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
