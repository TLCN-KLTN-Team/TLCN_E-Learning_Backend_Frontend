export interface ReviewResponse {
  id: number;
  rate: number;
  content: string;
  courseId: number;
  createdById: string;
  createdByName?: string; // If backend returns user name
  createdByAvatar?: string; // Optional avatar URL for reviewer
  createdAt: string;
}

export interface ReviewStatsResponse {
  averageRating: number;
  totalReviews: number;
  ratingDistribution: {
    fiveStar: number;
    fourStar: number;
    threeStar: number;
    twoStar: number;
    oneStar: number;
  };
}

export interface CreateReviewRequest {
  courseId: number;
  rate: number;
  content: string;
}
