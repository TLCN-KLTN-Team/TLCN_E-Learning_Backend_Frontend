import axiosInstance from "../httpClient/axiosInstance";

const PAYMENT_API_BASE_URL = `${
  import.meta.env.VITE_BASE_URL
}/course-management/payments/user`;

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
  createPayment,
  handleVNPayPaymentReturn,
  capturePaypalOrder,
};
