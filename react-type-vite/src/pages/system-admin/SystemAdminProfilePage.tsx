import type React from "react";
import ProfilePage from "@/components/shared/ProfilePage";

const SystemAdminProfilePage: React.FC = () => {
  return (
    <ProfilePage roleLabel="System Administrator" roleBadgeColor="green" />
  );
};

export default SystemAdminProfilePage;
