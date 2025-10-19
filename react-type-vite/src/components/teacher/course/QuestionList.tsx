import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader} from '@/components/ui/card';
import { PlusCircle } from 'lucide-react';
import QuestionEditor from './QuestionEditor'; // The new component for a single question
import type { QuestionRequest } from '@/services/api/request/questionRequest';
import type { AnswerRequest } from '@/services/api/request/answerRequest';

const QuestionList: React.FC<{
  questions: QuestionRequest[];
  onQuestionsChange: (questions: QuestionRequest[]) => void;
}> = ({ questions, onQuestionsChange }) => {
  const addQuestion = () => {
    const newAnswer: AnswerRequest = { id: Date.now(), content: '' , isCorrect: true };
    const newQuestion: QuestionRequest = {
      id: Date.now(),
      questionText: '',
      questionType: 'SINGLE_CHOICE',
      score: 10,
      answers: [newAnswer],
    };
    onQuestionsChange([...questions, newQuestion]);
  };

  const updateQuestion = (index: number, updatedQuestion: QuestionRequest) => {
    const newQuestions = [...questions];
    newQuestions[index] = updatedQuestion;
    onQuestionsChange(newQuestions);
  };

  const deleteQuestion = (index: number) => {
    onQuestionsChange(questions.filter((_, i) => i !== index));
  };

  const reorderQuestions = (fromIndex: number, toIndex: number) => {
    const reorderedQuestions = [...questions];
    const [movedItem] = reorderedQuestions.splice(fromIndex, 1);
    reorderedQuestions.splice(toIndex, 0, movedItem);
    onQuestionsChange(reorderedQuestions);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Questions</h3>
          <p className="text-sm text-gray-600">Add and configure the questions for this quiz.</p>
        </div>
        <Button onClick={addQuestion}>
          <PlusCircle className="h-4 w-4 mr-2" />
          Add Question
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
            <p className="text-gray-500">This quiz has no questions yet.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default QuestionList;