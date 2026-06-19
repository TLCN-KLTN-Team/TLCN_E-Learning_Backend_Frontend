
import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { X, Save, BookOpen, AlertCircle } from "lucide-react";
import { toast } from "react-toastify";
import * as equivalentCourseApi from "@/services/api/expert/equivalentCourseApi";
import type { EquivalentCourseResponse } from "@/services/api/response/equivalentCourseResponse";
import type { EquivalentCourseRequest } from "@/services/api/request/equivalentCourseRequest";
import * as expertCourseApi from "@/services/api/expert/expertCourseApi";
import courseApi from "@/services/api/anonymous/course.api";
import * as educationUnitApi from "@/services/api/admin/educationUnitApi";
import type { CourseResponse } from "@/services/api/response/courseResponse";
import type { PublishedCourseResponse as PublicPublishedCourseResponse } from "@/types/course.types";

interface EquivalentCourseModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    equivalentCourse: EquivalentCourseResponse | null;
}

const EquivalentCourseModal: React.FC<EquivalentCourseModalProps> = ({
    isOpen,
    onClose,
    onSuccess,
    equivalentCourse,
}) => {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState<EquivalentCourseRequest>({
        sourceCourseId: 0,
        targetCourseId: 0,
        requirements: "",
        description: "",
        status: true,
        validFrom: "",
        validUntil: "",
    });

    // Dropdown States
    const [publishedCourses, setPublishedCourses] = useState<PublicPublishedCourseResponse[]>([]);
    const [courses, setCourses] = useState<CourseResponse[]>([]);
    const [dropdownLoading, setDropdownLoading] = useState(false);
    const [sourceSearch, setSourceSearch] = useState("");
    const [targetSearch, setTargetSearch] = useState("");

    useEffect(() => {
        if (isOpen) {
            fetchDropdownData();
        }
    }, [isOpen]);

    const fetchDropdownData = async () => {
        try {
            setDropdownLoading(true);
            const educationalUnit = await educationUnitApi.getMyEducationalUnit();
            const unitId = educationalUnit.id;

            const publishedRes = await courseApi.searchAndFiltersPublishedCourses(0, 100);
            setPublishedCourses(publishedRes.content || []);

            const coursesRes = await expertCourseApi.getCourses(unitId, 0, 100);
            setCourses(coursesRes.content || []);

        } catch (error) {
            console.error("Failed to load dropdown data", error);
            toast.error("Không thể tải danh sách khóa học");
        } finally {
            setDropdownLoading(false);
        }
    };

    useEffect(() => {
        if (equivalentCourse) {
            setFormData({
                sourceCourseId: equivalentCourse.sourceCourseId,
                targetCourseId: equivalentCourse.targetCourseId,
                requirements: equivalentCourse.requirements,
                description: equivalentCourse.description,
                status: equivalentCourse.status,
                validFrom: equivalentCourse.validFrom,
                validUntil: equivalentCourse.validUntil,
                minQuizScore: equivalentCourse.minQuizScore,
                minAssignmentScore: equivalentCourse.minAssignmentScore,
                requiredRank: equivalentCourse.requiredRank,
            });
        } else {
            setFormData({
                sourceCourseId: 0,
                targetCourseId: 0,
                requirements: "",
                description: "",
                status: true,
                validFrom: "",
                validUntil: "",
                minQuizScore: undefined,
                minAssignmentScore: undefined,
                requiredRank: "",
            });
            setSourceSearch("");
            setTargetSearch("");
        }
    }, [equivalentCourse, isOpen]);

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
    ) => {
        const { name, value, type } = e.target;
        if (type === "checkbox") {
            const checked = (e.target as HTMLInputElement).checked;
            setFormData((prev) => ({ ...prev, [name]: checked }));
        } else {
            setFormData((prev) => ({ ...prev, [name]: value }));
        }
    };

    const handleSelectSource = (id: string) => {
        setFormData(prev => ({ ...prev, sourceCourseId: Number(id) }));
    };

    const handleSelectTarget = (id: string) => {
        setFormData(prev => ({ ...prev, targetCourseId: Number(id) }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.sourceCourseId || !formData.targetCourseId) {
            toast.error("Vui lòng chọn khóa học nguồn và đích");
            return;
        }

        try {
            setLoading(true);
            if (equivalentCourse) {
                await equivalentCourseApi.updateEquivalentCourse(
                    equivalentCourse.id,
                    formData
                );
                toast.success("Cập nhật thành công");
            } else {
                await equivalentCourseApi.createEquivalentCourse(formData);
                toast.success("Tạo mới thành công");
            }
            onSuccess();
            onClose();
        } catch (error: any) {
            console.error(error);
            toast.error(error.response?.data?.message || "Có lỗi xảy ra");
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    const filteredSourceCourses = publishedCourses.filter(course => 
        course.courseName.toLowerCase().includes(sourceSearch.toLowerCase()) || 
        course.id.toString().includes(sourceSearch) ||
        (course.authorName && course.authorName.toLowerCase().includes(sourceSearch.toLowerCase()))
    );

    const filteredTargetCourses = courses.filter(course => 
        course.courseName.toLowerCase().includes(targetSearch.toLowerCase()) || 
        course.id.toString().includes(targetSearch)
    );

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={onClose}
            ></div>
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4 flex-shrink-0">
                    <div className="flex justify-between items-center">
                        <h2 className="text-xl font-bold text-white flex items-center">
                            <BookOpen className="mr-2" size={24} />
                            {equivalentCourse ? "Cập nhật Quy đổi" : "Quản lý Quy đổi Mới"}
                        </h2>
                        <button
                            onClick={onClose}
                            className="text-white hover:text-gray-200 transition-colors"
                        >
                            <X size={24} />
                        </button>
                    </div>
                </div>

                {/* Body */}
                <div className="p-6 overflow-y-auto flex-1">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="bg-blue-50 p-3 rounded-lg flex items-start text-blue-800 text-sm mb-4">
                            <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
                            <div>
                                Chọn khóa học Nguồn (đã xuất bản) và khóa học Đích (nội bộ) để thiết lập quy đổi.
                            </div>
                        </div>

                        {/* Source Course Selection */}
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700">
                                Khóa học Nguồn (Bên ngoài)
                            </label>
                            <input
                                type="text"
                                placeholder="Tìm kiếm theo tên, ID, hoặc tác giả..."
                                value={sourceSearch}
                                onChange={(e) => setSourceSearch(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                            />
                            {dropdownLoading ? (
                                <div className="h-10 bg-gray-100 rounded animate-pulse"></div>
                            ) : (
                                <select
                                    value={formData.sourceCourseId}
                                    onChange={(e) => handleSelectSource(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    required
                                >
                                    <option value={0}>-- Chọn khóa học nguồn --</option>
                                    {filteredSourceCourses.map(course => (
                                        <option key={course.id} value={course.id}>
                                            {course.courseName} (ID: {course.id}) - {course.authorName || 'N/A'}
                                        </option>
                                    ))}
                                </select>
                            )}
                            <div className="mt-1 text-xs text-gray-500">
                                *Hiển thị {filteredSourceCourses.length}/{publishedCourses.length} khóa học công khai
                            </div>
                        </div>

                        {/* Target Course Selection */}
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700">
                                Khóa học Đích (Nội bộ)
                            </label>
                            <input
                                type="text"
                                placeholder="Tìm kiếm theo tên hoặc ID..."
                                value={targetSearch}
                                onChange={(e) => setTargetSearch(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                            />
                            {dropdownLoading ? (
                                <div className="h-10 bg-gray-100 rounded animate-pulse"></div>
                            ) : (
                                <select
                                    value={formData.targetCourseId}
                                    onChange={(e) => handleSelectTarget(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    required
                                >
                                    <option value={0}>-- Chọn khóa học đích --</option>
                                    {filteredTargetCourses.map(course => (
                                        <option key={course.id} value={course.id}>
                                            {course.courseName} (ID: {course.id})
                                        </option>
                                    ))}
                                </select>
                            )}
                            <div className="mt-1 text-xs text-gray-500">
                                *Hiển thị {filteredTargetCourses.length}/{courses.length} khóa học nội bộ
                            </div>
                        </div>

                        {/* Specific Requirements Section */}
                        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 space-y-4">
                            <h3 className="font-semibold text-gray-800 border-b pb-2">Điều kiện Tiên quyết</h3>

                            {/* Rank Selection */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Yêu cầu Xếp loại
                                </label>
                                <select
                                    name="requiredRank"
                                    value={formData.requiredRank || ""}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="">-- Không yêu cầu --</option>
                                    <option value="EXCELLENT">Xuất sắc (GPA &ge; 9.0)</option>
                                    <option value="GOOD">Giỏi (GPA &ge; 8.0)</option>
                                    <option value="MERIT">Khá (GPA &ge; 6.5)</option>
                                    <option value="AVERAGE">Trung bình (GPA &ge; 5.0)</option>
                                </select>
                            </div>

                            {/* Score Inputs */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Min Quiz Score
                                    </label>
                                    <input
                                        type="number"
                                        name="minQuizScore"
                                        value={formData.minQuizScore || ""}
                                        onChange={handleChange}
                                        step="0.1"
                                        min="0"
                                        max="10"
                                        placeholder="VD: 8.0"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Min Assignment Score
                                    </label>
                                    <input
                                        type="number"
                                        name="minAssignmentScore"
                                        value={formData.minAssignmentScore || ""}
                                        onChange={handleChange}
                                        step="0.1"
                                        min="0"
                                        max="10"
                                        placeholder="VD: 7.5"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Additional Text Requirements */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Yêu cầu khác (Văn bản/Ghi chú thêm)
                            </label>
                            <textarea
                                name="requirements"
                                value={formData.requirements}
                                onChange={handleChange}
                                rows={3}
                                placeholder="Ví dụ: Cần thư giới thiệu, Link project cuối khóa..."
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Mô tả
                            </label>
                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                rows={2}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Hiệu lực từ
                                </label>
                                <input
                                    type="datetime-local"
                                    name="validFrom"
                                    value={formData.validFrom || ""}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Hiệu lực đến
                                </label>
                                <input
                                    type="datetime-local"
                                    name="validUntil"
                                    value={formData.validUntil || ""}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        </div>

                        <div className="flex items-center">
                            <input
                                type="checkbox"
                                name="status"
                                id="status"
                                checked={formData.status}
                                onChange={handleChange}
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                            <label htmlFor="status" className="ml-2 block text-sm text-gray-900">
                                Kích hoạt (Status)
                            </label>
                        </div>

                        <div className="pt-4 border-t flex justify-end space-x-3">
                            <Button type="button" variant="outline" onClick={onClose}>
                                Hủy
                            </Button>
                            <Button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white">
                                {loading ? "Đang xử lý..." : <><Save size={18} className="mr-1" /> Lưu</>}
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default EquivalentCourseModal;
