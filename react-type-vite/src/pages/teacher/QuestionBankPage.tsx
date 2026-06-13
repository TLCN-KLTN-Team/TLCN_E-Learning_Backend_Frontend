"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Plus,
  Search,
  Edit,
  Trash2,
  BookOpen,
  Tag,
  FileText,
  Upload,
  CheckCircle2,
  XCircle,
} from "lucide-react"
import {
  getLibraryQuestions,
  deleteLibraryQuestion,
  type QuestionLibraryResponse,
} from "@/services/api/teacher/questionLibraryApi"
import { getTeacherActiveClos, type CourseObjectiveResponse } from "@/services/api/teacher/courseObjectiveApi"
import { toast } from "react-toastify"
import { Badge } from "@/components/ui/badge"
import QuestionBankModal from "@/components/teacher/course/QuestionBankModal"
import QuestionImportModal from "@/components/teacher/course/QuestionImportModal"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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

const QuestionBankPage: React.FC = () => {
  const [questions, setQuestions] = useState<QuestionLibraryResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [questionType, setQuestionType] = useState<string>("ALL")
  const [difficultyLevel, setDifficultyLevel] = useState<string>("ALL")
  const [availableClos, setAvailableClos] = useState<CourseObjectiveResponse[]>([])
  const [selectedCourseId, setSelectedCourseId] = useState<string>("ALL")
  const [selectedCloId, setSelectedCloId] = useState<string>("ALL")
  const [selectedTag, setSelectedTag] = useState<string>("ALL")
  const [currentPage, setCurrentPage] = useState(0)
  const [pageSize, setPageSize] = useState(10)
  const [totalPages, setTotalPages] = useState(0)
  const [totalItems, setTotalItems] = useState(0)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [questionToDelete, setQuestionToDelete] = useState<number | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [importModalOpen, setImportModalOpen] = useState(false)
  const [selectedQuestion, setSelectedQuestion] = useState<QuestionLibraryResponse | undefined>(undefined)

  useEffect(() => {
    const loadClos = async () => {
      try {
        const clos = await getTeacherActiveClos()
        setAvailableClos(clos)
      } catch (error) {
        console.error("Error loading CLOs:", error)
      }
    }
    loadClos()
  }, [])

  const availableCourses = Array.from(
    new Map(
      availableClos.map((item) => [item.courseId, {
        courseId: item.courseId,
        courseName: item.courseName || `Khóa học #${item.courseId}`,
      }])
    ).values()
  )

  const filteredClos = selectedCourseId && selectedCourseId !== "ALL"
    ? availableClos.filter((item) => item.courseId === Number(selectedCourseId))
    : availableClos

  const fetchQuestions = async () => {
    try {
      setLoading(true)
      const response = await getLibraryQuestions({
        page: currentPage,
        size: pageSize,
        search: searchTerm || undefined,
        questionType: questionType && questionType !== "ALL" ? questionType : undefined,
        difficultyLevel: difficultyLevel && difficultyLevel !== "ALL" ? difficultyLevel : undefined,
        tags: selectedTag && selectedTag !== "ALL" ? selectedTag : undefined,
        courseId: selectedCourseId && selectedCourseId !== "ALL" ? Number(selectedCourseId) : undefined,
        cloId: selectedCloId && selectedCloId !== "ALL" ? Number(selectedCloId) : undefined,
        sortBy: "id",
        sortDirection: "DESC",
      })

      setQuestions(response.questions)
      setTotalPages(response.totalPages)
      setTotalItems(response.totalItems)
      setCurrentPage(response.currentPage)
    } catch (error) {
      console.error("Error fetching questions:", error)
      toast.error("Không thể tải danh sách câu hỏi")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchQuestions()
  }, [currentPage, pageSize, searchTerm, questionType, difficultyLevel, selectedTag, selectedCourseId, selectedCloId])

  const handleDelete = async () => {
    if (!questionToDelete) return

    try {
      await deleteLibraryQuestion(questionToDelete)
      toast.success("Xóa câu hỏi thành công")
      fetchQuestions()
    } catch (error: any) {
      console.error("Error deleting question:", error)
      const errorMessage = error?.response?.data?.message || error?.message || ""

      if (errorMessage.includes("foreign key constraint fails") || errorMessage.includes("Cannot delete or update a parent row")) {
        toast.error("Không thể xóa câu hỏi này vì đã có sinh viên làm bài (dữ liệu đang được sử dụng).")
      } else {
        toast.error("Không thể xóa câu hỏi")
      }
    } finally {
      setDeleteDialogOpen(false)
      setQuestionToDelete(null)
    }
  }

  // Extract unique tags from the current list of questions
  const availableTags = Array.from(
    new Set(
      questions
        .map((q) => q.tags)
        .filter(Boolean)
        .flatMap((tags) => tags?.split(',').map(t => t.trim()))
    )
  ).filter(Boolean) as string[]

  const openDeleteDialog = (id: number) => {
    setQuestionToDelete(id)
    setDeleteDialogOpen(true)
  }

  const handleCreateQuestion = () => {
    setSelectedQuestion(undefined)
    setModalOpen(true)
  }

  const handleEditQuestion = (question: QuestionLibraryResponse) => {
    setSelectedQuestion(question)
    setModalOpen(true)
  }

  const handleModalSuccess = () => {
    fetchQuestions()
    setModalOpen(false)
  }

  const getQuestionTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      MULTIPLE_CHOICE: "Nhiều đáp án",
      TRUE_FALSE: "Đúng/Sai",
      SINGLE_CHOICE: "Một đáp án",
      FILL_IN_THE_BLANK: "Điền khuyết",
    }
    return types[type] || type
  }

  const getDifficultyBadge = (difficulty?: string) => {
    if (!difficulty) return null

    const colors: Record<string, string> = {
      EASY: "bg-green-100 text-green-800",
      MEDIUM: "bg-yellow-100 text-yellow-800",
      HARD: "bg-red-100 text-red-800",
    }

    const labels: Record<string, string> = {
      EASY: "Dễ",
      MEDIUM: "Trung bình",
      HARD: "Khó",
    }

    return (
      <Badge className={colors[difficulty] || ""}>{labels[difficulty] || difficulty}</Badge>
    )
  }

  const getSortedAnswers = (question: QuestionLibraryResponse) =>
    [...(question.answers || [])].sort(
      (a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0)
    )

  return (
    <div className="flex-1 overflow-auto">
      <main className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <BookOpen className="h-8 w-8 text-primary" />
              Ngân hàng câu hỏi
            </h1>
            <p className="text-muted-foreground mt-1">
              Quản lý và tái sử dụng câu hỏi cho các bài kiểm tra
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              size="lg"
              variant="outline"
              className="gap-2 border-green-600 text-green-600 hover:bg-green-50"
              onClick={() => setImportModalOpen(true)}
            >
              <Upload className="h-5 w-5" />
              Import từ Excel
            </Button>
            <Button
              size="lg"
              className="gap-2 bg-blue-600 text-white hover:bg-blue-700 shadow-sm"
              onClick={handleCreateQuestion}
            >
              <Plus className="h-5 w-5" />
              Tạo câu hỏi mới
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-card rounded-lg border p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Search */}
            <div className="min-w-0">
              <Label htmlFor="search" className="text-sm font-medium mb-2 flex items-center">
                <Search className="h-4 w-4 mr-1.5" />
                Tìm kiếm
              </Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Tìm kiếm câu hỏi..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Question Type Filter */}
            <div className="min-w-0">
              <Label htmlFor="questionType" className="text-sm font-medium mb-2 flex items-center">
                <FileText className="h-4 w-4 mr-1.5" />
                Loại câu hỏi
              </Label>
              <Select value={questionType} onValueChange={setQuestionType}>
                <SelectTrigger id="questionType" className="w-full">
                  <SelectValue placeholder="Loại câu hỏi" />
                </SelectTrigger>
                <SelectContent className="bg-white z-50 shadow-lg border-gray-200">
                  <SelectItem value="ALL">Tất cả</SelectItem>
                  <SelectItem value="MULTIPLE_CHOICE">Nhiều đáp án</SelectItem>
                  <SelectItem value="TRUE_FALSE">Đúng/Sai</SelectItem>
                  <SelectItem value="SINGLE_CHOICE">Một đáp án</SelectItem>
                  <SelectItem value="FILL_IN_THE_BLANK">Điền khuyết</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Difficulty Filter */}
            <div className="min-w-0">
              <Label htmlFor="difficulty" className="text-sm font-medium mb-2 flex items-center">
                <FileText className="h-4 w-4 mr-1.5" />
                Độ khó
              </Label>
              <Select value={difficultyLevel} onValueChange={setDifficultyLevel}>
                <SelectTrigger id="difficulty" className="w-full">
                  <SelectValue placeholder="Độ khó" />
                </SelectTrigger>
                <SelectContent className="bg-white z-50 shadow-lg border-gray-200">
                  <SelectItem value="ALL">Tất cả</SelectItem>
                  <SelectItem value="EASY">Dễ</SelectItem>
                  <SelectItem value="MEDIUM">Trung bình</SelectItem>
                  <SelectItem value="HARD">Khó</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Course Filter */}
            <div className="min-w-0">
              <Label htmlFor="course" className="text-sm font-medium mb-2 flex items-center">
                <BookOpen className="h-4 w-4 mr-1.5" />
                Khóa học
              </Label>
              <Select 
                value={selectedCourseId} 
                onValueChange={(val) => {
                  setSelectedCourseId(val)
                  setSelectedCloId("ALL")
                }}
              >
                <SelectTrigger id="course" className="w-full">
                  <SelectValue placeholder="Chọn khóa học" />
                </SelectTrigger>
                <SelectContent className="bg-white z-50 shadow-lg border-gray-200">
                  <SelectItem value="ALL">Tất cả khóa học</SelectItem>
                  {availableCourses.map((course) => (
                    <SelectItem key={course.courseId} value={String(course.courseId)}>
                      {course.courseName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* CLO Filter */}
            <div className="min-w-0">
              <Label htmlFor="clo" className="text-sm font-medium mb-2 flex items-center">
                <CheckCircle2 className="h-4 w-4 mr-1.5" />
                Chuẩn đầu ra
              </Label>
              <Select value={selectedCloId} onValueChange={setSelectedCloId}>
                <SelectTrigger id="clo" className="w-full">
                  <SelectValue placeholder="Chọn CĐR" />
                </SelectTrigger>
                <SelectContent className="bg-white z-50 shadow-lg border-gray-200">
                  <SelectItem value="ALL">Tất cả CĐR</SelectItem>
                  {filteredClos.map((clo) => (
                    <SelectItem key={clo.id} value={String(clo.id)}>
                      {clo.code}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Tag Filter */}
            <div className="min-w-0">
              <Label htmlFor="tag" className="text-sm font-medium mb-2 flex items-center">
                <Tag className="h-4 w-4 mr-1.5" />
                Tag
              </Label>
              <Select value={selectedTag} onValueChange={setSelectedTag}>
                <SelectTrigger id="tag" className="w-full">
                  <SelectValue placeholder="Lọc theo Tag" />
                </SelectTrigger>
                <SelectContent className="bg-white z-50 shadow-lg border-gray-200">
                  <SelectItem value="ALL">Tất cả Tags</SelectItem>
                  {availableTags.map((tag) => (
                    <SelectItem key={tag} value={tag}>
                      {tag}
                    </SelectItem>
                  ))}
                  {/* Nếu người dùng chọn một tag không có trong list hiện tại nhưng đang active, vẫn hiển thị nó */}
                  {selectedTag !== "ALL" && !availableTags.includes(selectedTag) && (
                    <SelectItem key={selectedTag} value={selectedTag}>
                      {selectedTag}
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="bg-primary/5 rounded-lg border border-primary/20 p-4 mb-6">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            <span className="font-medium">
              Tổng số câu hỏi: <span className="text-primary">{totalItems}</span>
            </span>
          </div>
        </div>

        {/* Questions List */}
        {loading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="animate-pulse bg-card rounded-lg border p-4">
                <div className="h-6 bg-muted rounded w-3/4 mb-3"></div>
                <div className="h-4 bg-muted rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : questions.length === 0 ? (
          <div className="text-center py-16 bg-card rounded-lg border">
            <BookOpen className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Chưa có câu hỏi nào</h3>
            <p className="text-muted-foreground mb-4">
              Bắt đầu tạo câu hỏi để sử dụng trong các bài kiểm tra
            </p>
            <Button className="gap-2 bg-blue-600 text-white hover:bg-blue-700" onClick={handleCreateQuestion}>
              <Plus className="h-4 w-4" />
              Tạo câu hỏi đầu tiên
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {questions.map((question) => {
              const answers = getSortedAnswers(question)
              const correctAnswerCount = answers.filter((answer) => answer.isCorrect).length

              return (
                <div
                  key={question.id}
                  className="bg-card rounded-lg border p-4 hover:shadow-md transition-shadow"
                >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline">{getQuestionTypeLabel(question.questionType)}</Badge>
                      {getDifficultyBadge(question.difficultyLevel)}
                      {question.cloCode && (
                        <Badge className="bg-blue-100 text-blue-800">
                          {question.courseName
                            ? `${question.cloCode} - ${question.courseName}`
                            : question.cloCode}
                        </Badge>
                      )}
                      {question.score && (
                        <Badge variant="secondary">{question.score} điểm</Badge>
                      )}
                    </div>

                    <h3 className="text-lg font-medium mb-2">{question.questionText}</h3>

                    {question.tags && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                        <Tag className="h-4 w-4" />
                        {question.tags.split(",").map((tag, index) => (
                          <span
                            key={index}
                            className="bg-secondary px-2 py-1 rounded text-xs"
                          >
                            {tag.trim()}
                          </span>
                        ))}
                      </div>
                    )}

                    {answers.length > 0 ? (
                      <div className="mt-3 space-y-2">
                        {answers.map((answer, index) => (
                          <div
                            key={answer.id || index}
                            className={`flex items-center gap-2 rounded-md border p-2 text-sm ${
                              answer.isCorrect
                                ? "border-green-200 bg-green-50 text-green-900"
                                : "border-gray-200 bg-gray-50 text-gray-700"
                            }`}
                          >
                            {answer.isCorrect ? (
                              <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-green-600" />
                            ) : (
                              <XCircle className="h-4 w-4 flex-shrink-0 text-gray-400" />
                            )}
                            <span className={answer.isCorrect ? "font-medium flex items-center" : "flex items-center"}>
                              {question.questionType === 'FILL_IN_THE_BLANK' && (
                                <span className="mr-2 px-1.5 py-0.5 bg-white border border-gray-200 rounded text-xs text-gray-500 font-bold">
                                  Ô {index + 1}
                                </span>
                              )}
                              {answer.content}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-sm text-muted-foreground">
                        Chưa có đáp án
                      </div>
                    )}

                    <div className="mt-2 text-sm text-muted-foreground">
                      {answers.length} đáp án • {correctAnswerCount} đáp án đúng
                    </div>
                  </div>

                  <div className="flex gap-2 ml-4">
                    <Button variant="outline" size="sm" className="gap-1" onClick={() => handleEditQuestion(question)}>
                      <Edit className="h-4 w-4" />
                      Sửa
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1 text-destructive hover:text-destructive"
                      onClick={() => openDeleteDialog(question.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                      Xóa
                    </Button>
                  </div>
                </div>
              </div>
              )
            })}
          </div>
        )}

        {/* Pagination */}
        <div className="mt-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              disabled={currentPage === 0}
              onClick={() => setCurrentPage(currentPage - 1)}
            >
              Trước
            </Button>
            <span className="text-sm text-muted-foreground">
              Trang {currentPage + 1} / {totalPages || "-"}
            </span>
            <Button
              variant="outline"
              disabled={totalPages === 0 || currentPage >= totalPages - 1}
              onClick={() => setCurrentPage(currentPage + 1)}
            >
              Sau
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm text-muted-foreground">Hiển thị</label>
            <select value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(0); }} title="Số câu hỏi hiển thị trên trang" className="border rounded-md p-1 bg-background">
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
          </div>
        </div>
      </main>

      {/* Question Bank Modal */}
      <QuestionBankModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={handleModalSuccess}
        question={selectedQuestion}
        availableTags={availableTags}
      />

      {/* Question Import Modal */}
      <QuestionImportModal
        isOpen={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        onSuccess={fetchQuestions}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa câu hỏi</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa câu hỏi này? Hành động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-white border-gray-300 hover:bg-gray-100 text-gray-700">Hủy</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 text-white hover:bg-red-700 border-red-600">
              Xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export default QuestionBankPage
