import { useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Save,
  Edit3,
  Sparkles,
  BookOpen,
} from "lucide-react";
import type { UIFlashcard } from "@/types/flashcard.type";
import "@/styles/flashcard.css";

interface Props {
  cards: UIFlashcard[];
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

  const handleDotClick = (idx: number) => {
    setCurrentIndex(idx);
    setFlipped(false);
  };

  const getDifficultyLabel = (difficulty: string) => {
    switch (difficulty) {
      case "easy":
        return "Dễ";
      case "medium":
        return "Trung bình";
      case "hard":
        return "Khó";
      default:
        return difficulty;
    }
  };

  return (
    <div className="flashcard-container">
      {/* Header */}
      <div className="flashcard-header">
        <div className="flashcard-title">
          <div className="flashcard-title-icon">
            <BookOpen className="h-5 w-5" />
          </div>
          <span>Học Flashcards ({cards.length} thẻ)</span>
          <span
            className={`flashcard-difficulty difficulty-${currentCard.difficulty}`}
          >
            {getDifficultyLabel(currentCard.difficulty)}
          </span>
        </div>
        <div className="flashcard-actions">
          <button onClick={onEdit} disabled={editing} className="flashcard-btn">
            <Edit3 className="h-4 w-4" />
            Sửa
          </button>
          <button onClick={onRegenerate} className="flashcard-btn">
            <RotateCcw className="h-4 w-4" />
            Tạo lại
          </button>
          <button
            onClick={onSave}
            className="flashcard-btn flashcard-btn-primary"
          >
            <Save className="h-4 w-4" />
            Lưu bộ thẻ
          </button>
        </div>
      </div>

      {/* Flashcard */}
      <div className="flashcard-flip-container">
        <div
          className={`flashcard-flip-inner ${flipped ? "flipped" : ""}`}
          onClick={() => setFlipped(!flipped)}
        >
          {/* Front */}
          <div className="flashcard-face flashcard-face-front">
            <div className="flashcard-label">Mặt trước</div>
            <div className="flashcard-content">
              <Sparkles className="flashcard-icon" />
              <p className="flashcard-text">{currentCard.front}</p>
            </div>
            <p className="flashcard-hint">Click để lật thẻ</p>
          </div>

          {/* Back */}
          <div className="flashcard-face flashcard-face-back">
            <div className="flashcard-label">Mặt sau</div>
            <div className="flashcard-content">
              <p className="flashcard-text flashcard-text-back">
                {currentCard.back}
              </p>
            </div>
            <p className="flashcard-hint">Click để lật lại</p>
          </div>
        </div>
      </div>

      {/* Tags */}
      {currentCard.tags.length > 0 && (
        <div className="flashcard-tags">
          {currentCard.tags.map((tag) => (
            <span key={tag} className="flashcard-tag">
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* Navigation */}
      <div className="flashcard-navigation">
        <div className="flashcard-nav-controls">
          <button
            onClick={handlePrev}
            disabled={currentIndex === 0}
            className="flashcard-nav-btn"
          >
            <ChevronLeft className="h-4 w-4" />
            <span>Trước</span>
          </button>
          <div className="flashcard-counter">
            {currentIndex + 1} / {cards.length}
          </div>
          <button
            onClick={handleNext}
            disabled={currentIndex === cards.length - 1}
            className="flashcard-nav-btn"
          >
            <span>Tiếp</span>
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        {/* Progress Dots */}
        <div className="flashcard-progress">
          {cards.map((_, idx) => (
            <button
              key={idx}
              onClick={() => handleDotClick(idx)}
              className={`flashcard-dot ${idx === currentIndex ? "active" : ""}`}
              aria-label={`Đi tới thẻ ${idx + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
