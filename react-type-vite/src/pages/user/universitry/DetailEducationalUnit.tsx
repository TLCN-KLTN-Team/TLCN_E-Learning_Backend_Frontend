import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import Header from "@/components/student/home/Header";
import Footer from "@/components/student/home/Footer";
import { HeroBanner } from "@/components/university/HeroBanner";
import { GeneralInfo } from "@/components/university/GeneralInfo";
import { LecturersSection } from "@/components/university/LecturersSection";
import { CoursesSection } from "@/components/university/CoursesSection";
import {
  getEducationalUnitById,
  getTeachersByEducationalUnit,
  getCoursesByEducationalUnit,
} from "@/services/api/anonymous/home.api";
import type {
  EducationalUnitDetailResponse,
  EducationalUnitTeacher,
  EducationalUnitCourse,
  PaginatedResponse,
} from "@/types/educational-unit.types";

import logo from "@/assets/university-hero.jpg";

const DEFAULT_AVATAR = "https://via.placeholder.com/100";
const DEFAULT_COURSE_IMAGE = "https://via.placeholder.com/300x200";

const mapTeacher = (t: EducationalUnitTeacher) => ({
  id: t.id,
  name: t.name,
  avatar: t.avatarUrl || DEFAULT_AVATAR,
  department: t.departmentName,
  email: "",
  title: t.academicDegree || "Giảng viên",
  bio: "",
});

const mapCourse = (c: EducationalUnitCourse) => ({
  id: c.id.toString(),
  title: c.name,
  description: c.description || "Chưa có mô tả",
  duration: `${c.duration} giờ`,
  price: Number.parseFloat(c.price.replace(/[^0-9]/g, "")) || 0,
  instructor: c.departmentName || "Chưa xác định",
  thumbnail: c.coverImageUrl || DEFAULT_COURSE_IMAGE,
  enrollmentCount: c.numberOfStudents,
  rating: c.averageRating,
  category: c.departmentName || "Chưa phân loại",
  level: "Trung cấp",
});

const DetailEducationalUnit = () => {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<EducationalUnitDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);

  // Teachers pagination state
  const [teachersData, setTeachersData] =
    useState<PaginatedResponse<EducationalUnitTeacher> | null>(null);
  const [teacherPage, setTeacherPage] = useState(0);
  const [teachersLoading, setTeachersLoading] = useState(false);

  // Courses pagination state
  const [coursesData, setCoursesData] =
    useState<PaginatedResponse<EducationalUnitCourse> | null>(null);
  const [coursePage, setCoursePage] = useState(0);
  const [coursesLoading, setCoursesLoading] = useState(false);

  // Fetch basic unit info (metadata, departments, totals)
  useEffect(() => {
    if (!id) return;
    setLoading(true);
    getEducationalUnitById(Number(id))
      .then(setData)
      .catch((err) => console.error("Error fetching unit:", err))
      .finally(() => setLoading(false));
  }, [id]);

  // Fetch teachers page
  useEffect(() => {
    if (!id) return;
    setTeachersLoading(true);
    getTeachersByEducationalUnit(Number(id), teacherPage, 8)
      .then(setTeachersData)
      .catch((err) => console.error("Error fetching teachers:", err))
      .finally(() => setTeachersLoading(false));
  }, [id, teacherPage]);

  // Fetch courses page
  useEffect(() => {
    if (!id) return;
    setCoursesLoading(true);
    getCoursesByEducationalUnit(Number(id), coursePage, 6)
      .then(setCoursesData)
      .catch((err) => console.error("Error fetching courses:", err))
      .finally(() => setCoursesLoading(false));
  }, [id, coursePage]);

  const handleFollow = () => setIsFollowing(!isFollowing);

  const handleVisit = () => {
    if (data?.website) window.open(data.website, "_blank");
  };

  const handleContact = () => {
    if (data?.email) window.location.href = `mailto:${data.email}`;
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

  const lecturers = (teachersData?.content ?? []).map(mapTeacher);
  const courses = (coursesData?.content ?? []).map(mapCourse);
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

        <LecturersSection
          lecturers={lecturers}
          departments={departments}
          currentPage={teacherPage}
          totalPages={teachersData?.totalPages ?? 0}
          totalElements={teachersData?.totalElements ?? 0}
          loading={teachersLoading}
          onPageChange={setTeacherPage}
        />

        <CoursesSection
          courses={courses}
          categories={departments}
          currentPage={coursePage}
          totalPages={coursesData?.totalPages ?? 0}
          totalElements={coursesData?.totalElements ?? 0}
          loading={coursesLoading}
          onPageChange={setCoursePage}
        />
      </div>

      <Footer />
    </div>
  );
};

export default DetailEducationalUnit;
