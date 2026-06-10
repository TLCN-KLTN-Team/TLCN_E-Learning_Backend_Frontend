import { useEffect, useState } from "react";
import Header from "./Header";
import {
  ChangePassword,
  PaymentHistory,
  ProfileForm,
} from "@/components/shared/profile";
import { useAuth } from "@/context/auth-context/useAuth";
import type { User } from "@/context/auth-context/types";
import BoughtCourses from "@/components/shared/profile/BoughtCourses";
import EnrolledClassCourses from "@/components/shared/profile/EnrolledClassCoures";

const EditProfile = () => {
  const { user } = useAuth();
  const [isLoading] = useState(false);

  const handleSaveProfile = async () => {};

  useEffect(() => {
    document.title = "Chỉnh sửa hồ sơ";
  }, []);

  return (
    <div>
      <Header />

      <div className="min-h-screen p-3 sm:p-4 lg:p-6 max-w-6xl mx-auto space-y-4">
        <ProfileForm
          initialData={user as User}
          onSave={handleSaveProfile}
          isLoading={isLoading}
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-px bg-gray-200 dark:bg-gray-800 border border-gray-200 dark:border-gray-800 rounded-lg shadow-sm overflow-hidden">
          <div className="bg-white dark:bg-gray-900">
            <EnrolledClassCourses />
          </div>
          <div className="bg-white dark:bg-gray-900">
            <BoughtCourses />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-px bg-gray-200 dark:bg-gray-800 border border-gray-200 dark:border-gray-800 rounded-lg shadow-sm overflow-hidden">
          <div className="bg-white dark:bg-gray-900">
            <PaymentHistory payments={[]} />
          </div>
          <div className="bg-white dark:bg-gray-900">
            <ChangePassword isLoading={isLoading} />
          </div>
        </div>
      </div>
    </div>
  );
};
export default EditProfile;
