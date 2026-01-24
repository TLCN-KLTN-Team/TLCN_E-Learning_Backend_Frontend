"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { GripVertical, Edit, Trash, ChevronUp, ChevronDown, PlusCircle, BookOpen, AlertCircle, Eye } from "lucide-react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import LessonItem from "./LessonItem"
import QuizItem from "./QuizItem"
import AddLessonModal from "./AddLessonModal"
import QuizModalEditor from "./QuizModalEditor"
import EditSectionModal from "./EditSectionModal"
import EditLessonModal from "./EditLessonModal"
import EditQuizModal from "./EditQuizModal"
import AssignmentItem from "./AssignmentItem"
import AddAssignmentModal from "./AddAssignmentModal"
import EditAssignmentModal from "./EditAssignmentModal"
import SectionVisibilityModal from "./SectionVisibilityModal"
// import Modal from "@/components/ui/modal"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import type { SectionResponse } from "@/services/api/response/sectionResponse"
import type { LessonResponse } from "@/services/api/response/lessonResponse"
import type { QuizResponse } from "@/services/api/response/quizResponse"
import type { QuizRequest } from "@/services/api/request/quizRequest"
import { convertSectionResponseToRequest } from "@/utils/converters"
import { getNextLessonNumberItem, getNextQuizNumberItem, getNextAssignmentNumberItem } from "@/utils/orderIndexUtils"
import type { AssignmentResponse } from "@/services/api/response/assignmentResponse"
import type { AssignmentRequest } from "@/services/api/request/assignmentRequest"

interface SectionItemProps {
  section: SectionResponse
  index: number
  courseId: string
  educationalUnitId: number
  onUpdate: (section: SectionResponse) => void
  onDelete: (sectionId: number) => void
  onReorder: (fromIndex: number, toIndex: number) => void
}

const SectionItem: React.FC<SectionItemProps> = ({ section, index, courseId, educationalUnitId, onUpdate, onDelete, onReorder }) => {
  const [isExpanded, setIsExpanded] = useState(false)
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)

  // Trạng thái modal
  const [isLessonModalOpen, setIsLessonModalOpen] = useState(false)
  const [isQuizModalOpen, setIsQuizModalOpen] = useState(false)
  const [isEditSectionModalOpen, setIsEditSectionModalOpen] = useState(false)
  const [isEditLessonModalOpen, setIsEditLessonModalOpen] = useState(false)
  const [isEditQuizModalOpen, setIsEditQuizModalOpen] = useState(false)
  const [isAssignmentModalOpen, setIsAssignmentModalOpen] = useState(false)
  const [isEditAssignmentModalOpen, setIsEditAssignmentModalOpen] = useState(false)
  const [isVisibilityModalOpen, setIsVisibilityModalOpen] = useState(false)
  const [selectedLesson, setSelectedLesson] = useState<LessonResponse | null>(null)
  const [selectedQuiz, setSelectedQuiz] = useState<QuizResponse | null>(null)
  const [selectedAssignment, setSelectedAssignment] = useState<AssignmentResponse | null>(null)
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    type: "lesson" | "quiz" | "assignment" | null
    id: number | null
    name: string
  }>({ type: null, id: null, name: "" })

  const lessonsArray = section.lessons ? Array.from(section.lessons) : []
  const quizzesArray = section.quizs ? Array.from(section.quizs) : []
  const assignmentsArray = section.assignments ? Array.from(section.assignments) : []

  // Sắp xếp ngay từ đầu để dùng cho cả hiển thị và handler
  const sortedLessons = [...lessonsArray].sort((a, b) => a.numberItem - b.numberItem)
  const sortedQuizzes = [...quizzesArray].sort((a, b) => a.numberItem - b.numberItem)
  const sortedAssignments = [...assignmentsArray].sort((a, b) => a.numberItem - b.numberItem)

  const handleLessonsReorder = (fromIndex: number, toIndex: number) => {
    const fromLesson = sortedLessons[fromIndex]
    const toLesson = sortedLessons[toIndex]

    if (!fromLesson || !toLesson) return

    const lessonsWithSwappedOrder = lessonsArray.map((lesson) => {
      if (lesson.id === fromLesson.id) {
        return { ...lesson, numberItem: toLesson.numberItem }
      } else if (lesson.id === toLesson.id) {
        return { ...lesson, numberItem: fromLesson.numberItem }
      }
      return lesson
    })

    onUpdate({ ...section, lessons: new Set(lessonsWithSwappedOrder) })
  }

  const handleQuizzesReorder = (fromIndex: number, toIndex: number) => {
    const fromQuiz = sortedQuizzes[fromIndex]
    const toQuiz = sortedQuizzes[toIndex]

    if (!fromQuiz || !toQuiz) return

    const quizzesWithSwappedOrder = quizzesArray.map((quiz) => {
      if (quiz.id === fromQuiz.id) {
        return { ...quiz, numberItem: toQuiz.numberItem }
      } else if (quiz.id === toQuiz.id) {
        return { ...quiz, numberItem: fromQuiz.numberItem }
      }
      return quiz
    })

    onUpdate({ ...section, quizs: new Set(quizzesWithSwappedOrder) })
  }

  const handleAssignmentsReorder = (fromIndex: number, toIndex: number) => {
    const fromAssignment = sortedAssignments[fromIndex]
    const toAssignment = sortedAssignments[toIndex]

    if (!fromAssignment || !toAssignment) return

    const assignmentsWithSwappedOrder = assignmentsArray.map((assignment) => {
      if (assignment.id === fromAssignment.id) {
        return { ...assignment, numberItem: toAssignment.numberItem }
      } else if (assignment.id === toAssignment.id) {
        return { ...assignment, numberItem: fromAssignment.numberItem }
      }
      return assignment
    })

    onUpdate({ ...section, assignments: new Set(assignmentsWithSwappedOrder) })
  }

  // Xử lý thêm bài học mới
  const handleAddLesson = (lessonData: any) => {
    const nextNumberItem = getNextLessonNumberItem(lessonsArray)

    const newLesson: LessonResponse = {
      ...lessonData,
      sectionId: section.id,
      sectionName: section.title,
      numberItem: nextNumberItem,
      createdAt: new Date(),
      updateAt: new Date(),
    }

    const updatedLessons = new Set([...lessonsArray, newLesson])
    onUpdate({ ...section, lessons: updatedLessons })
  }

  // Xử lý thêm bài kiểm tra mới
  const handleAddQuiz = (quizData: QuizRequest) => {
    // Get questions from quizData if available, otherwise create empty set
    const questionsToAdd = quizData.questions && quizData.questions.length > 0
      ? new Set(quizData.questions)
      : new Set<any>()

    const newQuiz: QuizResponse = {
      id: Date.now(),
      title: quizData.title,
      description: quizData.description || "",
      duration: quizData.duration,
      attemptLimit: quizData.attemptLimit || 3,
      passingScore: quizData.passingScore || 70,
      numberItem: quizData.numberItem || getNextQuizNumberItem(quizzesArray),
      sectionId: section.id,
      sectionName: section.title,
      showResults: quizData.showResults || false,
      isPublished: quizData.isPublished || false,
      attemptsCount: 0,
      createdAt: new Date(),
      updateAt: new Date(),
      questions: questionsToAdd,
      ...(quizData.startTime && { startTime: quizData.startTime }),
      ...(quizData.endTime && { endTime: quizData.endTime }),
    }

    console.log('[SectionItem] newQuiz created:', newQuiz);

    const updatedQuizzes = new Set([...quizzesArray, newQuiz])
    onUpdate({ ...section, quizs: updatedQuizzes })
  }

  const handleAddAssignment = (assignmentData: AssignmentRequest) => {
    const nextNumberItem = getNextAssignmentNumberItem(assignmentsArray)

    const newAssignment: AssignmentResponse = {
      id: Date.now(),
      title: assignmentData.title,
      description: assignmentData.description || "",
      deadline: assignmentData.deadline,
      assignmentFiles: assignmentData.assignmentFiles || [],
      submissionType: assignmentData.submissionType,
      rubricFiles: assignmentData.rubricFiles || [],
      maxScore: assignmentData.maxScore || 100,
      numberItem: nextNumberItem,
      sectionId: section.id,
      sectionName: section.title,
      isPublished: assignmentData.isPublished || false,
      createdAt: new Date(),
      updateAt: new Date(),
      submissionsCount: 0,
    }

    const updatedAssignments = new Set([...assignmentsArray, newAssignment])
    onUpdate({ ...section, assignments: updatedAssignments })
  }

  // Xử lý các thao tác chỉnh sửa
  const handleEditLesson = (lesson: LessonResponse) => {
    setSelectedLesson(lesson)
    setIsEditLessonModalOpen(true)
  }

  const handleUpdateLesson = (updatedLesson: LessonResponse) => {
    const updatedLessons = lessonsArray.map((l) => (l.id === updatedLesson.id ? updatedLesson : l))
    onUpdate({ ...section, lessons: new Set(updatedLessons) })
  }

  const handleEditQuiz = (quiz: QuizResponse) => {
    setSelectedQuiz(quiz)
    setIsEditQuizModalOpen(true)
  }

  const handleUpdateQuiz = (updatedQuizData: QuizRequest) => {
    if (!selectedQuiz) return

    const updatedQuiz: QuizResponse = {
      ...selectedQuiz,
      title: updatedQuizData.title,
      description: updatedQuizData.description || "",
      duration: updatedQuizData.duration,
      attemptLimit: updatedQuizData.attemptLimit || 3,
      passingScore: updatedQuizData.passingScore || 70,
      showResults: updatedQuizData.showResults || false,
      isPublished: updatedQuizData.isPublished || false,
      questions: new Set((updatedQuizData.questions || []) as any),
      updateAt: new Date(),
    }

    const updatedQuizzes = quizzesArray.map((q) => (q.id === updatedQuiz.id ? updatedQuiz : q))
    onUpdate({ ...section, quizs: new Set(updatedQuizzes) })
  }

  const handleEditAssignment = (assignment: AssignmentResponse) => {
    setSelectedAssignment(assignment)
    setIsEditAssignmentModalOpen(true)
  }

  const handleUpdateAssignment = (updatedAssignment: AssignmentResponse) => {
    const updatedAssignments = assignmentsArray.map((a) => (a.id === updatedAssignment.id ? updatedAssignment : a))
    onUpdate({ ...section, assignments: new Set(updatedAssignments) })
  }

  const handleDeleteLesson = (lessonId: number, lessonTitle: string) => {
    setDeleteConfirmation({ type: "lesson", id: lessonId, name: lessonTitle })
  }

  const handleConfirmDeleteLesson = () => {
    if (deleteConfirmation.id) {
      const filteredLessons = lessonsArray.filter((l) => l.id !== deleteConfirmation.id)
      onUpdate({ ...section, lessons: new Set(filteredLessons) })
      setDeleteConfirmation({ type: null, id: null, name: "" })
    }
  }

  const handleDeleteQuiz = (quizId: number, quizTitle: string) => {
    setDeleteConfirmation({ type: "quiz", id: quizId, name: quizTitle })
  }

  const handleConfirmDeleteQuiz = () => {
    if (deleteConfirmation.id) {
      const filteredQuizzes = quizzesArray.filter((q) => q.id !== deleteConfirmation.id)
      onUpdate({ ...section, quizs: new Set(filteredQuizzes) })
      setDeleteConfirmation({ type: null, id: null, name: "" })
    }
  }

  const handleDeleteAssignment = (assignmentId: number, assignmentTitle: string) => {
    setDeleteConfirmation({ type: "assignment", id: assignmentId, name: assignmentTitle })
  }

  const handleConfirmDeleteAssignment = () => {
    if (deleteConfirmation.id) {
      const filteredAssignments = assignmentsArray.filter((a) => a.id !== deleteConfirmation.id)
      onUpdate({ ...section, assignments: new Set(filteredAssignments) })
      setDeleteConfirmation({ type: null, id: null, name: "" })
    }
  }

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData("text/plain", index.toString())
    setDraggedIndex(index)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const fromIndex = Number.parseInt(e.dataTransfer.getData("text/plain"))
    const toIndex = index

    if (fromIndex !== toIndex) {
      onReorder(fromIndex, toIndex)
    }
    setDraggedIndex(null)
  }

  const isDragging = draggedIndex === index
  const isDragOver = draggedIndex !== null && draggedIndex !== index

  return (
    <>
      <Card
        className={`transition-all ${isDragging ? "opacity-50" : ""} ${isDragOver ? "border-2 border-blue-300 bg-blue-50" : ""
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
            <span className="text-sm text-gray-500 min-w-[20px]">{section.orderIndex}.</span>
            <BookOpen className="h-5 w-5 text-blue-600" />
            <div>
              <span className="font-semibold">{section.title}</span>
              {!isExpanded && (
                <div className="flex items-center gap-4 text-xs text-gray-500 mt-1">
                  <span>{lessonsArray.length} bài học</span>
                  <span>{quizzesArray.length} bài kiểm tra</span>
                  <span>{assignmentsArray.length} bài tập</span>
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 mr-1"
              onClick={(e) => {
                e.stopPropagation()
                setIsVisibilityModalOpen(true)
              }}
              title="Quản lý hiển thị cho các lớp"
            >
              <Eye className="h-4 w-4 text-blue-600" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 mr-1"
              onClick={(e) => {
                e.stopPropagation()
                setIsEditSectionModalOpen(true)
              }}
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 mr-1"
              onClick={(e) => {
                e.stopPropagation()
                onDelete(section.id)
              }}
            >
              <Trash className="h-4 w-4 text-red-500" />
            </Button>
            <div className="h-8 w-8 inline-flex items-center justify-center">
              {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
            </div>
          </div>
        </CardHeader>
        {isExpanded && (
          <CardContent className="p-4 space-y-4">
            {/* Mô Tả Phần */}
            {section.description && (
              <div className="bg-blue-50 border-l-4 border-blue-400 p-3 rounded">
                <p className="text-sm text-gray-700">{section.description}</p>
              </div>
            )}

            {/* Phần Bài Học */}
            <div>
              <div className="flex justify-between items-center mb-3">
                <h4 className="font-semibold text-lg flex items-center gap-2">
                  Bài Học
                  <span className="text-sm font-normal text-gray-500">({lessonsArray.length})</span>
                </h4>
              </div>
              <div className="space-y-2">
                {sortedLessons.length > 0 ? (
                  sortedLessons.map((lesson, lessonIndex) => (
                    <LessonItem
                      key={lesson.id}
                      lesson={lesson}
                      index={lessonIndex}
                      courseId={courseId}
                      educationalUnitId={educationalUnitId}
                      onUpdate={(updatedLesson) => {
                        const updatedLessons = lessonsArray.map((l) => (l.id === updatedLesson.id ? updatedLesson : l))
                        onUpdate({ ...section, lessons: new Set(updatedLessons) })
                      }}
                      onDelete={(lessonId) => handleDeleteLesson(lessonId, lesson.title)}
                      onReorder={handleLessonsReorder}
                      onEdit={handleEditLesson}
                    />
                  ))
                ) : (
                  <div className="text-center py-8 border-2 border-dashed rounded-lg bg-gray-50">
                    <p className="text-sm text-gray-500">Chưa có bài học nào.</p>
                  </div>
                )}
                {/* Nút Thêm Bài Học - Di chuyển xuống dưới danh sách */}

                <div className="flex justify-end pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsLessonModalOpen(true)}
                    className="text-blue-600 hover:text-blue-700"
                  >
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Thêm Bài Học
                  </Button>
                </div>
              </div>
            </div>

            {/* Phần Bài Kiểm Tra */}
            <div className="pt-4 border-t">
              <div className="flex justify-between items-center mb-3">
                <h4 className="font-semibold text-lg flex items-center gap-2">
                  Bài Kiểm Tra
                  <span className="text-sm font-normal text-gray-500">({quizzesArray.length})</span>
                </h4>
              </div>
              <div className="space-y-2">
                {sortedQuizzes.length > 0 ? (
                  sortedQuizzes.map((quiz, quizIndex) => (
                    <QuizItem
                      key={quiz.id}
                      quiz={quiz}
                      index={quizIndex}
                      courseId={courseId}
                      educationalUnitId={educationalUnitId}
                      onUpdate={(updatedQuiz) => {
                        const updatedQuizzes = quizzesArray.map((q) => (q.id === updatedQuiz.id ? updatedQuiz : q))
                        onUpdate({ ...section, quizs: new Set(updatedQuizzes) })
                      }}
                      onDelete={(quizId) => handleDeleteQuiz(quizId, quiz.title)}
                      onReorder={handleQuizzesReorder}
                      onEdit={handleEditQuiz}
                    />
                  ))
                ) : (
                  <div className="text-center py-8 border-2 border-dashed rounded-lg bg-gray-50">
                    <p className="text-sm text-gray-500">Chưa có bài kiểm tra nào.</p>
                  </div>
                )}
                {/* Nút Thêm Bài Kiểm Tra - Di chuyển xuống dưới danh sách */}

                <div className="flex justify-end pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsQuizModalOpen(true)}
                    className="text-purple-600 hover:text-purple-700"
                  >
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Thêm Bài Kiểm Tra
                  </Button>
                </div>
              </div>
            </div>

            {/* Phần Bài Tập */}
            <div className="pt-4 border-t">
              <div className="flex justify-between items-center mb-3">
                <h4 className="font-semibold text-lg flex items-center gap-2">
                  Bài Tập
                  <span className="text-sm font-normal text-gray-500">({assignmentsArray.length})</span>
                </h4>
              </div>
              <div className="space-y-2">
                {sortedAssignments.length > 0 ? (
                  sortedAssignments.map((assignment, assignmentIndex) => (
                    <AssignmentItem
                      key={assignment.id}
                      assignment={assignment}
                      index={assignmentIndex}
                      courseId={courseId}
                      educationalUnitId={educationalUnitId}
                      onUpdate={(updatedAssignment) => {
                        const updatedAssignments = assignmentsArray.map((a) =>
                          a.id === updatedAssignment.id ? updatedAssignment : a,
                        )
                        onUpdate({ ...section, assignments: new Set(updatedAssignments) })
                      }}
                      onDelete={(assignmentId) => handleDeleteAssignment(assignmentId, assignment.title)}
                      onReorder={handleAssignmentsReorder}
                      onEdit={handleEditAssignment}
                    />
                  ))
                ) : (
                  <div className="text-center py-8 border-2 border-dashed rounded-lg bg-gray-50">
                    <p className="text-sm text-gray-500">Chưa có bài tập nào.</p>
                  </div>
                )}
                {/* Nút Thêm Bài Tập - Di chuyển xuống dưới danh sách */}
                <div className="flex justify-end pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsAssignmentModalOpen(true)}
                    className="text-orange-600 hover:text-orange-700 "
                  >
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Thêm Bài Tập
                  </Button>
                </div>

              </div>
            </div>

            {/* Thống Kê Phần */}
            <div className="pt-3 border-t flex items-center justify-between text-xs text-gray-500">
              <div className="flex items-center gap-4">
                <span>Tạo: {new Date(section.createdAt).toLocaleDateString("vi-VN")}</span>
                {section.updateAt && <span>Cập nhật: {new Date(section.updateAt).toLocaleDateString("vi-VN")}</span>}
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      <AddLessonModal
        isOpen={isLessonModalOpen}
        onClose={() => setIsLessonModalOpen(false)}
        onAddLesson={handleAddLesson}
        sectionId={section.id}
        courseId={Number(courseId)}
        existingSection={convertSectionResponseToRequest(section)}
      />

      <QuizModalEditor
        isOpen={isQuizModalOpen}
        onClose={() => setIsQuizModalOpen(false)}
        onSave={handleAddQuiz}
        courseId={courseId}
        sectionId={section.id}
        section={section}
      />

      <AddAssignmentModal
        isOpen={isAssignmentModalOpen}
        onClose={() => setIsAssignmentModalOpen(false)}
        onAddAssignment={handleAddAssignment}
        sectionId={section.id}
        courseId={Number(courseId)}
        existingSection={convertSectionResponseToRequest(section)}
      />

      <EditSectionModal
        isOpen={isEditSectionModalOpen}
        onClose={() => setIsEditSectionModalOpen(false)}
        onUpdate={onUpdate}
        section={section}
        courseId={Number(courseId)}
      />

      <EditLessonModal
        isOpen={isEditLessonModalOpen}
        onClose={() => setIsEditLessonModalOpen(false)}
        onUpdate={handleUpdateLesson}
        lesson={selectedLesson}
        sectionId={section.id}
        courseId={Number(courseId)}
      />

      <EditQuizModal
        isOpen={isEditQuizModalOpen}
        onClose={() => setIsEditQuizModalOpen(false)}
        onUpdate={handleUpdateQuiz}
        quiz={selectedQuiz}
        section={section}
        sectionId={section.id}
        courseId={Number(courseId)}
      />

      <EditAssignmentModal
        isOpen={isEditAssignmentModalOpen}
        onClose={() => setIsEditAssignmentModalOpen(false)}
        onUpdate={handleUpdateAssignment}
        assignment={selectedAssignment}
        sectionId={section.id}
        courseId={Number(courseId)}
      />

      <SectionVisibilityModal
        isOpen={isVisibilityModalOpen}
        onClose={() => setIsVisibilityModalOpen(false)}
        sectionId={section.id}
        sectionTitle={section.title}
        courseId={Number(courseId)}
        educationalUnitId={educationalUnitId}
      />

      <AlertDialog
        open={deleteConfirmation.type !== null}
        onOpenChange={(open) => !open && setDeleteConfirmation({ type: null, id: null, name: "" })}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Xóa{" "}
              {deleteConfirmation.type === "lesson"
                ? "Bài Học"
                : deleteConfirmation.type === "quiz"
                  ? "Bài Kiểm Tra"
                  : "Bài Tập"}
              ?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa "{deleteConfirmation.name}"? Hành động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={
                deleteConfirmation.type === "lesson"
                  ? handleConfirmDeleteLesson
                  : deleteConfirmation.type === "quiz"
                    ? handleConfirmDeleteQuiz
                    : handleConfirmDeleteAssignment
              }
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

export default SectionItem