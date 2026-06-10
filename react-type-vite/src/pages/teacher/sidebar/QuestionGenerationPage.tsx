import { useState, useCallback, useMemo } from "react";
import { Sparkles, Loader2, Brain } from "lucide-react";
import SourceSelection from "@/components/quiz/SourceSelection";
import QuizConfiguration from "@/components/quiz/QuizConfiguration";
import QuizEditor from "@/components/quiz/QuizEditor";
import SaveToQuestionBankModal from "@/components/quiz/SaveToQuestionBankModal";
import type {
  QuizQuestion,
  QuestionType,
  Difficulty,
  QuizConfig,
  DifficultyConfig,
} from "@/lib/quiz/quizMockData";
import QuizApiService from "@/services/api/teacher/quizApi";
import {
  toUIQuizQuestion,
  type QuizQuestionConfigDto,
} from "@/types/quiz.type";
import { AppError } from "@/errors";
import { toast } from "react-toastify";

const DIFFICULTIES: Difficulty[] = ["EASY", "MEDIUM", "HARD"];

const stripHtml = (html: string) => html.replace(/<[^>]*>/g, "").trim();

const defaultDiffConfig = (): DifficultyConfig => ({ EASY: 0, MEDIUM: 0, HARD: 0 });
const initialDiffConfig = (): DifficultyConfig => ({ EASY: 1, MEDIUM: 0, HARD: 0 });

const QuestionGenerationPage = () => {
  const [sourceType, setSourceType] = useState<"document" | "topic">("document");
  const [summary, setSummary] = useState("");
  const [topic, setTopic] = useState("");
  const [fileName, setFileName] = useState("");

  const [selectedTypes, setSelectedTypes] = useState<QuestionType[]>([]);
  const [config, setConfig] = useState<QuizConfig>({});

  const [generatedQuiz, setGeneratedQuiz] = useState<QuizQuestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);

  const totalQuestions = useMemo(() => {
    let total = 0;
    for (const type of selectedTypes) {
      const dc = config[type];
      if (dc) total += dc.EASY + dc.MEDIUM + dc.HARD;
    }
    return total;
  }, [selectedTypes, config]);

  const handleToggleType = useCallback((type: QuestionType) => {
    setSelectedTypes((prev) => {
      if (prev.includes(type)) {
        setConfig((c) => {
          const next = { ...c };
          delete next[type];
          return next;
        });
        return prev.filter((t) => t !== type);
      }
      setConfig((c) => ({ ...c, [type]: initialDiffConfig() }));
      return [...prev, type];
    });
  }, []);

  const handleCountChange = useCallback(
    (type: QuestionType, diff: Difficulty, count: number) => {
      setConfig((prev) => ({
        ...prev,
        [type]: { ...(prev[type] || defaultDiffConfig()), [diff]: Math.max(0, count) },
      }));
    },
    [],
  );

  const handleGenerate = useCallback(async () => {
    const context = summary || topic;
    if (!stripHtml(context)) {
      toast.error("Vui lòng nhập nguồn dữ liệu (tài liệu hoặc chủ đề).");
      return;
    }
    if (selectedTypes.length === 0) {
      toast.error("Vui lòng chọn ít nhất một loại câu hỏi.");
      return;
    }
    if (totalQuestions === 0) {
      toast.error("Vui lòng cấu hình số lượng câu hỏi.");
      return;
    }

    const questions: QuizQuestionConfigDto[] = selectedTypes
      .map((type) => {
        const dc = config[type] || defaultDiffConfig();
        return {
          type,
          numberOfQuestions: DIFFICULTIES.filter((d) => dc[d] > 0).map((d) => ({
            difficulty: d,
            number: dc[d],
          })),
        };
      })
      .filter((q) => q.numberOfQuestions.length > 0);

    setLoading(true);
    try {
      const response = await QuizApiService.generateQuiz({
        context,
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
  }, [selectedTypes, config, summary, topic, totalQuestions]);

  const handleUpdateQuestion = useCallback(
    (id: string, updated: Partial<QuizQuestion>) => {
      setGeneratedQuiz((prev) => prev.map((q) => (q.id === id ? { ...q, ...updated } : q)));
    },
    [],
  );

  const handleSave = useCallback(() => {
    setShowSaveModal(true);
  }, []);


  return (
    <div className="min-h-screen bg-background">
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

        <QuizConfiguration
          selectedTypes={selectedTypes}
          config={config}
          onToggleType={handleToggleType}
          onCountChange={handleCountChange}
          totalQuestions={totalQuestions}
        />

        {totalQuestions > 0 && (
          <button
            onClick={handleGenerate}
            disabled={loading}
            className={`w-full flex items-center justify-center gap-2 rounded-xl px-6 py-3.5 text-sm font-semibold transition-opacity duration-200 ${
              loading
                ? "bg-emerald-500 text-white opacity-70 cursor-not-allowed"
                : "bg-emerald-500 text-white"
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
                Tạo Quiz ({totalQuestions} câu)
              </>
            )}
          </button>
        )}

        {loading && (
          <div className="section-card space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 rounded-xl bg-muted animate-pulse" />
            ))}
          </div>
        )}

        <QuizEditor
          questions={generatedQuiz}
          onUpdateQuestion={handleUpdateQuestion}
          onRegenerate={handleGenerate}
          onSave={handleSave}
          loading={loading}
        />
      </main>

      <SaveToQuestionBankModal
        isOpen={showSaveModal}
        questions={generatedQuiz}
        onClose={() => setShowSaveModal(false)}
        onSuccess={() => setShowSaveModal(false)}
      />
    </div>
  );
};

export default QuestionGenerationPage;
