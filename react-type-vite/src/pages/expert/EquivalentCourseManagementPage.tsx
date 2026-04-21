import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Search,
    Plus,
    Edit2,
    Trash2,
    ChevronLeft,
    ChevronRight,
    ArrowRightLeft
} from "lucide-react";
import { toast } from "react-toastify";
import * as equivalentCourseApi from "@/services/api/expert/equivalentCourseApi";
import type { EquivalentCourseResponse } from "@/services/api/response/equivalentCourseResponse";
import type { PaginatedResponse } from "@/services/api/response/apiResponse";
import EquivalentCourseModal from "@/components/expert/equivalentCourses/EquivalentCourseModal";
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

const EquivalentCourseManagementPage: React.FC = () => {
    const [courses, setCourses] = useState<EquivalentCourseResponse[]>([]);
    const [showModal, setShowModal] = useState(false);
    const [selectedCourse, setSelectedCourse] = useState<EquivalentCourseResponse | null>(null);
    const [loading, setLoading] = useState(false);
    const [courseToDelete, setCourseToDelete] = useState<EquivalentCourseResponse | null>(null);

    const [keyword, setKeyword] = useState("");
    const [debouncedKeyword, setDebouncedKeyword] = useState("");

    // Pagination
    const [currentPage, setCurrentPage] = useState(0);
    const [pageSize] = useState(10);
    const [totalPages, setTotalPages] = useState(0);
    const [totalElements, setTotalElements] = useState(0);

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedKeyword(keyword);
            setCurrentPage(0); // Reset to page 0 on search
        }, 500);
        return () => clearTimeout(handler);
    }, [keyword]);

    useEffect(() => {
        loadCourses();
    }, [debouncedKeyword, currentPage, pageSize]);

    const loadCourses = async () => {
        try {
            setLoading(true);
            const response: PaginatedResponse<EquivalentCourseResponse> =
                await equivalentCourseApi.getEquivalentCourses(debouncedKeyword, undefined, currentPage, pageSize);

            setCourses(response.content || []);
            setTotalPages(response.totalPages);
            setTotalElements(response.totalElements);
        } catch (error) {
            console.error("Failed to load equivalent courses", error);
            toast.error("Không thể tải danh sách khóa học quy đổi");
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (course: EquivalentCourseResponse) => {
        setSelectedCourse(course);
        setShowModal(true);
    };

    const handleDelete = async (id: number) => {
        try {
            await equivalentCourseApi.deleteEquivalentCourse(id);
            toast.success("Xóa thành công");
            loadCourses();
        } catch (error) {
            console.error(error);
            toast.error("Xóa thất bại");
        }
    };

    const handleModalClose = () => {
        setShowModal(false);
        setSelectedCourse(null);
    };

    const handlePageChange = (newPage: number) => {
        if (newPage >= 0 && newPage < totalPages) {
            setCurrentPage(newPage);
        }
    };

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                        <ArrowRightLeft className="mr-3 text-blue-600" size={28} />
                        Quản lý Khóa học Quy đổi
                    </h1>
                    <p className="text-gray-500 mt-1">
                        Thiết lập danh sách các khóa học tương đương từ các nền tảng khác
                    </p>
                </div>
                <Button
                    onClick={() => setShowModal(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-200"
                >
                    <Plus className="mr-2" size={18} />
                    Thêm Quy đổi Mới
                </Button>
            </div>

            {/* Search Filter */}
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex items-center space-x-4">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Tìm kiếm theo tên khóa học..."
                        value={keyword}
                        onChange={(e) => setKeyword(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                    />
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                {loading ? (
                    <div className="p-12 text-center text-gray-500">Đang tải dữ liệu...</div>
                ) : courses.length === 0 ? (
                    <div className="p-12 text-center">
                        <div className="bg-gray-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                            <ArrowRightLeft className="text-gray-400" size={32} />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">Chưa có dữ liệu</h3>
                        <p className="text-gray-500">Chưa có khóa học quy đổi nào được tạo.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Khóa học Nguồn (Bên ngoài)</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Khóa học Đích (Nội bộ)</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Yêu cầu</th>
                                    <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Trạng thái</th>
                                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Hành động</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {courses.map((course) => (
                                    <tr key={course.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-gray-900">{course.sourceCourseName}</div>
                                            <div className="text-xs text-gray-500 mt-1">ID: {course.sourceCourseId}</div>
                                            <div className="text-xs text-blue-600 mt-0.5">{course.sourceEducationalUnit}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-gray-900">{course.targetCourseName}</div>
                                            <div className="text-xs text-gray-500 mt-1">ID: {course.targetCourseId}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm text-gray-600 max-w-xs truncate" title={course.requirements}>
                                                {course.requirements || "-"}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${course.status ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                                                }`}>
                                                {course.status ? "Hoạt động" : "Không hoạt động"}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end space-x-2">
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => handleEdit(course)}
                                                    className="text-blue-600 border-blue-200 hover:bg-blue-50"
                                                >
                                                    <Edit2 size={14} className="mr-1" /> Sửa
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => setCourseToDelete(course)}
                                                    className="text-red-600 border-red-200 hover:bg-red-50"
                                                >
                                                    <Trash2 size={14} className="mr-1" /> Xóa
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Pagination Controls */}
                {courses.length > 0 && (
                    <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                        <span className="text-sm text-gray-700">
                            Trang {currentPage + 1} / {totalPages} - Tổng {totalElements} kết quả
                        </span>
                        <div className="flex space-x-2">
                            <Button variant="outline" size="sm" onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 0}>
                                <ChevronLeft size={16} /> Trước
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage >= totalPages - 1}>
                                Sau <ChevronRight size={16} />
                            </Button>
                        </div>
                    </div>
                )}
            </div>

            <EquivalentCourseModal
                isOpen={showModal}
                onClose={handleModalClose}
                onSuccess={loadCourses}
                equivalentCourse={selectedCourse}
            />

            <AlertDialog open={!!courseToDelete} onOpenChange={(open) => !open && setCourseToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Xóa khóa học quy đổi?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Bạn có chắc chắn muốn xóa khóa học quy đổi này? Hành động này không thể hoàn tác.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Hủy</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => {
                                if (courseToDelete) {
                                    handleDelete(courseToDelete.id);
                                    setCourseToDelete(null);
                                }
                            }}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            Xóa
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
};

export default EquivalentCourseManagementPage;
