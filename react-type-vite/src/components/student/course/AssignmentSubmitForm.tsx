"use client"

import type React from "react"
import { useState } from "react"
import {
  X,
  Upload,
  Link as LinkIcon,
  FileText,
  Loader2,
  Trash2,
  AlertCircle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import Modal from "@/components/ui/modal"
import assignmentApi from "@/services/api/student/assignmentApi"
import type { AssignmentDetailResponse } from "@/services/api/response/assignmentDetailResponse"
import type { AssignmentSubmissionResponse } from "@/services/api/response/assignmentSubmissionResponse"

interface AssignmentSubmitFormProps {
  assignment: AssignmentDetailResponse
  existingSubmission?: AssignmentSubmissionResponse | null
  onClose: () => void
  onSuccess: () => void
}

const AssignmentSubmitForm: React.FC<AssignmentSubmitFormProps> = ({
  assignment,
  existingSubmission,
  onClose,
  onSuccess,
}) => {
  const [submissionText, setSubmissionText] = useState(existingSubmission?.submissionText || "")
  const [submissionLink, setSubmissionLink] = useState(existingSubmission?.submissionLink || "")
  
  // Store File objects for new uploads
  const [newFiles, setNewFiles] = useState<File[]>([])
  
  // Store existing file URLs (for updates)
  const [existingFiles, setExistingFiles] = useState<string[]>(
    existingSubmission?.submissionFiles || []
  )
  
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const canSubmitText = ["TEXT", "BOTH"].includes(assignment.submissionType)
  const canSubmitFile = ["UPLOAD_FILE", "BOTH"].includes(assignment.submissionType)
  const canSubmitLink = ["LINK", "BOTH"].includes(assignment.submissionType)

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) return

    setError(null)

    try {
      const fileArray = Array.from(files)
      
      // Validate file sizes
      const maxSize = 10 * 1024 * 1024 // 10MB
      for (const file of fileArray) {
        if (file.size > maxSize) {
          throw new Error(`File "${file.name}" quá lớn. Kích thước tối đa là 10MB.`)
        }
      }

      // Add to new files array
      setNewFiles([...newFiles, ...fileArray])
      
      // Reset file input
      event.target.value = ""
      
    } catch (err: any) {
      console.error("Error selecting files:", err)
      setError(err.message || "Lỗi khi chọn file")
    }
  }

  const handleRemoveNewFile = (index: number) => {
    setNewFiles(newFiles.filter((_, i) => i !== index))
  }

  const handleRemoveExistingFile = (index: number) => {
    setExistingFiles(existingFiles.filter((_, i) => i !== index))
  }

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true)
      setError(null)

      // Validate
      const hasContent = submissionText || newFiles.length > 0 || existingFiles.length > 0 || submissionLink
      if (!hasContent) {
        setError("Vui lòng nhập nội dung bài làm")
        setIsSubmitting(false)
        return
      }

      const submitData = {
        assignmentId: assignment.id,
        submissionText: canSubmitText ? submissionText : undefined,
        submissionLink: canSubmitLink ? submissionLink : undefined,
      }

      if (existingSubmission) {
        // Update existing submission
        await assignmentApi.updateSubmission(
          existingSubmission.id, 
          submitData,
          canSubmitFile ? newFiles : undefined,
          canSubmitFile ? existingFiles : undefined
        )
      } else {
        // Create new submission
        await assignmentApi.submitAssignment(
          assignment.id, 
          submitData,
          canSubmitFile ? newFiles : undefined
        )
      }

      onSuccess()
    } catch (err: any) {
      console.error("Error submitting assignment:", err)
      setError(err.message || "Không thể nộp bài. Vui lòng thử lại.")
      setIsSubmitting(false)
    }
  }

  const getFileName = (url: string): string => {
    return url.split("/").pop() || "file"
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  return (
    <Modal isOpen={true} onClose={onClose} maxWidth="max-w-2xl">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h3 className="text-xl font-bold text-gray-900">
              {existingSubmission ? "Cập nhật bài nộp" : "Nộp bài tập"}
            </h3>
            <p className="text-sm text-gray-600 mt-1">{assignment.title}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        <div className="space-y-4">
          {/* Text Submission */}
          {canSubmitText && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nội dung bài làm
              </label>
              <textarea
                value={submissionText}
                onChange={(e) => setSubmissionText(e.target.value)}
                rows={8}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Nhập nội dung bài làm của bạn..."
              />
            </div>
          )}

          {/* File Upload */}
          {canSubmitFile && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tệp đính kèm
              </label>
              
              {/* Upload Button */}
              <div className="mb-3">
                <label className="cursor-pointer">
                  <div className="flex items-center gap-2 px-4 py-2 border-2 border-dashed rounded-lg transition border-gray-300 hover:border-blue-500 hover:bg-blue-50">
                    <Upload className="h-5 w-5 text-gray-600" />
                    <span className="text-sm text-gray-600">
                      Chọn file để upload (Tối đa 10MB/file)
                    </span>
                  </div>
                  <input
                    type="file"
                    multiple
                    onChange={handleFileSelect}
                    className="hidden"
                    disabled={isSubmitting}
                    accept="*/*"
                  />
                </label>
              </div>

              {/* Existing Files (for updates) */}
              {existingFiles.length > 0 && (
                <div className="mb-3">
                  <p className="text-xs text-gray-500 mb-2">File đã tải lên trước đó:</p>
                  <div className="space-y-2">
                    {existingFiles.map((file, index) => (
                      <div
                        key={`existing-${index}`}
                        className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded"
                      >
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-blue-600" />
                          <span className="text-sm">{getFileName(file)}</span>
                        </div>
                        <button
                          onClick={() => handleRemoveExistingFile(index)}
                          className="p-1 hover:bg-blue-100 rounded"
                          disabled={isSubmitting}
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* New Files */}
              {newFiles.length > 0 && (
                <div>
                  <p className="text-xs text-gray-500 mb-2">File mới:</p>
                  <div className="space-y-2">
                    {newFiles.map((file, index) => (
                      <div
                        key={`new-${index}`}
                        className="flex items-center justify-between p-3 bg-gray-50 border rounded"
                      >
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <FileText className="h-4 w-4 text-blue-600 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm truncate">{file.name}</p>
                            <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleRemoveNewFile(index)}
                          className="p-1 hover:bg-gray-200 rounded ml-2"
                          disabled={isSubmitting}
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Link Submission */}
          {canSubmitLink && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Link bài làm
              </label>
              <div className="flex items-center gap-2">
                <LinkIcon className="h-5 w-5 text-gray-400" />
                <input
                  type="url"
                  value={submissionLink}
                  onChange={(e) => setSubmissionLink(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="https://..."
                />
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Hủy
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="bg-orange-600 hover:bg-orange-700 text-white"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Đang nộp...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                {existingSubmission ? "Cập nhật" : "Nộp bài"}
              </>
            )}
          </Button>
        </div>
      </div>
    </Modal>
  )
}

export default AssignmentSubmitForm