import { useState, useCallback, useMemo } from "react";
import { Sparkles, Loader2, Brain } from "lucide-react";
import SourceSelection from "@/components/quiz/SourceSelection";
import QuizConfiguration from "@/components/quiz/QuizConfiguration";
import QuizEditor from "@/components/quiz/QuizEditor";
import {
  getInitialState,
  generateMockQuiz,
  type QuizState,
  type QuestionType,
  type Difficulty,
  type QuizQuestion,
} from "@/lib/quiz/quizMockData";

const QuestionGenerationPage = () => {
  const [state, setState] = useState<QuizState>(getInitialState);

  const update = useCallback(
    (partial: Partial<QuizState>) => setState((s) => ({ ...s, ...partial })),
    [],
  );

  const handleToggleType = useCallback((type: QuestionType) => {
    setState((s) => {
      const selected = s.selectedTypes.includes(type)
        ? s.selectedTypes.filter((t) => t !== type)
        : [...s.selectedTypes, type];
      const config = { ...s.config };
      if (!config[type]) config[type] = { EASY: 1, MEDIUM: 1, HARD: 0 };
      if (!selected.includes(type)) delete config[type];
      return { ...s, selectedTypes: selected, config };
    });
  }, []);

  const handleCountChange = useCallback(
    (type: QuestionType, diff: Difficulty, count: number) => {
      setState((s) => ({
        ...s,
        config: {
          ...s.config,
          [type]: { ...s.config[type], [diff]: count },
        },
      }));
    },
    [],
  );

  const totalQuestions = useMemo(() => {
    return Object.values(state.config).reduce(
      (sum, dc) => sum + dc.EASY + dc.MEDIUM + dc.HARD,
      0,
    );
  }, [state.config]);

  const handleGenerate = useCallback(() => {
    update({ loading: true });
    setTimeout(() => {
      const quiz = generateMockQuiz(state.config);
      update({ generatedQuiz: quiz, loading: false });
    }, 2000);
  }, [state.config, update]);

  const handleUpdateQuestion = useCallback(
    (id: string, updated: Partial<QuizQuestion>) => {
      setState((s) => ({
        ...s,
        generatedQuiz: s.generatedQuiz.map((q) =>
          q.id === id ? { ...q, ...updated } : q,
        ),
      }));
    },
    [],
  );

  const handleSave = useCallback(() => {
    console.log("Saved to question bank:", state.generatedQuiz);
    alert("Đã lưu vào ngân hàng câu hỏi! (xem console)");
  }, [state.generatedQuiz]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="mx-auto max-w-3xl px-4 py-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center">
            <Brain className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">
              AI Quiz Generator
            </h1>
            <p className="text-sm text-muted-foreground">
              Tạo bài kiểm tra thông minh từ tài liệu hoặc chủ đề
            </p>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="mx-auto max-w-3xl px-4 py-6 space-y-6">
        <SourceSelection
          sourceType={state.sourceType}
          summary={state.summary}
          topic={state.topic}
          fileName={state.fileName}
          onSourceTypeChange={(t) =>
            update({ sourceType: t, summary: "", fileName: "", topic: "" })
          }
          onSummaryChange={(summary) => update({ summary })}
          onTopicChange={(topic) => update({ topic })}
          onFileSelect={(fileName) => update({ fileName })}
        />

        <QuizConfiguration
          selectedTypes={state.selectedTypes}
          config={state.config}
          onToggleType={handleToggleType}
          onCountChange={handleCountChange}
          totalQuestions={totalQuestions}
        />

        {/* Generate Button */}
        <button
          onClick={handleGenerate}
          disabled={totalQuestions === 0 || state.loading}
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {state.loading ? (
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

        {/* Loading skeleton */}
        {state.loading && (
          <div className="section-card space-y-3 animate-pulse-gentle">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 rounded-lg bg-muted" />
            ))}
          </div>
        )}

        <QuizEditor
          questions={state.generatedQuiz}
          onUpdateQuestion={handleUpdateQuestion}
          onRegenerate={handleGenerate}
          onSave={handleSave}
          loading={state.loading}
        />
      </main>
    </div>
  );
};

export default QuestionGenerationPage;
