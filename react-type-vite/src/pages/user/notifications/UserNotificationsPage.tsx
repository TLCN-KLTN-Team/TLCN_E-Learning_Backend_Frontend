import NotificationCenterPage from "@/components/shared/notifications/NotificationCenterPage";

const UserNotificationsPage = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <NotificationCenterPage
        title="Tất cả thông báo"
        fallbackPath="/my-courses"
        notificationsPagePath="/notifications"
      />
    </div>
  );
};

export default UserNotificationsPage;
