import { Edit3 } from "lucide-react";
import type { Flashcard } from "@/lib/flashcardMockData";

interface Props {
  cards: Flashcard[];
  onUpdateCard: (id: string, updates: Partial<Flashcard>) => void;
}

export default function FlashcardEditor({ cards, onUpdateCard }: Props) {
  const difficultyOptions: Array<"easy" | "medium" | "hard"> = [
    "easy",
    "medium",
    "hard",
  ];
  const difficultyLabels = {
    easy: "Dễ",
    medium: "Trung bình",
    hard: "Khó",
  };

  if (cards.length === 0) {
    return null;
  }

  return (
    <div className="section-card space-y-4">
      <div className="flex items-center gap-2">
        <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
          <Edit3 className="h-4 w-4 text-primary" />
        </div>
        <h2 className="text-lg font-semibold text-foreground">
          Chỉnh sửa Flashcards
        </h2>
      </div>

      <div className="space-y-4">
        {cards.map((card, index) => (
          <div
            key={card.id}
            className="rounded-lg border border-border bg-secondary/30 p-4 space-y-3"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">
                Thẻ #{index + 1}
              </span>
              <select
                value={card.difficulty}
                onChange={(e) =>
                  onUpdateCard(card.id, {
                    difficulty: e.target.value as "easy" | "medium" | "hard",
                  })
                }
                className="text-xs rounded-md border border-border bg-background px-2 py-1 text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {difficultyOptions.map((diff) => (
                  <option key={diff} value={diff}>
                    {difficultyLabels[diff]}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">
                Câu hỏi (Front)
              </label>
              <textarea
                value={card.front}
                onChange={(e) =>
                  onUpdateCard(card.id, { front: e.target.value })
                }
                rows={2}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-y"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">
                Câu trả lời (Back)
              </label>
              <textarea
                value={card.back}
                onChange={(e) =>
                  onUpdateCard(card.id, { back: e.target.value })
                }
                rows={3}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-y"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">
                Tags (phân cách bởi dấu phẩy)
              </label>
              <input
                type="text"
                value={card.tags.join(", ")}
                onChange={(e) =>
                  onUpdateCard(card.id, {
                    tags: e.target.value
                      .split(",")
                      .map((t) => t.trim())
                      .filter(Boolean),
                  })
                }
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
