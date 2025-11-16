import axiosInstance from "../httpClient/axiosInstance";

const API_MY_COURSES_ENDPOINT = "/course-management/enrolled-courses";

export interface EnrolledCourse {
  courseId: number;
  courseName: string;
  authorName: string;
  thumbnailUrl?: string;
  rating: number;
  duration: number;
  progress: number;
  lastAccessed?: string;
  totalLessons?: number;
  completedLessons?: number;
  enrolledDate?: string;
}

export interface EnrolledCoursesResponse {
  courses: EnrolledCourse[];
  totalCourses: number;
}

const getEnrolledCourses = async (): Promise<EnrolledCoursesResponse> => {
  const response = await axiosInstance.get<EnrolledCoursesResponse>(
    `${API_MY_COURSES_ENDPOINT}`
  );
  return response.data;
};

const getCourseProgress = async (courseId: number): Promise<number> => {
  const response = await axiosInstance.get<{ progress: number }>(
    `${API_MY_COURSES_ENDPOINT}/${courseId}/progress`
  );
  return response.data.progress;
};

const updateCourseProgress = async (
  courseId: number,
  lessonId: number,
  completed: boolean
): Promise<void> => {
  await axiosInstance.post(`${API_MY_COURSES_ENDPOINT}/${courseId}/progress`, {
    lessonId,
    completed,
  });
};

export default {
  getEnrolledCourses,
  getCourseProgress,
  updateCourseProgress,
};
