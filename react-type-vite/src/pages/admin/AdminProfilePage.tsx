import type React from "react";
import ProfilePage from "@/components/shared/ProfilePage";

const AdminProfilePage: React.FC = () => {
  return <ProfilePage roleLabel="Quản trị viên" roleBadgeColor="purple" />;
};

export default AdminProfilePage;
