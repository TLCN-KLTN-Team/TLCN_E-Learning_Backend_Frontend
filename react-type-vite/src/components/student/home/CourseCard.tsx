import type { Course } from "./types";

const CourseCard = ({ course }: { course: Course }) => {
  return (
    <div className="flex-none w-48 lg:w-60 bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300 cursor-pointer">
      <div className="relative">
        <img
          src={course.image}
          alt={course.title}
          className="w-full h-44 sm:h-48 object-cover"
        />
        {course.badge && (
          <div
            className={`absolute top-2 left-2 px-2 py-1 text-xs font-semibold rounded ${
              course.isBestSeller
                ? "bg-orange-500 text-white"
                : course.isPopular
                ? "bg-green-500 text-white"
                : "bg-blue-500 text-white"
            }`}
          >
            {course.badge}
          </div>
        )}
      </div>

      <div className="px-4 py-2 space-y-1">
        <h3 className="text-sm font-semibold text-gray-900 line-clamp-2 min-h-[2.5rem] leading-tight">
          {course.title}
        </h3>

        <p className="text-sm text-gray-600 truncate">{course.instructor}</p>

        <div className="flex items-center gap-1">
          <span className="text-sm font-bold text-orange-500">
            {course.rating}
          </span>
          <div className="flex text-orange-400">
            {[...Array(5)].map((_, i) => (
              <svg key={i} className="w-3 h-3 fill-current" viewBox="0 0 20 20">
                <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
              </svg>
            ))}
          </div>
          <span className="text-xs text-gray-500 ml-1">
            ({course.reviewCount})
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-base sm:text-lg font-bold text-gray-900">
            {course.price.toLocaleString("vi-VN")} ₫
          </span>
          {course.originalPrice && (
            <span className="text-sm text-gray-500 line-through">
              {course.originalPrice.toLocaleString("vi-VN")} ₫
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default CourseCard;
