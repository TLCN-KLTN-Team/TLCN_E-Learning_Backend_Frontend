import React, { useState, useEffect } from "react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Download, AlertTriangle } from "lucide-react";
import OrderService, {
    type OrderItemResponse,
} from "@/services/api/user/orderApi";
import { toast } from "react-toastify";

const AdminRefundPage: React.FC = () => {
    const [refundedOrders, setRefundedOrders] = useState<OrderItemResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState<number | null>(null);
    const [confirmId, setConfirmId] = useState<number | null>(null);

    useEffect(() => {
        document.title = "Quản lý hoàn tiền - Admin Portal";
        fetchRefundedOrders();
    }, []);

    const fetchRefundedOrders = async () => {
        try {
            setLoading(true);
            const data = await OrderService.getPendingRefunds();
            setRefundedOrders(data);
        } catch (error) {
            console.error("Error fetching pending refunds:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleApproveRefund = async (orderItemId: number) => {
        try {
            setProcessingId(orderItemId);
            await OrderService.approveRefund(orderItemId);
            toast.success("Đã phê duyệt hoàn tiền thành công!");
            fetchRefundedOrders();
        } catch (error: any) {
            console.error("Error approving refund:", error);
            const msg = error.message || error.getDisplayMessage?.() || "Có lỗi xảy ra khi phê duyệt hoàn tiền";
            toast.error(msg);
        } finally {
            setProcessingId(null);
            setConfirmId(null);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center py-10">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                        Yêu cầu hoàn tiền
                    </h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        Các yêu cầu hoàn tiền đang chờ xử lý
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                        <Download className="w-4 h-4 mr-2" />
                        Xuất Excel
                    </Button>
                </div>
            </div>

            <Card className="p-4">
                <div className="rounded-md border border-gray-200 dark:border-gray-800">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Mã Item</TableHead>
                                <TableHead>Khóa học</TableHead>
                                <TableHead>Giá trị hoàn</TableHead>
                                <TableHead>Ngày đơn hàng</TableHead>
                                <TableHead>Trạng thái</TableHead>
                                <TableHead className="text-right">Hành động</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {refundedOrders.length === 0 ? (
                                <TableRow>
                                    <TableCell
                                        colSpan={6}
                                        className="text-center py-8 text-gray-500"
                                    >
                                        Không có yêu cầu hoàn tiền nào đang chờ xử lý
                                    </TableCell>
                                </TableRow>
                            ) : (
                                refundedOrders.map((order) => (
                                    <TableRow key={order.id}>
                                        <TableCell>#{order.id}</TableCell>
                                        <TableCell className="font-medium text-gray-900 dark:text-white">
                                            {order.courseName}
                                        </TableCell>
                                        <TableCell>
                                            {new Intl.NumberFormat("vi-VN", {
                                                style: "currency",
                                                currency: "VND",
                                            }).format(order.price)}
                                        </TableCell>
                                        <TableCell>
                                            {order.orderDate
                                                ? format(new Date(order.orderDate), "dd/MM/yyyy", {
                                                    locale: vi,
                                                })
                                                : "N/A"}
                                        </TableCell>
                                        <TableCell>
                                            <Badge className="bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400">
                                                Chờ xử lý
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button 
                                                size="sm" 
                                                className="bg-green-600 hover:bg-green-700 text-white"
                                                onClick={() => setConfirmId(order.id)}
                                                disabled={processingId === order.id}
                                            >
                                                {processingId === order.id ? "Đang xử lý..." : "Phê duyệt"}
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </Card>

            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-md border border-blue-200 dark:border-blue-800">
                <h3 className="font-semibold text-blue-800 dark:text-blue-300 mb-2">Quy trình xử lý hoàn tiền:</h3>
                <ol className="list-decimal list-inside text-sm text-blue-700 dark:text-blue-400 space-y-1">
                    <li>Xem xét yêu cầu hoàn tiền từ người dùng (kiểm tra thời gian, tiến độ học).</li>
                    <li>Nhấn nút <strong>"Phê duyệt"</strong> để chấp nhận yêu cầu.</li>
                    <li>Hệ thống sẽ tự động cập nhật trạng thái và điều chỉnh doanh thu giảng viên.</li>
                    <li>Sau đó truy cập cổng thanh toán (VNPay/PayPal) để thực hiện hoàn tiền thực tế.</li>
                </ol>
            </div>

            <AlertDialog open={confirmId !== null} onOpenChange={(open) => { if (!open) setConfirmId(null); }}>
                <AlertDialogContent className="max-w-md">
                    <AlertDialogHeader>
                        <div className="flex items-center gap-3 mb-1">
                            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 shrink-0">
                                <AlertTriangle className="w-5 h-5 text-green-600 dark:text-green-400" />
                            </div>
                            <AlertDialogTitle className="text-lg font-semibold text-gray-900 dark:text-white">
                                Xác nhận phê duyệt hoàn tiền
                            </AlertDialogTitle>
                        </div>
                        <AlertDialogDescription className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                            Bạn có chắc chắn muốn phê duyệt yêu cầu hoàn tiền cho{" "}
                            <span className="font-medium text-gray-700 dark:text-gray-300">
                                đơn hàng #{confirmId}
                            </span>
                            ? Hành động này sẽ cập nhật trạng thái đơn hàng và điều chỉnh doanh thu giảng viên.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="gap-2 sm:gap-2">
                        <AlertDialogCancel
                            className="flex-1 sm:flex-none"
                            disabled={processingId !== null}
                        >
                            Hủy
                        </AlertDialogCancel>
                        <AlertDialogAction
                            className="flex-1 sm:flex-none bg-green-600 hover:bg-green-700 text-white focus:ring-green-600"
                            onClick={() => confirmId !== null && handleApproveRefund(confirmId)}
                            disabled={processingId !== null}
                        >
                            {processingId !== null ? (
                                <span className="flex items-center gap-2">
                                    <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                                    Đang xử lý...
                                </span>
                            ) : (
                                "Phê duyệt"
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
};

export default AdminRefundPage;
