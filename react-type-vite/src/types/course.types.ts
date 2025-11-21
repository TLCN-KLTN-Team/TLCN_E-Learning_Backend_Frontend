// --- Course Types ---
export interface PublishedCourseResponse {
  id: string;
  courseName: string;
  authorName: string;
  coursePrice: string;
  rating: number;
  reviewCount: number;
  studentCount: number;
  category: string;
  thumbnailUrl: string;
  isHandsOn: boolean;
  duration: string;
  level: string;
}

export interface PublishedCourseDetailResponse {
  courseName: string;
  description: string;
  whatYouWillLearn: string;
  targetAudience: string;
  rating: number;
  studentCount: number;
  duration: number;
  authorName: string;
  thumbnailUrl: string;
  coursePrice: string;
  level: string;
  category: string;
  isHandsOn: boolean;
  purchaserStatus: boolean;
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
  priceRange: [number, number];
  minRating: number;
  levels: string[];
  practiceTypes: string[];
  categories: string[];
  duration: string[];
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
