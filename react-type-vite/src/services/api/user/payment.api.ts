import axiosInstance from "../httpClient/axiosInstance";
import type { ApiResponse } from "../response/apiResponse";

const PAYMENT_API_BASE_URL = `${
  import.meta.env.VITE_BASE_URL
}/course-management/payments`;

interface PaymentResponse {
  paymentUrl: string;
}

interface VNPayReturnResponse {
  success: boolean;
  message: string;
}

interface PaypalOrderResponse {
  orderId: string;
  status: string;
}

export interface OrderItem {
  publishedCourseId: number;
  finishedFee: number;
}

export interface OrderPreviewRequest {
  courseIds: number[];
  currency: string;
}

export interface OrderPreviewResponse {
  items: CourseItem[];
  totalPrice: string;
  amount: number;
  currency: string;
}

export interface CourseItem {
  id: number;
  courseName: string;
  price: string;
  amount: number;
  discountedPrice: string;
  imageUrl: string;
}

export const getOrderPreview = async (
  request: OrderPreviewRequest
): Promise<OrderPreviewResponse> => {
  const response = await axiosInstance.post<ApiResponse<OrderPreviewResponse>>(
    `${PAYMENT_API_BASE_URL}/preview`,
    request
  );
  return response.data.result;
};

export const createPayment = async (paymentData: {
  amount: number;
  currency: string;
  paymentType: string;
  orderItems: OrderItem[];
}): Promise<PaymentResponse> => {
  const response = await axiosInstance.post<PaymentResponse>(
    `${PAYMENT_API_BASE_URL}/create`,
    paymentData
  );
  return response.data;
};

export const handleVNPayPaymentReturn = async (
  params: Record<string, string>
): Promise<VNPayReturnResponse> => {
  const response = await axiosInstance.get<VNPayReturnResponse>(
    `${PAYMENT_API_BASE_URL}/vnpay/return`,
    { params }
  );
  return response.data;
};

export const capturePaypalOrder = async (
  orderId: string
): Promise<PaypalOrderResponse> => {
  const response = await axiosInstance.post<PaypalOrderResponse>(
    `${PAYMENT_API_BASE_URL}/paypal/capture/${orderId}`
  );
  return response.data;
};

export default {
  getOrderPreview,
  createPayment,
  handleVNPayPaymentReturn,
  capturePaypalOrder,
};
