import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Clock,
  Users,
  ArrowRight,
  BookOpen,
  Star,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

interface Course {
  id: string;
  title: string;
  description: string;
  duration: string;
  price: number;
  instructor?: string;
  thumbnail?: string;
  enrollmentCount?: number;
  rating?: number;
  category?: string;
  level?: string;
}

interface CoursesSectionProps {
  courses: Course[];
  categories?: string[];
  currentPage: number;
  totalPages: number;
  totalElements: number;
  loading?: boolean;
  onPageChange: (page: number) => void;
}

export function CoursesSection({
  courses,
  categories = [],
  currentPage,
  totalPages,
  totalElements,
  loading = false,
  onPageChange,
}: CoursesSectionProps) {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("newest");

  const filteredCourses = courses
    .filter((course) => {
      return selectedCategory === "all" || course.category === selectedCategory;
    })
    .sort((a, b) => {
      if (sortBy === "name") return a.title.localeCompare(b.title);
      if (sortBy === "price-low") return a.price - b.price;
      if (sortBy === "price-high") return b.price - a.price;
      if (sortBy === "popular")
        return (b.enrollmentCount || 0) - (a.enrollmentCount || 0);
      return 0;
    });

  const pageNumbers = Array.from({ length: totalPages }, (_, i) => i);
  const visiblePages = pageNumbers.filter(
    (p) => p === 0 || p === totalPages - 1 || Math.abs(p - currentPage) <= 1,
  );

  if (!loading && courses.length === 0 && currentPage === 0) {
    return (
      <section className="p-10 md:py-16 bg-background">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-8">
            Khóa học
          </h2>
          <div className="text-center py-16">
            <BookOpen className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground text-lg">
              Chưa có khóa học công bố. Theo dõi chúng tôi để nhận khóa học mới.
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="p-10 md:py-16 bg-background">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-foreground">
              Khóa học
            </h2>
            {totalElements > 0 && (
              <p className="text-sm text-muted-foreground mt-1">
                {totalElements} khóa học
              </p>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            {categories.length > 0 && (
              <Select
                value={selectedCategory}
                onValueChange={setSelectedCategory}
              >
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Lọc theo ngành" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả ngành</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Sắp xếp" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Mới nhất</SelectItem>
                <SelectItem value="popular">Phổ biến nhất</SelectItem>
                <SelectItem value="price-low">Giá thấp → cao</SelectItem>
                <SelectItem value="price-high">Giá cao → thấp</SelectItem>
                <SelectItem value="name">Theo tên</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="border animate-pulse overflow-hidden">
                <div className="w-full h-44 bg-muted" />
                <CardContent className="p-4 space-y-3">
                  <div className="h-5 bg-muted rounded w-3/4" />
                  <div className="h-4 bg-muted rounded w-full" />
                  <div className="h-4 bg-muted rounded w-5/6" />
                  <div className="flex justify-between items-center pt-1">
                    <div className="h-5 bg-muted rounded w-1/4" />
                    <div className="h-8 bg-muted rounded w-1/3" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
            {filteredCourses.map((course) => (
              <Card
                key={course.id}
                className="overflow-hidden hover:shadow-lg transition-all duration-300 border flex flex-col cursor-pointer"
                onClick={() => navigate(`/courses/${course.id}`)}
              >
                {/* Thumbnail */}
                <div className="w-full h-44 bg-gray-100 dark:bg-gray-800 flex items-center justify-center shrink-0 overflow-hidden">
                  {course.thumbnail ? (
                    <img
                      src={course.thumbnail}
                      alt={course.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <BookOpen className="w-12 h-12 text-gray-400" />
                  )}
                </div>

                <CardContent className="p-4 flex flex-col flex-1">
                  {/* Category */}
                  {course.category && (
                    <Badge
                      variant="secondary"
                      className="text-xs bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400 mb-2 w-fit"
                    >
                      {course.category}
                    </Badge>
                  )}

                  {/* Title */}
                  <h3 className="font-semibold text-foreground text-base mb-1 line-clamp-2 hover:text-blue-600 transition-colors">
                    {course.title}
                  </h3>

                  {/* Description */}
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-3 flex-1">
                    {course.description}
                  </p>

                  {/* Stats */}
                  <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground mb-3">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {course.duration}
                    </span>
                    {course.enrollmentCount !== undefined && (
                      <span className="flex items-center gap-1">
                        <Users className="w-3.5 h-3.5" />
                        {course.enrollmentCount.toLocaleString("vi-VN")}
                      </span>
                    )}
                    {course.rating != null && course.rating > 0 && (
                      <span className="flex items-center gap-1">
                        <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                        {course.rating.toFixed(1)}
                      </span>
                    )}
                  </div>

                  {/* Price + CTA */}
                  <div
                    className="flex items-center justify-between pt-3 border-t border-border"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <span className="text-base font-bold text-blue-600 dark:text-blue-400">
                      {course.price === 0
                        ? "Miễn phí"
                        : `${course.price.toLocaleString("vi-VN")} đ`}
                    </span>
                    <Button
                      size="sm"
                      className="bg-blue-600 hover:bg-blue-700 text-white gap-1 text-xs"
                      onClick={() => navigate(`/courses/${course.id}`)}
                    >
                      Xem khóa học
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {!loading && filteredCourses.length === 0 && courses.length > 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-lg">
              Không tìm thấy khóa học phù hợp
            </p>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-8">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 0 || loading}
              className="gap-1"
            >
              <ChevronLeft className="w-4 h-4" />
              Trước
            </Button>

            {visiblePages.map((p, idx) => {
              const prev = visiblePages[idx - 1];
              const showEllipsis = prev !== undefined && p - prev > 1;
              return (
                <span key={p} className="flex items-center gap-2">
                  {showEllipsis && (
                    <span className="text-muted-foreground px-1">...</span>
                  )}
                  <Button
                    variant={p === currentPage ? "default" : "outline"}
                    size="sm"
                    onClick={() => onPageChange(p)}
                    disabled={loading}
                    className={
                      p === currentPage
                        ? "bg-blue-600 hover:bg-blue-700 text-white min-w-[36px]"
                        : "min-w-[36px]"
                    }
                  >
                    {p + 1}
                  </Button>
                </span>
              );
            })}

            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage >= totalPages - 1 || loading}
              className="gap-1"
            >
              Sau
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        )}

        {/* View all link */}
        <div className="text-center mt-8">
          <Button
            variant="outline"
            className="gap-2 border-blue-200 text-blue-600 hover:bg-blue-50 hover:text-blue-700 dark:border-blue-800 dark:text-blue-400 dark:hover:bg-blue-900/20"
            onClick={() => navigate("/courses")}
          >
            Xem tất cả khóa học
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </section>
  );
}
