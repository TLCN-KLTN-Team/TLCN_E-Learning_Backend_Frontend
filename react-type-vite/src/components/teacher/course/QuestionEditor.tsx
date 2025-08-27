import React, { useState } from "react";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Trash, PlusCircle, GripVertical } from 'lucide-react';
import type { QuestionRequest, AnswerRequest } from '@/types/course.types';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import AnswerEditor from './AnswerEditor';
import FileUpload from './FileUpload';
import DragDropUtils from "@/utils/DragDropUtils";

const QuestionEditor: React.FC<{
  question: QuestionRequest;
  index: number;
  onUpdate: (index: number, question: QuestionRequest) => void;
  onDelete: (index: number) => void;
  onReorder: (fromIndex: number, toIndex: number) => void;
}> = ({ question, index, onUpdate, onDelete, onReorder }) => {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const updateQuestion = (updates: Partial<QuestionRequest>) => {
    onUpdate(index, { ...question, ...updates });
  };

  const handleFilesChange = (files: string[]) => {
    updateQuestion({ attachments: files });
  };

  const addAnswer = () => {
    const newAnswer: AnswerRequest = {
      id: Date.now(),
      content: '', // Updated to match backend
      isCorrect: false
    };
    updateQuestion({
      answers: [...question.answers, newAnswer]
    });
  };

  const updateAnswer = (answerIndex: number, updatedAnswer: AnswerRequest) => {
    const updatedAnswers = question.answers.map((answer, i) =>
      i === answerIndex ? updatedAnswer : answer
    );
    updateQuestion({ answers: updatedAnswers });
  };

  const deleteAnswer = (answerIndex: number) => {
    updateQuestion({
      answers: question.answers.filter((_, i) => i !== answerIndex)
    });
  };

  const reorderAnswers = (fromIndex: number, toIndex: number) => {
    const reorderedAnswers = DragDropUtils.reorderArray(question.answers, fromIndex, toIndex);
    updateQuestion({ answers: reorderedAnswers });
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
    <Card 
      className={`transition-all ${isDragging ? 'opacity-50' : ''} ${
        isDragOver ? 'border-blue-300 bg-blue-50' : ''
      }`}
      draggable
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <GripVertical className="h-4 w-4 text-gray-400 cursor-move" />
          <h4 className="font-semibold">Question {index + 1}</h4>
        </div>
        <Button variant="ghost" size="icon" onClick={() => onDelete(index)}>
          <Trash className="h-4 w-4 text-red-500" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <label className="block text-sm font-medium mb-1">Question Text</label>
          <textarea
            value={question.questionText}
            onChange={(e) => updateQuestion({ questionText: e.target.value })}
            className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
            rows={3}
            placeholder="Enter question text"
          />
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="questionType" className="block text-sm font-medium mb-1">
              Question Type
            </label>
            <select
              id="questionType"
              value={question.questionType}
              onChange={(e) => updateQuestion({ questionType: e.target.value as any })}
              className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
            >
              <option value="SINGLE_CHOICE">Single Choice</option>
              <option value="MULTIPLE_CHOICE">Multiple Choice</option>
              <option value="TRUE_FALSE">True/False</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Score</label>
            <Input
              type="number"
              value={question.score}
              onChange={(e) => updateQuestion({ score: parseInt(e.target.value) || 0 })}
              min="1"
            />
          </div>
        </div>

        {/* File Upload Section */}
        <FileUpload
          files={question.attachments || []}
          onFilesChange={handleFilesChange}
          title="Question Attachments"
          description="Upload images, documents, or other files to support this question"
          acceptedTypes={['.jpg', '.jpeg', '.png', '.gif', '.pdf', '.doc', '.docx', '.mp4', '.mov', '.txt']}
          maxFileSize={25}
          maxFiles={5}
        />

        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="block text-sm font-medium">Answers (Drag to reorder)</label>
            <Button variant="outline" size="sm" onClick={addAnswer}>
              <PlusCircle className="h-4 w-4 mr-1" />
              Add Answer
            </Button>
          </div>
          <div className="space-y-2">
            {question.answers.map((answer, answerIndex) => (
              <AnswerEditor
                key={answer.id}
                answer={answer}
                index={answerIndex}
                answers={question.answers}
                questionType={question.questionType}
                onUpdate={updateAnswer}
                onDelete={deleteAnswer}
                onReorder={reorderAnswers}
              />
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default QuestionEditor;