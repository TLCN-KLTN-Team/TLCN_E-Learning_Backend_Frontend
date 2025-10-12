import { useCallback } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline";
import CourseCard from "./CourseCard";
import type { Course } from "./types";
import { useTheme } from "@/context/theme-context";

interface SubjectsSectionProps {
  title?: string;
  subtitle?: string;
}

// Mock data cho courses
const mockCourses: Course[] = [
  {
    id: "1",
    title: "Làm Chủ Git và GitHub Từ A đến Z",
    instructor: "AI Coding",
    rating: 4.9,
    reviewCount: 200,
    price: 279000,
    originalPrice: 1099000,
    image:
      "https://www.udemy.com/staticx/udemy/js/webpack/coding-exercises-demo-preview-desktop.2957bed27c3ae43a02824b61ad9cda03.png",
    badge: "Thịnh hành & mới",
    isPopular: true,
  },
  {
    id: "2",
    title: "Vỡ lòng về Amazon Web Services",
    instructor: "Thang Nguyen",
    rating: 4.8,
    reviewCount: 466,
    price: 269000,
    originalPrice: 1019000,
    image: "https://img-c.udemycdn.com/course/240x135/3524426_55a1_2.jpg",
  },
  {
    id: "3",
    title: "Vỡ lòng về Automation với nền",
    instructor: "Thang Nguyen",
    rating: 4.7,
    reviewCount: 570,
    price: 279000,
    originalPrice: 809000,
    image: "https://img-c.udemycdn.com/course/240x135/4506576_3b24_2.jpg",
  },
  {
    id: "4",
    title: "Lập Trình Python Từ Cơ Bản Đến Nâng Cao Trong 30 Ngày",
    instructor: "AI Coding",
    rating: 4.8,
    reviewCount: 818,
    price: 279000,
    originalPrice: 1129000,
    image: "https://img-c.udemycdn.com/course/240x135/4506402_6c9d_2.jpg",
    badge: "Bán chạy nhất",
    isBestSeller: true,
  },
  {
    id: "5",
    title: "Tự động hoá công việc bằng AI agent và nền",
    instructor: "Thanh Nguyen",
    rating: 4.7,
    reviewCount: 128,
    price: 279000,
    originalPrice: 399000,
    image: "https://img-c.udemycdn.com/course/240x135/5659130_25b0_2.jpg",
  },
  {
    id: "6",
    title: "Machine Learning Cơ Bản Cho Người Mới Bắt Đầu",
    instructor: "Minh Hoang",
    rating: 4.6,
    reviewCount: 342,
    price: 299000,
    originalPrice: 699000,
    image: "", // Empty image để test default thumbnail
    badge: "Mới",
    isPopular: false,
  },
];
const SubjectsSection = ({ title, subtitle }: SubjectsSectionProps) => {
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
          <div className="flex gap-4 lg:gap-6 ml-0">
            {mockCourses.map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
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
