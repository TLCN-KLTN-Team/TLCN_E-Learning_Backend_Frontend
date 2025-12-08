import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import Header from "@/components/student/home/Header";
import Footer from "@/components/student/home/Footer";
import { HeroBanner } from "@/components/university/HeroBanner";
import { GeneralInfo } from "@/components/university/GeneralInfo";
import { LecturersSection } from "@/components/university/LecturersSection";
import { CoursesSection } from "@/components/university/CoursesSection";
import type {
  EducationalUnit,
  Instructor,
  UnitCourse,
} from "@/types/educational-unit.types";

import logo from "@/assets/university-hero.jpg";

const DetailEducationalUnit = () => {
  const { id } = useParams<{ id: string }>();
  const [unit, setUnit] = useState<EducationalUnit | null>(null);
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [courses, setCourses] = useState<UnitCourse[]>([]);
  const [loading, setLoading] = useState(true);

  // Mock data - Replace with actual API calls
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Mock data cho Đại học Bách khoa Hà Nội
        const mockUnit: EducationalUnit = {
          id: id || "1",
          name: "Đại học Bách khoa Hà Nội",
          logo: "https://via.placeholder.com/150",
          bannerImage: "https://via.placeholder.com/1920x400",
          address: "Số 1 Đại Cồ Việt, Hai Bà Trưng, Hà Nội",
          establishedYear: 1956,
          totalStudents: 35000,
          description:
            "Trường Đại học Bách khoa Hà Nội là một trong những trường đại học kỹ thuật hàng đầu Việt Nam, tiên phong trong nghiên cứu và đào tạo các ngành kỹ thuật công nghệ cao. Với lịch sử gần 70 năm, trường đã đào tạo hàng trăm nghìn kỹ sư, cử nhân chất lượng cao phục vụ cho sự phát triển của đất nước.",
          specializations: [
            "Công nghệ thông tin",
            "Điện - Điện tử",
            "Cơ khí",
            "Hóa học",
            "Vật liệu",
            "Xây dựng",
          ],
          trainingPrograms: [
            "Đại học chính quy",
            "Thạc sĩ",
            "Tiến sĩ",
            "Chương trình tiên tiến",
            "Chương trình quốc tế",
          ],
          email: "dhbk@hust.edu.vn",
          phone: "024 3869 4242",
          website: "https://www.hust.edu.vn",
          isFollowing: false,
        };

        const mockInstructors: Instructor[] = [
          {
            id: "1",
            name: "PGS.TS Nguyễn Văn An",
            avatar: "https://via.placeholder.com/100",
            department: "Công nghệ thông tin",
            email: "an.nguyen@hust.edu.vn",
            title: "Phó Giáo sư",
          },
          {
            id: "2",
            name: "TS. Trần Thị Bích",
            avatar: "https://via.placeholder.com/100",
            department: "Điện - Điện tử",
            email: "bich.tran@hust.edu.vn",
            title: "Tiến sĩ",
          },
          {
            id: "3",
            name: "ThS. Lê Minh Cường",
            avatar: "https://via.placeholder.com/100",
            department: "Cơ khí",
            email: "cuong.le@hust.edu.vn",
            title: "Thạc sĩ",
          },
          {
            id: "4",
            name: "GS.TS Phạm Đức Dũng",
            avatar: "https://via.placeholder.com/100",
            department: "Hóa học",
            email: "dung.pham@hust.edu.vn",
            title: "Giáo sư",
          },
          {
            id: "5",
            name: "TS. Hoàng Thị Ế",
            avatar: "https://via.placeholder.com/100",
            department: "Vật liệu",
            email: "e.hoang@hust.edu.vn",
            title: "Tiến sĩ",
          },
          {
            id: "6",
            name: "PGS.TS Vũ Văn Phúc",
            avatar: "https://via.placeholder.com/100",
            department: "Xây dựng",
            email: "phuc.vu@hust.edu.vn",
            title: "Phó Giáo sư",
          },
        ];

        const mockCourses: UnitCourse[] = [
          {
            id: "1",
            title: "Lập trình hướng đối tượng với Java",
            description:
              "Khóa học toàn diện về lập trình hướng đối tượng sử dụng ngôn ngữ Java, bao gồm các khái niệm cơ bản và nâng cao.",
            duration: "45 giờ",
            price: 2800000,
            instructor: "PGS.TS Nguyễn Văn An",
            thumbnail: "https://via.placeholder.com/300x200",
            enrollmentCount: 1850,
            rating: 4.8,
            category: "Công nghệ thông tin",
          },
          {
            id: "2",
            title: "Mạch điện tử số và vi xử lý",
            description:
              "Tìm hiểu về thiết kế mạch điện tử số và lập trình vi xử lý cho các ứng dụng nhúng.",
            duration: "50 giờ",
            price: 3200000,
            instructor: "TS. Trần Thị Bích",
            thumbnail: "https://via.placeholder.com/300x200",
            enrollmentCount: 1450,
            rating: 4.7,
            category: "Điện - Điện tử",
          },
          {
            id: "3",
            title: "Thiết kế cơ khí với CAD/CAM",
            description:
              "Khóa học về thiết kế và sản xuất cơ khí sử dụng phần mềm CAD/CAM hiện đại.",
            duration: "40 giờ",
            price: 3000000,
            instructor: "ThS. Lê Minh Cường",
            thumbnail: "https://via.placeholder.com/300x200",
            enrollmentCount: 1200,
            rating: 4.6,
            category: "Cơ khí",
          },
          {
            id: "4",
            title: "Hóa học vô cơ và phân tích",
            description:
              "Nắm vững các kiến thức về hóa học vô cơ và các phương pháp phân tích hóa học.",
            duration: "48 giờ",
            price: 2500000,
            instructor: "GS.TS Phạm Đức Dũng",
            thumbnail: "https://via.placeholder.com/300x200",
            enrollmentCount: 980,
            rating: 4.9,
            category: "Hóa học",
          },
          {
            id: "5",
            title: "Vật liệu composite tiên tiến",
            description:
              "Nghiên cứu về các loại vật liệu composite hiện đại và ứng dụng trong công nghiệp.",
            duration: "42 giờ",
            price: 3500000,
            instructor: "TS. Hoàng Thị Ế",
            thumbnail: "https://via.placeholder.com/300x200",
            enrollmentCount: 756,
            rating: 4.7,
            category: "Vật liệu",
          },
        ];

        setUnit(mockUnit);
        setInstructors(mockInstructors);
        setCourses(mockCourses);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const handleFollow = () => {
    if (unit) {
      setUnit({ ...unit, isFollowing: !unit.isFollowing });
    }
  };

  const handleVisit = () => {
    if (unit?.website) {
      window.open(unit.website, "_blank");
    }
  };

  const handleContact = () => {
    if (unit?.email) {
      window.location.href = `mailto:${unit.email}`;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Đang tải...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!unit) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-20 text-center">
          <h2 className="text-2xl font-bold text-foreground">
            Không tìm thấy đơn vị đào tạo
          </h2>
        </div>
        <Footer />
      </div>
    );
  }

  const categories = [
    ...new Set(courses.map((c) => c.category).filter(Boolean)),
  ] as string[];

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <HeroBanner
        name={unit.name}
        address={unit.address}
        foundedYear={unit.establishedYear}
        studentCount={unit.totalStudents.toLocaleString("vi-VN")}
        logoUrl={logo}
        bannerImage={logo}
        isFollowing={unit.isFollowing}
        onFollow={handleFollow}
        onVisitWebsite={handleVisit}
        onContact={handleContact}
      />

      <GeneralInfo
        description={unit.description}
        specializations={unit.specializations}
        educationLevels={unit.trainingPrograms}
        contact={{
          email: unit.email,
          phone: unit.phone,
          website: unit.website,
        }}
      />

      <LecturersSection
        lecturers={instructors}
        departments={[...new Set(instructors.map((i) => i.department))]}
      />

      <CoursesSection courses={courses} categories={categories} />

      <Footer />
    </div>
  );
};

export default DetailEducationalUnit;
