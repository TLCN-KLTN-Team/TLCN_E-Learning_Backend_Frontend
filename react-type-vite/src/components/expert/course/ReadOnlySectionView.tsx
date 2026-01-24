import React, { useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  BookOpen,
  FileQuestion,
  ClipboardList,
  CheckCircle,
  Clock,
  X,
  FileText,
} from "lucide-react";
import type { SectionResponse } from "@/services/api/response/sectionResponse";

interface ReadOnlySectionViewProps {
  sections: SectionResponse[];
}

const ReadOnlySectionView: React.FC<ReadOnlySectionViewProps> = ({ sections }) => {
  const [expandedSections, setExpandedSections] = useState<Set<number>>(new Set());
  const [selectedLesson, setSelectedLesson] = useState<any>(null);
  const [selectedQuiz, setSelectedQuiz] = useState<any>(null);
  const [selectedAssignment, setSelectedAssignment] = useState<any>(null);

  // Debug log
  console.log("ReadOnlySectionView sections:", sections);

  const toggleSection = (sectionId: number) => {
    setExpandedSections((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId);
      } else {
        newSet.add(sectionId);
      }
      return newSet;
    });
  };

  // Sort sections by orderIndex
  const sortedSections = [...sections].sort((a, b) => a.orderIndex - b.orderIndex);

  if (sections.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <BookOpen className="w-12 h-12 mx-auto mb-2 opacity-50" />
        <p>Khóa học chưa có nội dung</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {sortedSections.map((section, index) => {
        const isExpanded = expandedSections.has(section.id);
        
        // Convert to arrays first, handle both Set and Array
        const lessons = section.lessons 
          ? (Array.isArray(section.lessons) 
            ? section.lessons 
            : Array.from(section.lessons))
          : [];
        
        const quizzes = section.quizs 
          ? (Array.isArray(section.quizs) 
            ? section.quizs 
            : Array.from(section.quizs))
          : [];
        
        const assignments = section.assignments 
          ? (Array.isArray(section.assignments) 
            ? section.assignments 
            : Array.from(section.assignments))
          : [];

        const hasLessons = lessons.length > 0;
        const hasQuizzes = quizzes.length > 0;
        const hasAssignments = assignments.length > 0;
        const hasContent = hasLessons || hasQuizzes || hasAssignments;

        console.log(`Section ${section.id}:`, { hasLessons, hasQuizzes, hasAssignments, lessons, quizzes, assignments });

        return (
          <div
            key={section.id}
            className="border rounded-lg bg-white shadow-sm hover:shadow-md transition-shadow"
          >
            {/* Section Header */}
            <div
              className="p-4 cursor-pointer"
              onClick={() => toggleSection(section.id)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1">
                  <div className="flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-600 rounded-full font-semibold text-sm">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">
                      {section.title}
                    </h3>
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                      {hasLessons && (
                        <span className="flex items-center gap-1">
                          <BookOpen className="w-3 h-3" />
                          {lessons.length} bài học
                        </span>
                      )}
                      {hasQuizzes && (
                        <span className="flex items-center gap-1">
                          <FileQuestion className="w-3 h-3" />
                          {quizzes.length} quiz
                        </span>
                      )}
                      {hasAssignments && (
                        <span className="flex items-center gap-1">
                          <ClipboardList className="w-3 h-3" />
                          {assignments.length} bài tập
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {section.isPublished ? (
                    <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" />
                      Đã xuất bản
                    </span>
                  ) : (
                    <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded-full flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Chưa xuất bản
                    </span>
                  )}
                  {hasContent && (
                    <>
                      {isExpanded ? (
                        <ChevronUp className="w-5 h-5 text-gray-400" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-gray-400" />
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Section Content */}
            {isExpanded && hasContent && (
              <div className="border-t bg-gray-50 p-4 space-y-3">
                {/* Lessons */}
                {hasLessons && (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-blue-600" />
                      Bài học ({lessons.length})
                    </h4>
                    <div className="space-y-2">
                      {lessons.sort((a, b) => a.numberItem - b.numberItem).map((lesson, idx) => (
                        <div
                          key={lesson.id}
                          className="flex items-center justify-between bg-white p-3 rounded border hover:border-blue-300 hover:shadow-sm transition-all cursor-pointer"
                          onClick={() => setSelectedLesson(lesson)}
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-xs text-gray-500 font-medium w-6">
                              {idx + 1}.
                            </span>
                            <div>
                              <p className="text-sm font-medium text-gray-900">
                                {lesson.title}
                              </p>
                              {lesson.description && (
                                <p className="text-xs text-gray-500 mt-1 line-clamp-1">
                                  {lesson.description}
                                </p>
                              )}
                            </div>
                          </div>
                          {lesson.isPublished ? (
                            <CheckCircle className="w-4 h-4 text-green-600" />
                          ) : (
                            <Clock className="w-4 h-4 text-gray-400" />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Quizzes */}
                {hasQuizzes && (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                      <FileQuestion className="w-4 h-4 text-purple-600" />
                      Bài kiểm tra ({quizzes.length})
                    </h4>
                    <div className="space-y-2">
                      {quizzes.sort((a, b) => a.numberItem - b.numberItem).map((quiz, idx) => (
                        <div
                          key={quiz.id}
                          className="flex items-center justify-between bg-white p-3 rounded border hover:border-purple-300 hover:shadow-sm transition-all cursor-pointer"
                          onClick={() => setSelectedQuiz(quiz)}
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-xs text-gray-500 font-medium w-6">
                              {idx + 1}.
                            </span>
                            <div>
                              <p className="text-sm font-medium text-gray-900">
                                {quiz.title}
                              </p>
                              <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                                <span>{quiz.questions?.size || 0} câu hỏi</span>
                                <span>•</span>
                                <span>{quiz.duration || 0} phút</span>
                              </div>
                            </div>
                          </div>
                          {quiz.isPublished ? (
                            <CheckCircle className="w-4 h-4 text-green-600" />
                          ) : (
                            <Clock className="w-4 h-4 text-gray-400" />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Assignments */}
                {hasAssignments && (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                      <ClipboardList className="w-4 h-4 text-orange-600" />
                      Bài tập ({assignments.length})
                    </h4>
                    <div className="space-y-2">
                      {assignments.sort((a, b) => a.numberItem - b.numberItem).map((assignment, idx) => (
                        <div
                          key={assignment.id}
                          className="flex items-center justify-between bg-white p-3 rounded border hover:border-orange-300 hover:shadow-sm transition-all cursor-pointer"
                          onClick={() => setSelectedAssignment(assignment)}
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-xs text-gray-500 font-medium w-6">
                              {idx + 1}.
                            </span>
                            <div>
                              <p className="text-sm font-medium text-gray-900">
                                {assignment.title}
                              </p>
                              {assignment.description && (
                                <p className="text-xs text-gray-500 mt-1 line-clamp-1">
                                  {assignment.description}
                                </p>
                              )}
                            </div>
                          </div>
                          {assignment.isPublished ? (
                            <CheckCircle className="w-4 h-4 text-green-600" />
                          ) : (
                            <Clock className="w-4 h-4 text-gray-400" />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}

      {/* Lesson Detail Modal */}
      {selectedLesson && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setSelectedLesson(null)}>
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Chi tiết Bài học</h3>
                  <p className="text-sm text-gray-500">#{selectedLesson.numberItem}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedLesson(null)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                aria-label="Đóng"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Tên bài học</label>
                <p className="mt-1 text-gray-900">{selectedLesson.title}</p>
              </div>
              {selectedLesson.description && (
                <div>
                  <label className="text-sm font-medium text-gray-700">Mô tả</label>
                  <p className="mt-1 text-gray-600">{selectedLesson.description}</p>
                </div>
              )}
              {selectedLesson.content && (
                <div>
                  <label className="text-sm font-medium text-gray-700">Nội dung</label>
                  <div className="mt-1 prose max-w-none" dangerouslySetInnerHTML={{ __html: selectedLesson.content }} />
                </div>
              )}
              {selectedLesson.attachments && selectedLesson.attachments.length > 0 && (
                <div>
                  <label className="text-sm font-medium text-gray-700">Tài liệu đính kèm</label>
                  <div className="mt-2 space-y-2">
                    {selectedLesson.attachments.map((file: any, idx: number) => (
                      <div key={idx} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                        <FileText className="w-4 h-4 text-gray-500" />
                        <a href={file.url} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline">
                          {file.fileName}
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700">Trạng thái:</label>
                {selectedLesson.isPublished ? (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                    <CheckCircle className="w-3 h-3" />
                    Đã xuất bản
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                    <Clock className="w-3 h-3" />
                    Chưa xuất bản
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quiz Detail Modal */}
      {selectedQuiz && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setSelectedQuiz(null)}>
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                  <FileQuestion className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Chi tiết Bài kiểm tra</h3>
                  <p className="text-sm text-gray-500">#{selectedQuiz.numberItem}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedQuiz(null)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                aria-label="Đóng"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Tiêu đề</label>
                <p className="mt-1 text-gray-900">{selectedQuiz.title}</p>
              </div>
              {selectedQuiz.description && (
                <div>
                  <label className="text-sm font-medium text-gray-700">Mô tả</label>
                  <p className="mt-1 text-gray-600">{selectedQuiz.description}</p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Thời gian</label>
                  <p className="mt-1 text-gray-900">{selectedQuiz.duration} phút</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Điểm tối đa</label>
                  <p className="mt-1 text-gray-900">{selectedQuiz.maxScore}</p>
                </div>
              </div>
              {selectedQuiz.questions && selectedQuiz.questions.length > 0 && (
                <div>
                  <label className="text-sm font-medium text-gray-700">Câu hỏi ({selectedQuiz.questions.length})</label>
                  <div className="mt-2 space-y-4">
                    {selectedQuiz.questions.map((question: any, idx: number) => (
                      <div key={idx} className="border rounded-lg p-4 bg-gray-50">
                        <div className="flex gap-2">
                          <span className="font-medium text-gray-700">Q{idx + 1}.</span>
                          <div className="flex-1">
                            <p className="text-gray-900">{question.questionText}</p>
                            {question.questionImage && (
                              <img src={question.questionImage} alt="Question" className="mt-2 max-w-md rounded" />
                            )}
                            {question.answers && question.answers.length > 0 && (
                              <div className="mt-3 space-y-2">
                                {question.answers.map((answer: any, aIdx: number) => (
                                  <div
                                    key={aIdx}
                                    className={`p-2 rounded border ${answer.isCorrect ? 'bg-green-50 border-green-300' : 'bg-white border-gray-200'}`}
                                  >
                                    <div className="flex items-center gap-2">
                                      {answer.isCorrect && <CheckCircle className="w-4 h-4 text-green-600" />}
                                      <span className="text-sm">{answer.answerText}</span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700">Trạng thái:</label>
                {selectedQuiz.isPublished ? (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                    <CheckCircle className="w-3 h-3" />
                    Đã xuất bản
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                    <Clock className="w-3 h-3" />
                    Chưa xuất bản
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Assignment Detail Modal */}
      {selectedAssignment && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setSelectedAssignment(null)}>
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Chi tiết Bài tập</h3>
                  <p className="text-sm text-gray-500">#{selectedAssignment.numberItem}</p>
                </div>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); setSelectedAssignment(null); }}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                aria-label="Đóng"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Tiêu đề</label>
                <p className="mt-1 text-gray-900">{selectedAssignment.title}</p>
              </div>
              {selectedAssignment.description && (
                <div>
                  <label className="text-sm font-medium text-gray-700">Mô tả</label>
                  <p className="mt-1 text-gray-600">{selectedAssignment.description}</p>
                </div>
              )}
              {selectedAssignment.content && (
                <div>
                  <label className="text-sm font-medium text-gray-700">Nội dung</label>
                  <div className="mt-1 prose max-w-none" dangerouslySetInnerHTML={{ __html: selectedAssignment.content }} />
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Hạn nộp</label>
                  <p className="mt-1 text-gray-900">{selectedAssignment.dueDate ? new Date(selectedAssignment.dueDate).toLocaleDateString('vi-VN') : 'Không có'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Điểm tối đa</label>
                  <p className="mt-1 text-gray-900">{selectedAssignment.maxScore}</p>
                </div>
              </div>
              {selectedAssignment.attachments && selectedAssignment.attachments.length > 0 && (
                <div>
                  <label className="text-sm font-medium text-gray-700">Tài liệu đính kèm</label>
                  <div className="mt-2 space-y-2">
                    {selectedAssignment.attachments.map((file: any, idx: number) => (
                      <div key={idx} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                        <FileText className="w-4 h-4 text-gray-500" />
                        <a href={file.url} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline">
                          {file.fileName}
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {selectedAssignment.rubric && (
                <div>
                  <label className="text-sm font-medium text-gray-700">Rubric chấm điểm</label>
                  <div className="mt-2 p-4 bg-gray-50 rounded border">
                    <p className="text-sm text-gray-700">{selectedAssignment.rubric}</p>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700">Trạng thái:</label>
                {selectedAssignment.isPublished ? (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                    <CheckCircle className="w-3 h-3" />
                    Đã xuất bản
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                    <Clock className="w-3 h-3" />
                    Chưa xuất bản
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReadOnlySectionView;
