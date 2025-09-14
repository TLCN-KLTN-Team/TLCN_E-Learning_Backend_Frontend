import { MoreVertical } from "lucide-react";

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
  <div className="student-dashboard-course-card">
    <div className="relative cursor-pointer">
      <img
        src={course.image}
        alt={course.title}
        className="w-full h-48 object-cover"
      />
      <div className="absolute top-3 right-3">
        <button className="student-dashboard-card-action-btn">
          <MoreVertical className="w-4 h-4 student-dashboard-card-action-icon" />
        </button>
      </div>
    </div>

    <div className="p-4">
      <h3 className="font-semibold text-lg student-dashboard-course-title mb-2 line-clamp-2 cursor-pointer">
        {course.title}
      </h3>
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
