export type QuestionType = 'SINGLE_CHOICE' | 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'FILL_IN_THE_BLANK';
export type Difficulty = 'EASY' | 'MEDIUM' | 'HARD';

export interface QuizOption {
  id: string;
  text: string;
  isCorrect: boolean;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: QuizOption[];
  difficulty: Difficulty;
  questionType: QuestionType;
  score: number;
  tags: string[];
  answers?: string[]; // for FILL_IN_THE_BLANK
  cloId?: number;
}

export interface DifficultyConfig {
  EASY: number;
  MEDIUM: number;
  HARD: number;
}

export interface QuizConfig {
  [key: string]: DifficultyConfig;
}

export interface QuizState {
  sourceType: 'document' | 'topic';
  summary: string;
  topic: string;
  fileName: string;
  selectedTypes: QuestionType[];
  config: QuizConfig;
  generatedQuiz: QuizQuestion[];
  loading: boolean;
}

const QUESTION_TYPE_LABELS: Record<QuestionType, string> = {
  SINGLE_CHOICE: 'Trắc nghiệm một đáp án',
  MULTIPLE_CHOICE: 'Trắc nghiệm nhiều đáp án',
  TRUE_FALSE: 'Đúng / Sai',
  FILL_IN_THE_BLANK: 'Điền vào chỗ trống',
};

export { QUESTION_TYPE_LABELS };

let idCounter = 0;
const genId = () => `q_${++idCounter}_${Date.now()}`;

const singleChoiceQuestions: Omit<QuizQuestion, 'id' | 'difficulty' | 'score'>[] = [
  {
    question: 'Ngôn ngữ lập trình nào được sử dụng phổ biến nhất cho phát triển web front-end?',
    questionType: 'SINGLE_CHOICE',
    options: [
      { id: '1', text: 'Python', isCorrect: false },
      { id: '2', text: 'JavaScript', isCorrect: true },
      { id: '3', text: 'C++', isCorrect: false },
      { id: '4', text: 'Java', isCorrect: false },
    ],
    tags: ['programming', 'web'],
  },
  {
    question: 'React được phát triển bởi công ty nào?',
    questionType: 'SINGLE_CHOICE',
    options: [
      { id: '1', text: 'Google', isCorrect: false },
      { id: '2', text: 'Microsoft', isCorrect: false },
      { id: '3', text: 'Meta (Facebook)', isCorrect: true },
      { id: '4', text: 'Apple', isCorrect: false },
    ],
    tags: ['react', 'framework'],
  },
  {
    question: 'HTTP status code 404 nghĩa là gì?',
    questionType: 'SINGLE_CHOICE',
    options: [
      { id: '1', text: 'Server Error', isCorrect: false },
      { id: '2', text: 'Not Found', isCorrect: true },
      { id: '3', text: 'Unauthorized', isCorrect: false },
      { id: '4', text: 'OK', isCorrect: false },
    ],
    tags: ['http', 'web'],
  },
];

const multipleChoiceQuestions: Omit<QuizQuestion, 'id' | 'difficulty' | 'score'>[] = [
  {
    question: 'Những hook nào sau đây là built-in React hooks?',
    questionType: 'MULTIPLE_CHOICE',
    options: [
      { id: '1', text: 'useState', isCorrect: true },
      { id: '2', text: 'useQuery', isCorrect: false },
      { id: '3', text: 'useEffect', isCorrect: true },
      { id: '4', text: 'useRef', isCorrect: true },
    ],
    tags: ['react', 'hooks'],
  },
  {
    question: 'CSS có thể được sử dụng để thay đổi những thuộc tính nào?',
    questionType: 'MULTIPLE_CHOICE',
    options: [
      { id: '1', text: 'Màu chữ', isCorrect: true },
      { id: '2', text: 'Database queries', isCorrect: false },
      { id: '3', text: 'Font size', isCorrect: true },
      { id: '4', text: 'Layout', isCorrect: true },
    ],
    tags: ['css', 'web'],
  },
];

const trueFalseQuestions: Omit<QuizQuestion, 'id' | 'difficulty' | 'score'>[] = [
  {
    question: 'TypeScript là superset của JavaScript.',
    questionType: 'TRUE_FALSE',
    options: [
      { id: '1', text: 'Đúng', isCorrect: true },
      { id: '2', text: 'Sai', isCorrect: false },
    ],
    tags: ['typescript'],
  },
  {
    question: 'HTML là ngôn ngữ lập trình.',
    questionType: 'TRUE_FALSE',
    options: [
      { id: '1', text: 'Đúng', isCorrect: false },
      { id: '2', text: 'Sai', isCorrect: true },
    ],
    tags: ['html', 'web'],
  },
];

const fillInBlankQuestions: Omit<QuizQuestion, 'id' | 'difficulty' | 'score'>[] = [
  {
    question: 'Từ khóa _____ được dùng để khai báo biến không thể thay đổi trong JavaScript.',
    questionType: 'FILL_IN_THE_BLANK',
    options: [],
    answers: ['const'],
    tags: ['javascript'],
  },
  {
    question: 'React sử dụng _____ DOM để tối ưu hiệu năng render.',
    questionType: 'FILL_IN_THE_BLANK',
    options: [],
    answers: ['Virtual', 'virtual'],
    tags: ['react'],
  },
];

const questionPools: Record<QuestionType, Omit<QuizQuestion, 'id' | 'difficulty' | 'score'>[]> = {
  SINGLE_CHOICE: singleChoiceQuestions,
  MULTIPLE_CHOICE: multipleChoiceQuestions,
  TRUE_FALSE: trueFalseQuestions,
  FILL_IN_THE_BLANK: fillInBlankQuestions,
};

const scoreMap: Record<Difficulty, number> = { EASY: 5, MEDIUM: 10, HARD: 15 };

export function generateMockQuiz(config: QuizConfig): QuizQuestion[] {
  const questions: QuizQuestion[] = [];

  for (const [type, diffConfig] of Object.entries(config)) {
    const pool = questionPools[type as QuestionType];
    if (!pool) continue;

    for (const [diff, count] of Object.entries(diffConfig) as [Difficulty, number][]) {
      for (let i = 0; i < count; i++) {
        const base = pool[i % pool.length];
        questions.push({
          ...base,
          id: genId(),
          difficulty: diff,
          score: scoreMap[diff],
        });
      }
    }
  }

  return questions;
}

export const MOCK_SUMMARY = `Tài liệu giới thiệu về các khái niệm cơ bản trong phát triển web hiện đại bao gồm: React, TypeScript, CSS, HTTP protocols, và kiến trúc client-server. Tài liệu cũng đề cập đến các best practices trong việc xây dựng ứng dụng web hiệu suất cao.`;

export function getInitialState(): QuizState {
  return {
    sourceType: 'topic',
    summary: '',
    topic: '',
    fileName: '',
    selectedTypes: [],
    config: {},
    generatedQuiz: [],
    loading: false,
  };
}