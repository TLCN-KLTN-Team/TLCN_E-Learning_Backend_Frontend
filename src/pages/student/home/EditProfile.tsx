import { useState } from "react";
import { useTheme } from "@/context/theme-context/useTheme";
import {
  ProfileHeader,
  ProfileForm,
  PaymentHistory,
  ChangePassword,
} from "@/components/student/profile";
import type {
  ProfileFormData,
  ChangePasswordData,
  PaymentHistoryItem,
} from "@/types/profile.types";
import Header from "@/components/student/home/Header";
import Footer from "@/components/student/home/Footer";

// Mock data - thay thế bằng dữ liệu thực từ API
const mockUserData = {
  name: "Alex Johnson",
  jobTitle: "Senior Developer",
  location: "San Francisco, CA",
  company: "Tech Corp",
  avatar: undefined, // sẽ sử dụng getAvartarFromName
};

const mockProfileData = {
  fullName: "Alex Johnson",
  bio: "Tôi là một lập trình viên full-stack với hơn 5 năm kinh nghiệm trong việc phát triển ứng dụng web và mobile. Đam mê học hỏi các công nghệ mới và chia sẻ kiến thức với cộng đồng.",
  interests: [
    "React",
    "Node.js",
    "TypeScript",
    "Machine Learning",
    "UI/UX Design",
  ],
};

const mockPayments: PaymentHistoryItem[] = [
  {
    id: "1",
    courseName: "React Advanced Course",
    amount: 2500000,
    date: "2024-01-15",
    status: "completed" as const,
    paymentMethod: "Visa **** 1234",
  },
  {
    id: "2",
    courseName: "Node.js Masterclass",
    amount: 1800000,
    date: "2024-02-20",
    status: "completed" as const,
    paymentMethod: "MasterCard **** 5678",
  },
  {
    id: "3",
    courseName: "TypeScript Fundamentals",
    amount: 1200000,
    date: "2024-03-10",
    status: "failed" as const,
    paymentMethod: "Visa **** 9012",
  },
];

const EditProfile = () => {
  const { resolvedTheme } = useTheme();
  const [isLoading, setIsLoading] = useState(false);

  const handleSaveProfile = async (profileData: ProfileFormData) => {
    setIsLoading(true);
    try {
      // TODO: Gọi API để lưu thông tin profile
      console.log("Saving profile data:", profileData);

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 2000));

      alert("Cập nhật thông tin thành công!");
    } catch (error) {
      console.error("Error saving profile:", error);
      alert("Có lỗi xảy ra khi cập nhật thông tin!");
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangePassword = async (passwordData: ChangePasswordData) => {
    setIsLoading(true);
    try {
      // TODO: Gọi API để đổi mật khẩu
      console.log("Changing password:", passwordData);

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 2000));

      alert("Đổi mật khẩu thành công!");
    } catch (error) {
      console.error("Error changing password:", error);
      alert("Có lỗi xảy ra khi đổi mật khẩu!");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className={`min-h-screen p-6 lg:p-12 ${
        resolvedTheme === "dark" ? "bg-slate-900" : "bg-slate-50"
      }`}
    >
      <Header />
      <div className="max-w-6xl mx-auto space-y-8 mt-12 lg:mt-16">
        {/* Header Section */}
        <ProfileHeader
          name={mockUserData.name}
          jobTitle={mockUserData.jobTitle}
          location={mockUserData.location}
          company={mockUserData.company}
          avatar={mockUserData.avatar}
        />

        {/* Profile Form Section */}
        <ProfileForm
          initialData={mockProfileData}
          onSave={handleSaveProfile}
          isLoading={isLoading}
        />

        {/* Bottom Container: Payment History & Change Password */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Payment History */}
          <PaymentHistory payments={mockPayments} />

          {/* Change Password */}
          <ChangePassword
            onChangePassword={handleChangePassword}
            isLoading={isLoading}
          />
        </div>

        <Footer />
      </div>
    </div>
  );
};

export default EditProfile;
