import {
  type PublishedCourseDetailResponse,
  type PublishedCourseResponse,
} from "../../../types/course.types";
import axiosInstance from "../httpClient/axiosInstance";
import type { ApiResponse, PaginatedResponse } from "../response/apiResponse";

// Mock API service for courses
export class CourseApiService {
  private static publishedCourses: PublishedCourseResponse[] = [];
  private static isDataLoaded: boolean = false;
  private static lastLoadTime: number = 0;
  private static CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  private static USER_COURSE_ENPOINT =
    "/course-management/user/published-courses";

  // Helper method to ensure data is loaded
  private static async ensureDataLoaded(): Promise<void> {
    const now = Date.now();
    const needsRefresh =
      !this.isDataLoaded || now - this.lastLoadTime > this.CACHE_DURATION;

    if (needsRefresh) {
      await this.loadAllCourses();
    }
  }

  // Load all courses and update cache
  private static async loadAllCourses(): Promise<void> {
    try {
      const loadCourses = await axiosInstance.get<
        ApiResponse<PaginatedResponse<PublishedCourseResponse>>
      >(`${this.USER_COURSE_ENPOINT}?page=0&size=1000`); // Load all courses

      // Extract courses array from paginated response
      const coursesData = loadCourses.data.result;
      this.publishedCourses = Array.isArray(coursesData.content)
        ? coursesData.content
        : [];

      this.isDataLoaded = true;
      this.lastLoadTime = Date.now();
    } catch (error) {
      console.error("Error loading courses:", error);
      this.publishedCourses = [];
      this.isDataLoaded = false;
    }
  }

  static async getCourses(
    page: number = 0,
    size: number = 12
  ): Promise<PaginatedResponse<PublishedCourseResponse>> {
    try {
      const loadCourses = await axiosInstance.get<
        ApiResponse<PaginatedResponse<PublishedCourseResponse>>
      >(`${this.USER_COURSE_ENPOINT}?page=${page}&size=${size}`);

      // Update cache with latest data from this page
      const coursesData = loadCourses.data.result;
      if (coursesData && Array.isArray(coursesData.content)) {
        // Merge new courses into cache (avoid duplicates)
        const newCourses = coursesData.content.filter(
          (newCourse) =>
            !this.publishedCourses.some(
              (existing) => existing.id === newCourse.id
            )
        );
        this.publishedCourses.push(...newCourses);
        this.isDataLoaded = true;
        this.lastLoadTime = Date.now();
      }

      // Add pagination helper properties
      const result = loadCourses.data.result;
      return {
        ...result,
        first: result.page === 0,
        last: result.page === result.totalPages - 1,
        hasNext: result.page < result.totalPages - 1,
        hasPrevious: result.page > 0,
      };
    } catch (error) {
      console.error("Error fetching courses:", error);
      // Return empty paginated response structure
      return {
        content: [],
        page: page,
        size: size,
        totalElements: 0,
        totalPages: 0,
        first: true,
        last: true,
        hasNext: false,
        hasPrevious: false,
      };
    }
  }

  static async getCourseById(
    courseId: string
  ): Promise<PublishedCourseDetailResponse | null> {
    try {
      // call api
      const response = await axiosInstance.get<
        ApiResponse<PublishedCourseDetailResponse>
      >(`${this.USER_COURSE_ENPOINT}/${courseId}`);

      return response.data.result;
    } catch (error) {
      console.error("Error fetching course by id:", error);
      return null;
    }
  }

  static async searchCourses(
    query: string
  ): Promise<PublishedCourseResponse[]> {
    try {
      // Ensure data is loaded first
      await this.ensureDataLoaded();

      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 500));

      return this.publishedCourses.filter(
        (course) =>
          course.courseName.toLowerCase().includes(query.toLowerCase()) ||
          course.authorName.toLowerCase().includes(query.toLowerCase()) ||
          course.category.toLowerCase().includes(query.toLowerCase())
      );
    } catch (error) {
      console.error("Error searching courses:", error);
      return [];
    }
  }

  static async getCategories(): Promise<string[]> {
    try {
      // Ensure data is loaded first
      await this.ensureDataLoaded();

      return [
        ...new Set(this.publishedCourses.map((course) => course.category)),
      ];
    } catch (error) {
      console.error("Error getting categories:", error);
      return [];
    }
  }

  // Method for server-side pagination with filters
  static async getCoursesWithFilters(params: {
    page: number;
    size: number;
    searchTerm?: string;
    category?: string;
    minRating?: number;
    minPrice?: number;
    maxPrice?: number;
    level?: string;
    isHandsOn?: boolean;
  }): Promise<PaginatedResponse<PublishedCourseResponse>> {
    try {
      // Build query parameters for server-side filtering
      const queryParams = new URLSearchParams({
        page: params.page.toString(),
        size: params.size.toString(),
      });

      // Add filter parameters if they exist
      if (params.searchTerm) {
        queryParams.append("search", params.searchTerm);
      }
      if (params.category) {
        queryParams.append("category", params.category);
      }
      if (params.minRating) {
        queryParams.append("minRating", params.minRating.toString());
      }
      if (params.minPrice) {
        queryParams.append("minPrice", params.minPrice.toString());
      }
      if (params.maxPrice) {
        queryParams.append("maxPrice", params.maxPrice.toString());
      }
      if (params.level) {
        queryParams.append("level", params.level);
      }
      if (params.isHandsOn !== undefined) {
        queryParams.append("isHandsOn", params.isHandsOn.toString());
      }

      // Send request to server with filter parameters
      const loadCourses = await axiosInstance.get<
        ApiResponse<PaginatedResponse<PublishedCourseResponse>>
      >(`${this.USER_COURSE_ENPOINT}?${queryParams.toString()}`);

      // Update cache with latest data from this page
      const coursesData = loadCourses.data.result;
      if (coursesData && Array.isArray(coursesData.content)) {
        // Note: With filtering, we don't merge into cache since results may vary
        // Cache would need to be more sophisticated for filtered results
        this.isDataLoaded = true;
        this.lastLoadTime = Date.now();
      }

      // Add pagination helper properties
      const result = loadCourses.data.result;
      return {
        ...result,
        first: result.page === 0,
        last: result.page === result.totalPages - 1,
        hasNext: result.page < result.totalPages - 1,
        hasPrevious: result.page > 0,
      };
    } catch (error) {
      console.error("Error fetching courses with filters:", error);
      return {
        content: [],
        page: params.page,
        size: params.size,
        totalElements: 0,
        totalPages: 0,
        first: true,
        last: true,
        hasNext: false,
        hasPrevious: false,
      };
    }
  }

  static getLevels(): string[] {
    return ["Beginner", "Intermediate", "Advanced"];
  }

  static getPracticeTypes(): string[] {
    return ["All courses", "Hands-On only", "Theory only"];
  }
}
