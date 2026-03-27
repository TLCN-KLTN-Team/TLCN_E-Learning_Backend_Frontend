import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Search, Eye, Filter } from "lucide-react";
import * as creditTransferApi from "@/services/api/expert/creditTransferApi";
import type { CreditTransferResponse } from "@/services/api/response/creditTransferResponse";
import CreditTransferDetailModal from "@/components/expert/creditTransfer/CreditTransferDetailModal";
import { toast } from "react-toastify";

const CreditTransferApprovalPage: React.FC = () => {
    const [requests, setRequests] = useState<CreditTransferResponse[]>([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [searchKeyword, setSearchKeyword] = useState("");
    const [filterStatus, setFilterStatus] = useState("all");
    const [selectedRequest, setSelectedRequest] = useState<CreditTransferResponse | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const fetchRequests = async () => {
        try {
            setLoading(true);
            const statusParam = filterStatus === 'all' ? undefined : filterStatus;
            const response = await creditTransferApi.searchCreditTransfers(statusParam, searchKeyword, page, 10);
            setRequests(response.content || []);
            setTotalPages(response.totalPages);
        } catch (error) {
            console.error("Failed to fetch requests", error);
            toast.error("Không thể tải danh sách yêu cầu");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRequests();
    }, [page, filterStatus]); // Reload when page or filter changes

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setPage(0);
        fetchRequests();
    };

    const handleViewDetail = (request: CreditTransferResponse) => {
        setSelectedRequest(request);
        setIsModalOpen(true);
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'APPROVED': return 'bg-green-100 text-green-800';
            case 'REJECTED': return 'bg-red-100 text-red-800';
            case 'PENDING': return 'bg-yellow-100 text-yellow-800';
            case 'INTERVIEW_SCHEDULED': return 'bg-indigo-100 text-indigo-800';
            case 'INTERVIEW_SCORED': return 'bg-purple-100 text-purple-800';
            case 'PENDING_EXPERT_REVIEW': return 'bg-blue-100 text-blue-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'PENDING': return 'Chờ xếp vấn đáp';
            case 'INTERVIEW_SCHEDULED': return 'Đã xếp lịch';
            case 'INTERVIEW_SCORED': return 'Đã chấm vấn đáp';
            case 'PENDING_EXPERT_REVIEW': return 'Chờ expert duyệt';
            case 'APPROVED': return 'Đã duyệt';
            case 'REJECTED': return 'Từ chối';
            default: return status;
        }
    };

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Phê duyệt Tín chỉ Ngoài trường</h1>
                <p className="text-gray-600">Quản lý và xét duyệt các yêu cầu quy đổi điểm từ khóa học bên ngoài.</p>
            </div>

            {/* Filter & Search Bar */}
            <div className="bg-white p-4 rounded-xl shadow-sm mb-6 flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0 text-sm">
                <div className="flex items-center space-x-4 w-full md:w-auto">
                    <div className="relative">
                        <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                        <select
                            aria-label="Lọc trạng thái hồ sơ quy đổi"
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            className="pl-10 pr-8 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none appearance-none bg-white"
                        >
                            <option value="all">Tất cả trạng thái</option>
                            <option value="PENDING">Chờ xếp vấn đáp</option>
                            <option value="INTERVIEW_SCHEDULED">Đã xếp lịch</option>
                            <option value="PENDING_EXPERT_REVIEW">Chờ expert duyệt</option>
                            <option value="APPROVED">Đã duyệt</option>
                            <option value="REJECTED">Đã từ chối</option>
                        </select>
                    </div>
                </div>

                <form onSubmit={handleSearch} className="relative w-full md:w-96">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Tìm theo tên SV hoặc tên khóa học..."
                        className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        value={searchKeyword}
                        onChange={(e) => setSearchKeyword(e.target.value)}
                    />
                </form>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Thông tin Sinh viên</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Khóa học Nguồn (External)</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Khóa học Đích (Internal)</th>
                                <th className="px-6 py-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Ngày gửi</th>
                                <th className="px-6 py-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Trạng thái</th>
                                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Hành động</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-10 text-center text-gray-500">
                                        <div className="animate-spin h-6 w-6 border-2 border-blue-500 rounded-full border-t-transparent mx-auto mb-2"></div>
                                        Đang tải dữ liệu...
                                    </td>
                                </tr>
                            ) : requests.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-10 text-center text-gray-500 italic">
                                        Không tìm thấy yêu cầu nào.
                                    </td>
                                </tr>
                            ) : (
                                requests.map((req) => (
                                    <tr key={req.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900">{req.studentName || 'N/A'}</div>
                                            <div className="text-xs text-gray-500">{req.studentId}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm text-gray-900 line-clamp-1" title={req.sourceCourseName}>{req.sourceCourseName}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm text-green-700 font-medium line-clamp-1" title={req.targetCourseName}>{req.targetCourseName}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500">
                                            {new Date(req.requestDate).toLocaleDateString("vi-VN")}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center">
                                            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(req.status)}`}>
                                                {getStatusLabel(req.status)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="text-blue-600 hover:text-blue-900 hover:bg-blue-50"
                                                onClick={() => handleViewDetail(req)}
                                            >
                                                <Eye size={16} className="mr-1" /> Chi tiết
                                            </Button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {totalPages > 0 && (
                    <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                        <div className="text-sm text-gray-500">
                            Trang {page + 1} / {totalPages}
                        </div>
                        <div className="flex space-x-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPage(p => Math.max(0, p - 1))}
                                disabled={page === 0}
                            >
                                Trước
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                                disabled={page >= totalPages - 1}
                            >
                                Sau
                            </Button>
                        </div>
                    </div>
                )}
            </div>

            <CreditTransferDetailModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={fetchRequests}
                creditTransfer={selectedRequest}
            />
        </div>
    );
};

export default CreditTransferApprovalPage;
