import NotificationCenterPage from "@/components/shared/notifications/NotificationCenterPage";

const TeacherNotificationsPage = () => {
  return (
    <NotificationCenterPage
      title="Thông báo giảng viên"
      fallbackPath="/teacher/home"
      notificationsPagePath="/teacher/notifications"
    />
  );
};

export default TeacherNotificationsPage;
