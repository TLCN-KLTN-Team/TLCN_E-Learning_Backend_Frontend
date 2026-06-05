import React, { useState, useEffect } from "react";
import {
  GraduationCap,
  Users,
  BookOpen,
  Building,
} from "lucide-react";
import * as educationUnitApi from "@/services/api/admin/educationUnitApi";
import type { EducationalUnitResponse } from "@/services/api/response/educationalUnitResponse";

const AdminStatsCards: React.FC = () => {
  const [educationalUnit, setEducationalUnit] =
    useState<EducationalUnitResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadEducationalUnit = async () => {
      try {
        setLoading(true);
        const data = await educationUnitApi.getMyEducationalUnit();
        setEducationalUnit(data);
      } catch (error) {
        console.error("Error loading educational unit:", error);
      } finally {
        setLoading(false);
      }
    };

    loadEducationalUnit();
  }, []);

  const stats = [
    {
      title: "Tổng Khóa Học",
      value: educationalUnit?.totalCourses || 0,
      icon: BookOpen,
      color: "blue",
      bgColor: "bg-blue-100",
      textColor: "text-blue-600",
      change: "+12.5%",
      trending: "up",
    },
    {
      title: "Tổng Giảng Viên",
      value: educationalUnit?.totalTeachers || 0,
      icon: Users,
      color: "green",
      bgColor: "bg-green-100",
      textColor: "text-green-600",
      change: "+8.2%",
      trending: "up",
    },
    {
      title: "Tổng Sinh Viên",
      value: educationalUnit?.totalStudents || 0,
      icon: GraduationCap,
      color: "purple",
      bgColor: "bg-purple-100",
      textColor: "text-purple-600",
      change: "+23.1%",
      trending: "up",
    },
    {
      title: "Tổng Khoa",
      value: educationalUnit?.totalDepartments || 0,
      icon: Building,
      color: "orange",
      bgColor: "bg-orange-100",
      textColor: "text-orange-600",
      change: "+5.0%",
      trending: "up",
    },
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-4 md:mb-6">
        {[...Array(4)].map((_, index) => (
          <div
            key={index}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 animate-pulse"
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded w-24 mb-3"></div>
                <div className="h-8 bg-gray-200 rounded w-16 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-20"></div>
              </div>
              <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-4 md:mb-6">
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <div
            key={index}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200"
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600 mb-1">
                  {stat.title}
                </p>
                <p className="text-3xl font-bold text-gray-900 mb-2">
                  {stat.value.toLocaleString()}
                </p>
                {/* 
                <div className="flex items-center space-x-1">
                  {stat.trending === "up" ? (
                    <TrendingUp className="w-3 h-3 text-green-500" />
                  ) : (
                    <TrendingDown className="w-3 h-3 text-red-500" />
                  )}
                  <span
                    className={`text-xs font-medium ${stat.trending === "up" ? "text-green-600" : "text-red-600"
                      }`}
                  >
                    {stat.change}
                  </span>
                  <span className="text-xs text-gray-500">vs tháng trước</span>
                </div>
                */}
              </div>
              <div className={`${stat.bgColor} p-3 rounded-full`}>
                <Icon className={`w-6 h-6 ${stat.textColor}`} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default AdminStatsCards;
