export interface Chapter {
  id: string;
  title: string;
  description: string;
  order: number;
  completed: boolean;
}

export type ReviewMode = "flashcard" | "quiz" | "ai-study";

/**
 * Extract and merge context from selected chapters
 */
export function getContextForChapters(
  chapters: Chapter[],
  selectedIds: string[],
): string {
  const selectedChapters = chapters.filter((c) => selectedIds.includes(c.id));

  if (selectedChapters.length === 0) {
    return "";
  }

  const context = selectedChapters
    .sort((a, b) => a.order - b.order)
    .map((chapter) => {
      return `=== ${chapter.title} ===\n\n${chapter.description}`;
    })
    .join("\n\n");

  return context;
}
