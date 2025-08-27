// This file centralizes all type definitions related to the course-management service.
// It is designed to mirror the Java DTOs (Data Transfer Objects).

// --- Answer ---
export interface AnswerRequest {
  id?: number;
  questionId?: number;
  content: string; // Changed from answerText to content
  isCorrect: boolean;
  orderIndex?: number;
  createdAt?: string;
  updateAt?: string;
}

// --- Question ---
export interface QuestionRequest {
  id?: number;
  quizId?: number;
  questionText: string;
  questionType: 'SINGLE_CHOICE' | 'MULTIPLE_CHOICE' | 'TRUE_FALSE';
  orderIndex?: number;
  attachments?: string[]; // Added attachments array
  score: number;
  createdAt?: string;
  updateAt?: string;
  answers: AnswerRequest[]; // Changed from Set to Array for frontend
}

// --- Quiz ---
export interface QuizRequest {
  id?: number;
  sectionId?: number;
  title: string;
  description?: string;
  duration: number; // Made required to match backend
  attemptLimit?: number;
  passingScore?: number; // Changed to number from backend Double
  numberItem?: number;
  showResults?: boolean;
  isPublished?: boolean;
  questions?: QuestionRequest[]; // Changed from Set to Array for frontend
  createdAt?: string;
  updateAt?: string;
}

// --- Lesson ---
export interface LessonRequest {
  id?: number;
  sectionId?: number;
  title: string;
  description?: string;
  content?: string;
  attachments?: string[]; // Added attachments array
  videoUrl?: string;
  numberItem?: number;
  isFreeLesson?: boolean;
  createdAt?: string;
  updateAt?: string;
}

// --- Section ---
export interface SectionRequest {
  id?: number;
  courseId?: number; // Removed from backend but keeping for frontend logic
  title: string;
  description?: string;
  orderIndex?: number;
  isPublished?: boolean;
  lessons?: LessonRequest[];
  quizzes?: QuizRequest[];
}

// --- Course Detail ---
export interface CourseTypeRequest {
  id?: number;
  courseTypeName: string;
}

// --- Course ---
export interface CourseRequest {
  id?: number;
  courseName: string;
  courseTypeId: number;
  idTeacher?: string;
  createdAt?: string;
  updateAt?: string;
  sections?: SectionRequest[];
}

export interface FileUploadRequest {
  file: File;
  type: 'lesson' | 'question';
  targetId?: number;
}

export interface UploadedFile {
  id: string;
  name: string;
  url: string;
  type: string;
  size: number;
  uploadedAt: string;
}