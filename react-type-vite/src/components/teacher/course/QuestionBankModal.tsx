"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Plus, Trash2, Save, X, FileQuestion, CheckSquare, Tag, Hash, Edit, Upload, Image as ImageIcon } from "lucide-react"
import {
  createLibraryQuestion,
  updateLibraryQuestion,
  type QuestionLibraryResponse,
  type QuestionLibraryRequest,
  type AnswerRequest,
} from "@/services/api/teacher/questionLibraryApi"
import { toast } from "react-toastify"
import { Checkbox } from "@/components/ui/checkbox"

interface QuestionBankModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  question?: QuestionLibraryResponse
  educationalUnitId?: number
}

const QuestionBankModal: React.FC<QuestionBankModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  question,
  educationalUnitId,
}) => {
  const [formData, setFormData] = useState<QuestionLibraryRequest>({
    questionText: "",
    questionType: "MULTIPLE_CHOICE",
    score: 1,
    difficultyLevel: "MEDIUM",
    tags: "",
    educationalUnitId,
    answers: [
      { content: "", isCorrect: false },
      { content: "", isCorrect: false },
    ],
  })
  const [loading, setLoading] = useState(false)
  const [imageFiles, setImageFiles] = useState<File[]>([]) // Store File objects
  const [imagePreviews, setImagePreviews] = useState<string[]>([]) // Store preview URLs

  useEffect(() => {
    if (question) {
      setFormData({
        questionText: question.questionText,
        questionType: question.questionType,
        score: question.score || 1,
        difficultyLevel: question.difficultyLevel || "MEDIUM",
        tags: question.tags || "",
        educationalUnitId: question.educationalUnitId,
        answers: question.answers.map((a) => ({
          content: a.content,
          isCorrect: a.isCorrect,
        })),
      })
    } else {
      setFormData({
        questionText: "",
        questionType: "MULTIPLE_CHOICE",
        score: 1,
        difficultyLevel: "MEDIUM",
        tags: "",
        educationalUnitId,
        answers: [
          { content: "", isCorrect: false },
          { content: "", isCorrect: false },
        ],
      })
    }
  }, [question, isOpen, educationalUnitId])

  // Create preview URLs from File objects
  useEffect(() => {
    const previews = imageFiles.map(file => URL.createObjectURL(file))
    setImagePreviews(previews)

    // Cleanup URLs on unmount
    return () => {
      previews.forEach(url => URL.revokeObjectURL(url))
    }
  }, [imageFiles])

  // Update answers when question type changes
  useEffect(() => {
    if (!question) { // Only auto-adjust for new questions
      if (formData.questionType === 'TRUE_FALSE') {
        setFormData(prev => ({
          ...prev,
          answers: [
            { content: 'Đúng', isCorrect: true },
            { content: 'Sai', isCorrect: false }
          ]
        }))
      } else if ((formData.questionType === 'MULTIPLE_CHOICE' || formData.questionType === 'SINGLE_CHOICE') && formData.answers.length < 2) {
        setFormData(prev => ({
          ...prev,
          answers: [
            { content: '', isCorrect: false },
            { content: '', isCorrect: false }
          ]
        }))
      }
    }
  }, [formData.questionType, question])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validation
    if (!formData.questionText.trim()) {
      toast.error("Vui lòng nhập nội dung câu hỏi")
      return
    }

    // Validate answers only for question types that need them
    if (formData.questionType === 'MULTIPLE_CHOICE' || formData.questionType === 'SINGLE_CHOICE' || formData.questionType === 'SINGLE_CHOICE' || formData.questionType === 'TRUE_FALSE' || formData.questionType === 'FILL_IN_THE_BLANK') {
      if (formData.answers.length < 2) {
        toast.error("Câu hỏi phải có ít nhất 2 đáp án")
        return
      }

      const hasCorrectAnswer = formData.answers.some((a) => a.isCorrect)
      if (!hasCorrectAnswer) {
        toast.error("Phải có ít nhất 1 đáp án đúng")
        return
      }

      const emptyAnswers = formData.answers.filter((a) => !a.content.trim())
      if (emptyAnswers.length > 0) {
        toast.error("Tất cả đáp án phải có nội dung")
        return
      }
    }

    try {
      setLoading(true)

      // Add orderIndex to answers based on array position
      const formDataWithOrder = {
        ...formData,
        // Only include tags if it has content
        tags: formData.tags?.trim() || undefined,
        answers: formData.answers.map((answer, index) => ({
          ...answer,
          orderIndex: index
        }))
      }

      console.log("Sending question data:", formDataWithOrder)

      if (question) {
        await updateLibraryQuestion(question.id, formDataWithOrder, imageFiles.length > 0 ? imageFiles : undefined)
        toast.success("Cập nhật câu hỏi thành công")
      } else {
        await createLibraryQuestion(formDataWithOrder, imageFiles.length > 0 ? imageFiles : undefined)
        toast.success("Tạo câu hỏi thành công")
      }

      onSuccess()
      onClose()
    } catch (error: any) {
      console.error("Error saving question:", error)
      const errorMessage = error?.response?.data?.message || error?.message || ""

      if (errorMessage.includes("foreign key constraint fails") || errorMessage.includes("Cannot delete or update a parent row")) {
        toast.error("Không thể sửa đáp án vì câu hỏi này đã có người làm bài. Vui lòng tạo câu hỏi mới.")
      } else {
        toast.error("Có lỗi xảy ra khi lưu câu hỏi")
      }
    } finally {
      setLoading(false)
    }
  }

  const addAnswer = () => {
    setFormData({
      ...formData,
      answers: [...formData.answers, { content: "", isCorrect: false }],
    })
  }

  const removeAnswer = (index: number) => {
    if (formData.answers.length <= 2) {
      toast.warning("Câu hỏi phải có ít nhất 2 đáp án")
      return
    }
    setFormData({
      ...formData,
      answers: formData.answers.filter((_, i) => i !== index),
    })
  }

  const updateAnswer = (index: number, field: keyof AnswerRequest, value: string | boolean) => {
    const newAnswers = [...formData.answers]
    newAnswers[index] = { ...newAnswers[index], [field]: value }
    setFormData({ ...formData, answers: newAnswers })
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    const file = files[0]

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Chỉ chấp nhận file ảnh')
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Kích thước ảnh không được vượt quá 5MB')
      return
    }

    setImageFiles(prev => [...prev, file])
    toast.success('Đã thêm ảnh')
    e.target.value = '' // Reset input
  }

  const removeImage = (index: number, isExisting: boolean) => {
    if (isExisting) {
      // Remove from attachments (existing URLs)
      setFormData(prev => ({
        ...prev,
        attachments: prev.attachments?.filter((_, i) => i !== index) || []
      }))
    } else {
      // Remove from new files
      const adjustedIndex = index - (formData.attachments?.length || 0)
      setImageFiles(prev => prev.filter((_, i) => i !== adjustedIndex))
    }
    toast.success('Đã xóa ảnh')
  }

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  if (!isOpen) return null

  const isEditMode = Boolean(question)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={handleBackdropClick}
      ></div>

      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className={`${isEditMode ? 'bg-gradient-to-r from-orange-600 to-orange-700' : 'bg-gradient-to-r from-blue-600 to-blue-700'} px-6 py-4`}>
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                {isEditMode ? <Edit className="w-5 h-5 text-white" /> : <FileQuestion className="w-5 h-5 text-white" />}
              </div>
              <h2 className="text-xl font-bold text-white">
                {isEditMode ? 'Chỉnh Sửa Câu Hỏi' : 'Tạo Câu Hỏi Mới'}
              </h2>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-white hover:bg-white/20 h-8 w-8 p-0"
            >
              <X size={18} />
            </Button>
          </div>
          <p className={`${isEditMode ? 'text-orange-100' : 'text-blue-100'} text-sm mt-2`}>
            {isEditMode ? 'Cập nhật thông tin câu hỏi trong ngân hàng' : 'Thêm câu hỏi mới vào ngân hàng để tái sử dụng'}
          </p>
        </div>

        {/* Form Content */}
        <div className="flex flex-col h-[calc(90vh-120px)]">
          <div className="flex-1 p-6 overflow-y-auto">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Question Text */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center">
                  <FileQuestion size={16} className="mr-2" />
                  Nội Dung Câu Hỏi
                </h3>
                <div className="space-y-2">
                  <Label htmlFor="questionText" className="flex items-center text-sm font-medium text-gray-700">
                    Câu hỏi <span className="text-red-500 ml-1">*</span>
                  </Label>
                  <Textarea
                    id="questionText"
                    value={formData.questionText}
                    onChange={(e) => setFormData({ ...formData, questionText: e.target.value })}
                    placeholder="Nhập nội dung câu hỏi..."
                    rows={4}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none transition-colors bg-white"
                  />
                </div>

                {/* Image Attachments */}
                <div className="space-y-2 mt-4">
                  <Label className="flex items-center text-sm font-medium text-gray-700">
                    <ImageIcon size={14} className="mr-2" />
                    Ảnh minh họa (Tùy chọn)
                  </Label>

                  {/* Upload Button */}
                  <div className="flex items-center gap-2">
                    <label className="cursor-pointer">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                      <div className="flex items-center gap-2 px-4 py-2 bg-white border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors">
                        <Upload size={16} className="text-gray-600" />
                        <span className="text-sm text-gray-600">Tải ảnh lên</span>
                      </div>
                    </label>
                    <span className="text-xs text-gray-500">Tối đa 5MB</span>
                  </div>

                  {/* Image Preview Grid */}
                  {((formData.attachments && formData.attachments.length > 0) || imagePreviews.length > 0) && (
                    <div className="grid grid-cols-3 gap-2 mt-3">
                      {/* Existing attachments from backend */}
                      {formData.attachments?.map((url, index) => (
                        <div key={`existing-${index}`} className="relative group">
                          <img
                            src={url}
                            alt={`Attachment ${index + 1}`}
                            className="w-full h-24 object-cover rounded-lg border-2 border-gray-200"
                          />
                          <button
                            type="button"
                            onClick={() => removeImage(index, true)}
                            className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center hover:bg-red-600"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ))}

                      {/* New images to be uploaded */}
                      {imagePreviews.map((preview, index) => (
                        <div key={`new-${index}`} className="relative group">
                          <img
                            src={preview}
                            alt={`New image ${index + 1}`}
                            className="w-full h-24 object-cover rounded-lg border-2 border-green-300"
                          />
                          <div className="absolute top-1 left-1 px-2 py-0.5 bg-green-500 text-white text-xs rounded">
                            Mới
                          </div>
                          <button
                            type="button"
                            onClick={() => removeImage((formData.attachments?.length || 0) + index, false)}
                            className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center hover:bg-red-600"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Question Type & Difficulty */}
              <div className="bg-blue-50 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center">
                  <CheckSquare size={16} className="mr-2" />
                  Phân Loại
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="questionType" className="flex items-center text-sm font-medium text-gray-700">
                      <CheckSquare size={14} className="mr-2 text-blue-600" />
                      Loại câu hỏi <span className="text-red-500 ml-1">*</span>
                    </Label>
                    <Select
                      value={formData.questionType}
                      onValueChange={(value) => setFormData({ ...formData, questionType: value })}
                    >
                      <SelectTrigger id="questionType" className="w-full bg-white border-gray-300 focus:border-blue-500">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-white">
                        <SelectItem value="SINGLE_CHOICE">Một đáp án</SelectItem>
                        <SelectItem value="MULTIPLE_CHOICE">Nhiều đáp án</SelectItem>
                        <SelectItem value="TRUE_FALSE">Đúng/Sai</SelectItem>
                        <SelectItem value="FILL_IN_THE_BLANK">Điền khuyết (Kéo thả)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="difficultyLevel" className="flex items-center text-sm font-medium text-gray-700">
                      <Hash size={14} className="mr-2 text-blue-600" />
                      Độ khó <span className="text-red-500 ml-1">*</span>
                    </Label>
                    <Select
                      value={formData.difficultyLevel}
                      onValueChange={(value) => setFormData({ ...formData, difficultyLevel: value })}
                    >
                      <SelectTrigger id="difficultyLevel" className="w-full bg-white border-gray-300 focus:border-blue-500">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-white">
                        <SelectItem value="EASY">Dễ</SelectItem>
                        <SelectItem value="MEDIUM">Trung bình</SelectItem>
                        <SelectItem value="HARD">Khó</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Score & Tags */}
              <div className="bg-purple-50 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center">
                  <Tag size={16} className="mr-2" />
                  Thông Tin Bổ Sung
                  <span className="text-gray-400 ml-2 text-xs">(Tùy chọn)</span>
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="score" className="flex items-center text-sm font-medium text-gray-700">
                      <Hash size={14} className="mr-2 text-purple-600" />
                      Điểm số
                    </Label>
                    <Input
                      id="score"
                      type="number"
                      min={0}
                      step={0.5}
                      value={formData.score}
                      onChange={(e) => setFormData({ ...formData, score: Number(e.target.value) })}
                      className="w-full border-gray-300 focus:border-purple-500"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="tags" className="flex items-center text-sm font-medium text-gray-700">
                      <Tag size={14} className="mr-2 text-purple-600" />
                      Tags (phân cách bằng dấu phẩy)
                    </Label>
                    <Input
                      id="tags"
                      value={formData.tags}
                      onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                      placeholder="VD: toán học, đại số, bậc 2"
                      className="w-full border-gray-300 focus:border-purple-500"
                    />
                  </div>
                </div>
              </div>

              {/* Answers - Dynamic based on question type */}
              {formData.questionType === 'SINGLE_CHOICE' && (
                <div className="bg-green-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold text-gray-700 flex items-center">
                      <CheckSquare size={16} className="mr-2" />
                      Đáp Án <span className="text-red-500 ml-1">*</span>
                    </h3>
                    <Button
                      type="button"
                      onClick={addAnswer}
                      size="sm"
                      variant="outline"
                      className="gap-1 bg-white hover:bg-green-100 border-green-300"
                    >
                      <Plus className="h-4 w-4" />
                      Thêm đáp án
                    </Button>
                  </div>

                  <div className="space-y-3">
                    {formData.answers.map((answer, index) => (
                      <div
                        key={index}
                        className={`flex items-center gap-3 p-3 bg-white border-2 rounded-lg transition-all cursor-pointer ${answer.isCorrect
                            ? 'border-green-500 bg-green-50'
                            : 'border-gray-200 hover:border-green-300'
                          }`}
                        onClick={() => {
                          // Set this as correct and others as incorrect (single choice)
                          const newAnswers = formData.answers.map((a, i) => ({
                            ...a,
                            isCorrect: i === index
                          }))
                          setFormData({ ...formData, answers: newAnswers })
                        }}
                      >
                        <div className="flex items-center gap-3 flex-1">
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${answer.isCorrect
                              ? 'border-green-500 bg-green-500'
                              : 'border-gray-300'
                            }`}>
                            {answer.isCorrect && (
                              <div className="w-2.5 h-2.5 bg-white rounded-full" />
                            )}
                          </div>
                          <span className="text-sm font-medium text-gray-600 min-w-[20px]">
                            {index + 1}
                          </span>
                          <div className="flex-1">
                            <Input
                              value={answer.content}
                              onChange={(e) => {
                                e.stopPropagation()
                                updateAnswer(index, "content", e.target.value)
                              }}
                              onClick={(e) => e.stopPropagation()}
                              placeholder={`Đáp án ${index + 1}`}
                              required
                              className="border-none shadow-none focus-visible:ring-0 px-2"
                            />
                          </div>
                        </div>
                        {formData.answers.length > 2 && (
                          <Button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              removeAnswer(index)
                            }}
                            size="sm"
                            variant="ghost"
                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-gray-600 mt-3">
                    Click vào đáp án để chọn đáp án đúng (chỉ được chọn 1)
                  </p>
                </div>
              )}

              {formData.questionType === 'MULTIPLE_CHOICE' && (
                <div className="bg-green-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold text-gray-700 flex items-center">
                      <CheckSquare size={16} className="mr-2" />
                      Đáp Án <span className="text-red-500 ml-1">*</span>
                    </h3>
                    <Button
                      type="button"
                      onClick={addAnswer}
                      size="sm"
                      variant="outline"
                      className="gap-1 bg-white hover:bg-green-100 border-green-300"
                    >
                      <Plus className="h-4 w-4" />
                      Thêm đáp án
                    </Button>
                  </div>

                  <div className="space-y-3">
                    {formData.answers.map((answer, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-3 p-3 bg-white border-2 border-gray-200 rounded-lg hover:border-green-300 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <Checkbox
                            checked={answer.isCorrect}
                            onCheckedChange={(checked) =>
                              updateAnswer(index, "isCorrect", checked as boolean)
                            }
                            className="w-5 h-5"
                          />
                          <span className="text-sm font-medium text-gray-600 min-w-[20px]">
                            {index + 1}
                          </span>
                        </div>
                        <div className="flex-1">
                          <Input
                            value={answer.content}
                            onChange={(e) => updateAnswer(index, "content", e.target.value)}
                            placeholder={`Đáp án ${index + 1}`}
                            required
                            className="border-none shadow-none focus-visible:ring-0 px-2"
                          />
                        </div>
                        {formData.answers.length > 2 && (
                          <Button
                            type="button"
                            onClick={() => removeAnswer(index)}
                            size="sm"
                            variant="ghost"
                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-gray-600 mt-3 flex items-center gap-2">
                    <span className="inline-flex w-4 h-4 border-2 border-gray-400 rounded items-center justify-center">
                      <CheckSquare size={12} className="text-gray-400" />
                    </span>
                    Chọn checkbox để đánh dấu đáp án đúng (có thể chọn nhiều)
                  </p>
                </div>
              )}

              {formData.questionType === 'TRUE_FALSE' && (
                <div className="bg-green-50 rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center">
                    <CheckSquare size={16} className="mr-2" />
                    Đáp Án <span className="text-red-500 ml-1">*</span>
                  </h3>
                  <div className="space-y-3">
                    {formData.answers.map((answer, index) => (
                      <div
                        key={index}
                        className={`flex items-center gap-3 p-4 bg-white border-2 rounded-lg transition-all cursor-pointer ${answer.isCorrect
                            ? 'border-green-500 bg-green-50'
                            : 'border-gray-200 hover:border-green-300'
                          }`}
                        onClick={() => {
                          // Set this as correct and others as incorrect
                          const newAnswers = formData.answers.map((a, i) => ({
                            ...a,
                            isCorrect: i === index
                          }))
                          setFormData({ ...formData, answers: newAnswers })
                        }}
                      >
                        <div className="flex items-center gap-3 flex-1">
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${answer.isCorrect
                              ? 'border-green-500 bg-green-500'
                              : 'border-gray-300'
                            }`}>
                            {answer.isCorrect && (
                              <CheckSquare size={14} className="text-white" />
                            )}
                          </div>
                          <span className="text-base font-medium text-gray-700">
                            {answer.content}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-gray-600 mt-3">
                    Chọn đáp án đúng (chỉ được chọn 1)
                  </p>
                </div>
              )}

              {formData.questionType === 'FILL_IN_THE_BLANK' && (
                <div className="bg-green-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold text-gray-700 flex items-center">
                      <CheckSquare size={16} className="mr-2" />
                      Đáp án kéo thả <span className="text-red-500 ml-1">*</span>
                    </h3>
                    <Button
                      type="button"
                      onClick={addAnswer}
                      size="sm"
                      variant="outline"
                      className="gap-1 bg-white hover:bg-green-100 border-green-300"
                    >
                      <Plus className="h-4 w-4" />
                      Thêm đáp án
                    </Button>
                  </div>

                  <div className="bg-blue-50 border border-blue-300 rounded-lg p-3 mb-4">
                    <p className="text-xs text-blue-800 font-semibold mb-2">💡 Hướng dẫn sử dụng:</p>
                    <ul className="text-xs text-blue-700 space-y-1 ml-4">
                      <li>• Trong nội dung câu hỏi, dùng <code className="bg-blue-200 px-1 rounded">[___1___]</code>, <code className="bg-blue-200 px-1 rounded">[___2___]</code> để đánh dấu chỗ trống</li>
                      <li>• Đánh dấu ✓ cho đáp án đúng của mỗi chỗ trống</li>
                      <li>• Học sinh sẽ kéo thả đáp án vào vị trí tương ứng</li>
                    </ul>
                  </div>

                  <div className="space-y-3">
                    {formData.answers.map((answer, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-3 p-3 bg-white border-2 border-gray-200 rounded-lg hover:border-green-300 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <Checkbox
                            checked={answer.isCorrect}
                            onCheckedChange={(checked) =>
                              updateAnswer(index, "isCorrect", checked as boolean)
                            }
                            className="w-5 h-5"
                          />
                          <span className="text-sm font-medium text-gray-600 bg-green-100 px-2 py-1 rounded">
                            Đáp án {index + 1}
                          </span>
                        </div>
                        <div className="flex-1">
                          <Input
                            value={answer.content}
                            onChange={(e) => updateAnswer(index, "content", e.target.value)}
                            placeholder={`Nội dung đáp án ${index + 1}`}
                            required
                            className="border-none shadow-none focus-visible:ring-0 px-2"
                          />
                        </div>
                        {formData.answers.length > 2 && (
                          <Button
                            type="button"
                            onClick={() => removeAnswer(index)}
                            size="sm"
                            variant="ghost"
                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-gray-600 mt-3 flex items-center gap-2">
                    <span className="inline-flex w-4 h-4 border-2 border-gray-400 rounded items-center justify-center">
                      <CheckSquare size={12} className="text-gray-400" />
                    </span>
                    Đánh dấu ✓ cho đáp án đúng - học sinh sẽ kéo thả vào chỗ trống
                  </p>
                </div>
              )}
            </form>
          </div>

          {/* Footer */}
          <div className="border-t bg-gray-50 px-6 py-4 mt-auto">
            <div className="flex justify-end space-x-3">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="px-6 py-2 border-gray-300 text-gray-700 hover:bg-gray-100 transition-colors"
                disabled={loading}
              >
                Hủy
              </Button>
              <Button
                type="submit"
                disabled={loading}
                onClick={handleSubmit}
                className={`px-6 py-2 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${isEditMode
                    ? 'bg-orange-600 hover:bg-orange-700'
                    : 'bg-blue-600 hover:bg-blue-700'
                  }`}
              >
                {loading ? (
                  <div className="flex items-center">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    {isEditMode ? 'Đang cập nhật...' : 'Đang tạo...'}
                  </div>
                ) : (
                  <div className="flex items-center">
                    {isEditMode ? <Edit size={16} className="mr-2" /> : <Save size={16} className="mr-2" />}
                    {isEditMode ? 'Cập Nhật Câu Hỏi' : 'Tạo Câu Hỏi'}
                  </div>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default QuestionBankModal
