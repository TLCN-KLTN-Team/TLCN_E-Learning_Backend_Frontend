import {
  CreditCard,
  Calendar,
  DollarSign,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { useTheme } from "@/context/theme-context/useTheme";
import type { PaymentHistoryItem } from "@/types/profile.types";

interface PaymentHistoryProps {
  payments: PaymentHistoryItem[];
}

const PaymentHistory = ({ payments }: PaymentHistoryProps) => {
  const { resolvedTheme } = useTheme();

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case "failed":
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Calendar className="w-5 h-5 text-yellow-500" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "completed":
        return "Thành công";
      case "failed":
        return "Thất bại";
      default:
        return "Đang xử lý";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return resolvedTheme === "dark" ? "text-green-400" : "text-green-600";
      case "failed":
        return resolvedTheme === "dark" ? "text-red-400" : "text-red-600";
      default:
        return resolvedTheme === "dark" ? "text-yellow-400" : "text-yellow-600";
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("vi-VN");
  };

  return (
    <div
      className={`p-6 rounded-lg shadow-lg ${
        resolvedTheme === "dark"
          ? "bg-slate-800 border border-slate-700"
          : "bg-white border border-slate-200"
      }`}
    >
      <div className="flex items-center space-x-2 mb-6">
        <CreditCard className="w-6 h-6 text-green-600" />
        <h2
          className={`text-2xl font-bold ${
            resolvedTheme === "dark" ? "text-white" : "text-slate-900"
          }`}
        >
          Lịch sử thanh toán
        </h2>
      </div>

      {payments.length === 0 ? (
        <div className="text-center py-8">
          <DollarSign
            className={`w-16 h-16 mx-auto mb-4 ${
              resolvedTheme === "dark" ? "text-slate-600" : "text-slate-300"
            }`}
          />
          <p
            className={
              resolvedTheme === "dark" ? "text-slate-400" : "text-slate-500"
            }
          >
            Chưa có giao dịch nào
          </p>
        </div>
      ) : (
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {payments.map((payment) => (
            <div
              key={payment.id}
              className={`border rounded-lg p-4 transition-colors ${
                resolvedTheme === "dark"
                  ? "border-slate-600 hover:bg-slate-700"
                  : "border-slate-200 hover:bg-slate-50"
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3
                    className={`font-semibold mb-1 ${
                      resolvedTheme === "dark" ? "text-white" : "text-slate-900"
                    }`}
                  >
                    {payment.courseName}
                  </h3>
                  <div
                    className={`flex items-center space-x-4 text-sm ${
                      resolvedTheme === "dark"
                        ? "text-slate-400"
                        : "text-slate-500"
                    }`}
                  >
                    <span>{formatDate(payment.date)}</span>
                    <span>•</span>
                    <span>{payment.paymentMethod}</span>
                  </div>
                </div>

                <div className="text-right">
                  <div
                    className={`font-bold text-lg mb-1 ${
                      resolvedTheme === "dark" ? "text-white" : "text-slate-900"
                    }`}
                  >
                    {formatCurrency(payment.amount)}
                  </div>
                  <div
                    className={`flex items-center space-x-1 text-sm ${getStatusColor(
                      payment.status
                    )}`}
                  >
                    {getStatusIcon(payment.status)}
                    <span>{getStatusText(payment.status)}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PaymentHistory;
