import NotificationCenterPage from "@/components/shared/notifications/NotificationCenterPage";

const SystemAdminNotificationsPage = () => {
  return (
    <NotificationCenterPage
      title="Thông báo hệ thống"
      fallbackPath="/system-admin/dashboard"
      notificationsPagePath="/system-admin/notifications"
    />
  );
};

export default SystemAdminNotificationsPage;
