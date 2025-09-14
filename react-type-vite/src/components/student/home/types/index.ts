export interface Course {
  id: string;
  title: string;
  instructor: string;
  rating: number;
  reviewCount: number;
  price: number;
  originalPrice?: number;
  image: string;
  badge?: string;
  isPopular?: boolean;
  isBestSeller?: boolean;
}

export interface Subject {
  id: string;
  name: string;
  image: string;
  icon: string;
  description: string;
  courseCount: number;
}
