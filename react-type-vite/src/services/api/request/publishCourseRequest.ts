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
  courseName: string;
  description: string;
  courseIntroduction: string;
  courseImage: string;
  courseVideo: string;
  learnerAchievements: string;
  courseLearner: string;
  courseTarget: string[];
  coursePrice: number;
  note?: string;
}