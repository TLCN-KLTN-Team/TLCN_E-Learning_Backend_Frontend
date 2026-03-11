// Mock API for Document Library (Archive)
// This will be replaced with real API calls later

import type {
  DocumentSet,
  FlashcardSet,
  QuizSet,
  DocumentLibraryStats,
} from "@/types/document-library.types";

// Mock data generators
let setIdCounter = 0;
const genSetId = () => `set_${++setIdCounter}_${Date.now()}`;

const mockFlashcardSets: Omit<FlashcardSet, "id">[] = [
  {
    name: "React Hooks & Lifecycle",
    type: "flashcard",
    count: 15,
    createdAt: "2026-03-05T10:30:00Z",
    tags: ["react", "hooks", "frontend"],
    difficulty: "medium",
  },
  {
    name: "TypeScript Basics",
    type: "flashcard",
    count: 20,
    createdAt: "2026-03-03T14:20:00Z",
    tags: ["typescript", "programming"],
    difficulty: "easy",
  },
  {
    name: "Advanced React Patterns",
    type: "flashcard",
    count: 12,
    createdAt: "2026-03-01T09:15:00Z",
    tags: ["react", "patterns", "advanced"],
    difficulty: "hard",
  },
  {
    name: "CSS Grid & Flexbox",
    type: "flashcard",
    count: 18,
    createdAt: "2026-02-28T16:45:00Z",
    tags: ["css", "layout"],
    difficulty: "medium",
  },
  {
    name: "JavaScript ES6+",
    type: "flashcard",
    count: 25,
    createdAt: "2026-02-25T11:00:00Z",
    tags: ["javascript", "es6"],
    difficulty: "easy",
  },
];

const mockQuizSets: Omit<QuizSet, "id">[] = [
  {
    name: "React Component Quiz",
    type: "quiz",
    count: 10,
    createdAt: "2026-03-06T13:30:00Z",
    tags: ["react", "components"],
    difficulty: "medium",
    questionsAnswered: 10,
    correctAnswers: 8,
  },
  {
    name: "Frontend Fundamentals Test",
    type: "quiz",
    count: 15,
    createdAt: "2026-03-04T10:00:00Z",
    tags: ["frontend", "basics"],
    difficulty: "easy",
    questionsAnswered: 15,
    correctAnswers: 13,
  },
  {
    name: "State Management Quiz",
    type: "quiz",
    count: 8,
    createdAt: "2026-03-02T15:20:00Z",
    tags: ["react", "state", "redux"],
    difficulty: "hard",
    questionsAnswered: 8,
    correctAnswers: 5,
  },
  {
    name: "Web Performance Quiz",
    type: "quiz",
    count: 12,
    createdAt: "2026-02-27T09:30:00Z",
    tags: ["performance", "optimization"],
    difficulty: "medium",
  },
];

// Simulated delay for API calls
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Get all document sets (flashcards + quizzes)
 */
export const getAllDocumentSets = async (): Promise<DocumentSet[]> => {
  await delay(500); // Simulate network delay

  const flashcardSets: FlashcardSet[] = mockFlashcardSets.map((set) => ({
    ...set,
    id: genSetId(),
  }));

  const quizSets: QuizSet[] = mockQuizSets.map((set) => ({
    ...set,
    id: genSetId(),
  }));

  const allSets: DocumentSet[] = [...flashcardSets, ...quizSets];

  // Sort by creation date (newest first)
  return allSets.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
};

/**
 * Get only flashcard sets
 */
export const getFlashcardSets = async (): Promise<FlashcardSet[]> => {
  await delay(400);

  const flashcardSets: FlashcardSet[] = mockFlashcardSets.map((set) => ({
    ...set,
    id: genSetId(),
  }));

  return flashcardSets.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
};

/**
 * Get only quiz sets
 */
export const getQuizSets = async (): Promise<QuizSet[]> => {
  await delay(400);

  const quizSets: QuizSet[] = mockQuizSets.map((set) => ({
    ...set,
    id: genSetId(),
  }));

  return quizSets.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
};

/**
 * Get document library statistics
 */
export const getDocumentLibraryStats =
  async (): Promise<DocumentLibraryStats> => {
    await delay(300);

    const totalFlashcards = mockFlashcardSets.reduce(
      (sum, set) => sum + set.count,
      0,
    );
    const totalQuizQuestions = mockQuizSets.reduce(
      (sum, set) => sum + set.count,
      0,
    );

    return {
      totalSets: mockFlashcardSets.length + mockQuizSets.length,
      flashcardCount: mockFlashcardSets.length,
      quizCount: mockQuizSets.length,
      totalFlashcards,
      totalQuizQuestions,
    };
  };

/**
 * Delete a document set by ID
 */
export const deleteDocumentSet = async (id: string): Promise<void> => {
  await delay(300);
  console.log(`Deleted set with ID: ${id}`);
  // In real implementation, this would make a DELETE request to the backend
};

export const documentLibraryApi = {
  getAllDocumentSets,
  getFlashcardSets,
  getQuizSets,
  getDocumentLibraryStats,
  deleteDocumentSet,
};

export default documentLibraryApi;
