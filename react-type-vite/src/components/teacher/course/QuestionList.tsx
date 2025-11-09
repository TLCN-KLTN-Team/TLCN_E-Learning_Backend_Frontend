"use client"

import type React from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { PlusCircle } from "lucide-react"
import QuestionEditor from "./QuestionEditor"
import type { QuestionRequest } from "@/services/api/request/questionRequest"
import type { AnswerRequest } from "@/services/api/request/answerRequest"

const QuestionList: React.FC<{
  questions: QuestionRequest[]
  onQuestionsChange: (questions: QuestionRequest[]) => void
}> = ({ questions, onQuestionsChange }) => {
  const addQuestion = () => {
    const defaultAnswers: AnswerRequest[] = [
      { content: "", isCorrect: true, orderIndex: 1 },
      { content: "", isCorrect: false, orderIndex: 2 },
      { content: "", isCorrect: false, orderIndex: 3 },
      { content: "", isCorrect: false, orderIndex: 4 }
    ]
    const newQuestion: QuestionRequest = {
      questionText: "",
      questionType: "SINGLE_CHOICE",
      score: 10,
      orderIndex: questions.length + 1,
      answers: defaultAnswers,
    }
    onQuestionsChange([...questions, newQuestion])
  }

  const updateQuestion = (index: number, updatedQuestion: QuestionRequest) => {
    const newQuestions = [...questions]
    newQuestions[index] = updatedQuestion
    onQuestionsChange(newQuestions)
  }

  const deleteQuestion = (index: number) => {
    onQuestionsChange(questions.filter((_, i) => i !== index))
  }

  const reorderQuestions = (fromIndex: number, toIndex: number) => {
    const fromQuestion = questions[fromIndex]
    const toQuestion = questions[toIndex]

    if (!fromQuestion || !toQuestion) return

    const questionsWithSwappedOrder = questions.map((question) => {
      if (question === fromQuestion) {
        return { ...question, orderIndex: toQuestion.orderIndex }
      } else if (question === toQuestion) {
        return { ...question, orderIndex: fromQuestion.orderIndex }
      }
      return question
    })

    onQuestionsChange(questionsWithSwappedOrder)
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Câu Hỏi</h3>
          <p className="text-sm text-gray-600">Thêm và cấu hình các câu hỏi cho bài kiểm tra này.</p>
        </div>
        <Button onClick={addQuestion}>
          <PlusCircle className="h-4 w-4 mr-2" />
          Thêm Câu Hỏi
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {questions.map((q, index) => (
          <QuestionEditor
            key={q.id}
            question={q}
            index={index}
            onUpdate={updateQuestion}
            onDelete={deleteQuestion}
            onReorder={reorderQuestions}
          />
        ))}
        {questions.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-500">Bài kiểm tra này chưa có câu hỏi nào.</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default QuestionList