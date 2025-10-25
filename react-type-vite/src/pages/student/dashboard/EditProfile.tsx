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
  const [isLoading, setIsLoading] = useState(false);

  const handleSaveProfile = async () => {};

  useEffect(() => {
    document.title = "Chỉnh sửa hồ sơ";
  }, []);

  return (
    <div>
      <Header />

      <div className="min-h-screen p-6 lg:p-12">
        <ProfileForm
          initialData={user as User}
          onSave={handleSaveProfile}
          isLoading={isLoading}
        />

        <div className="grid grid-cols-2 space-x-2 bg-white border rounded-lg shadow-md mt-8">
          <EnrolledClassCourses />
          <BoughtCourses />
        </div>

        <div className="grid grid-cols-2 space-x-2 bg-white border rounded-lg shadow-md mt-8">
          <PaymentHistory payments={[]} />
          <ChangePassword onChangePassword={() => {}} isLoading={isLoading} />
        </div>
      </div>
    </div>
  );
};
export default EditProfile;
