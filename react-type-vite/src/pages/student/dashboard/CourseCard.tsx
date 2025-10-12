import { MoreVertical } from "lucide-react";
import { Link } from "react-router-dom";

// Types
interface Course {
  id: number;
  title: string;
  subtitle: string;
  image: string;
  progress: number | null;
  category: string;
}

interface CourseCardProps {
  course: Course;
}

const CourseCard = ({ course }: CourseCardProps) => (
  <div className="student-dashboard-course-card hover:translate-y-[-4px] hover:shadow-lg transition-all duration-300">
    <Link
      to={`/student/course/${course.id}`}
      className="relative cursor-pointer block"
    >
      <img
        src={course.image}
        alt={course.title}
        className="w-full h-48 object-cover"
      />
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
      <Link to={`/student/course/${course.id}`}>
        <h3 className="font-semibold text-lg student-dashboard-course-title mb-2 line-clamp-2 cursor-pointer hover:text-blue-600 transition-colors">
          {course.title}
        </h3>
      </Link>
      <p className="text-sm student-dashboard-course-subtitle mb-3 line-clamp-1">
        {course.subtitle}
      </p>

      {course.progress !== null && (
        <div className="mt-3">
          <div className="flex justify-between items-center mb-1">
            <span className="text-sm student-dashboard-progress-text">
              {course.progress}% complete
            </span>
          </div>
          <div className="w-full student-dashboard-progress-bg rounded-full h-2">
            <div
              className="student-dashboard-progress-fill h-2 rounded-full transition-all duration-300"
              style={{ width: `${course.progress}%` }}
            ></div>
          </div>
        </div>
      )}
    </div>
  </div>
);

export default CourseCard;
