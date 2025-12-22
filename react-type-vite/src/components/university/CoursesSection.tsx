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
import { Clock, Users, ArrowRight, BookOpen, Star } from "lucide-react";

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
}

export function CoursesSection({
  courses,
  categories = [],
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

  // Check if there are no courses at all
  if (courses.length === 0) {
    return (
      <section className="p-10 md:py-16 bg-secondary/20 dark:bg-secondary/10">
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
    <section className="p-10 md:py-16 bg-secondary/20 dark:bg-secondary/10">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-foreground">
              Khóa học
            </h2>
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
                <SelectItem value="price-low">Giá thấp đến cao</SelectItem>
                <SelectItem value="price-high">Giá cao đến thấp</SelectItem>
                <SelectItem value="name">Theo tên</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-4">
          {filteredCourses.map((course) => (
            <Card
              key={course.id}
              className="overflow-hidden hover:shadow-lg transition-all duration-300 border"
            >
              <CardContent className="p-0">
                <div className="flex flex-col md:flex-row gap-4 p-5 md:p-6">
                  {/* Thumbnail */}
                  <div
                    className="w-full md:w-48 h-32 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center shrink-0 overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={() => navigate(`/courses/${course.id}`)}
                  >
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

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
                      <div className="flex-1">
                        <h3
                          className="text-lg font-semibold text-foreground mb-2 cursor-pointer hover:text-blue-600 transition-colors"
                          onClick={() => navigate(`/courses/${course.id}`)}
                        >
                          {course.title}
                        </h3>
                        {course.category && (
                          <Badge
                            variant="secondary"
                            className="text-xs bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400"
                          >
                            {course.category}
                          </Badge>
                        )}
                      </div>
                    </div>

                    <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                      {course.description}
                    </p>

                    <div className="flex flex-wrap items-center gap-4 text-sm mb-4">
                      <span className="flex items-center gap-1.5 text-muted-foreground">
                        <Clock className="w-4 h-4" />
                        {course.duration}
                      </span>
                      {course.enrollmentCount !== undefined && (
                        <span className="flex items-center gap-1.5 text-muted-foreground">
                          <Users className="w-4 h-4" />
                          {course.enrollmentCount.toLocaleString("vi-VN")}
                        </span>
                      )}
                      {course.rating && (
                        <span className="flex items-center gap-1.5 text-muted-foreground">
                          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                          {course.rating}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="text-xl font-bold text-blue-600 dark:text-blue-400">
                        {course.price.toLocaleString("vi-VN")} đ
                      </div>
                      <Button
                        className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
                        onClick={() => navigate(`/courses/${course.id}`)}
                      >
                        Đăng ký
                        <ArrowRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredCourses.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-lg">
              Không tìm thấy khóa học phù hợp
            </p>
          </div>
        )}

        <div className="text-center mt-8">
          <Button
            variant="outline"
            size="lg"
            className="gap-2 border-blue-600 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20"
          >
            Xem tất cả khóa học
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </section>
  );
}
