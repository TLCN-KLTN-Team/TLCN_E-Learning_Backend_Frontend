import React, { useState } from "react";
import { GripVertical, Trash } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { AnswerRequest } from "@/types/course.types";

const AnswerEditor: React.FC<{
  answer: AnswerRequest;
  index: number;
  answers: AnswerRequest[];
  questionType: string;
  onUpdate: (index: number, answer: AnswerRequest) => void;
  onDelete: (index: number) => void;
  onReorder: (fromIndex: number, toIndex: number) => void;
}> = ({ answer, index, questionType, onUpdate, onDelete, onReorder }) => {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const handleCorrectChange = (checked: boolean) => {
    if (questionType === 'SINGLE_CHOICE' && checked) {
      // For single choice, uncheck all other answers first
      // This would be handled by the parent component in a real scenario
      // but for this demo, we'll just update this answer
    }
    onUpdate(index, { ...answer, isCorrect: checked });
  };

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('text/plain', index.toString());
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const fromIndex = parseInt(e.dataTransfer.getData('text/plain'));
    const toIndex = index;
    
    if (fromIndex !== toIndex) {
      onReorder(fromIndex, toIndex);
    }
    setDraggedIndex(null);
  };

  const isDragging = draggedIndex === index;
  const isDragOver = draggedIndex !== null && draggedIndex !== index;

  return (
    <div 
      className={`flex items-center gap-2 p-3 border rounded-lg transition-all ${
        isDragging ? 'opacity-50' : ''
      } ${isDragOver ? 'border-blue-300 bg-blue-50' : 'border-gray-200'}`}
      draggable
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <GripVertical className="h-4 w-4 text-gray-400 cursor-move" />
      <span className="text-sm text-gray-500 min-w-[20px] font-medium">{index + 1}.</span>
      
      {/* Correct Answer Checkbox/Radio */}
      <div className="flex items-center">
        {questionType === 'SINGLE_CHOICE' ? (
          <input
            type="radio"
            name={`correct-answer-${Math.random()}`} // Unique name per question
            checked={answer.isCorrect}
            onChange={(e) => handleCorrectChange(e.target.checked)}
            className="h-4 w-4 text-blue-600"
            title="Mark as correct answer"
          />
        ) : (
          <input
            type="checkbox"
            checked={answer.isCorrect}
            onChange={(e) => handleCorrectChange(e.target.checked)}
            className="h-4 w-4 text-blue-600"
            title="Mark as correct answer"
          />
        )}
      </div>
      
      {/* Answer Content Input */}
      <input
        type="text"
        value={answer.content} // Changed from answerText to content
        onChange={(e) => onUpdate(index, { ...answer, content: e.target.value })}
        className="flex-1 px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        placeholder="Enter answer text"
      />
      
      {/* Delete Button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => onDelete(index)}
        className="h-8 w-8 flex-shrink-0"
        title="Delete answer"
      >
        <Trash className="h-4 w-4 text-red-500" />
      </Button>
    </div>
  );
};

export default AnswerEditor;