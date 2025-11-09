export interface CourseDetailRequest {
  description: string;
  courseIntroduction: string;
  courseImage: string;
  courseVideo: string;
  learnerAchievements: string;
  courseLearner: string;
  courseTarget: string[];
}

export interface PublishCourseRequest {
  courseId: number;
  courseTypeId: number;
  coursePrice: number;
  courseDetail: CourseDetailRequest;
  note?: string;
}