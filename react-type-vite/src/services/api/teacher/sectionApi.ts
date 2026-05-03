import axiosInstance from "../httpClient/axiosInstance"
import type { ApiResponse } from "../response/apiResponse"
import type { SectionRequest } from "../request/sectionRequest"
import type { SectionResponse } from "../response/sectionResponse"


/**
 * Get all sections for a course
 * @param courseId - The course ID
 * @returns List of sections with lessons and quizzes
 */
export const getSectionsByCourseId = async (courseId: number): Promise<SectionResponse[]> => {
  const response = await axiosInstance.get<ApiResponse<SectionResponse[]>>(
    `/course-management/teacher/courses/section/${courseId}`
  )
  return response.data.result
}

/**
 * Create or update sections with nested lessons, quizzes, questions, and answers
 * This is the unified endpoint that handles all CRUD operations via upsert logic
 * @param bulkRequest - Bulk section request with courseId and sections array
 * @param lessonFiles - Optional lesson files to upload
 * @param questionFiles - Optional question files to upload
 * @returns Created/updated sections
 */
export const createOrUpdateSections = async (
  bulkRequest: {
    courseId: number
    sections: SectionRequest[]
  },
  lessonFiles?: File[],
  questionFiles?: File[],
  assignmentFiles?: File[],
  rubricFiles?: File[],
): Promise<SectionResponse[]> => {
  const formData = new FormData()

  // Helper: kiểm tra xem có phải file cũ không (đã lưu trên server)
  const isExistingFile = (input: string | undefined): boolean => {
    if (!input || typeof input !== "string") return false
    
    // Nếu là URL từ server (http/https) hoặc đã có metadata JSON
    if (input.startsWith("http://") || input.startsWith("https://")) {
      return true
    }
    
    // Nếu là JSON metadata có chứa URL từ server
    if (input.trim().startsWith("{")) {
      try {
        const meta = JSON.parse(input)
        if (meta.url && (meta.url.startsWith("http://") || meta.url.startsWith("https://"))) {
          return true
        }
      } catch (err) {
        // Ignore parse error
      }
    }
    
    return false
  }

  // helper: convert blob/data URL -> File (CHỈ với file mới)
  const urlToFile = async (input: string | undefined, fileNamePrefix = "file") => {
    if (!input || typeof input !== "string") return null
    
    // SKIP nếu là file cũ đã có trên server
    if (isExistingFile(input)) {
      console.log(`[SKIP] Existing file: ${input.substring(0, 50)}...`)
      return null
    }
    
    let url = input
    let providedName: string | undefined

    // If stored as JSON string { name, url, uploadedAt } but NOT from server
    if (input.trim().startsWith("{")) {
      try {
        const meta = JSON.parse(input)
        url = meta.url || url
        providedName = meta.name || providedName
      } catch (err) {
        // not JSON — ignore
      }
    }

    // Only attempt to fetch for blob: or data: (NEW files)
    if (!url.startsWith("blob:") && !url.startsWith("data:")) {
      return null
    }

    try {
      const res = await fetch(url)
      const blob = await res.blob()
      const ext = (blob.type && blob.type.split("/")[1]) || (providedName && providedName.split(".").pop()) || "bin"
      let name = providedName || `${fileNamePrefix}.${ext}`
      if (providedName && providedName.includes(".")) name = providedName
      
      console.log(`[CONVERT] New file: ${name}`)
      return new File([blob], name, { type: blob.type || "application/octet-stream" })
    } catch (err) {
      console.warn("[createOrUpdateSections] Failed to fetch/convert url -> file:", url, err)
      return null
    }
  }

  // collect files found in section payloads (chỉ file mới)
  const lessonFilesFromUrls: File[] = []
  const questionFilesFromUrls: File[] = []
  const assignmentFilesFromUrls: File[] = []
  const rubricFilesFromUrls: File[] = []

  // Track file mappings
  const lessonFileMap: { sectionIndex: number; lessonIndex: number; fileIndex: number; attachmentIndex: number }[] = []
  const lessonVideoMap: { sectionIndex: number; lessonIndex: number; fileIndex: number }[] = []
  const questionFileMap: { sectionIndex: number; quizIndex: number; questionIndex: number; fileIndex: number; attachmentIndex: number }[] = []
  const assignmentFileMap: { sectionIndex: number; assignmentIndex: number; fileIndex: number; attachmentIndex: number }[] = []
  const rubricFileMap: { sectionIndex: number; assignmentIndex: number; fileIndex: number; attachmentIndex: number }[] = []

  const fetchPromises: Promise<void>[] = []

  bulkRequest.sections.forEach((section, sIdx) => {
    ;(section.lessons || []).forEach((lesson: any, lIdx: number) => {
      // Xử lý video file từ videoUrl
      if (lesson.videoUrl && typeof lesson.videoUrl === "string") {
        fetchPromises.push(
          (async () => {
            const file = await urlToFile(lesson.videoUrl, `section${sIdx}_lesson${lIdx}_video`)
            if (file) {
              const fileIndex = lessonFilesFromUrls.length
              lessonFilesFromUrls.push(file)
              lessonVideoMap.push({
                sectionIndex: sIdx,
                lessonIndex: lIdx,
                fileIndex: fileIndex,
              })
            }
          })(),
        )
      }

      // Xử lý attachments
      ;(lesson.attachments || []).forEach((att: any, attIdx: number) => {
        if (typeof att === "string") {
          fetchPromises.push(
            (async () => {
              const file = await urlToFile(att, `section${sIdx}_lesson${lIdx}_file${attIdx}`)
              if (file) {
                const fileIndex = lessonFilesFromUrls.length
                lessonFilesFromUrls.push(file)
                lessonFileMap.push({ 
                  sectionIndex: sIdx, 
                  lessonIndex: lIdx, 
                  fileIndex: fileIndex,
                  attachmentIndex: attIdx 
                })
              }
            })(),
          )
        }
      })
    })

    ;(section.quizzes || []).forEach((quiz: any, qIdx: number) => {
      ;(quiz.questions || []).forEach((question: any, quesIdx: number) => {
        ;(question.attachments || []).forEach((att: any, attIdx: number) => {
          if (typeof att === "string") {
            fetchPromises.push(
              (async () => {
                const file = await urlToFile(att, `section${sIdx}_quiz${qIdx}_q${quesIdx}_file${attIdx}`)
                if (file) {
                  const fileIndex = questionFilesFromUrls.length
                  questionFilesFromUrls.push(file)
                  questionFileMap.push({ 
                    sectionIndex: sIdx, 
                    quizIndex: qIdx, 
                    questionIndex: quesIdx, 
                    fileIndex: fileIndex,
                    attachmentIndex: attIdx 
                  })
                }
              })(),
            )
          }
        })
      })
    })

    ;(section.assignments || []).forEach((assignment: any, aIdx: number) => {
      ;(assignment.assignmentFiles || []).forEach((att: any, attIdx: number) => {
        if (typeof att === "string") {
          fetchPromises.push(
            (async () => {
              const file = await urlToFile(att, `section${sIdx}_assignment${aIdx}_file${attIdx}`)
              if (file) {
                const fileIndex = assignmentFilesFromUrls.length
                assignmentFilesFromUrls.push(file)
                assignmentFileMap.push({ 
                  sectionIndex: sIdx, 
                  assignmentIndex: aIdx, 
                  fileIndex: fileIndex,
                  attachmentIndex: attIdx 
                })
              }
            })(),
          )
        }
      })
      ;(assignment.rubricFiles || []).forEach((att: any, attIdx: number) => {
        if (typeof att === "string") {
          fetchPromises.push(
            (async () => {
              const file = await urlToFile(att, `section${sIdx}_assignment${aIdx}_rubric${attIdx}`)
              if (file) {
                const fileIndex = rubricFilesFromUrls.length
                rubricFilesFromUrls.push(file)
                rubricFileMap.push({ 
                  sectionIndex: sIdx, 
                  assignmentIndex: aIdx, 
                  fileIndex: fileIndex,
                  attachmentIndex: attIdx 
                })
              }
            })(),
          )
        }
      })
    })
  })

  if (fetchPromises.length > 0) {
    await Promise.all(fetchPromises)
  }

  // Replace blob URLs with FILE_INDEX, keep server URLs as-is
  bulkRequest.sections.forEach((section, sIdx) => {
    ;(section.lessons || []).forEach((lesson: any, lIdx: number) => {
      // Xử lý videoUrl
      if (lesson.videoUrl && typeof lesson.videoUrl === "string") {
        // Nếu là file cũ từ server, giữ nguyên
        if (isExistingFile(lesson.videoUrl)) {
          // Keep as-is
        } else {
          // Nếu là file mới, thay bằng FILE_INDEX
          const mapping = lessonVideoMap.find(
            m => m.sectionIndex === sIdx && m.lessonIndex === lIdx
          )
          if (mapping) {
            lesson.videoUrl = `FILE_INDEX:${mapping.fileIndex}`
          }
        }
      }

      // Xử lý attachments
      if (lesson.attachments) {
        lesson.attachments = lesson.attachments.map((att: any, attIdx: number) => {
          if (typeof att === "string") {
            // Nếu là file cũ từ server, giữ nguyên
            if (isExistingFile(att)) {
              return att
            }
            
            // Nếu là file mới, thay bằng FILE_INDEX
            const mapping = lessonFileMap.find(
              m => m.sectionIndex === sIdx && m.lessonIndex === lIdx && m.attachmentIndex === attIdx
            )
            return mapping ? `FILE_INDEX:${mapping.fileIndex}` : att
          }
          return att
        })
      }
    })

    ;(section.quizzes || []).forEach((quiz: any, qIdx: number) => {
      ;(quiz.questions || []).forEach((question: any, quesIdx: number) => {
        if (question.attachments) {
          question.attachments = question.attachments.map((att: any, attIdx: number) => {
            if (typeof att === "string") {
              if (isExistingFile(att)) {
                return att
              }
              const mapping = questionFileMap.find(
                m => m.sectionIndex === sIdx && m.quizIndex === qIdx && 
                m.questionIndex === quesIdx && m.attachmentIndex === attIdx
              )
              return mapping ? `FILE_INDEX:${mapping.fileIndex}` : att
            }
            return att
          })
        }
      })
    })

    ;(section.assignments || []).forEach((assignment: any, aIdx: number) => {
      if (assignment.assignmentFiles) {
        assignment.assignmentFiles = assignment.assignmentFiles.map((att: any, attIdx: number) => {
          if (typeof att === "string") {
            if (isExistingFile(att)) {
              return att
            }
            const mapping = assignmentFileMap.find(
              m => m.sectionIndex === sIdx && m.assignmentIndex === aIdx && m.attachmentIndex === attIdx
            )
            return mapping ? `FILE_INDEX:${mapping.fileIndex}` : att
          }
          return att
        })
      }
      if (assignment.rubricFiles) {
        assignment.rubricFiles = assignment.rubricFiles.map((att: any, attIdx: number) => {
          if (typeof att === "string") {
            if (isExistingFile(att)) {
              return att
            }
            const mapping = rubricFileMap.find(
              m => m.sectionIndex === sIdx && m.assignmentIndex === aIdx && m.attachmentIndex === attIdx
            )
            return mapping ? `FILE_INDEX:${mapping.fileIndex}` : att
          }
          return att
        })
      }
    })
  })

  console.log(`[SUMMARY] Sending ${lessonFilesFromUrls.length + questionFilesFromUrls.length + assignmentFilesFromUrls.length + rubricFilesFromUrls.length} new files`)

  // Add JSON payload
  formData.append("data", JSON.stringify(bulkRequest))
  
  const appendFiles = (fieldName: string, files?: File[]) => {
    if (!files || files.length === 0) return
    files.forEach((file) => formData.append(fieldName, file))
  }

  // append explicit files passed by caller first
  appendFiles("lessonFiles", lessonFiles)
  appendFiles("questionFiles", questionFiles)
  appendFiles("assignmentFiles", assignmentFiles)
  appendFiles("rubricFiles", rubricFiles)

  // then append files we converted from blob/json URLs
  appendFiles("lessonFiles", lessonFilesFromUrls)
  appendFiles("questionFiles", questionFilesFromUrls)
  appendFiles("assignmentFiles", assignmentFilesFromUrls)
  appendFiles("rubricFiles", rubricFilesFromUrls)

  const response = await axiosInstance.post<ApiResponse<SectionResponse[]>>(
    `/course-management/teacher/courses/section/create`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    },
  )
  return response.data.result
}


