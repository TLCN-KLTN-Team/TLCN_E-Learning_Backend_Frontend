import { useState } from "react"
import { toast } from "react-toastify"
import { getLibraryQuestions, type QuestionLibraryResponse } from "@/services/api/teacher/questionLibraryApi"
import type { QuestionRequest } from "@/services/api/request/questionRequest"

export type GenerationMode = "count" | "score"

interface UseQuizGeneratorProps {
  onQuestionsGenerated: (newQuestions: QuestionRequest[]) => void
}

export const useQuizGenerator = ({ onQuestionsGenerated }: UseQuizGeneratorProps) => {
  const [generationMode, setGenerationMode] = useState<GenerationMode>("count")
  const [randomQuestionCount, setRandomQuestionCount] = useState<number>(10)
  const [targetScore, setTargetScore] = useState<number>(10)
  const [isGeneratingQuestions, setIsGeneratingQuestions] = useState(false)

  const shuffle = <T,>(items: T[]): T[] => {
    const cloned = [...items]
    for (let i = cloned.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      const temp = cloned[i]
      cloned[i] = cloned[j]
      cloned[j] = temp
    }
    return cloned
  }

  const mapLibraryQuestionsToQuizQuestions = (
    selectedQuestions: QuestionLibraryResponse[],
    startOrderIndex: number
  ): QuestionRequest[] => {
    return selectedQuestions.map((libQ, idx) => ({
      id: libQ.id,
      questionText: libQ.questionText,
      questionType: libQ.questionType as "MULTIPLE_CHOICE" | "TRUE_FALSE" | "SINGLE_CHOICE" | "SHORT_ANSWER" | "ESSAY" | "FILL_IN_THE_BLANK",
      score: libQ.score || 10,
      difficultyLevel: libQ.difficultyLevel,
      tags: libQ.tags,
      cloCode: libQ.cloCode,
      courseName: libQ.courseName,
      attachments: libQ.attachments,
      orderIndex: startOrderIndex + idx,
      answers: (libQ.answers || []).map((ans, ansIdx) => ({
        content: ans.content,
        isCorrect: ans.isCorrect,
        orderIndex: ansIdx + 1,
      })),
    }))
  }

  const generateQuestions = async (
    blueprintRows: { cloId: number; percentage: number }[],
    totalBlueprintPercentage: number,
    currentQuestions: { id?: number }[],
    startOrderIndex: number
  ) => {
    if (blueprintRows.length === 0) {
      toast.warning("Vui lòng thêm ma trận CĐR trước khi sinh câu hỏi")
      return
    }

    if (totalBlueprintPercentage !== 100) {
      toast.warning("Tổng tỷ lệ ma trận CĐR phải bằng 100%")
      return
    }

    if (generationMode === "count" && (!Number.isFinite(randomQuestionCount) || randomQuestionCount <= 0)) {
      toast.warning("Số câu cần sinh phải lớn hơn 0")
      return
    }

    if (generationMode === "score" && (!Number.isFinite(targetScore) || targetScore <= 0)) {
      toast.warning("Tổng điểm mục tiêu phải lớn hơn 0")
      return
    }

    setIsGeneratingQuestions(true)
    try {
      const selectedBlueprintRows = blueprintRows.filter((row) => row.percentage > 0)
      if (selectedBlueprintRows.length === 0) {
        toast.warning("Ma trận CĐR chưa có tỷ lệ hợp lệ")
        return
      }

      const selectedCloIdSet = new Set(selectedBlueprintRows.map((row) => row.cloId))
      const allCandidateQuestions: QuestionLibraryResponse[] = []
      let currentPage = 0
      let totalPages = 1

      while (currentPage < totalPages) {
        const response = await getLibraryQuestions({
          page: currentPage,
          size: 100,
          sortBy: "id",
          sortDirection: "DESC",
        })

        totalPages = response.totalPages
        const pageFiltered = response.questions.filter(
          (question) => question.cloId != null && selectedCloIdSet.has(question.cloId)
        )
        allCandidateQuestions.push(...pageFiltered)
        currentPage += 1
      }

      const dedupedCandidates = Array.from(
        new Map(allCandidateQuestions.map((question) => [question.id, question])).values()
      )

      if (dedupedCandidates.length === 0) {
        toast.warning("Không tìm thấy câu hỏi trong ngân hàng cho các CĐR đã chọn")
        return
      }

      const groupedByClo = new Map<number, QuestionLibraryResponse[]>()
      for (const question of dedupedCandidates) {
        if (!question.cloId) continue
        const existing = groupedByClo.get(question.cloId) || []
        existing.push(question)
        groupedByClo.set(question.cloId, existing)
      }

      let rawAllocations: { cloId: number; base?: number; fractional?: number; targetScore?: number }[] = []
      
      if (generationMode === "count") {
        const targetCount = Math.floor(randomQuestionCount)
        rawAllocations = selectedBlueprintRows.map((row) => {
          const exact = (targetCount * row.percentage) / 100
          return {
            cloId: row.cloId,
            base: Math.floor(exact),
            fractional: exact - Math.floor(exact),
          }
        })

        let assignedCount = rawAllocations.reduce((sum, item) => sum + (item.base || 0), 0)
        let remaining = Math.max(0, targetCount - assignedCount)

        rawAllocations
          .sort((a, b) => (b.fractional || 0) - (a.fractional || 0))
          .forEach((item) => {
            if (remaining <= 0) return
            item.base = (item.base || 0) + 1
            remaining -= 1
          })
      } else {
        const targetTotal = Number(targetScore)
        rawAllocations = selectedBlueprintRows.map((row) => {
          return {
            cloId: row.cloId,
            targetScore: (targetTotal * row.percentage) / 100,
          }
        })
      }

      const currentQuestionIds = new Set((currentQuestions || []).map((q) => q.id).filter(Boolean) as number[])
      const pickedIds = new Set<number>()
      const pickedQuestions: QuestionLibraryResponse[] = []

      let shortage = 0
      let missingScore = 0

      for (const allocation of rawAllocations) {
        const pool = (groupedByClo.get(allocation.cloId) || []).filter(
          (question) => !pickedIds.has(question.id) && !currentQuestionIds.has(question.id)
        )

        if (generationMode === "count") {
          const shuffledPool = shuffle(pool)
          const takeCount = Math.min(allocation.base!, shuffledPool.length)
          shortage += Math.max(0, allocation.base! - takeCount)

          for (let index = 0; index < takeCount; index++) {
            const question = shuffledPool[index]
            pickedQuestions.push(question)
            pickedIds.add(question.id)
          }
        } else {
          const target = allocation.targetScore!
          let bestSubset: QuestionLibraryResponse[] = []
          let bestSum = 0

          for (let i = 0; i < 50; i++) {
            const shuffled = shuffle(pool)
            let currentSubset: QuestionLibraryResponse[] = []
            let currentSum = 0
            for (const q of shuffled) {
              const s = q.score || 10
              if (currentSum + s <= target) {
                currentSum += s
                currentSubset.push(q)
              }
              if (currentSum === target) break
            }
            if (currentSum === target) {
              bestSubset = currentSubset
              bestSum = currentSum
              break
            }
            if (currentSum > bestSum) {
              bestSum = currentSum
              bestSubset = currentSubset
            }
          }

          bestSubset.forEach(q => {
            pickedQuestions.push(q)
            pickedIds.add(q.id)
          })
          missingScore += Math.max(0, target - bestSum)
        }
      }

      if (generationMode === "count" && shortage > 0) {
        const fallbackPool = shuffle(
          dedupedCandidates.filter(
            (question) => !pickedIds.has(question.id) && !currentQuestionIds.has(question.id)
          )
        )
        const fallbackTakeCount = Math.min(shortage, fallbackPool.length)
        for (let index = 0; index < fallbackTakeCount; index++) {
          const question = fallbackPool[index]
          pickedQuestions.push(question)
          pickedIds.add(question.id)
        }
      } else if (generationMode === "score" && missingScore > 0) {
        const fallbackPool = dedupedCandidates.filter(
          (question) => !pickedIds.has(question.id) && !currentQuestionIds.has(question.id)
        )
        const target = missingScore
        let bestSubset: QuestionLibraryResponse[] = []
        let bestSum = 0

        for (let i = 0; i < 50; i++) {
          const shuffled = shuffle(fallbackPool)
          let currentSubset: QuestionLibraryResponse[] = []
          let currentSum = 0
          for (const q of shuffled) {
            const s = q.score || 10
            if (currentSum + s <= target) {
              currentSum += s
              currentSubset.push(q)
            }
            if (currentSum === target) break
          }
          if (currentSum === target) {
            bestSubset = currentSubset
            bestSum = currentSum
            break
          }
          if (currentSum > bestSum) {
            bestSum = currentSum
            bestSubset = currentSubset
          }
        }
        bestSubset.forEach(q => {
          pickedQuestions.push(q)
          pickedIds.add(q.id)
        })
      }

      if (pickedQuestions.length === 0) {
        toast.warning("Không có đủ câu hỏi phù hợp để sinh theo ma trận")
        return
      }

      const newQuestions = mapLibraryQuestionsToQuizQuestions(pickedQuestions, startOrderIndex)

      onQuestionsGenerated(newQuestions)

      if (generationMode === "count") {
        const targetCount = Math.floor(randomQuestionCount)
        if (pickedQuestions.length < targetCount) {
          toast.warning(
            `Chỉ sinh được ${pickedQuestions.length}/${targetCount} câu do ngân hàng chưa đủ câu hỏi phù hợp.`
          )
        } else {
          toast.success(`Đã sinh ${pickedQuestions.length} câu hỏi theo ma trận CĐR.`)
        }
      } else {
        const totalPickedScore = pickedQuestions.reduce((sum, q) => sum + (q.score || 10), 0)
        if (totalPickedScore < targetScore) {
          toast.warning(
            `Chỉ sinh được ${totalPickedScore}/${targetScore} điểm do ngân hàng chưa đủ câu hỏi phù hợp.`
          )
        } else {
          toast.success(`Đã sinh ${pickedQuestions.length} câu hỏi (tổng ${totalPickedScore} điểm) theo ma trận CĐR.`)
        }
      }
    } catch (error) {
      console.error("Error generating questions by blueprint:", error)
      toast.error("Không thể sinh câu hỏi theo ma trận CĐR")
    } finally {
      setIsGeneratingQuestions(false)
    }
  }

  return {
    generationMode,
    setGenerationMode,
    randomQuestionCount,
    setRandomQuestionCount,
    targetScore,
    setTargetScore,
    isGeneratingQuestions,
    generateQuestions,
  }
}
