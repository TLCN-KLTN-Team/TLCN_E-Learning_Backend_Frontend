import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import Header from "@/components/student/home/Header";
import Footer from "@/components/student/home/Footer";
import { HeroBanner } from "@/components/university/HeroBanner";
import { GeneralInfo } from "@/components/university/GeneralInfo";
import { LecturersSection } from "@/components/university/LecturersSection";
import { CoursesSection } from "@/components/university/CoursesSection";
import { getEducationalUnitById } from "@/services/api/anonymous/home.api";
import type {
  EducationalUnit,
  Teacher,
  UnitCourse,
  EducationalUnitDetailResponse,
} from "@/types/educational-unit.types";

import logo from "@/assets/university-hero.jpg";

const DetailEducationalUnit = () => {
  const { id } = useParams<{ id: string }>();
  const [unit, setUnit] = useState<EducationalUnit | null>(null);
  const [instructors, setInstructors] = useState<Teacher[]>([]);
  const [courses] = useState<UnitCourse[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch data from API
  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;

      setLoading(true);
      try {
        const data: EducationalUnitDetailResponse =
          await getEducationalUnitById(Number(id));

        // Transform API response to EducationalUnit
        const transformedUnit: EducationalUnit = {
          id: data.id.toString(),
          name: data.name,
          logo: data.logo || "https://via.placeholder.com/150",
          bannerImage: data.logo || "https://via.placeholder.com/1920x400",
          address: data.address,
          establishedYear: data.establishedYear,
          totalStudents: data.totalStudents || 0,
          description: data.description || "Chưa có mô tả chi tiết.",
          specializations: [], // API không có field này, để trống
          trainingPrograms: [], // API không có field này, để trống
          email: data.email || "",
          phone: data.phone || "",
          website: data.website || "",
          isFollowing: false,
        };

        // Transform teachers
        const transformedInstructors: Teacher[] = data.teachers.map(
          (teacher) => ({
            id: teacher.id,
            name: teacher.name,
            avatar: teacher.avatarUrl || "https://via.placeholder.com/100",
            department: teacher.departmentName,
            email: "", // API không có field này
            title: teacher.academicDegree || "Giảng viên",
            bio: "",
          })
        );

        // Transform courses
        // const transformedCourses: UnitCourse[] = data.courses.map((course) => ({
        //   id: course.id.toString(),
        //   title: course.name,
        //   description: course.description || "Chưa có mô tả",
        //   duration: `${course.duration} giờ`,
        //   price: Number.parseFloat(course.price.replace(/[^0-9]/g, "")) || 0,
        //   instructor: course.departmentName || "Chưa xác định",
        //   thumbnail:
        //     course.coverImageUrl || "https://via.placeholder.com/300x200",
        //   enrollmentCount: course.numberOfStudents,
        //   rating: course.averageRating,
        //   category: course.departmentName || "Chưa phân loại",
        //   level: "Trung cấp",
        // }));

        setUnit(transformedUnit);
        setInstructors(transformedInstructors);
        // setCourses(transformedCourses);
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
