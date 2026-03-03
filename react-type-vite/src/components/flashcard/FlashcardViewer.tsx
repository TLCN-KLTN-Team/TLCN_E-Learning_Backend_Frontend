import { useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Save,
  Edit3,
  Sparkles,
} from "lucide-react";
import type { Flashcard } from "@/lib/flashcardMockData";

interface Props {
  cards: Flashcard[];
  onRegenerate: () => void;
  onSave: () => void;
  loading: boolean;
  onEdit: () => void;
  editing: boolean;
}

export default function FlashcardViewer({
  cards,
  onRegenerate,
  onSave,
  loading,
  onEdit,
  editing,
}: Props) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);

  if (cards.length === 0 || loading) {
    return null;
  }

  const currentCard = cards[currentIndex];
  const difficultyColors = {
    easy: "bg-green-500/10 text-green-600 dark:text-green-400",
    medium: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400",
    hard: "bg-red-500/10 text-red-600 dark:text-red-400",
  };

  const handleNext = () => {
    if (currentIndex < cards.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setFlipped(false);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setFlipped(false);
    }
  };

  return (
    <div className="section-card space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-muted-foreground">
            Thẻ {currentIndex + 1} / {cards.length}
          </span>
          <span
            className={`text-xs px-2 py-0.5 rounded-full font-medium ${difficultyColors[currentCard.difficulty]}`}
          >
            {currentCard.difficulty === "easy" && "Dễ"}
            {currentCard.difficulty === "medium" && "Trung bình"}
            {currentCard.difficulty === "hard" && "Khó"}
          </span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onEdit}
            disabled={editing}
            className="rounded-lg px-3 py-1.5 text-xs font-medium bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors disabled:opacity-40"
          >
            <Edit3 className="h-3 w-3 inline mr-1" />
            Chỉnh sửa
          </button>
          <button
            onClick={onRegenerate}
            className="rounded-lg px-3 py-1.5 text-xs font-medium bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors"
          >
            <RotateCcw className="h-3 w-3 inline mr-1" />
            Tạo lại
          </button>
          <button
            onClick={onSave}
            className="rounded-lg px-3 py-1.5 text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <Save className="h-3 w-3 inline mr-1" />
            Lưu bộ thẻ
          </button>
        </div>
      </div>

      {/* Flashcard */}
      <div
        onClick={() => setFlipped(!flipped)}
        className="relative min-h-[280px] cursor-pointer perspective-1000"
      >
        <div
          className={`relative w-full h-full transition-all duration-500 transform-style-3d ${flipped ? "rotate-y-180" : ""}`}
        >
          {/* Front */}
          <div
            className={`absolute inset-0 flex flex-col items-center justify-center p-8 rounded-xl border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-secondary/60 backface-hidden ${flipped ? "invisible" : "visible"}`}
          >
            <Sparkles className="h-8 w-8 text-primary mb-4" />
            <p className="text-lg font-semibold text-center text-foreground">
              {currentCard.front}
            </p>
            <p className="text-xs text-muted-foreground mt-4">
              Nhấn để lật thẻ
            </p>
          </div>

          {/* Back */}
          <div
            className={`absolute inset-0 flex flex-col items-center justify-center p-8 rounded-xl border-2 border-primary/20 bg-gradient-to-br from-secondary/60 to-primary/5 backface-hidden rotate-y-180 ${flipped ? "visible" : "invisible"}`}
          >
            <p className="text-base text-center text-foreground leading-relaxed">
              {currentCard.back}
            </p>
            <p className="text-xs text-muted-foreground mt-4">
              Nhấn để lật lại
            </p>
          </div>
        </div>
      </div>

      {/* Tags */}
      {currentCard.tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {currentCard.tags.map((tag) => (
            <span
              key={tag}
              className="text-xs px-2 py-1 rounded-md bg-secondary text-secondary-foreground"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between pt-2">
        <button
          onClick={handlePrev}
          disabled={currentIndex === 0}
          className="flex items-center gap-1 px-4 py-2 rounded-lg bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="h-4 w-4" />
          <span className="text-sm font-medium">Trước</span>
        </button>
        <div className="flex gap-1">
          {cards.map((_, idx) => (
            <button
              key={idx}
              onClick={() => {
                setCurrentIndex(idx);
                setFlipped(false);
              }}
              className={`h-2 w-2 rounded-full transition-all ${
                idx === currentIndex
                  ? "w-6 bg-primary"
                  : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
              }`}
            />
          ))}
        </div>
        <button
          onClick={handleNext}
          disabled={currentIndex === cards.length - 1}
          className="flex items-center gap-1 px-4 py-2 rounded-lg bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <span className="text-sm font-medium">Tiếp</span>
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
