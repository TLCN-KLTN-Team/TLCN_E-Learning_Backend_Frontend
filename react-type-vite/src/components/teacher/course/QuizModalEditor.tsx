import React, { useState, useCallback } from "react";
import Modal from "@/components/ui/modal";
import { Button } from "@/components/ui/button"; 
import {Save } from "lucide-react";
import QuizSettings from "./QuizSettings";
import QuestionList from "./QuestionList";

import type { QuizRequest, QuestionRequest } from "@/types/course.types";

const QuizModalEditor: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSave: (quiz: QuizRequest) => void;
  courseId: string;
  sectionId: number;
}> = ({ isOpen, onClose, onSave, sectionId }) => {
  const [quiz, setQuiz] = useState<QuizRequest>({
    title: "New Quiz",
    description: "",
    duration: 15,
    passingScore: 70,
    sectionId,
    questions: []
  });

  const handleQuizChange = useCallback((updater: (draft: QuizRequest) => void) => {
    setQuiz(prev => {
      const newQuiz = { ...prev };
      updater(newQuiz);
      return newQuiz;
    });
  }, []);

  const handleSettingsChange = (updatedSettings: Partial<QuizRequest>) => {
    handleQuizChange(draft => {
      Object.assign(draft, updatedSettings);
    });
  };

  const handleQuestionsChange = (questions: QuestionRequest[]) => {
    handleQuizChange(draft => {
      draft.questions = questions;
    });
  };

  const handleSave = () => {
    onSave({ ...quiz, id: Date.now() });
    onClose();
    setQuiz({
      title: "New Quiz",
      description: "",
      duration: 15,
      passingScore: 70,
      sectionId,
      questions: []
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="max-w-4xl">
      <div className="flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-2xl font-bold">Create New Quiz</h2>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <QuizSettings settings={quiz} onSettingsChange={handleSettingsChange} />
          <QuestionList
            questions={quiz.questions ?? []}
            onQuestionsChange={handleQuestionsChange}
          />
        </div>

        <div className="flex justify-end gap-3 p-6 border-t bg-gray-50">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave}>
            <Save className="h-4 w-4 mr-2" />
            Save Quiz
          </Button>
        </div>
      </div>
    </Modal>
  );
};
export default QuizModalEditor;