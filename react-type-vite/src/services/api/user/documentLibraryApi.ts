/**
 * Document Library API — gom hai nguồn dữ liệu:
 *   - GET /ai/flashcards/author/{id}
 *   - GET /ai/quiz/user/{id}
 * thành một danh sách DocumentSet thống nhất để trang document-library hiển
 * thị (flashcards + quizzes do chính user đã lưu).
 */

import type {
  DocumentSet,
  FlashcardSet as UIFlashcardSet,
  QuizSet as UIQuizSet,
} from "@/types/document-library.types";
import flashcardApi from "./flashcard.api";
import quizApi from "./quiz.api";
import type { FlashcardSetResponse } from "@/types/flashcard.type";
import type { QuizSetResponse } from "@/types/quiz.type";

function mapFlashcardSet(set: FlashcardSetResponse): UIFlashcardSet {
  const tags = new Set<string>();
  (set.flashcards ?? []).forEach((c) =>
    (c.tags ?? []).forEach((t) => t && tags.add(t)),
  );
  return {
    id: set.id,
    name: set.name?.trim() || "Bộ Flashcards",
    type: "flashcard",
    count: set.number ?? set.flashcards?.length ?? 0,
    createdAt: set.createdAt,
    updatedAt: set.updatedAt,
    tags: Array.from(tags).slice(0, 5),
  };
}

function mapQuizSet(set: QuizSetResponse): UIQuizSet {
  const tags = new Set<string>();
  (set.questions ?? []).forEach((q) =>
    (q.tags ?? []).forEach((t) => t && tags.add(t)),
  );
  return {
    id: set.id,
    name: set.name?.trim() || "Bộ Quiz",
    type: "quiz",
    count: set.number ?? set.questions?.length ?? 0,
    createdAt: set.createdAt,
    updatedAt: set.updatedAt,
    tags: Array.from(tags).slice(0, 5),
  };
}

export const getAllDocumentSets = async (
  userId: string,
): Promise<DocumentSet[]> => {
  if (!userId) return [];

  const [flashcards, quizzes] = await Promise.all([
    flashcardApi.getFlashcardSetsByAuthor(userId).catch((err) => {
      console.error("Failed to load flashcard sets:", err);
      return [];
    }),
    quizApi.getQuizSetsByUser(userId).catch((err) => {
      console.error("Failed to load quiz sets:", err);
      return [];
    }),
  ]);

  const merged: DocumentSet[] = [
    ...flashcards.map(mapFlashcardSet),
    ...quizzes.map(mapQuizSet),
  ];

  return merged.sort(
    (a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
};

export const deleteDocumentSet = async (
  id: string,
  type: "flashcard" | "quiz",
): Promise<void> => {
  if (type === "flashcard") {
    await flashcardApi.deleteFlashcardSet(id);
  } else {
    await quizApi.deleteQuizSet(id);
  }
};

export const documentLibraryApi = {
  getAllDocumentSets,
  deleteDocumentSet,
};

export default documentLibraryApi;
