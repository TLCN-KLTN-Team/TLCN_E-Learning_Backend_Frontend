import { useState } from "react";
import { useNavigate } from "react-router-dom";
import type { PublishedCourseCardResponse } from "@/types/course.types";
import DefaultThumbnail from "@/components/shared/DefaultThumbnail";
import { useTheme } from "@/context/theme-context";

interface CourseDetailProps {
  course: PublishedCourseCardResponse;
  variant?: "carousel" | "grid";
}

const CourseDetail = ({ course, variant = "carousel" }: CourseDetailProps) => {
  const [imageError, setImageError] = useState(false);
  const { theme } = useTheme();
  const navigate = useNavigate();

  const handleImageError = () => {
    setImageError(true);
  };

  const handleCourseClick = () => {
    navigate(`/courses/${course.id}`);
  };

  const widthClass =
    variant === "carousel" ? "flex-none w-64 lg:w-72" : "w-full";

  return (
    <div
      onClick={handleCourseClick}
      className={`${widthClass} ${
        theme === "dark" ? "bg-gray-800" : "bg-white"
      } rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer border ${
        theme === "dark"
          ? "border-gray-700 hover:border-gray-600"
          : "border-gray-100 hover:border-gray-200"
      }`}
    >
      {/* Thumbnail Section */}
      <div className="relative w-full h-40 overflow-hidden">
        {!imageError && course.thumbnailUrl ? (
          <img
            src={course.thumbnailUrl}
            alt={course.courseName}
            className="w-full h-full object-cover"
            onError={handleImageError}
            loading="lazy"
          />
        ) : (
          <DefaultThumbnail
            title={course.courseName}
            className="w-full h-full"
          />
        )}

        {/* Badge */}
        {course.isHandsOn && (
          <div className="absolute top-3 left-3 px-3 py-1 text-xs font-semibold rounded-full shadow-sm bg-blue-500 text-white">
            Thực hành
          </div>
        )}
        {course.studentCount > 1000 && (
          <div className="absolute top-3 right-3 px-3 py-1 text-xs font-semibold rounded-full shadow-sm bg-orange-500 text-white">
            Bán chạy
          </div>
        )}
      </div>

      {/* Content Section */}
      <div className="p-4 space-y-2">
        {/* Title */}
        <h3
          className={`text-base font-semibold leading-snug line-clamp-2 min-h-[2rem] ${
            theme === "dark" ? "text-white" : "text-gray-900"
          }`}
        >
          {course.courseName}
        </h3>

        {/* Instructor */}
        <p
          className={`text-sm font-medium ${
            theme === "dark" ? "text-gray-300" : "text-gray-600"
          }`}
        >
          {course.authorName || "Đang cập nhật"}
        </p>

        {/* Rating Section */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-amber-500">
            {course.rating.toFixed(1)}
          </span>
          <div className="flex text-amber-400">
            {[...Array(5)].map((_, i) => (
              <svg
                key={i}
                className={`w-3.5 h-3.5 ${
                  i < Math.floor(course.rating)
                    ? "fill-current"
                    : "fill-gray-300"
                }`}
                viewBox="0 0 20 20"
              >
                <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
              </svg>
            ))}
          </div>
          <span
            className={`text-xs ${
              theme === "dark" ? "text-gray-400" : "text-gray-500"
            }`}
          >
            ({course.reviewCount.toLocaleString()})
          </span>
        </div>

        {/* Price Section */}
        <div className="flex items-center gap-2 pt-1">
          <span
            className={`text-lg font-bold ${
              theme === "dark" ? "text-white" : "text-gray-900"
            }`}
          >
            {course.coursePrice}
          </span>
        </div>
      </div>
    </div>
  );
};

export default CourseDetail;
