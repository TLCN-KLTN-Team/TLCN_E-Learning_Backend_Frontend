import { useCallback } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline";
import CourseCard from "./CourseCardComponent";
import { useTheme } from "@/context/theme-context";
import type { PublishedCourseCardResponse } from "@/types/course.types";

interface SubjectsSectionProps {
  title?: string;
  subtitle?: string;
  courses?: PublishedCourseCardResponse[];
  loading?: boolean;
}

const SubjectsSection = ({
  title,
  subtitle,
  courses,
  loading = false,
}: SubjectsSectionProps) => {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: false,
    align: "start",
    slidesToScroll: 1,
    breakpoints: {
      "(min-width: 768px)": { slidesToScroll: 2 },
      "(min-width: 1024px)": { slidesToScroll: 3 },
    },
  });

  const { theme } = useTheme();

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  return (
    <section className="px-4 sm:px-8 lg:px-12 xl:px-24 py-8">
      <div className="container mx-auto">
        {/* Section Header */}
        <div className="mb-8">
          <h2
            className={`text-2xl lg:text-4xl font-bold mb-2 ${
              theme === "dark" ? "text-white" : "text-gray-900"
            }`}
          >
            {title || "Lĩnh vực bạn sẽ học tiếp theo"}
          </h2>

          <div className="flex items-center justify-between mt-6">
            <div>
              <p
                className={`text-lg lg:text-xl font-semibold ${
                  theme === "dark" ? "text-gray-200" : "text-gray-700"
                }`}
              >
                {subtitle || "Được đề xuất cho bạn"}
              </p>
              <p
                className={`text-sm mt-1 ${
                  theme === "dark" ? "text-gray-400" : "text-gray-500"
                }`}
              >
                Khám phá các khóa học phù hợp với bạn
              </p>
            </div>

            {/* Navigation buttons - hide on mobile */}
            <div className="hidden sm:flex gap-3">
              <button
                onClick={scrollPrev}
                className={`p-3 rounded-full border transition-all duration-200 hover:scale-105 ${
                  theme === "dark"
                    ? "border-gray-600 bg-gray-800 hover:bg-gray-700 text-white"
                    : "border-gray-200 bg-white hover:bg-gray-50 text-gray-600 shadow-sm hover:shadow-md"
                }`}
                aria-label="Previous courses"
              >
                <ChevronLeftIcon className="w-5 h-5" />
              </button>
              <button
                onClick={scrollNext}
                className={`p-3 rounded-full border transition-all duration-200 hover:scale-105 ${
                  theme === "dark"
                    ? "border-gray-600 bg-gray-800 hover:bg-gray-700 text-white"
                    : "border-gray-200 bg-white hover:bg-gray-50 text-gray-600 shadow-sm hover:shadow-md"
                }`}
                aria-label="Next courses"
              >
                <ChevronRightIcon className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Embla Carousel */}
        <div className="overflow-hidden" ref={emblaRef}>
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-bs-primary"></div>
            </div>
          ) : (
            <div className="flex gap-4 lg:gap-6 ml-0">
              {courses?.map((course) => (
                <CourseCard key={course.id} course={course} />
              ))}
            </div>
          )}
        </div>

        {/* Mobile scroll indicator */}
        <div className="flex justify-center mt-6 sm:hidden">
          <p
            className={`text-sm ${
              theme === "dark" ? "text-gray-400" : "text-gray-500"
            } flex items-center gap-2`}
          >
            <span>←</span>
            <span>Vuốt để xem thêm</span>
            <span>→</span>
          </p>
        </div>
      </div>
    </section>
  );
};

export default SubjectsSection;
