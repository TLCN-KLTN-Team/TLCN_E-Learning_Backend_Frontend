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
  Filter,
  Upload,
} from "lucide-react"
import {
  getLibraryQuestions,
  deleteLibraryQuestion,
  type QuestionLibraryResponse,
} from "@/services/api/teacher/questionLibraryApi"
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
  const [selectedTag, setSelectedTag] = useState<string>("ALL")
  const [availableTags, setAvailableTags] = useState<string[]>([])
  const [currentPage, setCurrentPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [totalItems, setTotalItems] = useState(0)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [questionToDelete, setQuestionToDelete] = useState<number | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [importModalOpen, setImportModalOpen] = useState(false)
  const [selectedQuestion, setSelectedQuestion] = useState<QuestionLibraryResponse | undefined>(undefined)

  const fetchQuestions = async () => {
    try {
      setLoading(true)
      const response = await getLibraryQuestions({
        page: currentPage,
        size: 10,
        search: searchTerm || undefined,
        questionType: questionType && questionType !== "ALL" ? questionType : undefined,
        difficultyLevel: difficultyLevel && difficultyLevel !== "ALL" ? difficultyLevel : undefined,
        tags: selectedTag && selectedTag !== "ALL" ? selectedTag : undefined,
        sortBy: "id",
        sortDirection: "DESC",
      })

      setQuestions(response.questions)
      setTotalPages(response.totalPages)
      setTotalItems(response.totalItems)
      setCurrentPage(response.currentPage)

      // Extract unique tags from all questions for filter dropdown
      const tags = new Set<string>()
      response.questions.forEach((q) => {
        if (q.tags) {
          q.tags.split(",").forEach((tag) => tags.add(tag.trim()))
        }
      })
      setAvailableTags(Array.from(tags).sort())
    } catch (error) {
      console.error("Error fetching questions:", error)
      toast.error("Không thể tải danh sách câu hỏi")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchQuestions()
  }, [currentPage, searchTerm, questionType, difficultyLevel, selectedTag])

  const handleDelete = async () => {
    if (!questionToDelete) return

    try {
      await deleteLibraryQuestion(questionToDelete)
      toast.success("Xóa câu hỏi thành công")
      fetchQuestions()
    } catch (error) {
      console.error("Error deleting question:", error)
      toast.error("Không thể xóa câu hỏi")
    } finally {
      setDeleteDialogOpen(false)
      setQuestionToDelete(null)
    }
  }

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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Search */}
            <div>
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
            <div>
              <Label htmlFor="questionType" className="text-sm font-medium mb-2 flex items-center">
                <FileText className="h-4 w-4 mr-1.5" />
                Loại câu hỏi
              </Label>
              <Select value={questionType} onValueChange={setQuestionType}>
                <SelectTrigger id="questionType">
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
            <div>
              <Label htmlFor="difficulty" className="text-sm font-medium mb-2 flex items-center">
                <FileText className="h-4 w-4 mr-1.5" />
                Độ khó
              </Label>
              <Select value={difficultyLevel} onValueChange={setDifficultyLevel}>
                <SelectTrigger id="difficulty">
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

            {/* Tag Filter */}
            <div>
              <Label htmlFor="tag" className="text-sm font-medium mb-2 flex items-center">
                <Tag className="h-4 w-4 mr-1.5" />
                Lọc theo Tag
              </Label>
              <Select value={selectedTag} onValueChange={setSelectedTag}>
                <SelectTrigger id="tag">
                  <SelectValue placeholder="Chọn tag" />
                </SelectTrigger>
                <SelectContent className="bg-white z-50 shadow-lg border-gray-200">
                  <SelectItem value="ALL">Tất cả</SelectItem>
                  {availableTags.map((tag) => (
                    <SelectItem key={tag} value={tag}>
                      {tag}
                    </SelectItem>
                  ))}
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
            {questions.map((question) => (
              <div
                key={question.id}
                className="bg-card rounded-lg border p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline">{getQuestionTypeLabel(question.questionType)}</Badge>
                      {getDifficultyBadge(question.difficultyLevel)}
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

                    <div className="text-sm text-muted-foreground">
                      {question.answers.length} đáp án •{" "}
                      {question.answers.filter((a) => a.isCorrect).length} đáp án đúng
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
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-6">
            <Button
              variant="outline"
              disabled={currentPage === 0}
              onClick={() => setCurrentPage(currentPage - 1)}
            >
              Trước
            </Button>
            <span className="text-sm text-muted-foreground">
              Trang {currentPage + 1} / {totalPages}
            </span>
            <Button
              variant="outline"
              disabled={currentPage >= totalPages - 1}
              onClick={() => setCurrentPage(currentPage + 1)}
            >
              Sau
            </Button>
          </div>
        )}
      </main>

      {/* Question Bank Modal */}
      <QuestionBankModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={handleModalSuccess}
        question={selectedQuestion}
      />

      {/* Question Import Modal */}
      <QuestionImportModal
        isOpen={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        onSuccess={fetchQuestions}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa câu hỏi</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa câu hỏi này? Hành động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export default QuestionBankPage