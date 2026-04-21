import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { X, CheckCircle, XCircle, FileText, User } from "lucide-react";
import { toast } from "react-toastify";
import * as creditTransferApi from "@/services/api/expert/creditTransferApi";
import * as userApi from "@/services/api/userApi";
import type { CreditTransferResponse } from "@/services/api/response/creditTransferResponse";

interface CreditTransferDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    creditTransfer: CreditTransferResponse | null;
}

const CreditTransferDetailModal = ({
    isOpen,
    onClose,
    onSuccess,
    creditTransfer,
}: CreditTransferDetailModalProps) => {
    const [loading, setLoading] = useState(false);
    const [rejectReason, setRejectReason] = useState("");
    const [showRejectInput, setShowRejectInput] = useState(false);
    const [showApproveConfirm, setShowApproveConfirm] = useState(false);
    const [approverName, setApproverName] = useState<string | null>(null);
    const [loadingApproverName, setLoadingApproverName] = useState(false);

    useEffect(() => {
        if (!isOpen || !creditTransfer || !creditTransfer.approvedById) {
            setApproverName(null);
            return;
        }

        const fetchApproverName = async () => {
            try {
                setLoadingApproverName(true);
                const user = await userApi.getUserById(creditTransfer.approvedById!);
                if (user && user.firstName) {
                    setApproverName(`${user.firstName}${user.lastName ? " " + user.lastName : ""}`);
                } else {
                    setApproverName(creditTransfer.approvedById || "-");
                }
            } catch (error) {
                console.warn("Failed to fetch approver name:", error);
                setApproverName(creditTransfer.approvedById || "-");
            } finally {
                setLoadingApproverName(false);
            }
        };

        fetchApproverName();
    }, [isOpen, creditTransfer?.approvedById]);

    if (!isOpen || !creditTransfer) return null;

    const handleApprove = async () => {
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

    const isPendingExpertReview = creditTransfer.status === "PENDING_EXPERT_REVIEW";
    const canShowTeacherResult =
        creditTransfer.interviewScore !== undefined ||
        creditTransfer.certificateScore !== undefined ||
        !!creditTransfer.interviewEvidenceUrl;

    const evidenceUrl = creditTransfer.interviewEvidenceUrl?.trim() || "";

    const buildEmbedUrl = (url: string) => {
        const trimmedUrl = url.trim();
        if (!trimmedUrl) return null;

        if (/(youtube\.com|youtu\.be)/i.test(trimmedUrl)) {
            try {
                const parsedUrl = new URL(trimmedUrl);
                const videoId = parsedUrl.hostname.includes("youtu.be")
                    ? parsedUrl.pathname.replace("/", "")
                    : parsedUrl.searchParams.get("v");

                if (!videoId) return null;
                return `https://www.youtube.com/embed/${videoId}`;
            } catch {
                return trimmedUrl
                    .replace("watch?v=", "embed/")
                    .replace("youtu.be/", "www.youtube.com/embed/");
            }
        }

        return trimmedUrl;
    };

    const evidenceEmbedUrl = evidenceUrl ? buildEmbedUrl(evidenceUrl) : null;

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
                            {getStatusLabel(creditTransfer.status)}
                        </span>
                    </h2>
                    <button aria-label="Đóng" title="Đóng" onClick={onClose} className="text-white hover:text-gray-200">
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
                            <div className="text-xs text-red-400 mt-2">Người từ chối: {loadingApproverName ? "Đang tải..." : (approverName || "-")} - {creditTransfer.approvedDate ? new Date(creditTransfer.approvedDate).toLocaleString() : "-"}</div>
                        </div>
                    )}

                    {/* Approval Info (If Approved) */}
                    {creditTransfer.status === 'APPROVED' && (
                        <div className="mt-6 bg-green-50 p-4 rounded-xl border border-green-100">
                            <div className="flex items-center text-green-800 font-medium">
                                <CheckCircle size={18} className="mr-2" />
                                Đã được phê duyệt vào lúc {creditTransfer.approvedDate ? new Date(creditTransfer.approvedDate).toLocaleString() : "-"}
                            </div>
                            <div className="text-xs text-green-600 mt-1 ml-6">
                                Người duyệt: {loadingApproverName ? "Đang tải..." : (approverName || "-")}
                            </div>
                        </div>
                    )}

                    {canShowTeacherResult && (
                        <div className="mt-6 bg-blue-50 p-4 rounded-xl border border-blue-100">
                            <div className="font-semibold text-blue-900 mb-2">Kết quả vấn đáp & điểm tổng hợp</div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-blue-900">
                                <div>Điểm chứng chỉ: <b>{creditTransfer.certificateScore ?? "-"}</b></div>
                                <div>Điểm vấn đáp: <b>{creditTransfer.interviewScore ?? "-"}</b></div>
                                <div>Điểm tổng hợp: <b>{creditTransfer.decisionScore ?? "-"}</b></div>
                                <div>Ngưỡng đạt: <b>{creditTransfer.approvalThresholdApplied ?? "-"}</b></div>
                            </div>
                            {creditTransfer.interviewFeedback && (
                                <div className="mt-2 text-sm text-blue-800">
                                    Nhận xét giáo viên: {creditTransfer.interviewFeedback}
                                </div>
                            )}
                            {evidenceUrl && (
                                <div className="mt-3">
                                    <div className="text-sm font-medium text-blue-900 mb-2">Minh chứng vấn đáp</div>
                                    <a
                                        href={evidenceUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-sm text-blue-700 underline break-all"
                                    >
                                        {evidenceUrl}
                                    </a>
                                    {evidenceEmbedUrl ? (
                                        /(youtube\.com|youtu\.be)/i.test(evidenceUrl) ? (
                                            <iframe
                                                src={evidenceEmbedUrl}
                                                title="Video minh chứng vấn đáp"
                                                className="mt-2 w-full max-w-xl h-64 rounded border"
                                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                                allowFullScreen
                                            />
                                        ) : (
                                            <video className="mt-2 w-full max-w-xl rounded border" controls>
                                                <source src={evidenceEmbedUrl} />
                                                Trình duyệt không hỗ trợ phát video.
                                            </video>
                                        )
                                    ) : (
                                        <div className="mt-2 text-sm text-gray-500">
                                            Không thể hiển thị trực tiếp video này, chỉ có thể mở link.
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {!isPendingExpertReview && creditTransfer.status !== 'APPROVED' && creditTransfer.status !== 'REJECTED' && (
                        <div className="mt-6 bg-amber-50 p-4 rounded-xl border border-amber-200 text-amber-800 text-sm">
                            Hồ sơ chưa đến bước expert duyệt. Vui lòng chờ giáo viên hoàn tất vấn đáp và chấm điểm.
                        </div>
                    )}
                </div>

                {/* Footer Actions */}
                {isPendingExpertReview && (
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
                                <Button onClick={() => setShowApproveConfirm(true)} className="bg-green-600 hover:bg-green-700 text-white" disabled={loading}>
                                    <CheckCircle size={18} className="mr-2" /> Phê duyệt
                                </Button>
                            </>
                        )}
                    </div>
                )}
                {!isPendingExpertReview && (
                    <div className="p-4 border-t bg-gray-50 flex justify-end">
                        <Button variant="outline" onClick={onClose}>Đóng</Button>
                    </div>
                )}

                {showApproveConfirm && (
                    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-sm p-4">
                        <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl border border-gray-100 overflow-hidden">
                            <div className="bg-green-600 px-5 py-4 text-white flex items-center gap-3">
                                <div className="h-10 w-10 rounded-full bg-white/15 flex items-center justify-center">
                                    <CheckCircle size={20} />
                                </div>
                                <div>
                                    <div className="text-base font-semibold">Xác nhận phê duyệt</div>
                                    <div className="text-sm text-green-50">Kiểm tra lại dữ liệu trước khi duyệt</div>
                                </div>
                            </div>

                            <div className="p-5 space-y-4">
                                <div className="text-sm text-gray-700 leading-6">
                                    Bạn có chắc muốn phê duyệt yêu cầu quy đổi <span className="font-semibold">#{creditTransfer.id}</span> của sinh viên <span className="font-semibold">{creditTransfer.studentName}</span> không?
                                </div>

                                <div className="rounded-xl bg-green-50 border border-green-100 p-4 text-sm text-green-900">
                                    Hành động này sẽ chuyển hồ sơ sang trạng thái <span className="font-semibold">Đã duyệt</span> và cập nhật tiến độ học tập của sinh viên.
                                </div>

                                <div className="flex justify-end gap-3 pt-1">
                                    <Button
                                        variant="outline"
                                        onClick={() => setShowApproveConfirm(false)}
                                        disabled={loading}
                                    >
                                        Hủy
                                    </Button>
                                    <Button
                                        onClick={handleApprove}
                                        className="bg-green-600 hover:bg-green-700 text-white"
                                        disabled={loading}
                                    >
                                        <CheckCircle size={18} className="mr-2" /> Xác nhận duyệt
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CreditTransferDetailModal;
