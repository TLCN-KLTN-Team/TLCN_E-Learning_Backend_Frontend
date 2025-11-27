import type React from "react";
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SystemRevenueTab from "@/components/system-admin/revenue/SystemRevenueTab";
import TeacherRevenueTab from "@/components/system-admin/revenue/TeacherRevenueTab";
import CourseRevenueTab from "@/components/system-admin/revenue/CourseRevenueTab";

const RevenueManagementPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState("system");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Theo dõi doanh thu</h1>
        <p className="text-gray-600 mt-1">
          Quản lý và theo dõi doanh thu từ hệ thống, giảng viên và khóa học
        </p>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 lg:w-[400px] bg-gray-100 p-1 rounded-lg">
          <TabsTrigger
            value="system"
            className="data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm hover:bg-gray-200 transition-all duration-200"
          >
            Hệ thống
          </TabsTrigger>
          <TabsTrigger
            value="teacher"
            className="data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm hover:bg-gray-200 transition-all duration-200"
          >
            Giảng viên
          </TabsTrigger>
          <TabsTrigger
            value="course"
            className="data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm hover:bg-gray-200 transition-all duration-200"
          >
            Khóa học
          </TabsTrigger>
        </TabsList>

        <TabsContent value="system" className="mt-6">
          <SystemRevenueTab />
        </TabsContent>

        <TabsContent value="teacher" className="mt-6">
          <TeacherRevenueTab />
        </TabsContent>

        <TabsContent value="course" className="mt-6">
          <CourseRevenueTab />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default RevenueManagementPage;
