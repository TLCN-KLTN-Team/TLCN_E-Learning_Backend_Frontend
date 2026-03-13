import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { X, CheckCircle, XCircle, FileText, ExternalLink, User } from "lucide-react";
import { toast } from "react-toastify";
import * as creditTransferApi from "@/services/api/expert/creditTransferApi";
import type { CreditTransferResponse } from "@/services/api/response/creditTransferResponse";

interface CreditTransferDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    creditTransfer: CreditTransferResponse | null;
}

const CreditTransferDetailModal: React.FC<CreditTransferDetailModalProps> = ({
    isOpen,
    onClose,
    onSuccess,
    creditTransfer,
}) => {
    const [loading, setLoading] = useState(false);
    const [rejectReason, setRejectReason] = useState("");
    const [showRejectInput, setShowRejectInput] = useState(false);

    if (!isOpen || !creditTransfer) return null;

    const handleApprove = async () => {
        if (!confirm("Bạn có chắc chắn muốn phê duyệt yêu cầu này?")) return;
        try {
            setLoading(true);
            await creditTransferApi.approveCreditTransfer(creditTransfer.id);
            toast.success("Đã phê duyệt yêu cầu thành công");
            onSuccess();
            onClose();
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Có lỗi xảy ra");
        } finally {
            setLoading(false);
        }
    };

    const handleReject = async () => {
        if (!rejectReason.trim()) {
            toast.warning("Vui lòng nhập lý do từ chối");
            return;
        }
        try {
            setLoading(true);
            await creditTransferApi.rejectCreditTransfer(creditTransfer.id, rejectReason);
            toast.success("Đã từ chối yêu cầu");
            onSuccess();
            onClose();
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Có lỗi xảy ra");
        } finally {
            setLoading(false);
        }
    };

    const isPending = creditTransfer.status === "PENDING";

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}></div>
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className={`px-6 py-4 flex justify-between items-center ${creditTransfer.status === 'APPROVED' ? 'bg-green-600' :
                    creditTransfer.status === 'REJECTED' ? 'bg-red-600' : 'bg-blue-600'
                    }`}>
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <FileText size={24} />
                        Chi tiết Yêu cầu Quy đổi #{creditTransfer.id}
                        <span className="text-sm bg-white/20 px-2 py-0.5 rounded ml-2">
                            {creditTransfer.status}
                        </span>
                    </h2>
                    <button onClick={onClose} className="text-white hover:text-gray-200">
                        <X size={24} />
                    </button>
                </div>

                {/* Body - Comparison View */}
                <div className="p-6 overflow-y-auto flex-1 bg-gray-50">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                        {/* LEFT: Student Submission */}
                        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
                            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center border-b pb-2">
                                <User className="mr-2 text-blue-600" size={20} />
                                Thông tin Sinh viên Nộp
                            </h3>

                            <div className="space-y-4">
                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase">Sinh viên</label>
                                    <div className="text-gray-900 font-medium">{creditTransfer.studentName}</div>
                                    <div className="text-xs text-gray-400">{creditTransfer.studentId}</div>
                                </div>

                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase">Khóa học đã học (Nguồn)</label>
                                    <div className="p-3 bg-blue-50 rounded-lg text-blue-900 font-medium mt-1">
                                        {creditTransfer.sourceCourseName}
                                    </div>
                                    <div className="text-xs text-gray-400 mt-1">ID: {creditTransfer.sourceCourseId}</div>
                                </div>

                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase">Ghi chú của sinh viên</label>
                                    <div className="p-3 bg-gray-50 rounded-lg text-gray-700 text-sm mt-1 min-h-[80px]">
                                        {creditTransfer.description || "Không có ghi chú"}
                                    </div>
                                </div>

                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase">Minh chứng đính kèm</label>
                                    {creditTransfer.attachmentUrl ? (
                                        <a href={creditTransfer.attachmentUrl} target="_blank" rel="noopener noreferrer"
                                            className="mt-1 flex items-center p-3 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors text-blue-600">
                                            <ExternalLink size={16} className="mr-2" />
                                            Xem tài liệu đính kèm
                                        </a>
                                    ) : (
                                        <div className="mt-1 text-gray-400 italic">Không có tài liệu đính kèm</div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* RIGHT: Equivalent Rule */}
                        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
                            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center border-b pb-2">
                                <CheckCircle className="mr-2 text-green-600" size={20} />
                                Quy tắc Quy đổi Tương ứng
                            </h3>

                            <div className="space-y-4">
                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase">Quy đổi sang Khóa học (Đích)</label>
                                    <div className="p-3 bg-green-50 rounded-lg text-green-900 font-bold mt-1 shadow-sm">
                                        {creditTransfer.targetCourseName}
                                    </div>
                                    <div className="text-xs text-gray-400 mt-1">ID: {creditTransfer.targetCourseId}</div>
                                </div>

                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase">Yêu cầu của Quy tắc</label>
                                    <div className="p-3 bg-yellow-50 border border-yellow-100 rounded-lg text-yellow-800 text-sm mt-1">
                                        {creditTransfer.equivalentCourseRequirements || "Không có yêu cầu đặc biệt"}
                                    </div>
                                </div>

                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase">Mô tả Quy đổi</label>
                                    <div className="text-sm text-gray-600 mt-1">
                                        {creditTransfer.equivalentCourseDescription}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Rejection Info (If Rejected) */}
                    {creditTransfer.status === 'REJECTED' && (
                        <div className="mt-6 bg-red-50 p-4 rounded-xl border border-red-100">
                            <label className="text-xs font-bold text-red-500 uppercase">Lý do từ chối</label>
                            <div className="text-red-800 mt-1 font-medium">{creditTransfer.rejectionReason}</div>
                            <div className="text-xs text-red-400 mt-2">Người từ chối: {creditTransfer.approvedById} - {new Date(creditTransfer.approvedDate).toLocaleString()}</div>
                        </div>
                    )}

                    {/* Approval Info (If Approved) */}
                    {creditTransfer.status === 'APPROVED' && (
                        <div className="mt-6 bg-green-50 p-4 rounded-xl border border-green-100">
                            <div className="flex items-center text-green-800 font-medium">
                                <CheckCircle size={18} className="mr-2" />
                                Đã được phê duyệt vào lúc {new Date(creditTransfer.approvedDate).toLocaleString()}
                            </div>
                            <div className="text-xs text-green-600 mt-1 ml-6">Người duyệt: {creditTransfer.approvedById}</div>
                        </div>
                    )}
                </div>

                {/* Footer Actions */}
                {isPending && (
                    <div className="p-4 border-t bg-gray-50 flex justify-end space-x-3">
                        {showRejectInput ? (
                            <div className="flex-1 flex space-x-2 animate-in slide-in-from-right duration-300">
                                <input
                                    type="text"
                                    placeholder="Nhập lý do từ chối..."
                                    className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 outline-none"
                                    value={rejectReason}
                                    onChange={(e) => setRejectReason(e.target.value)}
                                    autoFocus
                                />
                                <Button variant="destructive" onClick={handleReject} disabled={loading}>
                                    Xác nhận Từ chối
                                </Button>
                                <Button variant="outline" onClick={() => setShowRejectInput(false)}>Hủy</Button>
                            </div>
                        ) : (
                            <>
                                <Button variant="ghost" onClick={onClose}>Đóng</Button>
                                <Button variant="destructive" onClick={() => setShowRejectInput(true)} className="bg-red-100 text-red-700 hover:bg-red-200 border-none">
                                    <XCircle size={18} className="mr-2" /> Từ chối
                                </Button>
                                <Button onClick={handleApprove} className="bg-green-600 hover:bg-green-700 text-white" disabled={loading}>
                                    <CheckCircle size={18} className="mr-2" /> Phê duyệt
                                </Button>
                            </>
                        )}
                    </div>
                )}
                {!isPending && (
                    <div className="p-4 border-t bg-gray-50 flex justify-end">
                        <Button variant="outline" onClick={onClose}>Đóng</Button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CreditTransferDetailModal;
