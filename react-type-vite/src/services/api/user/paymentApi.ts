import axiosInstance from "../httpClient/axiosInstance";

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

export const createVNPayPayment = async (paymentData: {
  amount: number;
  orderId: number;
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
    `${PAYMENT_API_BASE_URL}/return`,
    { params }
  );
  return response.data;
};

export default {
  createVNPayPayment,
  handleVNPayPaymentReturn,
};
