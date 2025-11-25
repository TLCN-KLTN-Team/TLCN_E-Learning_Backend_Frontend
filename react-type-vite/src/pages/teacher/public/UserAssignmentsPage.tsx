"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { 
  ArrowLeft, 
  FileText, 
  Calendar, 
  Clock,
  CheckCircle,
  XCircle,
  Link as LinkIcon,
  Award
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "react-toastify"
import teacherPublicApi, { type StudentAssignmentSubmission } from "@/services/api/teacher/teacherPublicApi"

const StudentAssignmentsPage: React.FC = () => {
  const { courseId, studentId } = useParams<{ courseId: string; studentId: string }>()
  const navigate = useNavigate()
  const [studentName, setStudentName] = useState<string>("")
  const [assignments, setAssignments] = useState<StudentAssignmentSubmission[]>([])
  const [loading, setLoading] = useState(true)
  const [gradingAssignment, setGradingAssignment] = useState<number | null>(null)
  const [tempScore, setTempScore] = useState<string>("")
  const [tempFeedback, setTempFeedback] = useState<string>("")

  useEffect(() => {
    const loadData = async () => {
      if (!courseId || !studentId) return

      try {
        setLoading(true)
        
        // Load assignment submissions from API
        const submissions = await teacherPublicApi.getStudentAssignments(Number(courseId), studentId)
        setAssignments(submissions)
        
        // Set student name from API response or fallback to studentId
        if (submissions.length > 0 && submissions[0].studentName) {
          setStudentName(submissions[0].studentName)
        } else {
          setStudentName(studentId)
        }
      } catch (error) {
        console.error("Error loading assignment submissions:", error)
        toast.error("Đã có lỗi khi tải dữ liệu bài tập")
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [courseId, studentId])

  const handleStartGrading = (assignmentId: number, currentScore: number | null, currentFeedback: string) => {
    setGradingAssignment(assignmentId)
    setTempScore(currentScore?.toString() || "")
    setTempFeedback(currentFeedback || "")
  }

  const handleSaveGrade = async (assignmentId: number) => {
    const score = parseFloat(tempScore)
    const assignment = assignments.find(a => a.submissionId === assignmentId)
    
    if (isNaN(score) || score < 0 || (assignment && score > assignment.maxScore)) {
      toast.error(`Điểm phải từ 0 đến ${assignment?.maxScore}`)
      return
    }

    try {
      // Call API to save grade
      const updatedSubmission = await teacherPublicApi.gradeAssignment(assignmentId, {
        score,
        feedback: tempFeedback
      })
      
      // Update local state
      setAssignments(prev => prev.map(a => 
        a.submissionId === assignmentId ? updatedSubmission : a
      ))
      
      setGradingAssignment(null)
      setTempScore("")
      setTempFeedback("")
      toast.success("Đã lưu điểm thành công")
    } catch (error) {
      console.error("Error saving grade:", error)
      toast.error("Đã có lỗi khi lưu điểm")
    }
  }

  const handleCancelGrading = () => {
    setGradingAssignment(null)
    setTempScore("")
    setTempFeedback("")
  }

  const gradedCount = assignments.filter(a => a.status === 'graded').length
  const pendingCount = assignments.filter(a => a.status === 'pending').length
  const averageScore = gradedCount > 0
    ? (assignments.filter(a => a.score !== null).reduce((sum, a) => sum + (a.score || 0), 0) / gradedCount).toFixed(1)
    : 0

  return (
    <div className="flex-1 overflow-auto">
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <Button
              variant="ghost"
              onClick={() => navigate(`/teacher/public-courses/${courseId}/students`)}
              className="mb-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Quay lại danh sách người dùng
            </Button>
            
            <h1 className="text-3xl font-bold mb-2 flex items-center text-foreground">
              <FileText className="mr-3 text-primary" size={32} />
              Bài tập của {studentName}
            </h1>
            <p className="text-muted-foreground text-lg">Chấm điểm và đánh giá bài tập</p>
          </div>

          {/* Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-card border border-border rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Tổng bài nộp</p>
                  <h3 className="text-2xl font-bold text-card-foreground">{assignments.length}</h3>
                </div>
                <FileText className="w-8 h-8 text-blue-500" />
              </div>
            </div>
            <div className="bg-card border border-border rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Đã chấm</p>
                  <h3 className="text-2xl font-bold text-card-foreground">{gradedCount}</h3>
                </div>
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
            </div>
            <div className="bg-card border border-border rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Chờ chấm</p>
                  <h3 className="text-2xl font-bold text-card-foreground">{pendingCount}</h3>
                </div>
                <XCircle className="w-8 h-8 text-orange-500" />
              </div>
            </div>
            <div className="bg-card border border-border rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Điểm TB</p>
                  <h3 className="text-2xl font-bold text-card-foreground">{averageScore}</h3>
                </div>
                <Award className="w-8 h-8 text-purple-500" />
              </div>
            </div>
          </div>

          {/* Assignments List */}
          {assignments.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="mx-auto text-muted-foreground mb-4" size={48} />
              <h3 className="text-lg font-medium text-foreground mb-2">Chưa có bài tập nào</h3>
              <p className="text-muted-foreground">Học viên chưa nộp bài tập nào</p>
            </div>
          ) : (
            <div className="space-y-6">
              {assignments.map((assignment) => (
                <div
                  key={assignment.submissionId}
                  className="bg-card border border-border rounded-lg p-6"
                >
                  {/* Assignment Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-card-foreground mb-2">
                        {assignment.assignmentTitle}
                      </h3>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 mr-1" />
                          Nộp: {new Date(assignment.submittedDate).toLocaleDateString('vi-VN')}
                        </div>
                        <div className="flex items-center">
                          <Clock className="w-4 h-4 mr-1" />
                          Hạn: {new Date(assignment.deadline).toLocaleDateString('vi-VN')}
                        </div>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          new Date(assignment.submittedDate) <= new Date(assignment.deadline)
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {new Date(assignment.submittedDate) <= new Date(assignment.deadline) ? 'Đúng hạn' : 'Trễ hạn'}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      {assignment.status === 'graded' ? (
                        <div>
                          <div className="text-3xl font-bold text-green-600 mb-1">
                            {assignment.score}/{assignment.maxScore}
                          </div>
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Đã chấm
                          </span>
                        </div>
                      ) : (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                          <Clock className="w-3 h-3 mr-1" />
                          Chờ chấm
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Assignment Content */}
                  <div className="mb-4">
                    <h4 className="font-medium text-card-foreground mb-2">Nội dung bài làm:</h4>
                    <div className="bg-muted rounded-lg p-4 text-sm text-muted-foreground">
                      {assignment.content}
                    </div>
                  </div>

                  {/* Files */}
                  {assignment.files.length > 0 && (
                    <div className="mb-4">
                      <h4 className="font-medium text-card-foreground mb-2">File đính kèm:</h4>
                      <div className="bg-green-100 border border-green-300 rounded-lg p-3 space-y-2">
                        {assignment.files.map((file, index) => (
                          <div key={index} className="flex items-center gap-2 text-sm text-gray-700">
                            <FileText className="w-4 h-4 text-green-600" />
                            <a href={file} target="_blank" rel="noopener noreferrer" className="hover:underline">
                              {file.split('/').pop() || `File ${index + 1}`}
                            </a>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Link */}
                  {assignment.link && (
                    <div className="mb-4">
                      <h4 className="font-medium text-card-foreground mb-2">Link bài làm:</h4>
                      <a
                        href={assignment.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700"
                      >
                        <LinkIcon className="w-4 h-4" />
                        {assignment.link}
                      </a>
                    </div>
                  )}

                  {/* Grading Section */}
                  {gradingAssignment === assignment.submissionId ? (
                    <div className="border-t pt-4 mt-4">
                      <h4 className="font-medium text-card-foreground mb-3">Chấm điểm:</h4>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-card-foreground mb-2">
                            Điểm (tối đa {assignment.maxScore})
                          </label>
                          <Input
                            type="number"
                            min="0"
                            max={assignment.maxScore}
                            step="0.5"
                            value={tempScore}
                            onChange={(e) => setTempScore(e.target.value)}
                            placeholder={`0 - ${assignment.maxScore}`}
                            className="max-w-xs"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-card-foreground mb-2">
                            Nhận xét
                          </label>
                          <Textarea
                            value={tempFeedback}
                            onChange={(e) => setTempFeedback(e.target.value)}
                            placeholder="Nhập nhận xét cho học viên..."
                            rows={4}
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button onClick={() => handleSaveGrade(assignment.submissionId)}>
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Lưu điểm
                          </Button>
                          <Button variant="outline" onClick={handleCancelGrading}>
                            Hủy
                          </Button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="border-t pt-4 mt-4">
                      {assignment.status === 'graded' && assignment.feedback && (
                        <div className="mb-4">
                          <h4 className="font-medium text-card-foreground mb-2">Nhận xét:</h4>
                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-900">
                            {assignment.feedback}
                          </div>
                        </div>
                      )}
                      <Button
                        onClick={() => handleStartGrading(assignment.submissionId, assignment.score, assignment.feedback)}
                        variant={assignment.status === 'graded' ? 'outline' : 'default'}
                      >
                        <Award className="w-4 h-4 mr-2" />
                        {assignment.status === 'graded' ? 'Chỉnh sửa điểm' : 'Chấm điểm'}
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

export default StudentAssignmentsPage
