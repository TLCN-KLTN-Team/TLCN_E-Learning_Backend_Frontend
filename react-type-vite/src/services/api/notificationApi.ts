
import axiosInstance from "./httpClient/axiosInstance";

export interface NotificationMessage {
    userId: string;
    senderId?: string;
    type: string;
    message: string;
    link?: string;
    data?: any;
}

export const sendNotification = async (notification: NotificationMessage) => {
    return axiosInstance.post('/notifications/push', notification);
};

export const getUserNotifications = async (userId: string) => {
    return axiosInstance.get(`/notifications/user/${userId}`);
};

export const markNotificationAsRead = async (notificationId: string, userId: string) => {
    return axiosInstance.patch(`/notifications/${notificationId}/read`, null, {
        params: { userId },
    });
};

export const markAllNotificationsAsRead = async (userId: string) => {
    return axiosInstance.patch(`/notifications/user/${userId}/read-all`);
};

export const subscribeToNotifications = (userId: string) => {
    const apiBaseUrl = import.meta.env.VITE_BASE_URL || 'http://localhost:8888/api/v1';
    const normalizedBaseUrl = apiBaseUrl.replace(/\/$/, '');
    return new EventSource(`${normalizedBaseUrl}/notifications/subscribe/${userId}`);
};
