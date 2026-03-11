// Flashcard types based on Python backend models

export const DifficultyLevel = {
  EASY: "EASY",
  MEDIUM: "MEDIUM",
  HARD: "HARD",
} as const;

export type DifficultyLevel =
  (typeof DifficultyLevel)[keyof typeof DifficultyLevel];

export interface FlashcardNumberOfDifficultyConfig {
  difficulty: DifficultyLevel;
  numberOfCards: number;
}

export interface FlashCardRequest {
  internalDocument: string;
  externalDocument?: string | null;
  cardsPerDifficulty: FlashcardNumberOfDifficultyConfig[];
  language?: string; // Default: "vietnamese"
}

export interface Flashcard {
  front: string;
  back: string;
  tags: string[];
  difficulty: DifficultyLevel;
}

export interface FlashCardResponse {
  cards: Flashcard[];
}

export interface SaveFlashcardSetRequest {
  id: string;
  flashcards: Flashcard[];
  internalDocument: string;
  externalDocument?: string | null;
  authorId?: string;
  language?: string; // Default: "vietnamese"
}

// UI types (for frontend components)
export interface UIFlashcard {
  id: string;
  front: string;
  back: string;
  tags: string[];
  difficulty: "easy" | "medium" | "hard";
}

// Helper to convert backend Flashcard to UI Flashcard
export function toUIFlashcard(flashcard: Flashcard, id: string): UIFlashcard {
  return {
    id,
    front: flashcard.front,
    back: flashcard.back,
    tags: flashcard.tags,
    difficulty: flashcard.difficulty.toLowerCase() as
      | "easy"
      | "medium"
      | "hard",
  };
}
