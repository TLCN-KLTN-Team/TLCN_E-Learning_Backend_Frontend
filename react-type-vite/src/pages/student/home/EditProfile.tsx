import { useEffect, useState } from "react";
import { useTheme } from "@/context/theme-context/useTheme";
import {
  PaymentHistory,
  ChangePassword,
  ProfileForm,
} from "@/components/shared/profile";
import type {
  ChangePasswordData,
  PaymentHistoryItem,
} from "@/types/profile.types";
import Header from "@/components/student/home/Header";
import Footer from "@/components/student/home/Footer";
import SmartBreadcrumb from "@/components/shared/navigation/SmartBreadcrumb";
import { useAuth } from "@/context/auth-context/useAuth";
import type { User } from "@/context/auth-context/types";
import {
  updateProfile,
  type UserUpdateRequest,
} from "@/services/api/superadmin/userApi";
import { toast } from "react-toastify";

// Type for form data

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
  const { user } = useAuth();

  const handleSaveProfile = async (profileData: UserUpdateRequest) => {
    setIsLoading(true);
    try {
      // TODO: Gọi API để lưu thông tin profile
      console.log("Saving profile data:", profileData);

      // Simulate API call
      await updateProfile(profileData);

      toast.success("Cập nhật thông tin thành công!");
    } catch (error) {
      toast.error(
        error
          ? (error as Error).message
          : "Có lỗi xảy ra khi cập nhật thông tin!"
      );
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

  useEffect(() => {
    document.title = "Chỉnh sửa hồ sơ - E-Learning Platform";
    console.log("user:", user);
  }, [user]);

  return (
    <div
      className={`min-h-screen p-6 lg:p-12 ${
        resolvedTheme === "dark" ? "bg-slate-900" : "bg-slate-50"
      }`}
    >
      <Header />

      <div className="max-w-6xl mx-auto space-y-8 mt-12 lg:mt-16">
        {/* Modern Breadcrumb Navigation */}
        <SmartBreadcrumb
          currentPath="/edit profile"
          homePath="/"
          className="mb-6"
        />

        {/* Combined Profile Section - Display and Edit in one */}
        <ProfileForm
          initialData={user as User}
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
