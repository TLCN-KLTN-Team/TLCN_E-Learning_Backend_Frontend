import React, { useState, useEffect } from "react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { ShoppingBag, AlertTriangle, RefreshCw } from "lucide-react";
import Header from "@/components/student/home/Header";
import Footer from "@/components/student/home/Footer";
import OrderService, {
    type OrderResponse,
} from "@/services/api/user/orderApi";
import { toast } from "react-toastify";

const OrderHistoryPage: React.FC = () => {
    const [orders, setOrders] = useState<OrderResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedItemForRefund, setSelectedItemForRefund] = useState<{
        id: number;
        name: string;
    } | null>(null);
    const [refundLoading, setRefundLoading] = useState(false);

    useEffect(() => {
        document.title = "Lịch sử đơn hàng - E-Learning Platform";
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        try {
            setLoading(true);
            const data = await OrderService.getHistoryOrders();
            setOrders(data);
        } catch (error) {
            console.error("Error fetching orders:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleRefund = async () => {
        if (!selectedItemForRefund) return;

        try {
            setRefundLoading(true);
            await OrderService.refundCourse(selectedItemForRefund.id);
            toast.success("Yêu cầu hoàn tiền đã được gửi! Vui lòng chờ admin xử lý.");
            fetchOrders(); // Refresh list to update status
            setSelectedItemForRefund(null);
        } catch (error: any) {
            console.error("Refund failed:", error);
            console.log("Error details:", {
                message: error.message,
                code: error.code,
                name: error.name,
                getDisplayMessage: error.getDisplayMessage?.()
            });
            // AppError from axios interceptor has message property directly
            const msg = error.message || error.getDisplayMessage?.() || "Yêu cầu hoàn tiền thất bại.";
            toast.error(msg);
        } finally {
            setRefundLoading(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case "COMPLETED":
                return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
            case "PENDING":
                return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400";
            case "CANCELLED":
                return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
            case "REFUNDED":
                return "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400";
            default:
                return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400";
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case "COMPLETED": return "Thành công";
            case "PENDING": return "Chờ thanh toán";
            case "CANCELLED": return "Đã hủy";
            case "REFUNDED": return "Hoàn tiền"; // Usually mapped from OrderItem payment status if item level
            default: return status;
        }
    };

    const getPaymentStatusLabel = (status: string) => {
        switch (status) {
            case "PAID": return "Đã thanh toán";
            case "PENDING_REFUND": return "Chờ hoàn tiền";
            case "REFUNDED": return "Đã hoàn tiền";
            case "PENDING": return "Chờ xử lý";
            case "FAILED": return "Thất bại";
            default: return status;
        }
    };

    const getPaymentStatusColor = (status: string) => {
        switch (status) {
            case "PAID":
                return "text-green-600 dark:text-green-400";
            case "PENDING_REFUND":
                return "text-orange-600 dark:text-orange-400";
            case "REFUNDED":
                return "text-purple-600 dark:text-purple-400";
            case "FAILED":
                return "text-red-600 dark:text-red-400";
            default:
                return "text-yellow-600 dark:text-yellow-400";
        }
    };


    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-20 flex justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <Header />

            <main className="pt-24 pb-12">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                            <ShoppingBag className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                                Lịch sử đơn hàng
                            </h1>
                            <p className="text-gray-500 dark:text-gray-400 text-sm">
                                Quản lý các khóa học bạn đã mua và lịch sử giao dịch
                            </p>
                        </div>
                    </div>

                    <div className="space-y-6">
                        {orders.length === 0 ? (
                            <Card className="p-12 text-center text-gray-500 dark:text-gray-400">
                                Bạn chưa có đơn hàng nào.
                            </Card>
                        ) : (
                            orders.map((order) => (
                                <Card
                                    key={order.id}
                                    className="overflow-hidden border border-gray-200 dark:border-gray-800"
                                >
                                    <div className="bg-gray-50 dark:bg-gray-800/50 p-4 flex flex-wrap items-center justify-between gap-4 border-b border-gray-200 dark:border-gray-800">
                                        <div className="space-y-1">
                                            <div className="text-sm text-gray-500 dark:text-gray-400">
                                                Mã đơn hàng
                                            </div>
                                            <div className="font-mono font-medium text-gray-900 dark:text-white">
                                                #{order.orderId}
                                            </div>
                                        </div>
                                        <div className="space-y-1">
                                            <div className="text-sm text-gray-500 dark:text-gray-400">
                                                Ngày đặt
                                            </div>
                                            <div className="font-medium text-gray-900 dark:text-white">
                                                {order.orderDate ? format(new Date(order.orderDate), "dd 'thg' MM, yyyy", { locale: vi }) : "N/A"}
                                            </div>
                                        </div>
                                        <div className="space-y-1">
                                            <div className="text-sm text-gray-500 dark:text-gray-400">
                                                Tổng tiền
                                            </div>
                                            <div className="font-bold text-gray-900 dark:text-white">
                                                {new Intl.NumberFormat("vi-VN", {
                                                    style: "currency",
                                                    currency: order.currency || "VND",
                                                }).format(order.amount)}
                                            </div>
                                        </div>
                                        <div>
                                            <Badge className={getStatusColor(order.orderStatus)}>
                                                {getStatusLabel(order.orderStatus)}
                                            </Badge>
                                        </div>
                                    </div>

                                    <div className="divide-y divide-gray-100 dark:divide-gray-800">
                                        {order.orderItems.map((item) => (
                                            <div key={item.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-gray-50/50 dark:hover:bg-gray-800/20 transition-colors">
                                                <div className="flex items-start gap-4">
                                                    <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-md flex-shrink-0 overflow-hidden">
                                                        {item.thumbnailUrl ? (
                                                            <img 
                                                                src={item.thumbnailUrl} 
                                                                alt={item.courseName}
                                                                className="block w-full h-full min-w-full min-h-full object-cover" 
                                                            />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center">
                                                                <ShoppingBag className="w-6 h-6 text-gray-400" />
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
                                                            {item.courseName}
                                                        </h4>
                                                        <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                                                            {new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(item.price)}
                                                        </p>
                                                        <div className={`text-xs font-medium ${getPaymentStatusColor(item.paymentStatus)}`}>
                                                            {getPaymentStatusLabel(item.paymentStatus)}
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Refund Button Logic */}
                                                {item.paymentStatus === "PAID" && (
                                                    <Dialog>
                                                        <DialogTrigger asChild>
                                                            <Button variant="outline" size="sm"
                                                                className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 dark:border-red-900/30 dark:hover:bg-red-900/20"
                                                                onClick={() => setSelectedItemForRefund({ id: item.id, name: item.courseName })}
                                                            >
                                                                <RefreshCw className="w-4 h-4 mr-1.5" />
                                                                Hoàn tiền
                                                            </Button>
                                                        </DialogTrigger>
                                                        <DialogContent>
                                                            <DialogHeader>
                                                                <DialogTitle>Yêu cầu hoàn tiền</DialogTitle>
                                                                <DialogDescription>
                                                                    Bạn có chắc chắn muốn yêu cầu hoàn tiền cho khóa học <span className="font-semibold text-gray-900 dark:text-white">{item.courseName}</span>?
                                                                </DialogDescription>
                                                            </DialogHeader>

                                                            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-900/50 p-4 rounded-md text-sm text-yellow-800 dark:text-yellow-200 space-y-2 my-2">
                                                                <div className="flex items-center gap-2 font-semibold">
                                                                    <AlertTriangle className="w-4 h-4" />
                                                                    Lưu ý quan trọng:
                                                                </div>
                                                                <ul className="list-disc list-inside space-y-1 ml-1 opacity-90">
                                                                    <li>Yêu cầu chỉ được chấp nhận trong vòng <strong>7 ngày</strong> kể từ khi mua.</li>
                                                                    <li>Tiến độ học tập phải <strong>dưới 30%</strong>.</li>
                                                                    <li>Yêu cầu sẽ được gửi đến admin để <strong>xét duyệt</strong>.</li>
                                                                    <li>Tiền sẽ được hoàn lại sau khi admin phê duyệt.</li>
                                                                </ul>
                                                            </div>

                                                            <DialogFooter>
                                                                <Button variant="ghost" onClick={() => setSelectedItemForRefund(null)}>Hủy bỏ</Button>
                                                                <Button
                                                                    className="bg-red-600 hover:bg-red-700 text-white"
                                                                    onClick={handleRefund}
                                                                    disabled={refundLoading}
                                                                >
                                                                    {refundLoading ? "Đang xử lý..." : "Xác nhận hoàn tiền"}
                                                                </Button>
                                                            </DialogFooter>
                                                        </DialogContent>
                                                    </Dialog>
                                                )}

                                                {item.paymentStatus === "PENDING_REFUND" && (
                                                    <Badge variant="outline" className="border-orange-200 text-orange-700 bg-orange-50 dark:border-orange-900/30 dark:text-orange-400 dark:bg-orange-900/20">
                                                        Chờ hoàn tiền
                                                    </Badge>
                                                )}

                                                {item.paymentStatus === "REFUNDED" && (
                                                    <Badge variant="outline" className="border-purple-200 text-purple-700 bg-purple-50 dark:border-purple-900/30 dark:text-purple-400 dark:bg-purple-900/20">
                                                        Đã hoàn tiền
                                                    </Badge>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </Card>
                            ))
                        )}
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
};

export default OrderHistoryPage;
