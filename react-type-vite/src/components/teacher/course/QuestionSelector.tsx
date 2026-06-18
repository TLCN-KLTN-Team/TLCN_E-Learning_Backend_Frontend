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
import { getTeacherActiveClos, type CourseObjectiveResponse } from "@/services/api/teacher/courseObjectiveApi"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "react-toastify"

interface QuestionSelectorProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (questions: QuestionLibraryResponse[]) => void
  courseId?: number
}

const QuestionSelector: React.FC<QuestionSelectorProps> = ({
  isOpen,
  onClose,
  onSelect,
  courseId,
}) => {
  const [questions, setQuestions] = useState<QuestionLibraryResponse[]>([])
  const [selectedQuestions, setSelectedQuestions] = useState<Set<number>>(new Set())
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [questionType, setQuestionType] = useState<string>("")
  const [difficultyLevel, setDifficultyLevel] = useState<string>("")
  const [currentPage, setCurrentPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)

  const [tags, setTags] = useState("")
  const [availableTags, setAvailableTags] = useState<string[]>([])
  const [cloId, setCloId] = useState<string>("all")
  const [availableClos, setAvailableClos] = useState<CourseObjectiveResponse[]>([])

  useEffect(() => {
    const loadClos = async () => {
      if (courseId) {
        try {
          const clos = await getTeacherActiveClos()
          setAvailableClos(clos.filter(c => c.courseId === courseId))
        } catch (error) {
          console.error("Error loading CLOs:", error)
        }
      }
    }
    loadClos()
  }, [courseId])

  const fetchQuestions = async () => {
    try {
      setLoading(true)
      console.log('[QuestionSelector] Fetching questions with params:', {
        page: currentPage,
        size: 10,
        search: searchTerm || undefined,
        questionType: questionType === "all" ? undefined : (questionType || undefined),
        difficultyLevel: difficultyLevel === "all" ? undefined : (difficultyLevel || undefined),
        tags: tags === "all" ? undefined : (tags || undefined),
        courseId: courseId,
        cloId: cloId === "all" ? undefined : (cloId ? Number(cloId) : undefined),
      })

      const response = await getLibraryQuestions({
        page: currentPage,
        size: 10,
        search: searchTerm || undefined,
        questionType: questionType === "all" ? undefined : (questionType || undefined),
        difficultyLevel: difficultyLevel === "all" ? undefined : (difficultyLevel || undefined),
        tags: tags === "all" ? undefined : (tags || undefined),
        courseId: courseId,
        cloId: cloId === "all" ? undefined : (cloId ? Number(cloId) : undefined),
        sortBy: "id",
        sortDirection: "DESC",
      })

      console.log('[QuestionSelector] Received questions:', response)

      // Client-side filtering to ensure accuracy if backend is fuzzy
      let filteredQuestions = response.questions
      if (tags && tags !== "all") {
        filteredQuestions = response.questions.filter(q =>
          q.tags && q.tags.split(",").map(t => t.trim()).includes(tags)
        )
      }

      setQuestions(filteredQuestions)
      setTotalPages(response.totalPages)

      // Extract unique tags from original response (to keep list populated)
      const uniqueTags = new Set<string>()
      response.questions.forEach((q) => {
        if (q.tags) {
          q.tags.split(",").forEach((tag) => uniqueTags.add(tag.trim()))
        }
      })
      setAvailableTags(Array.from(uniqueTags).sort())
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
  }, [isOpen, currentPage, searchTerm, questionType, difficultyLevel, tags, cloId])

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

  const handleSelectAll = () => {
    const allIdsOnPage = questions.map((q) => q.id)
    const newSelected = new Set(selectedQuestions)
    const allSelected = allIdsOnPage.every((id) => newSelected.has(id))

    if (allSelected) {
      allIdsOnPage.forEach((id) => newSelected.delete(id))
    } else {
      allIdsOnPage.forEach((id) => newSelected.add(id))
    }
    setSelectedQuestions(newSelected)
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
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent
        className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col bg-white"
        style={{ zIndex: 10010 }}
      >
        <DialogHeader>
          <DialogTitle className="text-2xl">Chọn câu hỏi từ ngân hàng</DialogTitle>
          <DialogDescription>
            Chọn các câu hỏi có sẵn để thêm vào bài kiểm tra
          </DialogDescription>
        </DialogHeader>

        {/* Filters */}
        <div className="flex flex-col gap-4 py-4 border-b">
          {/* Row 1: Search */}
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Tìm kiếm câu hỏi..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full"
            />
          </div>

          {/* Row 2: Selects & Tag */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="min-w-0">
              <Select value={questionType} onValueChange={setQuestionType}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Loại câu hỏi" />
                </SelectTrigger>
                <SelectContent className="z-[10020] bg-white">
                  <SelectItem value="all">Tất cả</SelectItem>
                  <SelectItem value="MULTIPLE_CHOICE">Nhiều đáp án</SelectItem>
                  <SelectItem value="TRUE_FALSE">Đúng/Sai</SelectItem>
                  <SelectItem value="SINGLE_CHOICE">Một đáp án</SelectItem>
                  <SelectItem value="FILL_IN_THE_BLANK">Điền khuyết</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="min-w-0">
              <Select value={difficultyLevel} onValueChange={setDifficultyLevel}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Độ khó" />
                </SelectTrigger>
                <SelectContent className="z-[10020] bg-white">
                  <SelectItem value="all">Tất cả</SelectItem>
                  <SelectItem value="EASY">Dễ</SelectItem>
                  <SelectItem value="MEDIUM">Trung bình</SelectItem>
                  <SelectItem value="HARD">Khó</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="relative min-w-0">
              <Select value={tags} onValueChange={setTags}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Lọc theo tag" />
                </SelectTrigger>
                <SelectContent className="z-[10020] bg-white">
                  <SelectItem value="all">Tất cả</SelectItem>
                  {availableTags.map((tag) => (
                    <SelectItem key={tag} value={tag}>
                      {tag}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="relative min-w-0">
              <Select value={cloId} onValueChange={setCloId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Chuẩn đầu ra (CLO)" />
                </SelectTrigger>
                <SelectContent className="z-[10020] bg-white">
                  <SelectItem value="all">Tất cả CLO</SelectItem>
                  {availableClos.map((clo) => (
                    <SelectItem key={clo.id} value={String(clo.id)}>
                      {clo.code}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Select All Toolbar */}
        <div className="flex items-center justify-between px-4 py-2 bg-gray-50 border-b">
          <div className="flex items-center gap-2">
            <Checkbox
              id="select-all"
              checked={
                questions.length > 0 &&
                questions.every((q) => selectedQuestions.has(q.id))
              }
              onCheckedChange={handleSelectAll}
            />
            <label
              htmlFor="select-all"
              className="text-sm font-medium cursor-pointer select-none"
            >
              Chọn tất cả ({questions.length})
            </label>
          </div>
          <div className="text-sm text-muted-foreground">
            Đã chọn: <span className="font-semibold text-primary">{selectedQuestions.size}</span> câu hỏi
          </div>
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
                className={`border rounded-lg p-3 cursor-pointer transition-all ${selectedQuestions.has(question.id)
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
                      {question.tags && question.tags.split(",").map((tag, index) => (
                        <Badge key={index} variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                          {tag.trim()}
                        </Badge>
                      ))}
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
          <Button
            onClick={handleConfirm}
            disabled={selectedQuestions.size === 0}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Plus className="h-4 w-4 mr-1" />
            Thêm {selectedQuestions.size > 0 ? `${selectedQuestions.size} ` : ""}câu hỏi
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default QuestionSelector