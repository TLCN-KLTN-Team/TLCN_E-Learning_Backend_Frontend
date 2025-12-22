import type { EnrolledCoursesResponse } from "@/services/api/student/courseEnrollmentApi";
import { MoreVertical } from "lucide-react";
import { Link } from "react-router-dom";

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
          <img
            src="https://res.cloudinary.com/dm7wobbxu/image/upload/v1766208954/pngtree-people-studying-and-learning-in-room-couch-banner-graphic-vector-png-image_52216108_pigaoq.jpg"
            alt={course.courseName}
            className="w-full h-full object-cover"
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
        <h3 className="font-semibold text-lg student-dashboard-course-title mb-2 line-clamp-2">
          {course.courseName}
        </h3>

        <p className="text-sm student-dashboard-course-subtitle mb-3 line-clamp-1">
          Năm học: {getYearFromDate(course.enrollmentDate)}
        </p>

        <div className="mt-3">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium">Tiến độ học tập</span>
            <span className="text-sm student-dashboard-progress-text">
              {course.progressPercentage !== null && course.progressPercentage !== undefined
                ? `${course.progressPercentage}%`
                : "0%"}
            </span>
          </div>
          <div className="w-full student-dashboard-progress-bg rounded-full h-3">
            <div
              className="student-dashboard-progress-fill h-3 rounded-full transition-all duration-300"
              style={{
                width: `${course.progressPercentage || 0}%`,
              }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseCard;
