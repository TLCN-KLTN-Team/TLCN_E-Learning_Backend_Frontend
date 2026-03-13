import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Users,
    Search,
    UserPlus,
    Trash2,
    Edit,
    Mail,
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight,
    Lock,
    Unlock,
    X,
    User,
    Phone,
    FileText,
    UserCheck
} from "lucide-react";
import { toast } from "react-toastify";
import ImportExpertsModal from "@/components/admin/expert/ImportExpertsModal";
import ExpertFormModal from "@/components/admin/expert/ExpertFormModal";
import * as expertApi from "@/services/api/expert/expertApi";

import * as educationUnitApi from "@/services/api/admin/educationUnitApi";
import type { ExpertResponse } from "@/services/api/response/expertResponse";
import type { EducationalUnitResponse } from "@/services/api/response/educationalUnitResponse";

const ExpertListPage: React.FC = () => {
    const [experts, setExperts] = useState<ExpertResponse[]>([]);
    const [showExpertModal, setShowExpertModal] = useState(false);
    const [showImportModal, setShowImportModal] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [loading, setLoading] = useState(true);
    const [educationalUnitLoading, setEducationalUnitLoading] = useState(true);
    const [currentEducationalUnit, setCurrentEducationalUnit] =
        useState<EducationalUnitResponse | null>(null);
    const [educationalUnitId, setEducationalUnitId] = useState<number | null>(
        null
    );

    // Pagination state
    const [currentPage, setCurrentPage] = useState(0);
    const [pageSize, setPageSize] = useState(10);
    const [totalElements, setTotalElements] = useState(0);
    const [totalPages, setTotalPages] = useState(0);

    // State cho chức năng chỉnh sửa
    const [editingExpert, setEditingExpert] = useState<ExpertResponse | null>(
        null
    );

    // State cho detail modal
    const [selectedExpert, setSelectedExpert] =
        useState<ExpertResponse | null>(null);
    const [showDetailModal, setShowDetailModal] = useState(false);

    // Initialize EducationalUnit
    useEffect(() => {
        const initializeEducationalUnit = async () => {
            try {
                setEducationalUnitLoading(true);
                const educationalUnit = await educationUnitApi.getMyEducationalUnit();
                setCurrentEducationalUnit(educationalUnit);
                setEducationalUnitId(educationalUnit.id);
            } catch (error: any) {
                console.error("Failed to load educationalUnit:", error);
                toast.error("Không thể tải dữ liệu cơ sở giáo dục");
            } finally {
                setEducationalUnitLoading(false);
            }
        };

        initializeEducationalUnit();
    }, []);

    const loadExperts = async (
        page: number = currentPage,
        size: number = pageSize,
        search?: string
    ) => {
        if (!educationalUnitId) return;

        try {
            setLoading(true);
            const response = await expertApi.getExperts(
                educationalUnitId,
                page,
                size,
                search || ""
            );
            // Adjust based on actual API response structure observed in previous view
            const result = response.result || {};
            setExperts(result.content || []);
            setTotalElements(result.totalElements || 0);
            setTotalPages(result.totalPages || 0);
            setCurrentPage(page);
        } catch (error: any) {
            console.error("Error loading experts:", error);
            toast.error("Không thể tải danh sách chuyên gia");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (educationalUnitId) {
            loadExperts(0, pageSize);
        }
    }, [educationalUnitId, pageSize]);

    // Handle search with debounce
    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            if (educationalUnitId) {
                loadExperts(0, pageSize, searchTerm);
            }
        }, 500);

        return () => clearTimeout(delayDebounceFn);
    }, [searchTerm]);

    const handleSuccess = () => {
        loadExperts(currentPage, pageSize);
    };

    const handleDeleteExpert = async (
        expertId: string,
        expertName: string
    ) => {
        if (
            window.confirm(
                `Bạn có chắc chắn muốn xóa chuyên gia "${expertName}"? Hành động này không thể hoàn tác.`
            )
        ) {
            try {
                await expertApi.deleteExpert(educationalUnitId!, expertId);
                toast.success("Xóa chuyên gia thành công!");
                handleSuccess();
            } catch (error: any) {
                console.error("Error deleting expert:", error);
                toast.error(
                    error?.response?.data?.message || "Không thể xóa chuyên gia"
                );
            }
        }
    };

    const handleEditExpert = (expert: ExpertResponse) => {
        setEditingExpert(expert);
        setShowExpertModal(true);
    };

    const handleCloseModal = () => {
        setShowExpertModal(false);
        setEditingExpert(null);
    };

    const handleViewDetails = (expert: ExpertResponse) => {
        setSelectedExpert(expert);
        setShowDetailModal(true);
    };

    const handleToggleAccountStatus = async (expert: ExpertResponse) => {
        const newStatus =
            expert.accountStatus === "ACTIVE" ? "INACTIVE" : "ACTIVE";
        const action = newStatus === "INACTIVE" ? "vô hiệu hóa" : "kích hoạt";

        if (
            window.confirm(
                `Bạn có chắc chắn muốn ${action} tài khoản của "${expert.firstName} ${expert.lastName}"?`
            )
        ) {
            try {
                await expertApi.updateExpertAccountStatus(
                    educationalUnitId!,
                    expert.id,
                    newStatus
                );
                toast.success(
                    `${action.charAt(0).toUpperCase() + action.slice(1)
                    } tài khoản thành công!`
                );
                handleSuccess();
            } catch (error: any) {
                console.error("Error toggling account status:", error);
                toast.error(`Không thể ${action} tài khoản`);
            }
        }
    };

    // Pagination handlers
    const handlePageChange = (newPage: number) => {
        if (newPage >= 0 && newPage < totalPages) {
            loadExperts(newPage, pageSize);
        }
    };

    const handlePageSizeChange = (newSize: number) => {
        setPageSize(newSize);
        setCurrentPage(0);
    };

    const getStatusBadge = (status: string) => {
        const statusMap: Record<string, { label: string; className: string }> = {
            ACTIVE: {
                label: "Đang hoạt động",
                className: "bg-green-100 text-green-800",
            },
            INACTIVE: {
                label: "Không hoạt động",
                className: "bg-gray-100 text-gray-800",
            },
        };

        const statusInfo = statusMap[status] || {
            label: status,
            className: "bg-gray-100 text-gray-800",
        };

        return (
            <span
                className={`px-2 py-1 text-xs font-medium rounded-full ${statusInfo.className}`}
            >
                {statusInfo.label}
            </span>
        );
    };

    if (educationalUnitLoading) {
        return (
            <div className="p-6">
                <div className="animate-pulse">
                    <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
                    <div className="space-y-4">
                        {[...Array(5)].map((_, i) => (
                            <div key={i} className="h-16 bg-gray-200 rounded"></div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    if (!educationalUnitId) {
        return (
            <div className="p-6">
                <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
                    <h3 className="text-lg font-medium text-red-900 mb-2">
                        Không tìm thấy cơ sở giáo dục
                    </h3>
                    <p className="text-red-700">
                        Không thể tải dữ liệu cơ sở giáo dục. Vui lòng thử làm mới trang.
                    </p>
                </div>
            </div>
        );
    }

    if (loading && experts.length === 0) {
        return (
            <div className="p-6">
                <div className="animate-pulse">
                    <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
                    <div className="space-y-4">
                        {[...Array(5)].map((_, i) => (
                            <div key={i} className="h-16 bg-gray-200 rounded"></div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center space-y-4 lg:space-y-0">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                        <Users className="mr-3 text-green-600" size={32} />
                        Quản lý Chuyên gia
                    </h1>
                    <p className="text-gray-600 mt-1">
                        Quản lý đội ngũ chuyên gia cho{" "}
                        {currentEducationalUnit?.name || "cơ sở giáo dục của bạn"}
                    </p>
                </div>
                <div className="flex gap-3">
                    <Button
                        onClick={() => setShowImportModal(true)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 text-lg"
                    >
                        <FileText className="mr-2" size={18} />
                        Import từ File
                    </Button>
                    <Button
                        onClick={() => setShowExpertModal(true)}
                        className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 text-lg"
                    >
                        <UserPlus className="mr-2" size={18} />
                        Tạo Chuyên gia Mới
                    </Button>
                </div>
            </div>

            {/* Statistics and Search */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                <div className="lg:col-span-1">
                    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                        <div className="flex items-center">
                            <div className="p-2 bg-green-100 rounded-lg">
                                <Users className="text-green-600" size={24} />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600">
                                    Tổng Chuyên gia
                                </p>
                                <p className="text-2xl font-bold text-gray-900">
                                    {totalElements}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-3">
                    <div className="relative">
                        <Search
                            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                            size={20}
                        />
                        <Input
                            placeholder="Tìm kiếm chuyên gia theo tên, username, email hoặc mã chuyên gia..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 h-12 text-lg"
                            autoComplete="off"
                            role="search"
                        />
                    </div>
                </div>
            </div>

            {/* Experts Table */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                {experts.length === 0 ? (
                    <div className="p-12 text-center">
                        {totalElements === 0 ? (
                            <>
                                <Users className="mx-auto text-gray-400 mb-4" size={48} />
                                <h3 className="text-lg font-medium text-gray-900 mb-2">
                                    Không tìm thấy chuyên gia nào
                                </h3>
                                <p className="text-gray-500 mb-4">
                                    Bắt đầu bằng cách tạo tài khoản chuyên gia đầu tiên
                                </p>
                                <Button
                                    onClick={() => setShowExpertModal(true)}
                                    className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 text-lg"
                                >
                                    <UserPlus className="mr-2" size={16} />
                                    Tạo Chuyên gia
                                </Button>
                            </>
                        ) : (
                            <>
                                <Search className="mx-auto text-gray-400 mb-4" size={48} />
                                <h3 className="text-lg font-medium text-gray-900 mb-2">
                                    Không có chuyên gia nào phù hợp với tìm kiếm
                                </h3>
                                <p className="text-gray-500">
                                    Thử điều chỉnh từ khóa tìm kiếm của bạn
                                </p>
                            </>
                        )}
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            CHUYÊN GIA
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            LIÊN HỆ
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            MÃ CHUYÊN GIA
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            TRẠNG THÁI
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            HÀNH ĐỘNG
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {experts.map((expert) => (
                                        <tr
                                            key={expert.id}
                                            className="hover:bg-gray-50 transition-colors"
                                        >
                                            <td className="px-6 py-4">
                                                <div className="flex items-center">
                                                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mr-4 overflow-hidden">
                                                        {expert.avatarUrl ? (
                                                            <img src={expert.avatarUrl} alt={expert.firstName} className="w-full h-full object-cover" />
                                                        ) : (
                                                            <span className="text-green-600 font-medium text-sm">
                                                                {expert.firstName[0]}
                                                                {expert.lastName[0]}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <button
                                                            onClick={() => handleViewDetails(expert)}
                                                            className="text-sm font-medium text-green-600 hover:text-green-800 hover:underline transition-colors block text-left"
                                                        >
                                                            {expert.firstName} {expert.lastName}
                                                        </button>
                                                        <div className="text-sm text-gray-500">
                                                            @{expert.username}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-start space-y-1 flex-col">
                                                    <div className="flex items-center text-sm text-gray-900">
                                                        <Mail size={14} className="mr-2 text-gray-400" />
                                                        {expert.email}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                    {expert.expertId}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                {getStatusBadge(expert.accountStatus)}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex space-x-2">
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => handleEditExpert(expert)}
                                                        className="text-blue-600 border-blue-200 hover:bg-blue-50"
                                                        title="Chỉnh sửa"
                                                    >
                                                        <Edit size={14} />
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => handleToggleAccountStatus(expert)}
                                                        className={`${expert.accountStatus === "ACTIVE"
                                                            ? "text-orange-600 border-orange-200 hover:bg-orange-50"
                                                            : "text-green-600 border-green-200 hover:bg-green-50"
                                                            }`}
                                                        title={
                                                            expert.accountStatus === "ACTIVE"
                                                                ? "Khóa tài khoản"
                                                                : "Mở khóa tài khoản"
                                                        }
                                                    >
                                                        {expert.accountStatus === "ACTIVE" ? (
                                                            <Lock size={14} />
                                                        ) : (
                                                            <Unlock size={14} />
                                                        )}
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() =>
                                                            handleDeleteExpert(
                                                                expert.id,
                                                                `${expert.firstName} ${expert.lastName}`
                                                            )
                                                        }
                                                        className="text-red-600 border-red-200 hover:bg-red-50"
                                                        title="Xóa"
                                                    >
                                                        <Trash2 size={14} />
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination Controls */}
                        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between bg-gray-50">
                            <div className="flex items-center space-x-2">
                                <span className="text-sm text-gray-700">Hiển thị</span>
                                <select
                                    aria-label="Chọn số lượng hiển thị"
                                    value={pageSize}
                                    onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                                    className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                                >
                                    <option value={5}>5</option>
                                    <option value={10}>10</option>
                                    <option value={20}>20</option>
                                    <option value={50}>50</option>
                                </select>
                                <span className="text-sm text-gray-700">
                                    trên tổng số {totalElements} chuyên gia
                                </span>
                            </div>

                            <div className="flex items-center space-x-2">
                                <span className="text-sm text-gray-700">
                                    Trang {currentPage + 1} / {totalPages || 1}
                                </span>

                                <div className="flex space-x-1">
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => handlePageChange(0)}
                                        disabled={currentPage === 0 || loading}
                                        className="px-2"
                                    >
                                        <ChevronsLeft size={16} />
                                    </Button>

                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => handlePageChange(currentPage - 1)}
                                        disabled={currentPage === 0 || loading}
                                        className="px-2"
                                    >
                                        <ChevronLeft size={16} />
                                    </Button>

                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => handlePageChange(currentPage + 1)}
                                        disabled={currentPage >= totalPages - 1 || loading}
                                        className="px-2"
                                    >
                                        <ChevronRight size={16} />
                                    </Button>

                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => handlePageChange(totalPages - 1)}
                                        disabled={currentPage >= totalPages - 1 || loading}
                                        className="px-2"
                                    >
                                        <ChevronsRight size={16} />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* Expert Detail Modal */}
            {showDetailModal && selectedExpert && (
                <ExpertDetailModal
                    expert={selectedExpert}
                    onClose={() => {
                        setShowDetailModal(false);
                        setSelectedExpert(null);
                    }}
                />
            )}

            {educationalUnitId && (
                <>
                    <ExpertFormModal
                        isOpen={showExpertModal}
                        onClose={handleCloseModal}
                        educationalUnitId={educationalUnitId}
                        onSuccess={handleSuccess}
                        editingExpert={editingExpert}
                    />
                    <ImportExpertsModal
                        isOpen={showImportModal}
                        onClose={() => setShowImportModal(false)}
                        educationalUnitId={educationalUnitId}
                        onSuccess={handleSuccess}
                    />
                </>
            )}
        </div>
    );
};

// Expert Detail Modal Component
interface ExpertDetailModalProps {
    expert: ExpertResponse;
    onClose: () => void;
}

const ExpertDetailModal: React.FC<ExpertDetailModalProps> = ({
    expert,
    onClose,
}) => {
    const handleBackdropClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    const getStatusInfo = (status: string) => {
        const statusMap: Record<
            string,
            { label: string; className: string; icon: React.ReactElement }
        > = {
            ACTIVE: {
                label: "Đang hoạt động",
                className: "bg-green-100 text-green-800 border-green-200",
                icon: <Unlock className="text-green-600" size={20} />,
            },
            INACTIVE: {
                label: "Không hoạt động",
                className: "bg-gray-100 text-gray-800 border-gray-200",
                icon: <Lock className="text-gray-600" size={20} />,
            },
        };

        return (
            statusMap[status] || {
                label: status,
                className: "bg-gray-100 text-gray-800 border-gray-200",
                icon: <User className="text-gray-600" size={20} />,
            }
        );
    };

    const statusInfo = getStatusInfo(expert.accountStatus);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
                onClick={handleBackdropClick}
            ></div>

            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-green-600 to-green-700 px-6 py-6">
                    <div className="flex justify-between items-start">
                        <div className="flex items-start space-x-4">
                            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center overflow-hidden">
                                {expert.avatarUrl ? (
                                    <img src={expert.avatarUrl} alt={expert.firstName} className="w-full h-full object-cover" />
                                ) : (
                                    <span className="text-white font-bold text-2xl">
                                        {expert.firstName[0]}
                                        {expert.lastName[0]}
                                    </span>
                                )}
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-white">
                                    {expert.firstName} {expert.lastName}
                                </h2>
                                <p className="text-green-100 text-sm mt-1">
                                    @{expert.username}
                                </p>
                                <div className="mt-2">
                                    <span
                                        className={`inline-flex items-center space-x-2 px-3 py-1 rounded-full border ${statusInfo.className}`}
                                    >
                                        {statusInfo.icon}
                                        <span className="text-sm font-medium">
                                            {statusInfo.label}
                                        </span>
                                    </span>
                                </div>
                            </div>
                        </div>
                        <Button
                            onClick={onClose}
                            className="text-white hover:bg-white/20 rounded-lg p-2 transition-colors"
                        >
                            <X size={20} />
                        </Button>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-220px)]">
                    {/* Contact Information */}
                    <div className="bg-blue-50 rounded-lg p-4">
                        <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center">
                            <Mail size={16} className="mr-2 text-blue-600" />
                            Thông Tin Liên Hệ
                        </h3>
                        <div className="space-y-3">
                            <div className="flex items-center">
                                <Mail size={16} className="mr-3 text-gray-400" />
                                <div>
                                    <p className="text-xs text-gray-500">Email</p>
                                    <p className="text-sm font-medium text-gray-900">
                                        {expert.email}
                                    </p>
                                </div>
                            </div>
                            {expert.phoneNumber && (
                                <div className="flex items-center">
                                    <Phone size={16} className="mr-3 text-gray-400" />
                                    <div>
                                        <p className="text-xs text-gray-500">Số điện thoại</p>
                                        <p className="text-sm font-medium text-gray-900">
                                            {expert.phoneNumber}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Account Information */}
                    <div className="bg-purple-50 rounded-lg p-4">
                        <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center">
                            <UserCheck size={16} className="mr-2 text-purple-600" />
                            Thông Tin Tài Khoản
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="flex items-start">
                                <UserCheck size={16} className="mr-3 text-gray-400 mt-1" />
                                <div>
                                    <p className="text-xs text-gray-500">Mã Chuyên Gia</p>
                                    <p className="text-sm font-medium text-gray-900">
                                        {expert.expertId}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-start">
                                <UserCheck size={16} className="mr-3 text-gray-400 mt-1" />
                                <div>
                                    <p className="text-xs text-gray-500">Username</p>
                                    <p className="text-sm font-medium text-gray-900">
                                        {expert.username}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Additional Information */}
                    {(expert.description || expert.bio) && (
                        <div className="bg-orange-50 rounded-lg p-4">
                            <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center">
                                <FileText size={16} className="mr-2 text-orange-600" />
                                Thông Tin Bổ Sung
                            </h3>
                            <div className="space-y-3">
                                {expert.description && (
                                    <div className="flex items-start">
                                        <FileText size={16} className="mr-3 text-gray-400 mt-1" />
                                        <div className="flex-1">
                                            <p className="text-xs text-gray-500">Mô Tả</p>
                                            <p className="text-sm text-gray-900">
                                                {expert.description}
                                            </p>
                                        </div>
                                    </div>
                                )}
                                {expert.bio && (
                                    <div className="flex items-start">
                                        <FileText size={16} className="mr-3 text-gray-400 mt-1" />
                                        <div className="flex-1">
                                            <p className="text-xs text-gray-500">Tiểu sử</p>
                                            <p className="text-sm text-gray-900">
                                                {expert.bio}
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ExpertListPage;
