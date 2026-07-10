"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import Modal from "@/components/ui/modal"
import { Upload, FileText, Download, CheckCircle2, XCircle, AlertCircle } from "lucide-react"
import { importQuestionsFromCsv } from "@/services/api/teacher/questionLibraryApi"
import { toast } from "react-toastify"
import { getTeacherActiveClos, type CourseObjectiveResponse } from "@/services/api/teacher/courseObjectiveApi"
import { Label } from "@/components/ui/label"

interface QuestionImportModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

const QuestionImportModal: React.FC<QuestionImportModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [result, setResult] = useState<{
    successCount: number
    errorCount: number
    errors: string[]
  } | null>(null)
  const [availableClos, setAvailableClos] = useState<CourseObjectiveResponse[]>([])
  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null)
  const [selectedCloId, setSelectedCloId] = useState<number | null>(null)

  useEffect(() => {
    if (!isOpen) return

    const loadClos = async () => {
      try {
        const clos = await getTeacherActiveClos()
        setAvailableClos(clos)

        if (clos.length > 0) {
          const firstCourseId = clos[0].courseId
          setSelectedCourseId(firstCourseId)

          const courseClos = clos.filter((item) => item.courseId === firstCourseId)
          if (courseClos.length > 0) {
            setSelectedCloId(courseClos[0].id)
          }
        }
      } catch (error) {
        console.error("Error loading CLOs:", error)
        toast.error("Không thể tải danh sách chuẩn đầu ra")
      }
    }

    loadClos()
  }, [isOpen])

  const availableCourses = Array.from(
    new Map(
      availableClos.map((item) => [item.courseId, {
        courseId: item.courseId,
        courseName: item.courseName || `Khóa học #${item.courseId}`,
      }])
    ).values()
  )

  const filteredClos = selectedCourseId
    ? availableClos.filter((item) => item.courseId === selectedCourseId)
    : []

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
      setResult(null)
    }
  }

  const handleUpload = async () => {
    if (!file) {
      toast.error("Vui lòng chọn file Excel")
      return
    }

    if (!selectedCourseId) {
      toast.error("Vui lòng chọn khóa học")
      return
    }

    if (!selectedCloId) {
      toast.error("Vui lòng chọn chuẩn đầu ra (CĐR)")
      return
    }

    try {
      setUploading(true)
      const response = await importQuestionsFromCsv(file, selectedCloId)

      setResult({
        successCount: response.successCount,
        errorCount: response.errorCount,
        errors: response.errors,
      })

      if (response.successCount > 0) {
        toast.success(`Đã import thành công ${response.successCount} câu hỏi`)
        onSuccess()
      }

      if (response.errorCount > 0) {
        toast.warning(`${response.errorCount} câu hỏi bị lỗi`)
      }

    } catch (error) {
      console.error("Error importing questions:", error)
      toast.error("Không thể import câu hỏi. Vui lòng kiểm tra định dạng file Excel")
    } finally {
      setUploading(false)
    }
  }

  const handleDownloadTemplate = async () => {
    try {
      // Dynamically import ExcelJS
      const ExcelJS = (await import("exceljs")).default

      // Create workbook and worksheet
      const workbook = new ExcelJS.Workbook()
      const worksheet = workbook.addWorksheet("Questions")

      // Define columns
      worksheet.columns = [
        { header: "questionText", key: "questionText", width: 50 },
        { header: "questionType", key: "questionType", width: 20 },
        { header: "score", key: "score", width: 10 },
        { header: "difficultyLevel", key: "difficultyLevel", width: 15 },
        { header: "tags", key: "tags", width: 30 },
        { header: "answer1", key: "answer1", width: 40 },
        { header: "isCorrect1", key: "isCorrect1", width: 12 },
        { header: "answer2", key: "answer2", width: 40 },
        { header: "isCorrect2", key: "isCorrect2", width: 12 },
        { header: "answer3", key: "answer3", width: 40 },
        { header: "isCorrect3", key: "isCorrect3", width: 12 },
        { header: "answer4", key: "answer4", width: 40 },
        { header: "isCorrect4", key: "isCorrect4", width: 12 },
      ]

      // Style header row
      worksheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } }
      worksheet.getRow(1).fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF4472C4" },
      }
      worksheet.getRow(1).alignment = { vertical: "middle", horizontal: "center" }

      // Add sample data
      const sampleData = [
        {
          questionText: "Thủ đô của Việt Nam là gì?",
          questionType: "SINGLE_CHOICE",
          score: 1,
          difficultyLevel: "EASY",
          tags: "Địa lý,Cơ bản",
          answer1: "Hà Nội",
          isCorrect1: true,
          answer2: "Hồ Chí Minh",
          isCorrect2: false,
          answer3: "Đà Nẵng",
          isCorrect3: false,
          answer4: "Cần Thơ",
          isCorrect4: false,
        },
        {
          questionText: "Python là ngôn ngữ lập trình hướng đối tượng",
          questionType: "TRUE_FALSE",
          score: 0.5,
          difficultyLevel: "EASY",
          tags: "Lập trình,Python",
          answer1: "Đúng",
          isCorrect1: true,
          answer2: "Sai",
          isCorrect2: false,
          answer3: "",
          isCorrect3: "",
          answer4: "",
          isCorrect4: "",
        },
        {
          questionText: "Những ngôn ngữ nào sau đây là Backend?",
          questionType: "MULTIPLE_CHOICE",
          score: 2,
          difficultyLevel: "MEDIUM",
          tags: "Lập trình,Backend",
          answer1: "Java",
          isCorrect1: true,
          answer2: "Python",
          isCorrect2: true,
          answer3: "HTML",
          isCorrect3: false,
          answer4: "CSS",
          isCorrect4: false,
        },
        {
          questionText: "Framework nào được sử dụng cho React?",
          questionType: "SINGLE_CHOICE",
          score: 1,
          difficultyLevel: "MEDIUM",
          tags: "Frontend,React",
          answer1: "Next.js",
          isCorrect1: true,
          answer2: "Django",
          isCorrect2: false,
          answer3: "Spring Boot",
          isCorrect3: false,
          answer4: "Laravel",
          isCorrect4: false,
        },
        {
          questionText: "Ngôn ngữ lập trình [___1___] được sử dụng để phát triển Android",
          questionType: "FILL_IN_THE_BLANK",
          score: 1,
          difficultyLevel: "EASY",
          tags: "Lập trình,Android",
          answer1: "Kotlin",
          isCorrect1: true,
          answer2: "Java",
          isCorrect2: true,
          answer3: "",
          isCorrect3: "",
          answer4: "",
          isCorrect4: "",
        },
      ]

      worksheet.addRows(sampleData)

      // Auto-fit rows
      worksheet.eachRow((row) => {
        row.height = 20
      })

      // Generate Excel file
      const buffer = await workbook.xlsx.writeBuffer()
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      })

      // Download file
      const link = document.createElement("a")
      const url = URL.createObjectURL(blob)
      link.setAttribute("href", url)
      link.setAttribute("download", "question_import_template.xlsx")
      link.style.visibility = "hidden"
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (error) {
      console.error("Error creating Excel template:", error)
      toast.error("Không thể tải file mẫu")
    }
  }

  const handleClose = () => {
    setFile(null)
    setResult(null)
    setSelectedCourseId(null)
    setSelectedCloId(null)
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} maxWidth="max-w-3xl">
      <div className="max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Upload className="h-6 w-6 text-blue-600" />
                Import Câu Hỏi từ File Excel
              </h2>
              <p className="text-gray-600 mt-1">
                Tải lên file Excel (.xlsx) để import nhiều câu hỏi cùng lúc
              </p>
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Hướng dẫn định dạng file Excel
            </h3>
            <ul className="text-sm text-blue-800 space-y-1 ml-6 list-disc">
              <li>File Excel (.xlsx) phải có header: questionText | questionType | score | difficultyLevel | tags | answer1 | isCorrect1 | answer2 | isCorrect2 | ...</li>
              <li><strong>questionType:</strong> SINGLE_CHOICE, MULTIPLE_CHOICE, TRUE_FALSE, FILL_IN_THE_BLANK</li>
              <li><strong>difficultyLevel:</strong> EASY, MEDIUM, HARD</li>
              <li><strong>tags:</strong> Các tag cách nhau bởi dấu phẩy</li>
              <li><strong>Đáp án:</strong> Mỗi đáp án cần 2 cột (nội dung và đúng/sai). Ví dụ: answer1 | isCorrect1 (true/false hoặc 1/0)</li>
              <li><strong>Điền khuyết:</strong> Đánh dấu chỗ trống bằng _____ hoặc [blank]. Tất cả đáp án đều set isCorrect = true</li>
              <li>Mỗi dòng trong Excel tương ứng với 1 câu hỏi</li>
            </ul>
          </div>

          {/* Download Template Button */}
          <div className="mb-6">
            <Button
              variant="outline"
              onClick={handleDownloadTemplate}
              className="w-full border-green-600 text-green-600 hover:bg-green-50"
            >
              <Download className="h-4 w-4 mr-2" />
              Tải File Mẫu Excel (.xlsx)
            </Button>
          </div>

          {/* Course and CLO Selection */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6 space-y-4">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2 text-sm">
              <FileText className="h-4 w-4 text-blue-600" />
              Chọn chuẩn đầu ra áp dụng cho các câu hỏi import
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="courseSelect" className="flex items-center text-sm font-medium text-gray-700">
                  Khóa học <span className="text-red-500 ml-1">*</span>
                </Label>
                <select
                  id="courseSelect"
                  value={selectedCourseId ? String(selectedCourseId) : ""}
                  onChange={(e) => {
                    const nextCourseId = e.target.value ? Number(e.target.value) : null
                    setSelectedCourseId(nextCourseId)

                    if (nextCourseId) {
                      const courseClos = availableClos.filter((item) => item.courseId === nextCourseId)
                      if (courseClos.length > 0) {
                        setSelectedCloId(courseClos[0].id)
                      } else {
                        setSelectedCloId(null)
                      }
                    } else {
                      setSelectedCloId(null)
                    }
                  }}
                  className="w-full bg-white border border-gray-300 rounded-lg p-2 text-sm focus:border-blue-500 focus:outline-none transition-colors"
                >
                  <option value="">Chọn khóa học</option>
                  {availableCourses.map((course) => (
                    <option key={course.courseId} value={String(course.courseId)}>
                      {course.courseName}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="cloSelect" className="flex items-center text-sm font-medium text-gray-700">
                  CĐR đánh giá <span className="text-red-500 ml-1">*</span>
                </Label>
                <select
                  id="cloSelect"
                  value={selectedCloId ? String(selectedCloId) : ""}
                  onChange={(e) => setSelectedCloId(e.target.value ? Number(e.target.value) : null)}
                  disabled={!selectedCourseId}
                  className="w-full bg-white border border-gray-300 rounded-lg p-2 text-sm focus:border-blue-500 focus:outline-none transition-colors disabled:bg-gray-100 disabled:text-gray-400"
                >
                  <option value="">{selectedCourseId ? "Chọn CĐR" : "Vui lòng chọn khóa học trước"}</option>
                  {filteredClos.map((clo) => (
                    <option key={clo.id} value={String(clo.id)}>
                      {clo.code} - {clo.description || (clo.courseName || `Khóa học #${clo.courseId}`)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* File Upload */}
          <div className="mb-6">
            <label
              htmlFor="csv-upload"
              className="block w-full border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition"
            >
              <input
                id="csv-upload"
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileChange}
                className="hidden"
              />
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              {file ? (
                <div>
                  <p className="text-blue-600 font-medium">{file.name}</p>
                  <p className="text-sm text-gray-500 mt-1">
                    {(file.size / 1024).toFixed(2)} KB
                  </p>
                </div>
              ) : (
                <div>
                  <p className="text-gray-600 font-medium">Click để chọn file Excel</p>
                  <p className="text-sm text-gray-500 mt-1">
                    Hoặc kéo thả file vào đây
                  </p>
                </div>
              )}
            </label>
          </div>

          {/* Import Result */}
          {result && (
            <div className="mb-6 space-y-3">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center gap-2 text-green-800">
                  <CheckCircle2 className="h-5 w-5" />
                  <span className="font-semibold">
                    Thành công: {result.successCount} câu hỏi
                  </span>
                </div>
              </div>

              {result.errorCount > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-red-800 mb-2">
                    <XCircle className="h-5 w-5" />
                    <span className="font-semibold">
                      Lỗi: {result.errorCount} câu hỏi
                    </span>
                  </div>
                  <div className="max-h-40 overflow-y-auto">
                    {result.errors.map((error, index) => (
                      <p key={index} className="text-sm text-red-700 ml-7">
                        • {error}
                      </p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={handleClose}>
              Đóng
            </Button>
            <Button
              onClick={handleUpload}
              disabled={!file || uploading || !selectedCloId}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {uploading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Đang import...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Import Câu Hỏi
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  )
}

export default QuestionImportModal
