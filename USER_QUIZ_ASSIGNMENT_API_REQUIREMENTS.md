# User Quiz & Assignment API Requirements

## Overview
Users who purchase public courses (not enrolled in classes) need separate API endpoints to take quizzes and submit assignments. These endpoints should work without class context.

## Required Backend APIs

### User Quiz APIs

Base path: `/api/course-management/user/quizzes`

#### 1. Get Quiz Attempts
```
GET /api/course-management/user/quizzes/{quizId}/attempts
```
Returns: Array of `QuizAttemptResponse` for current user

#### 2. Start Quiz Attempt  
```
POST /api/course-management/user/quizzes/{quizId}/start
```
Returns: `{ attemptId: number }`

#### 3. Get Quiz Attempt Detail (with questions)
```
GET /api/course-management/user/quiz-attempts/{attemptId}
```
Returns: 
```typescript
{
  attemptId: number
  quiz: QuizResponse
  questions: Array<{
    questionId: number
    questionText: string
    questionType: 'SINGLE_CHOICE' | 'MULTIPLE_CHOICE'
    answers: Array<{
      answerId: number
      answerText: string
    }>
  }>
}
```

#### 4. Submit Quiz Answer (single question)
```
POST /api/course-management/user/quiz-attempts/{attemptId}/questions/{questionId}/answer
Body: { selectedAnswerIds: number[] }
```
Returns: `void`

#### 5. Submit Quiz Attempt (complete)
```
POST /api/course-management/user/quiz-attempts/{attemptId}/submit
```
Returns: `void`

#### 6. Get Quiz Result
```
GET /api/course-management/user/quiz-attempts/{attemptId}/result
```
Returns:
```typescript
{
  attemptId: number
  score: number
  totalQuestions: number
  correctAnswers: number
  incorrectAnswers: number
  passed: boolean
  questionResults: Array<{
    questionId: number
    questionText: string
    isCorrect: boolean
    userAnswers: string[]
    correctAnswers: string[]
  }>
}
```

---

### User Assignment APIs

Base path: `/api/course-management/user/assignments`

#### 1. Get Assignment Detail
```
GET /api/course-management/user/assignments/{assignmentId}
```
Returns: `AssignmentDetailResponse`

#### 2. Get My Submission
```
GET /api/course-management/user/assignments/{assignmentId}/my-submission
```
Returns: `AssignmentSubmissionResponse | null`

#### 3. Submit Assignment
```
POST /api/course-management/user/assignments/{assignmentId}/submit
Body: FormData
  - submissionText?: string
  - submissionLink?: string
  - submissionFiles?: File[]
```
Returns: `AssignmentSubmissionResponse`

#### 4. Update Submission
```
PUT /api/course-management/user/assignments/submissions/{submissionId}
Body: FormData
  - submissionText?: string
  - submissionLink?: string
  - submissionFiles?: File[]
  - existingFiles?: string[] (JSON)
```
Returns: `AssignmentSubmissionResponse`

#### 5. Delete Submission
```
DELETE /api/course-management/user/assignments/submissions/{submissionId}
```
Returns: `void`

---

## Key Differences from Student APIs

| Feature | Student API | User API |
|---------|------------|----------|
| Base Path | `/api/course-management/student/*` | `/api/course-management/user/*` |
| Context | Class-based (classId required) | Course-based (no class) |
| Tracking | By class enrollment | By course purchase |
| Teacher View | Yes, by class | No class view |
| Grading | Teacher grades by class | TBD (auto-grade or admin) |

## Database Considerations

### Quiz Attempts
- Add `userId` field (for users) alongside `studentId` (for students)
- OR: Create separate `user_quiz_attempts` table
- Track: `user_id`, `quiz_id`, `course_id` (no `class_id`)

### Assignment Submissions  
- Add `userId` field (for users) alongside `studentId` (for students)  
- OR: Create separate `user_assignment_submissions` table
- Track: `user_id`, `assignment_id`, `course_id` (no `class_id`)

## Security

- Verify user has purchased/enrolled in course before allowing quiz/assignment access
- Check course is PUBLIC before allowing user (non-student) access
- Respect deadline and attempt limit settings
- Prevent cheating (rate limiting, session management)

## Frontend Implementation Status

✅ **Completed:**
- UserQuizAttempt.tsx component (full UI)
- UserAssignmentSubmission.tsx component (full UI)
- userQuizApi.ts service layer (ready for backend)
- userAssignmentApi.ts service layer (ready for backend)
- Integration with CourseLearning page

⏳ **Pending Backend:**
- All API endpoints listed above
- Database schema updates
- User purchase verification
- Course public status checking

## Testing Checklist (once backend is ready)

- [ ] User can see their previous quiz attempts
- [ ] User can start a new quiz attempt
- [ ] Timer works correctly and auto-submits
- [ ] Single/multiple choice questions work
- [ ] Quiz results show correctly with detailed breakdown
- [ ] User can view assignment details
- [ ] User can submit all assignment types (TEXT, LINK, FILE, BOTH)
- [ ] User can edit submission before deadline
- [ ] User can delete submission before deadline
- [ ] Deadline validation works correctly
- [ ] File upload/download works
- [ ] Grading displays correctly (when implemented)
