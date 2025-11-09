import React, { useState } from "react";
import { GripVertical, Trash } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { AnswerRequest } from "@/services/api/request/answerRequest";

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
      // Đối với câu hỏi một lựa chọn, bỏ chọn tất cả các câu trả lời khác trước
      // Điều này sẽ được xử lý bởi component cha trong trường hợp thực tế
      // nhưng cho demo này, chúng ta sẽ chỉ cập nhật câu trả lời này
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
      
      {/* Checkbox/Radio Đánh Dấu Đáp Án Đúng */}
      <div className="flex items-center">
        {questionType === 'SINGLE_CHOICE' ? (
          <input
            type="radio"
            name={`correct-answer-${Math.random()}`} // Tên duy nhất cho mỗi câu hỏi
            checked={answer.isCorrect}
            onChange={(e) => handleCorrectChange(e.target.checked)}
            className="w-full p-2 border rounded-lg transition-colors 'border-red-500 focus:border-red-500' : 'border-gray-300 focus:border-blue-500'"
            title="Đánh dấu là đáp án đúng"
          />
        ) : (
          <input
            type="checkbox"
            checked={answer.isCorrect}
            onChange={(e) => handleCorrectChange(e.target.checked)}
            className="w-full p-2 border rounded-lg transition-colors 'border-red-500 focus:border-red-500' : 'border-gray-300 focus:border-blue-500'"
            title="Đánh dấu là đáp án đúng"
          />
        )}
      </div>
      
      {/* Ô Nhập Nội Dung Đáp Án */}
      <input
        type="text"
        value={answer.content}
        onChange={(e) => onUpdate(index, { ...answer, content: e.target.value })}
        className="w-full p-2 border rounded-lg transition-colors 'border-red-500 focus:border-red-500' : 'border-gray-300 focus:border-blue-500'"
        placeholder="Nhập nội dung đáp án"
      />
      
      {/* Nút Xóa */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => onDelete(index)}
        className="h-8 w-8 flex-shrink-0"
        title="Xóa đáp án"
      >
        <Trash className="h-4 w-4 text-red-500" />
      </Button>
    </div>
  );
};

export default AnswerEditor;