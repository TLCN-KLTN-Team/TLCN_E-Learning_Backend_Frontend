import { HatGlasses, Users, Calendar, Clock, ChevronRight } from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";

interface EnrolledClass {
  id: string;
  name: string;
  instructor: string;
  schedule: string;
  progress: number;
  nextClass?: string;
  totalStudents: number;
}

interface EnrolledClassCoursesProps {
  enrolledClasses?: EnrolledClass[];
}

// Mock data for demonstration
const mockEnrolledClasses: EnrolledClass[] = [
  {
    id: "1",
    name: "Lập trình React Advanced",
    instructor: "Nguyễn Văn A",
    schedule: "Thứ 2, 4, 6 - 19:00-21:00",
    progress: 75,
    nextClass: "2024-10-20 19:00",
    totalStudents: 25,
  },
  {
    id: "2",
    name: "JavaScript Fundamentals",
    instructor: "Trần Thị B",
    schedule: "Thứ 3, 5, 7 - 18:00-20:00",
    progress: 45,
    nextClass: "2024-10-19 18:00",
    totalStudents: 30,
  },
];

const EnrolledClassCourses = ({
  enrolledClasses = mockEnrolledClasses,
}: EnrolledClassCoursesProps) => {
  const renderProgressBar = (progress: number) => (
    <div className="w-full bg-gray-200 rounded-full h-2">
      <div
        className="bg-green-600 h-2 rounded-full transition-all duration-300"
        style={{ width: `${progress}%` }}
      ></div>
    </div>
  );

  const formatNextClass = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN", {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="p-6 rounded-lg">
      <div className="flex items-center mb-6">
        <HatGlasses className="w-12 h-12 text-green-500" />
        <h2 className="ml-2 text-2xl text-gray-900 font-bold">
          Lớp học đã tham gia
        </h2>
      </div>

      <div className="space-y-4">
        {enrolledClasses.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Bạn chưa tham gia lớp học nào</p>
            </CardContent>
          </Card>
        ) : (
          enrolledClasses.map((classItem) => (
            <Card
              key={classItem.id}
              className="hover:shadow-md transition-shadow"
            >
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="text-lg font-semibold text-gray-900 mb-2">
                      {classItem.name}
                    </CardTitle>
                    <CardDescription className="text-sm text-gray-600 mb-3">
                      Giảng viên: {classItem.instructor}
                    </CardDescription>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center text-sm text-gray-600">
                    <Calendar className="w-4 h-4 mr-2" />
                    {classItem.schedule}
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <Users className="w-4 h-4 mr-2" />
                    {classItem.totalStudents} học viên
                  </div>
                  {classItem.nextClass && (
                    <div className="flex items-center text-sm text-green-600 font-medium">
                      <Clock className="w-4 h-4 mr-2" />
                      Lớp tiếp theo: {formatNextClass(classItem.nextClass)}
                    </div>
                  )}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Tiến độ</span>
                      <span className="font-medium">{classItem.progress}%</span>
                    </div>
                    {renderProgressBar(classItem.progress)}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default EnrolledClassCourses;
