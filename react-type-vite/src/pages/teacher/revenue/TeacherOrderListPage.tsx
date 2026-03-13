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
import { Input } from "@/components/ui/input";
import { Search, ShoppingBag } from "lucide-react";
import OrderService, {
    type OrderItemResponse,
} from "@/services/api/user/orderApi";

const TeacherOrderListPage: React.FC = () => {
    const [orders, setOrders] = useState<OrderItemResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        document.title = "Quản lý đơn hàng - E-Learning Platform";
        fetchTeacherOrders();
    }, []);

    const fetchTeacherOrders = async () => {
        try {
            setLoading(true);
            const data = await OrderService.getTeacherOrders();
            setOrders(data);
        } catch (error) {
            console.error("Error fetching teacher orders:", error);
        } finally {
            setLoading(false);
        }
    };

    const filteredOrders = orders.filter((order) =>
        order.courseName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (order.buyerName && order.buyerName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (order.buyerEmail && order.buyerEmail.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const getStatusColor = (status: string) => {
        switch (status) {
            case "PAID":
                return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
            case "REFUNDED":
                return "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400";
            case "FAILED":
                return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
            default:
                return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400";
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
                        Danh sách đơn hàng
                    </h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        Theo dõi các học viên đã mua khóa học của bạn
                    </p>
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                    {/* Export functionality could be added here */}
                </div>
            </div>

            <Card className="p-4">
                <div className="flex items-center gap-2 mb-4">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input
                            placeholder="Tìm kiếm theo khóa học, người mua..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-9"
                        />
                    </div>
                </div>

                <div className="rounded-md border border-gray-200 dark:border-gray-800">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Khóa học</TableHead>
                                <TableHead>Người mua</TableHead>
                                <TableHead>Giá</TableHead>
                                <TableHead>Ngày mua</TableHead>
                                <TableHead>Trạng thái</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredOrders.length === 0 ? (
                                <TableRow>
                                    <TableCell
                                        colSpan={5}
                                        className="text-center py-8 text-gray-500"
                                    >
                                        Không tìm thấy đơn hàng nào
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredOrders.map((order) => (
                                    <TableRow key={order.id}>
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-md flex-shrink-0 overflow-hidden">
                                                    {order.thumbnailUrl ? (
                                                        <img 
                                                            src={order.thumbnailUrl} 
                                                            alt={order.courseName}
                                                            className="block w-full h-full min-w-full min-h-full object-cover" 
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center">
                                                            <ShoppingBag className="w-5 h-5 text-gray-400" />
                                                        </div>
                                                    )}
                                                </div>
                                                <span className="font-medium text-gray-900 dark:text-white">
                                                    {order.courseName}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="space-y-0.5">
                                                <div className="font-medium text-gray-900 dark:text-white">
                                                    {order.buyerName || "N/A"}
                                                </div>
                                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                                    {order.buyerEmail || ""}
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {new Intl.NumberFormat("vi-VN", {
                                                style: "currency",
                                                currency: "VND",
                                            }).format(order.price)}
                                        </TableCell>
                                        <TableCell>
                                            {order.orderDate
                                                ? format(new Date(order.orderDate), "dd/MM/yyyy HH:mm", {
                                                    locale: vi,
                                                })
                                                : "N/A"}
                                        </TableCell>
                                        <TableCell>
                                            <Badge className={getStatusColor(order.paymentStatus)}>
                                                {order.paymentStatus === "PAID"
                                                    ? "Đã thanh toán"
                                                    : order.paymentStatus === "REFUNDED"
                                                        ? "Đã hoàn tiền"
                                                        : order.paymentStatus}
                                            </Badge>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </Card>
        </div>
    );
};

export default TeacherOrderListPage;
