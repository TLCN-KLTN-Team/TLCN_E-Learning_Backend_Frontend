"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogPortal,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Search, Plus, Check } from "lucide-react"
import {
  getLibraryQuestions,
  type QuestionLibraryResponse,
} from "@/services/api/teacher/questionLibraryApi"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "react-toastify"

interface QuestionSelectorProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (questions: QuestionLibraryResponse[]) => void
}

const QuestionSelector: React.FC<QuestionSelectorProps> = ({
  isOpen,
  onClose,
  onSelect,
}) => {
  const [questions, setQuestions] = useState<QuestionLibraryResponse[]>([])
  const [selectedQuestions, setSelectedQuestions] = useState<Set<number>>(new Set())
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [questionType, setQuestionType] = useState<string>("")
  const [difficultyLevel, setDifficultyLevel] = useState<string>("")
  const [currentPage, setCurrentPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)

  const fetchQuestions = async () => {
    try {
      setLoading(true)
      console.log('[QuestionSelector] Fetching questions with params:', {
        page: currentPage,
        size: 10,
        search: searchTerm || undefined,
        questionType: questionType || undefined,
        difficultyLevel: difficultyLevel || undefined,
      })
      
      const response = await getLibraryQuestions({
        page: currentPage,
        size: 10,
        search: searchTerm || undefined,
        questionType: questionType || undefined,
        difficultyLevel: difficultyLevel || undefined,
        sortBy: "id",
        sortDirection: "DESC",
      })

      console.log('[QuestionSelector] Received questions:', response)
      setQuestions(response.questions)
      setTotalPages(response.totalPages)
    } catch (error) {
      console.error("[QuestionSelector] Error fetching questions:", error)
      toast.error("Không thể tải danh sách câu hỏi")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isOpen) {
      fetchQuestions()
    }
  }, [isOpen, currentPage, searchTerm, questionType, difficultyLevel])

  const toggleQuestion = (questionId: number) => {
    const newSelected = new Set(selectedQuestions)
    if (newSelected.has(questionId)) {
      newSelected.delete(questionId)
    } else {
      newSelected.add(questionId)
    }
    setSelectedQuestions(newSelected)
  }

  const handleConfirm = () => {
    const selected = questions.filter((q) => selectedQuestions.has(q.id))
    if (selected.length === 0) {
      toast.warning("Vui lòng chọn ít nhất 1 câu hỏi")
      return
    }
    onSelect(selected)
    setSelectedQuestions(new Set())
    onClose()
  }

  const handleClose = () => {
    setSelectedQuestions(new Set())
    onClose()
  }

  const getQuestionTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      MULTIPLE_CHOICE: "Trắc nghiệm",
      TRUE_FALSE: "Đúng/Sai",
      SHORT_ANSWER: "Trả lời ngắn",
      ESSAY: "Tự luận",
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
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent 
        className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col bg-white"
        style={{ zIndex: 10000 }}
      >
        <DialogHeader>
          <DialogTitle className="text-2xl">Chọn câu hỏi từ ngân hàng</DialogTitle>
          <DialogDescription>
            Chọn các câu hỏi có sẵn để thêm vào bài kiểm tra
          </DialogDescription>
        </DialogHeader>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 py-3 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Tìm kiếm câu hỏi..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <Select value={questionType} onValueChange={setQuestionType}>
            <SelectTrigger>
              <SelectValue placeholder="Loại câu hỏi" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả</SelectItem>
              <SelectItem value="MULTIPLE_CHOICE">Trắc nghiệm</SelectItem>
              <SelectItem value="TRUE_FALSE">Đúng/Sai</SelectItem>
              <SelectItem value="SHORT_ANSWER">Trả lời ngắn</SelectItem>
              <SelectItem value="ESSAY">Tự luận</SelectItem>
            </SelectContent>
          </Select>

          <Select value={difficultyLevel} onValueChange={setDifficultyLevel}>
            <SelectTrigger>
              <SelectValue placeholder="Độ khó" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả</SelectItem>
              <SelectItem value="EASY">Dễ</SelectItem>
              <SelectItem value="MEDIUM">Trung bình</SelectItem>
              <SelectItem value="HARD">Khó</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Selected Count */}
        {selectedQuestions.size > 0 && (
          <div className="bg-primary/10 border border-primary/20 rounded-lg p-2 text-center">
            <span className="text-primary font-medium">
              Đã chọn {selectedQuestions.size} câu hỏi
            </span>
          </div>
        )}

        {/* Questions List */}
        <div className="flex-1 overflow-y-auto space-y-2">
          {loading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="animate-pulse bg-muted rounded-lg p-4 h-24"></div>
              ))}
            </div>
          ) : questions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Không tìm thấy câu hỏi nào
            </div>
          ) : (
            questions.map((question) => (
              <div
                key={question.id}
                className={`border rounded-lg p-3 cursor-pointer transition-all ${
                  selectedQuestions.has(question.id)
                    ? "border-primary bg-primary/5"
                    : "hover:border-primary/50"
                }`}
                onClick={() => toggleQuestion(question.id)}
              >
                <div className="flex items-start gap-3">
                  <Checkbox
                    checked={selectedQuestions.has(question.id)}
                    onCheckedChange={() => toggleQuestion(question.id)}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline">{getQuestionTypeLabel(question.questionType)}</Badge>
                      {getDifficultyBadge(question.difficultyLevel)}
                      {question.score && (
                        <Badge variant="secondary">{question.score} điểm</Badge>
                      )}
                    </div>
                    <p className="text-sm font-medium">{question.questionText}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {question.answers.length} đáp án
                    </p>
                  </div>
                  {selectedQuestions.has(question.id) && (
                    <Check className="h-5 w-5 text-primary shrink-0 mt-1" />
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 pt-3 border-t">
            <Button
              variant="outline"
              size="sm"
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
              size="sm"
              disabled={currentPage >= totalPages - 1}
              onClick={() => setCurrentPage(currentPage + 1)}
            >
              Sau
            </Button>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-3 border-t">
          <Button variant="outline" onClick={handleClose}>
            Hủy
          </Button>
          <Button onClick={handleConfirm} disabled={selectedQuestions.size === 0}>
            <Plus className="h-4 w-4 mr-1" />
            Thêm {selectedQuestions.size > 0 ? `${selectedQuestions.size} ` : ""}câu hỏi
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default QuestionSelector
