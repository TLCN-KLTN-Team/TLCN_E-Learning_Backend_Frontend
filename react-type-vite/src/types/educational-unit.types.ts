// Educational Unit Types

export interface EducationalUnit {
  id: string;
  name: string;
  logo?: string;
  bannerImage?: string;
  address: string;
  establishedYear: number;
  totalStudents: number;
  description: string;
  specializations: string[];
  trainingPrograms: string[];
  email?: string;
  phone?: string;
  website?: string;
  isFollowing?: boolean;
}

export interface Instructor {
  id: string;
  name: string;
  avatar?: string;
  department: string;
  email?: string;
  title?: string;
  bio?: string;
}

export interface UnitCourse {
  id: string;
  title: string;
  description: string;
  duration: string;
  price: number;
  instructor: string;
  thumbnail?: string;
  enrollmentCount?: number;
  rating?: number;
  category?: string;
  level?: string;
}

export interface InstructorFilters {
  searchTerm: string;
  department: string;
}

export interface CourseFilters {
  sortBy: "newest" | "popular" | "price-low" | "price-high";
}
