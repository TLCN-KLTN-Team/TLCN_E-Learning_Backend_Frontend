// Quiz types mirroring the Spring AI service / Python contract.

import type {
  Difficulty,
  QuestionType,
  QuizQuestion,
  QuizOption,
} from "@/lib/quiz/quizMockData";

export interface LearningOutcomeDto {
  id: string;
  title: string;
  content?: string;
  chapterId?: string;
}

export interface QuestionTypeConfigDto {
  difficulty: Difficulty;
  number: number;
}

export interface QuizQuestionConfigDto {
  type: QuestionType;
  numberOfQuestions: QuestionTypeConfigDto[];
}

/** Body sent to POST /ai/quiz/generate/user (Spring proxies to Python /generate/user). */
export interface GenerateQuizUserRequest {
  context: string;
  /** Snake-case to match the Jackson @JsonProperty on the Java DTO. */
  learning_outcomes: LearningOutcomeDto[];
  questions: QuizQuestionConfigDto[];
  language?: string;
}

// ===== Response shapes (polymorphic via question_type) =====

interface BaseApiQuestion {
  question: string;
  difficulty: Difficulty;
  score?: number;
  tags?: string[];
  question_type: QuestionType;
  learning_outcome_id?: string;
  learning_outcome_title?: string;
}

export interface ChoiceOptionApi {
  text: string;
  is_correct: boolean;
}

export interface BlankOptionApi {
  blank_number: number;
  answer: string;
}

export interface SingleChoiceApi extends BaseApiQuestion {
  question_type: "SINGLE_CHOICE";
  options: ChoiceOptionApi[];
}

export interface MultipleChoiceApi extends BaseApiQuestion {
  question_type: "MULTIPLE_CHOICE";
  options: ChoiceOptionApi[];
}

export interface TrueFalseApi extends BaseApiQuestion {
  question_type: "TRUE_FALSE";
  options: ChoiceOptionApi[];
}

export interface FillInBlankApi extends BaseApiQuestion {
  question_type: "FILL_IN_THE_BLANK";
  options: BlankOptionApi[];
}

export type ApiQuizQuestion =
  | SingleChoiceApi
  | MultipleChoiceApi
  | TrueFalseApi
  | FillInBlankApi;

export interface GenerateQuizResponse {
  questions: ApiQuizQuestion[];
}

/** Body sent to POST /ai/quiz/save. */
export interface SaveQuizSetRequest {
  /** Content-based hash để chặn lưu trùng. */
  quizSetId: string;
  /** Tên hiển thị (tự sinh từ chương đã chọn). */
  quizSetName?: string;
  /** Giữ nguyên payload mà BE trả về để có thể mở lại sau này. */
  questions: ApiQuizQuestion[];
  context?: string;
  externalDocument?: string | null;
  authorId: string;
  language?: string;
}

export interface QuizSetResponse {
  id: string;
  name?: string;
  questions: ApiQuizQuestion[];
  context?: string;
  externalDocument?: string | null;
  authorId: string;
  language: string;
  createdAt: string;
  updatedAt: string;
  number: number;
}

/**
 * Chuyển UI QuizQuestion -> ApiQuizQuestion để gửi về BE giữ nguyên đa hình
 * theo question_type mà Python AI service đã sinh ra.
 */
export function toApiQuizQuestion(q: QuizQuestion): ApiQuizQuestion {
  const base = {
    question: q.question,
    difficulty: q.difficulty,
    score: q.score,
    tags: q.tags,
  };

  if (q.questionType === "FILL_IN_THE_BLANK") {
    return {
      ...base,
      question_type: "FILL_IN_THE_BLANK",
      options: (q.answers ?? []).map((answer, idx) => ({
        blank_number: idx + 1,
        answer,
      })),
    };
  }

  return {
    ...base,
    question_type: q.questionType,
    options: (q.options ?? []).map((o) => ({
      text: o.text,
      is_correct: !!o.isCorrect,
    })),
  };
}

// Default scoring when Python omits the field.
const DEFAULT_SCORE: Record<Difficulty, number> = {
  EASY: 5,
  MEDIUM: 10,
  HARD: 15,
};

/**
 * Convert an API question (snake_case, polymorphic) into the UI's QuizQuestion
 * shape that QuizEditor / QuizViewer already consume.
 */
export function toUIQuizQuestion(
  q: ApiQuizQuestion,
  index: number,
): QuizQuestion {
  const id = `q_${index}_${Date.now()}`;
  const base = {
    id,
    question: q.question,
    difficulty: q.difficulty,
    questionType: q.question_type,
    score: q.score ?? DEFAULT_SCORE[q.difficulty],
    tags: q.tags ?? [],
  };

  if (q.question_type === "FILL_IN_THE_BLANK") {
    return {
      ...base,
      options: [] as QuizOption[],
      answers: q.options.map((o) => o.answer),
    };
  }

  return {
    ...base,
    options: q.options.map((o, i) => ({
      id: String(i + 1),
      text: o.text,
      isCorrect: o.is_correct,
    })),
  };
}
