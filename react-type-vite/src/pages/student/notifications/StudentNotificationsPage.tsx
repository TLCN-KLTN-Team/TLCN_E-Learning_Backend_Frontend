import NotificationCenterPage from "@/components/shared/notifications/NotificationCenterPage";

const StudentNotificationsPage = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <NotificationCenterPage
        title="Thông báo học viên"
        fallbackPath="/student/dashboard"
        notificationsPagePath="/student/notifications"
      />
    </div>
  );
};

export default StudentNotificationsPage;
