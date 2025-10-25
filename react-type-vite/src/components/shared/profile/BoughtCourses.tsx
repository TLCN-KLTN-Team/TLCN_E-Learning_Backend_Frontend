import { ShoppingBag, BookOpen, ChevronRight, User } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface PurchasedCourse {
  id: string;
  title: string;
  instructor: string;
  thumbnail?: string;
}

interface BoughtCoursesProps {
  purchasedCourses?: PurchasedCourse[];
  onCourseClick?: (courseId: string) => void;
}

// Mock data for demonstration
const mockPurchasedCourses: PurchasedCourse[] = [
  {
    id: "1",
    title: "Complete Web Development Bootcamp",
    instructor: "Lê Văn C",
  },
  {
    id: "2",
    title: "Node.js và Express Framework",
    instructor: "Phạm Thị D",
  },
  {
    id: "3",
    title: "Database Design với MongoDB",
    instructor: "Hoàng Văn E",
  },
  {
    id: "4",
    title: "React Advanced Patterns",
    instructor: "Nguyễn Thị F",
  },
  {
    id: "5",
    title: "TypeScript Fundamentals",
    instructor: "Trần Văn G",
  },
];

const BoughtCourses = ({
  purchasedCourses = mockPurchasedCourses,
  onCourseClick,
}: BoughtCoursesProps) => {
  const handleCourseClick = (courseId: string) => {
    if (onCourseClick) {
      onCourseClick(courseId);
    }
  };

  return (
    <div className="p-6 rounded-lg">
      <div className="flex items-center mb-6">
        <ShoppingBag className="w-8 h-8 text-blue-500" />
        <h2 className="ml-2 text-xl text-gray-900 font-bold">
          Khóa học đã mua
        </h2>
      </div>

      <div className="space-y-3">
        {purchasedCourses.length === 0 ? (
          <Card className="text-center py-8">
            <CardContent>
              <BookOpen className="w-8 h-8 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">Bạn chưa mua khóa học nào</p>
            </CardContent>
          </Card>
        ) : (
          purchasedCourses.map((course) => (
            <Card
              key={course.id}
              className="hover:shadow-md hover:bg-blue-50 transition-all duration-200 cursor-pointer border-l-4 border-l-blue-500"
              onClick={() => handleCourseClick(course.id)}
            >
              <CardContent className="p-4">
                <div className="flex justify-between items-center">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 text-sm truncate mb-1">
                      {course.title}
                    </h3>
                    <div className="flex items-center text-xs text-gray-600">
                      <User className="w-3 h-3 mr-1" />
                      <span className="truncate">{course.instructor}</span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400 ml-2 flex-shrink-0" />
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default BoughtCourses;
