// --- Course Types ---
export interface CourseType {
  id: number;
  courseTypeName: string;
}

export interface PublishedCourseResponse {
  id: string;
  courseName: string;
  authorName: string;
  coursePrice: string;
  amountPrice: number;
  rating: number;
  reviewCount: number;
  studentCount: number;
  category: string;
  thumbnailUrl: string;
  isHandsOn: boolean;
  duration: string;
  level: string;
}

// Home Page API Response Type for Course Cards
export interface PublishedCourseCardResponse {
  id: number;
  courseName: string;
  authorName: string;
  coursePrice: string;
  rating: number;
  reviewCount: number;
  studentCount: number;
  category: string;
  thumbnailUrl: string;
  isHandsOn: boolean;
  duration: number;
  level: string;
  status: string;
}

export interface CompletionSuggestionResponse {
  titleSuggestions: string[];
}

export interface TeacherInfo {
  instructorId: string;
  instructorName: string;
  instructorAvatar: string | null;
  instructorTagline: string;
  instructorBio: string;
  socialUrl: string;
  instructorRating: number;
  totalReviews: number;
  totalStudents: number;
  totalCourses: number;
}

export interface ReviewCardResponse {
  rate: number;
  content: string;
  createdByName: string;
  createdByAvatar: string;
}

export interface PublishedCourseDetailResponse {
  courseName: string;
  description: string;
  courseIntroduction: string; // Subtitle under course title
  learnerAchievements: string; // Requirements section (HTML from TinyMCE)
  courseLearner: string; // Target Audience section (HTML from TinyMCE)
  whatYouWillLearn: string;
  targetAudience: string;
  rating: number;
  studentCount: number;
  duration: number;
  lastUpdated?: string;
  authorName: string;
  thumbnailUrl: string;
  coursePrice: string;
  level: string;
  category: string;
  isHandsOn: boolean;
  purchaserStatus: boolean;
  courseVideo?: string; // Video preview URL from published_course
  sections?: PublishedSectionResponse[]; // Published sections
  courseTarget?: string[]; // Learning objectives list
  teacherInfo?: TeacherInfo; // Teacher detailed information
}

export interface PublishedSectionResponse {
  id: number;
  title: string;
  description?: string;
  orderIndex: number;
  isPublished: boolean;
  lessons: PublishedLessonResponse[];
  quizzes: PublishedQuizResponse[];
  assignments: PublishedAssignmentResponse[];
}

export interface PublishedLessonResponse {
  id: number;
  title: string;
  description?: string;
  videoUrl?: string;
  duration?: string;
  numberItem: number;
  isPublished: boolean;
  isFreeLesson: boolean;
}

export interface PublishedQuizResponse {
  id: number;
  title: string;
  description?: string;
  numberItem: number;
  isPublished: boolean;
  questionCount?: number;
  duration?: number;
}

export interface PublishedAssignmentResponse {
  id: number;
  title: string;
  description?: string;
  numberItem: number;
  isPublished: boolean;
  dueDate?: Date;
}

export interface Course {
  id: string;
  title: string;
  instructor: string;
  price: number;
  originalPrice?: number;
  rating: number;
  reviewCount: number;
  studentCount: number;
  duration: string;
  level: "Beginner" | "Intermediate" | "Advanced";
  category: string;
  thumbnail: string;
  isHandsOn: boolean;
  practiceType: "Hands-On only" | "Theory only" | "All courses";
}

export interface Filters {
  minPrice: number;
  maxPrice: number;
  minRating: number;
  levels: string[];
  practiceType: string;
  category?: string;
  duration: string[];
  sort: string;
}

// --- Course Detail ---
export interface CourseTypeRequest {
  id?: number;
  courseTypeName: string;
}

export interface FileUploadRequest {
  file: File;
  type: "lesson" | "question";
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
