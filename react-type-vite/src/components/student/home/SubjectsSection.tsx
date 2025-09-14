import { useCallback } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline";
import CourseCard from "./CourseCard";
import type { Course } from "./types";

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

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  return (
    <section className="px-12 lg:px-24">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <h2 className="text-xl lg:text-3xl font-bold text-black mb-6">
          {title || "Lĩnh vực bạn sẽ học tiếp theo"}
        </h2>

        {/* Subject Tabs */}
        <div className="flex flex-col">
          <div className="flex items-center justify-between">
            <p className="text-lg lg:text-2xl font-bold text-black">
              {subtitle || "Được đề xuất cho bạn"}
            </p>

            {/* Navigation buttons - hide on mobile */}
            <div className="hidden sm:flex gap-2">
              <button
                onClick={scrollPrev}
                className="p-2 rounded-full border border-gray-300 hover:bg-gray-50 transition-colors disabled:opacity-50"
                aria-label="Previous courses"
              >
                <ChevronLeftIcon className="w-5 h-5 text-gray-600" />
              </button>
              <button
                onClick={scrollNext}
                className="p-2 rounded-full border border-gray-300 hover:bg-gray-50 transition-colors disabled:opacity-50"
                aria-label="Next courses"
              >
                <ChevronRightIcon className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          </div>

          {/* Embla Carousel */}
          <div className="overflow-hidden py-4 px-2" ref={emblaRef}>
            <div className="flex gap-3 sm:gap-4 ml-0">
              {mockCourses.map((course) => (
                <CourseCard key={course.id} course={course} />
              ))}
            </div>
          </div>

          {/* Mobile scroll indicator */}
          <div className="flex justify-center mt-4 sm:hidden">
            <p className="text-sm text-gray-500">← Vuốt để xem thêm →</p>
          </div>
        </div>

        {/* Active Subject Content */}
      </div>
    </section>
  );
};

export default SubjectsSection;
