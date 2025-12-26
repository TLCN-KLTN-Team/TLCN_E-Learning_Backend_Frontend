import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import Header from "@/components/student/home/Header";
import Footer from "@/components/student/home/Footer";
import { HeroBanner } from "@/components/university/HeroBanner";
import { GeneralInfo } from "@/components/university/GeneralInfo";
import { LecturersSection } from "@/components/university/LecturersSection";
import { CoursesSection } from "@/components/university/CoursesSection";
import { getEducationalUnitById } from "@/services/api/anonymous/home.api";
import type { EducationalUnitDetailResponse } from "@/types/educational-unit.types";

import logo from "@/assets/university-hero.jpg";

const DEFAULT_AVATAR = "https://via.placeholder.com/100";
const DEFAULT_COURSE_IMAGE = "https://via.placeholder.com/300x200";

const DetailEducationalUnit = () => {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<EducationalUnitDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);

  // Fetch data from API
  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;

      setLoading(true);
      try {
        const response = await getEducationalUnitById(Number(id));
        setData(response);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const handleFollow = () => {
    setIsFollowing(!isFollowing);
  };

  const handleVisit = () => {
    if (data?.website) {
      window.open(data.website, "_blank");
    }
  };

  const handleContact = () => {
    if (data?.email) {
      window.location.href = `mailto:${data.email}`;
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

  if (!data) {
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

  // Prepare lecturers with default values
  const lecturers = data.teachers.map((teacher) => ({
    id: teacher.id,
    name: teacher.name,
    avatar: teacher.avatarUrl || DEFAULT_AVATAR,
    department: teacher.departmentName,
    email: "",
    title: teacher.academicDegree || "Giảng viên",
    bio: "",
  }));

  // Prepare courses with default values
  const courses = data.courses.map((course) => ({
    id: course.id.toString(),
    title: course.name,
    description: course.description || "Chưa có mô tả",
    duration: `${course.duration} giờ`,
    price: Number.parseFloat(course.price.replace(/[^0-9]/g, "")) || 0,
    instructor: course.departmentName || "Chưa xác định",
    thumbnail: course.coverImageUrl || DEFAULT_COURSE_IMAGE,
    enrollmentCount: course.numberOfStudents,
    rating: course.averageRating,
    category: course.departmentName || "Chưa phân loại",
    level: "Trung cấp",
  }));

  const categories = [
    ...new Set(courses.map((c) => c.category).filter(Boolean)),
  ] as string[];

  const departments = data.departments || [];

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <HeroBanner
        name={data.name}
        address={data.address}
        foundedYear={data.establishedYear}
        studentCount={data.totalStudents?.toLocaleString("vi-VN") || "0"}
        logoUrl={logo}
        bannerImage={logo}
        isFollowing={isFollowing}
        onFollow={handleFollow}
        onVisitWebsite={handleVisit}
        onContact={handleContact}
      />

      <div className="px-4 md:px-6 lg:px-8">
        <GeneralInfo
          description={data.description || "Chưa có mô tả chi tiết."}
          specializations={departments}
          educationLevels={[]}
          contact={{
            email: data.email || "",
            phone: data.phone || "",
            website: data.website || "",
          }}
        />

        <LecturersSection lecturers={lecturers} departments={departments} />

        <CoursesSection courses={courses} categories={categories} />
      </div>

      <Footer />
    </div>
  );
};

export default DetailEducationalUnit;
