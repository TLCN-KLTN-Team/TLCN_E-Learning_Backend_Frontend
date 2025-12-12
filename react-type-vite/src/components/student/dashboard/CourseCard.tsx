import type { EnrolledCoursesResponse } from "@/services/api/student/courseEnrollmentApi";
import { MoreVertical } from "lucide-react";
import { Link } from "react-router-dom";
import DefaultThumbnail from "@/components/shared/DefaultThumbnail";

interface CourseCardProps {
  course: EnrolledCoursesResponse;
}

const CourseCard = ({ course }: CourseCardProps) => {
  // Hàm để lấy năm học từ enrollmentDate
  const getYearFromDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.getFullYear();
    } catch {
      return new Date().getFullYear(); // fallback về năm hiện tại nếu có lỗi
    }
  };

  return (
    <div className="student-dashboard-course-card hover:translate-y-[-4px] hover:shadow-lg transition-all duration-300">
      <Link
        to={`/student/dashboard/course/classes/${course.classId}`}
        className="relative cursor-pointer block"
      >
        <div className="w-full h-48 overflow-hidden">
          <DefaultThumbnail
            title={course.courseName}
            className="w-full h-full"
          />
        </div>
        <div className="absolute top-3 right-3">
          <button
            className="student-dashboard-card-action-btn"
            onClick={(e) => e.preventDefault()}
          >
            <MoreVertical className="w-4 h-4 student-dashboard-card-action-icon" />
          </button>
        </div>
      </Link>

      <div className="p-4">
        <Link to={`/student/dashboard/course/classes/${course.classId}`}>
          <h3 className="font-semibold text-lg student-dashboard-course-title mb-2 line-clamp-2 cursor-pointer hover:text-blue-600 transition-colors">
            {course.courseName}
          </h3>
        </Link>

        <p className="text-sm student-dashboard-course-subtitle mb-3 line-clamp-1">
          Năm học: {getYearFromDate(course.enrollmentDate)}
        </p>

        {course.progressPercentage !== null && (
          <div className="mt-3">
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm student-dashboard-progress-text">
                {course.progressPercentage}% complete
              </span>
            </div>
            <div className="w-full student-dashboard-progress-bg rounded-full h-2">
              <div
                className="student-dashboard-progress-fill h-2 rounded-full transition-all duration-300"
                style={{ width: `${course.progressPercentage}%` }}
              ></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CourseCard;
