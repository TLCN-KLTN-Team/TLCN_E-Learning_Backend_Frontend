// Types for Document Library (Archive) feature

export type DocumentSetType = "flashcard" | "quiz";

export interface FlashcardSet {
  id: string;
  name: string;
  type: "flashcard";
  count: number;
  createdAt: string;
  updatedAt?: string;
  tags: string[];
  difficulty?: "easy" | "medium" | "hard";
}

export interface QuizSet {
  id: string;
  name: string;
  type: "quiz";
  count: number;
  createdAt: string;
  updatedAt?: string;
  tags: string[];
  difficulty?: "easy" | "medium" | "hard";
  questionsAnswered?: number;
  correctAnswers?: number;
}

export type DocumentSet = FlashcardSet | QuizSet;

export interface DocumentLibraryStats {
  totalSets: number;
  flashcardCount: number;
  quizCount: number;
  totalFlashcards: number;
  totalQuizQuestions: number;
}
