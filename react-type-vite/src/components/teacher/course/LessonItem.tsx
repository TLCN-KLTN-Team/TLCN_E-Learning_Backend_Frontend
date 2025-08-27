import React, { useState } from "react";
import { GripVertical, FileVideo, Star, Edit, Trash } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { LessonRequest } from "@/types/course.types";

const LessonItem: React.FC<{
  lesson: LessonRequest;
  index: number;
  onUpdate: (lesson: LessonRequest) => void;
  onDelete: (lessonId?: number) => void;
  onReorder: (fromIndex: number, toIndex: number) => void;
}> = ({ lesson, index, onDelete, onReorder }) => {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

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
      className={`flex items-center justify-between p-2 rounded-md transition-all cursor-move ${
        isDragging ? 'opacity-50' : 'hover:bg-gray-100'
      } ${isDragOver ? 'border-2 border-blue-300 bg-blue-50' : ''}`}
      draggable
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <div className="flex items-center gap-3">
        <GripVertical className="h-4 w-4 text-gray-400" />
        <span className="text-sm text-gray-500 min-w-[20px]">{index + 1}.</span>
        <FileVideo className="h-5 w-5 text-gray-500"/>
        <span className="font-medium">{lesson.title}</span>
        {lesson.isFreeLesson && <Star className="h-4 w-4 text-yellow-500 fill-current" aria-label="Free lesson"/>}
      </div>
      <div>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <Edit className="h-4 w-4"/>
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onDelete(lesson.id)}>
          <Trash className="h-4 w-4 text-red-500"/>
        </Button>
      </div>
    </div>
  );
};
export default LessonItem;