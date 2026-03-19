import NotificationCenterPage from "@/components/shared/notifications/NotificationCenterPage";

const AdminNotificationsPage = () => {
  return (
    <NotificationCenterPage
      title="Thông báo quản trị"
      fallbackPath="/admin/dashboard"
      notificationsPagePath="/admin/notifications"
    />
  );
};

export default AdminNotificationsPage;
