import axiosInstance from "@/services/api/httpClient/axiosInstance";
import type { ApiResponse } from "@/services/api/response/apiResponse";

const API_USER_ORDER_ENDPOINT = "/course-management/user/orders";
const API_TEACHER_ORDER_ENDPOINT = "/course-management/teacher/orders";
const API_ADMIN_ORDER_ENDPOINT = "/course-management/super-admin/orders";

export interface OrderItemResponse {
    id: number;
    orderId?: string;
    courseName: string;
    courseId: number;
    price: number;
    paymentStatus: "PENDING" | "PAID" | "PENDING_REFUND" | "REFUNDED" | "FAILED";
    thumbnailUrl?: string;
    payoutStatus?: string;
    orderDate?: string;
    buyerName?: string;
    buyerEmail?: string;
    buyerId?: string;
}

export interface OrderResponse {
    id: number;
    orderId: string;
    amount: number;
    currency: string;
    orderStatus: "PENDING" | "COMPLETED" | "CANCELLED" | "FAILED" | "REFUNDED";
    orderDate: string;
    paymentMethod?: string;
    orderItems: OrderItemResponse[];
}


const getHistoryOrders = async (): Promise<OrderResponse[]> => {
    const response = await axiosInstance.get<ApiResponse<OrderResponse[]>>(
        `${API_USER_ORDER_ENDPOINT}`
    );
    return response.data.result;
};

const refundCourse = async (orderItemId: number): Promise<void> => {
    await axiosInstance.post<ApiResponse<any>>(
        `${API_USER_ORDER_ENDPOINT}/refund/${orderItemId}`
    );
};

const getTeacherOrders = async (): Promise<OrderItemResponse[]> => {
    const response = await axiosInstance.get<ApiResponse<OrderItemResponse[]>>(
        `${API_TEACHER_ORDER_ENDPOINT}`
    );
    return response.data.result;
};

const getPendingRefunds = async (): Promise<OrderItemResponse[]> => {
    const response = await axiosInstance.get<ApiResponse<OrderItemResponse[]>>(
        `${API_ADMIN_ORDER_ENDPOINT}/pending-refund`
    );
    return response.data.result;
};

const approveRefund = async (orderItemId: number): Promise<void> => {
    await axiosInstance.post<ApiResponse<any>>(
        `${API_ADMIN_ORDER_ENDPOINT}/approve-refund/${orderItemId}`
    );
};

export default {
    getHistoryOrders,
    refundCourse,
    getTeacherOrders,
    getPendingRefunds,
    approveRefund,
};
