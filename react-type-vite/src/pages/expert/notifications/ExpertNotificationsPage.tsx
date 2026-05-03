import NotificationCenterPage from "@/components/shared/notifications/NotificationCenterPage";

const ExpertNotificationsPage = () => {
  return (
    <NotificationCenterPage
      title="Thông báo chuyên gia"
      fallbackPath="/expert/courses"
      notificationsPagePath="/expert/notifications"
    />
  );
};

export default ExpertNotificationsPage;
