import React, { useState, useEffect } from "react";
import { X, User, Mail, Lock, Hash, FileText, UserCheck, Eye, EyeOff, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from 'react-toastify';
import * as expertApi from "@/services/api/expert/expertApi";
import type { ExpertRequest } from "@/services/api/request/expertRequest";
import type { ExpertResponse } from "@/services/api/response/expertResponse";

interface ExpertFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    educationalUnitId: number;
    onSuccess?: () => void;
    editingExpert?: ExpertResponse | null;
}

const ExpertFormModal: React.FC<ExpertFormModalProps> = ({
    isOpen,
    onClose,
    educationalUnitId,
    onSuccess,
    editingExpert = null,
}) => {
    const [form, setForm] = useState<Omit<ExpertRequest, 'educationalUnitId'>>({
        username: "",
        password: "",
        email: "",
        firstName: "",
        lastName: "",
        expertId: "",
        description: "",
    });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const isEditMode = Boolean(editingExpert);

    useEffect(() => {
        if (isOpen && editingExpert) {
            setForm({
                username: editingExpert.username || "",
                password: "",
                email: editingExpert.email || "",
                firstName: editingExpert.firstName || "",
                lastName: editingExpert.lastName || "",
                expertId: editingExpert.expertId || "",
                description: editingExpert.description || "",
            });
        } else if (isOpen && !editingExpert) {
            setForm({
                username: "",
                password: "",
                email: "",
                firstName: "",
                lastName: "",
                expertId: "",
                description: "",
            });
        }
        setErrors({});
    }, [isOpen, editingExpert]);

    if (!isOpen) return null;

    const validate = () => {
        const newErrors: Record<string, string> = {};
        if (!form.username || form.username.length < 3) {
            newErrors.username = "Tên đăng nhập phải có ít nhất 3 ký tự";
        }
        if (!form.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
            newErrors.email = "Định dạng email không hợp lệ";
        }
        if (!isEditMode) {
            if (!form.password || form.password.length < 6) {
                newErrors.password = "Mật khẩu phải có ít nhất 6 ký tự";
            }
        } else if (form.password && form.password.length < 6) {
            newErrors.password = "Mật khẩu phải có ít nhất 6 ký tự";
        }
        if (!form.firstName) {
            newErrors.firstName = "Tên là bắt buộc";
        }
        if (!form.lastName) {
            newErrors.lastName = "Họ là bắt buộc";
        }
        if (!form.expertId) {
            newErrors.expertId = "Mã chuyên gia là bắt buộc";
        }

        return newErrors;
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        //@ts-ignore
        setForm({ ...form, [name]: value });
        if (errors[name]) {
            setErrors({ ...errors, [name]: "" });
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const newErrors = validate();
        setErrors(newErrors);

        if (Object.keys(newErrors).length > 0) return;

        try {
            setIsLoading(true);

            if (isEditMode && editingExpert) {
                const updateData: any = {
                    username: form.username,
                    email: form.email,
                    firstName: form.firstName,
                    lastName: form.lastName,
                    expertId: form.expertId,
                    description: form.description,
                    educationalUnitId: String(educationalUnitId),
                };

                if (form.password) {
                    updateData.password = form.password;
                }

                await expertApi.updateExpert(educationalUnitId, editingExpert.id, updateData);
                toast.success('Cập nhật chuyên gia thành công!');
            } else {
                const expertData: ExpertRequest = {
                    ...form,
                    educationalUnitId: String(educationalUnitId),
                };

                await expertApi.createExpert(educationalUnitId, expertData);
                toast.success('Tạo chuyên gia thành công!');
            }

            onSuccess?.();
            onClose();

            setForm({
                username: "",
                password: "",
                email: "",
                firstName: "",
                lastName: "",
                expertId: "",
                description: "",
            });
            setErrors({});
        } catch (error: any) {
            console.error('Error saving expert:', error);
            let errorMessage = isEditMode ? 'Không thể cập nhật chuyên gia' : 'Không thể tạo chuyên gia';
            let fieldErrors: Record<string, string> = {};

            let backendMessage = '';
            if (error?.response?.data?.message) {
                backendMessage = error.response.data.message;
            } else if (error?.response?.data) {
                backendMessage = typeof error.response.data === 'string' ? error.response.data : '';
            } else if (error?.message) {
                backendMessage = error.message;
            }

            if (backendMessage) {
                errorMessage = backendMessage;
                const lowerMessage = backendMessage.toLowerCase();

                if (lowerMessage.includes('email')) {
                    fieldErrors.email = backendMessage;
                } else if (lowerMessage.includes('username')) {
                    fieldErrors.username = backendMessage;
                } else if (lowerMessage.includes('expert id') || lowerMessage.includes('expertid')) {
                    fieldErrors.expertId = backendMessage;
                }
            }

            if (Object.keys(fieldErrors).length > 0) {
                setErrors(prev => ({ ...prev, ...fieldErrors }));
            }

            toast.error(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            ></div>

            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
                {/* Header */}
                <div className={`${isEditMode ? 'bg-gradient-to-r from-orange-600 to-orange-700' : 'bg-gradient-to-r from-blue-600 to-blue-700'} px-6 py-4`}>
                    <div className="flex justify-between items-center">
                        <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                                {isEditMode ? <Edit className="w-5 h-5 text-white" /> : <UserCheck className="w-5 h-5 text-white" />}
                            </div>
                            <h2 className="text-xl font-bold text-white">
                                {isEditMode ? 'Chỉnh Sửa Chuyên Gia' : 'Tạo Chuyên Gia Mới'}
                            </h2>
                        </div>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={onClose}
                            className="text-white hover:bg-white/20 h-8 w-8 p-0"
                        >
                            <X size={18} />
                        </Button>
                    </div>
                    <p className={`${isEditMode ? 'text-orange-100' : 'text-blue-100'} text-sm mt-2`}>
                        {isEditMode ? `Cập nhật thông tin chuyên gia ${form.firstName} ${form.lastName}` : 'Thêm chuyên gia mới vào đơn vị của bạn'}
                    </p>
                </div>

                {/* Form Content */}
                <div className="flex flex-col h-[calc(90vh-120px)]">
                    <div className="flex-1 p-6 overflow-y-auto">
                        <div className="space-y-6">
                            {/* Personal Information */}
                            <div className="bg-gray-50 rounded-lg p-4">
                                <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center">
                                    <User size={16} className="mr-2" />
                                    Thông Tin Cá Nhân
                                </h3>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="flex items-center text-sm font-medium text-gray-700">
                                            <User size={14} className="mr-2 text-blue-600" />
                                            Tên
                                            <span className="text-red-500 ml-1">*</span>
                                        </label>
                                        <input
                                            name="firstName"
                                            placeholder="Nhập tên"
                                            value={form.firstName}
                                            onChange={handleChange}
                                            className={`w-full px-3 py-2 border rounded-lg transition-colors ${errors.firstName ? 'border-red-500 focus:border-red-500' : 'border-gray-300 focus:border-blue-500'}`}
                                        />
                                        {errors.firstName && (
                                            <p className="text-red-500 text-xs flex items-center mt-1">
                                                {errors.firstName}
                                            </p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <label className="flex items-center text-sm font-medium text-gray-700">
                                            <User size={14} className="mr-2 text-blue-600" />
                                            Họ
                                            <span className="text-red-500 ml-1">*</span>
                                        </label>
                                        <input
                                            name="lastName"
                                            placeholder="Nhập họ"
                                            value={form.lastName}
                                            onChange={handleChange}
                                            className={`w-full px-3 py-2 border rounded-lg transition-colors ${errors.lastName ? 'border-red-500 focus:border-red-500' : 'border-gray-300 focus:border-blue-500'}`}
                                        />
                                        {errors.lastName && (
                                            <p className="text-red-500 text-xs flex items-center mt-1">
                                                {errors.lastName}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Account Information */}
                            <div className="bg-green-50 rounded-lg p-4">
                                <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center">
                                    <Lock size={16} className="mr-2" />
                                    Thông Tin Tài Khoản
                                </h3>

                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="flex items-center text-sm font-medium text-gray-700">
                                            <User size={14} className="mr-2 text-green-600" />
                                            Tên Đăng Nhập
                                            <span className="text-red-500 ml-1">*</span>
                                        </label>
                                        <input
                                            name="username"
                                            placeholder="Nhập tên đăng nhập"
                                            value={form.username}
                                            onChange={handleChange}
                                            className={`w-full px-3 py-2 border rounded-lg transition-colors ${errors.username ? 'border-red-500 focus:border-red-500' : 'border-gray-300 focus:border-blue-500'}`}
                                        />
                                        {errors.username && (
                                            <p className="text-red-500 text-xs flex items-center mt-1">
                                                {errors.username}
                                            </p>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="flex items-center text-sm font-medium text-gray-700">
                                                <Mail size={14} className="mr-2 text-green-600" />
                                                Email
                                                <span className="text-red-500 ml-1">*</span>
                                            </label>
                                            <input
                                                name="email"
                                                type="email"
                                                placeholder="chuyengia@example.com"
                                                value={form.email}
                                                onChange={handleChange}
                                                className={`w-full px-3 py-2 border rounded-lg transition-colors ${errors.email ? 'border-red-500 focus:border-red-500' : 'border-gray-300 focus:border-blue-500'}`}
                                            />
                                            {errors.email && (
                                                <p className="text-red-500 text-xs flex items-center mt-1">
                                                    {errors.email}
                                                </p>
                                            )}
                                        </div>

                                        <div className="space-y-2">
                                            <label className="flex items-center text-sm font-medium text-gray-700">
                                                <Lock size={14} className="mr-2 text-green-600" />
                                                Mật Khẩu
                                                {!isEditMode && <span className="text-red-500 ml-1">*</span>}
                                            </label>
                                            <div className="relative">
                                                <input
                                                    name="password"
                                                    type={showPassword ? "text" : "password"}
                                                    placeholder={isEditMode ? "Nhập mật khẩu mới (tùy chọn)" : "Tối thiểu 6 ký tự"}
                                                    value={form.password}
                                                    onChange={handleChange}
                                                    className={`w-full px-3 py-2 border rounded-lg transition-colors pr-10 ${errors.password ? 'border-red-500 focus:border-red-500' : 'border-gray-300 focus:border-blue-500'}`}
                                                />
                                                <button
                                                    type="button"
                                                    onClick={togglePasswordVisibility}
                                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                                                >
                                                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                                </button>
                                            </div>
                                            {errors.password && (
                                                <p className="text-red-500 text-xs flex items-center mt-1">
                                                    {errors.password}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Professional Information */}
                            <div className="bg-purple-50 rounded-lg p-4">
                                <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center">
                                    <Hash size={16} className="mr-2" />
                                    Thông Tin Nghề Nghiệp
                                </h3>

                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="flex items-center text-sm font-medium text-gray-700">
                                            <Hash size={14} className="mr-2 text-purple-600" />
                                            Mã Chuyên Gia
                                            <span className="text-red-500 ml-1">*</span>
                                        </label>
                                        <input
                                            name="expertId"
                                            placeholder="vd: CG001"
                                            value={form.expertId}
                                            onChange={handleChange}
                                            className={`w-full px-3 py-2 border rounded-lg transition-colors ${errors.expertId ? 'border-red-500 focus:border-red-500' : 'border-gray-300 focus:border-blue-500'}`}
                                        />
                                        {errors.expertId && (
                                            <p className="text-red-500 text-xs flex items-center mt-1">
                                                {errors.expertId}
                                            </p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <label className="flex items-center text-sm font-medium text-gray-700">
                                            <FileText size={14} className="mr-2 text-purple-600" />
                                            Mô Tả
                                        </label>
                                        <textarea
                                            name="description"
                                            placeholder="Thông tin bổ sung..."
                                            value={form.description}
                                            onChange={handleChange}
                                            className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:border-purple-500 focus:outline-none transition-colors"
                                            rows={3}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="border-t bg-gray-50 px-6 py-4 mt-auto">
                        <div className="flex justify-end space-x-3">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={onClose}
                                className="px-6 py-2 border-gray-300 text-gray-700 hover:bg-gray-100 transition-colors"
                                disabled={isLoading}
                            >
                                Hủy
                            </Button>
                            <Button
                                type="submit"
                                disabled={isLoading}
                                onClick={handleSubmit}
                                className={`px-6 py-2 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${isEditMode
                                    ? 'bg-orange-600 hover:bg-orange-700'
                                    : 'bg-blue-600 hover:bg-blue-700'
                                    }`}
                            >
                                {isLoading ? (
                                    <div className="flex items-center">
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                                        {isEditMode ? 'Đang cập nhật...' : 'Đang tạo...'}
                                    </div>
                                ) : (
                                    <div className="flex items-center">
                                        {isEditMode ? <Edit size={16} className="mr-2" /> : <UserCheck size={16} className="mr-2" />}
                                        {isEditMode ? 'Cập Nhật Chuyên Gia' : 'Tạo Chuyên Gia'}
                                    </div>
                                )}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ExpertFormModal;
