import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  GripVertical, 
  Edit, 
  Trash, 
  ChevronUp, 
  ChevronDown, 
  PlusCircle 
} from "lucide-react";
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import DragDropUtils from "@/utils/DragDropUtils";
import LessonItem from "./LessonItem";
import QuizItem from "./QuizItem";
import AddLessonModal from "./AddLessonModal";
import QuizModalEditor from "./QuizModalEditor";
import type { SectionRequest } from '@/services/api/request/sectionRequest';
import type { LessonRequest } from '@/services/api/request/lessonRequest';
import type { QuizRequest } from '@/services/api/request/quizRequest';

const SectionItem: React.FC<{
  section: SectionRequest;
  index: number;
  courseId: string;
  onUpdate: (section: SectionRequest) => void;
  onDelete: (sectionId?: number) => void;
  onReorder: (fromIndex: number, toIndex: number) => void;
}> = ({ section, index, courseId, onUpdate, onDelete, onReorder }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  
  // Modal states
  const [isLessonModalOpen, setIsLessonModalOpen] = useState(false);
  const [isQuizModalOpen, setIsQuizModalOpen] = useState(false);

  const handleLessonsReorder = (fromIndex: number, toIndex: number) => {
    const reorderedLessons = DragDropUtils.reorderArray(section.lessons || [], fromIndex, toIndex);
    onUpdate({ ...section, lessons: reorderedLessons });
  };

  const handleQuizzesReorder = (fromIndex: number, toIndex: number) => {
    const reorderedQuizzes = DragDropUtils.reorderArray(section.quizzes || [], fromIndex, toIndex);
    onUpdate({ ...section, quizzes: reorderedQuizzes });
  };

  // Handle adding new lesson
  const handleAddLesson = (lessonData: Omit<LessonRequest, 'id'>) => {
    const newLesson: LessonRequest = {
      ...lessonData,
      id: Date.now(),
      sectionId: section.id,
      numberItem: (section.lessons?.length || 0) + 1
    };
    
    const updatedLessons = [...(section.lessons || []), newLesson];
    onUpdate({ ...section, lessons: updatedLessons });
  };

  // Handle adding new quiz
  const handleAddQuiz = (quizData: QuizRequest) => {
    const newQuiz: QuizRequest = {
      ...quizData,
      id: Date.now(),
      sectionId: section.id
    };
    
    const updatedQuizzes = [...(section.quizzes || []), newQuiz];
    onUpdate({ ...section, quizzes: updatedQuizzes });
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
    <>
      <Card 
        className={`transition-all ${isDragging ? 'opacity-50' : ''} ${
          isDragOver ? 'border-2 border-blue-300 bg-blue-50' : ''
        }`}
        draggable
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <CardHeader 
          className="p-4 flex flex-row items-center justify-between cursor-pointer bg-gray-50" 
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-center gap-3">
            <GripVertical className="h-5 w-5 text-gray-400 cursor-move" onClick={(e) => e.stopPropagation()} />
            <span className="text-sm text-gray-500 min-w-[20px]">{index + 1}.</span>
            <span className="font-semibold">{section.title}</span>
          </div>
          <div className="flex items-center">
            <Button variant="ghost" size="icon" className="h-8 w-8 mr-1" onClick={(e) => {e.stopPropagation()}}>
              <Edit className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 mr-1" onClick={(e) => { e.stopPropagation(); onDelete(section.id); }}>
              <Trash className="h-4 w-4 text-red-500" />
            </Button>
            <div className="h-8 w-8 inline-flex items-center justify-center">
              {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
            </div>
          </div>
        </CardHeader>
        {isExpanded && (
          <CardContent className="p-4 space-y-4">
            {/* Lessons Section */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <h4 className="font-semibold text-lg">Lessons</h4>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setIsLessonModalOpen(true)}
                >
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Add Lesson
                </Button>
              </div>
              <div className="space-y-2 pl-4 border-l-2">
                {(section.lessons || []).map((lesson, lessonIndex) => (
                  <LessonItem
                    key={lesson.id}
                    lesson={lesson}
                    index={lessonIndex}
                    onUpdate={(updatedLesson) => {
                      const updatedLessons = (section.lessons || []).map((l, i) =>
                        i === lessonIndex ? updatedLesson : l
                      );
                      onUpdate({ ...section, lessons: updatedLessons });
                    }}
                    onDelete={(lessonId) => {
                      const filteredLessons = (section.lessons || []).filter(l => l.id !== lessonId);
                      onUpdate({ ...section, lessons: filteredLessons });
                    }}
                    onReorder={handleLessonsReorder}
                  />
                ))}
                {(section.lessons || []).length === 0 && (
                  <p className="text-sm text-gray-500 py-2">This section has no lessons.</p>
                )}
              </div>
            </div>

            {/* Quizzes Section */}
            <div className="pt-4 border-t">
              <div className="flex justify-between items-center mb-2">
                <h4 className="font-semibold text-lg">Quizzes</h4>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setIsQuizModalOpen(true)}
                >
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Add Quiz
                </Button>
              </div>
              <div className="space-y-2 pl-4 border-l-2">
                {(section.quizzes || []).map((quiz, quizIndex) => (
                  <QuizItem
                    key={quiz.id}
                    quiz={quiz}
                    index={quizIndex}
                    onUpdate={(updatedQuiz) => {
                      const updatedQuizzes = (section.quizzes || []).map((q, i) =>
                        i === quizIndex ? updatedQuiz : q
                      );
                      onUpdate({ ...section, quizzes: updatedQuizzes });
                    }}
                    onDelete={(quizId) => {
                      const filteredQuizzes = (section.quizzes || []).filter(q => q.id !== quizId);
                      onUpdate({ ...section, quizzes: filteredQuizzes });
                    }}
                    onReorder={handleQuizzesReorder}
                  />
                ))}
                {(section.quizzes || []).length === 0 && (
                  <p className="text-sm text-gray-500 py-2">This section has no quizzes.</p>
                )}
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Modals */}
      <AddLessonModal
        isOpen={isLessonModalOpen}
        onClose={() => setIsLessonModalOpen(false)}
        onAddLesson={handleAddLesson}
      />
      
      <QuizModalEditor
        isOpen={isQuizModalOpen}
        onClose={() => setIsQuizModalOpen(false)}
        onSave={handleAddQuiz}
        courseId={courseId}
        sectionId={section.id || 0}
      />
    </>
  );
};

export default SectionItem;