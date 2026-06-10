import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ShoppingBag, BookOpen, ChevronRight } from "lucide-react";
import myCoursesApi, {
  type PurchasedCourse,
} from "@/services/api/user/myCoursesApi";

interface BoughtCoursesProps {
  onCourseClick?: (courseId: number) => void;
}

const BoughtCourses = ({ onCourseClick }: BoughtCoursesProps) => {
  const navigate = useNavigate();
  const [courses, setCourses] = useState<PurchasedCourse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const data = await myCoursesApi.getPurchasedCourses();
        if (active) setCourses(data ?? []);
      } catch (error) {
        console.error("Failed to load purchased courses", error);
        if (active) setCourses([]);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const handleCourseClick = (courseId: number) => {
    if (onCourseClick) {
      onCourseClick(courseId);
      return;
    }
    navigate(`/course/${courseId}/learn`);
  };

  return (
    <div className="p-4">
      <div className="flex items-center gap-2 mb-4">
        <ShoppingBag className="w-5 h-5 text-blue-500" />
        <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">
          Khóa học đã mua
        </h2>
        {!loading && courses.length > 0 && (
          <span className="ml-auto text-xs text-gray-500 dark:text-gray-400">
            {courses.length} khóa học
          </span>
        )}
      </div>

      {loading ? (
        <div className="space-y-2">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-14 rounded-md bg-gray-100 dark:bg-gray-800 animate-pulse"
            />
          ))}
        </div>
      ) : courses.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <BookOpen className="w-8 h-8 text-gray-300 dark:text-gray-600 mb-2" />
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Bạn chưa mua khóa học nào
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-gray-100 dark:divide-gray-800">
          {courses.map((course) => (
            <li key={course.publishedCourseId}>
              <button
                type="button"
                onClick={() => handleCourseClick(course.publishedCourseId)}
                className="group w-full flex items-center gap-3 py-2.5 px-1 text-left rounded-md hover:bg-gray-50 dark:hover:bg-gray-800/60 transition-colors"
              >
                {/* Thumbnail */}
                <div className="w-11 h-11 flex-shrink-0 rounded-md overflow-hidden bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                  {course.thumbnailUrl ? (
                    <img
                      src={course.thumbnailUrl}
                      alt={course.publishedCourseName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <BookOpen className="w-5 h-5 text-gray-400" />
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                    {course.publishedCourseName}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex-1 h-1 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-blue-500 transition-all"
                        style={{ width: `${course.progressPercentage}%` }}
                      />
                    </div>
                    <span className="text-[11px] tabular-nums text-gray-500 dark:text-gray-400 w-9 text-right">
                      {Math.round(course.progressPercentage)}%
                    </span>
                  </div>
                </div>

                <ChevronRight className="w-4 h-4 text-gray-300 dark:text-gray-600 group-hover:text-blue-500 flex-shrink-0" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default BoughtCourses;
