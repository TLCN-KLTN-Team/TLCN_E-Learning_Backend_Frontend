
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

export const subscribeToNotifications = (userId: string) => {
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8888';
    return new EventSource(`${baseUrl}/api/v1/notifications/subscribe/${userId}`);
};
