import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import type { EquivalentCourseResponse } from "@/types/course.types";
import * as studentCreditTransferApi from "@/services/api/student/studentCreditTransferApi";
import { toast } from "react-hot-toast";
import { uploadMultipleFiles } from "@/services/api/fileUploadApi";
import { Loader2, Upload, FileText, ArrowRight, AlertTriangle, CheckCircle2, CircleX } from "lucide-react";
import * as certificateApi from "@/services/api/user/certificateApi";

interface SubmitCreditTransferModalProps {
    isOpen: boolean;
    onClose: () => void;
    equivalentCourse: EquivalentCourseResponse | null;
    onSuccess: () => void;
}

const SubmitCreditTransferModal: React.FC<SubmitCreditTransferModalProps> = ({
    isOpen,
    onClose,
    equivalentCourse,
    onSuccess,
}) => {
    const [description, setDescription] = useState("");
    const [file, setFile] = useState<File | null>(null);
    const [linkUrl, setLinkUrl] = useState("");
    const [isLinkMode, setIsLinkMode] = useState(false);

    const [formErrors, setFormErrors] = useState<{ description?: string, file?: string, link?: string }>({});

    const [isUploading, setIsUploading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // GATEKEEPER STATES
    const [checkingEligibility, setCheckingEligibility] = useState(false);
    const [eligible, setEligible] = useState<boolean | null>(null);
    const [eligibilityError, setEligibilityError] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen && equivalentCourse) {
            checkEligibility();
        } else {
            // Reset states
            setEligible(null);
            setEligibilityError(null);
            setDescription("");
            setFile(null);
            setFormErrors({});
        }
    }, [isOpen, equivalentCourse]);

    const checkEligibility = async () => {
        if (!equivalentCourse) return;
        setCheckingEligibility(true);
        setEligible(null);
        setEligibilityError(null);

        try {
            // 1. Fetch Student Certificate (which contains grades)
            const cert = await certificateApi.getMyCertificate(equivalentCourse.sourceCourseId);

            if (!cert || cert.status !== 'ISSUED') {
                setEligible(false);
                setEligibilityError("Bạn chưa được cấp chứng chỉ cho khóa học này.");
                return;
            }

            // 2. CHECK RULES
            const errors: string[] = [];

            // Check Rank
            if (equivalentCourse.requiredRank) {
                let minGpaForRank = 0;
                switch (equivalentCourse.requiredRank) {
                    case 'EXCELLENT': minGpaForRank = 9.0; break;
                    case 'GOOD': minGpaForRank = 8.0; break;
                    case 'MERIT': minGpaForRank = 6.5; break;
                    case 'AVERAGE': minGpaForRank = 5.0; break;
                }

                if ((cert.finalScore || 0) < minGpaForRank) {
                    errors.push(`Yêu cầu loại ${equivalentCourse.requiredRank} (GPA >= ${minGpaForRank})`);
                }
            }

            if (errors.length > 0) {
                setEligible(false);
                setEligibilityError(errors.join(", "));
            } else {
                setEligible(true);
            }

        } catch (error) {
            console.error(error);
            setEligible(false);
            setEligibilityError("Không thể kiểm tra thông tin chứng chỉ.");
        } finally {
            setCheckingEligibility(false);
        }
    }

    if (!equivalentCourse) return null;

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            setFormErrors(prev => ({ ...prev, file: undefined }));
        }
    };

    const handleSubmit = async () => {
        // Reset errors
        setFormErrors({});
        let hasError = false;
        const newErrors: { description?: string, file?: string, link?: string } = {};

        if (!description.trim()) {
            toast.error("Vui lòng nhập mô tả hoặc ghi chú");
            return;
        }

        if (!isLinkMode && !file) {
            newErrors.file = "Vui lòng tải ảnh hoặc file chứng chỉ!";
            hasError = true;
        }

        if (isLinkMode && !linkUrl.trim()) {
            newErrors.link = "Vui lòng nhập đường dẫn chứng chỉ!";
            hasError = true;
        }

        if (hasError) {
            setFormErrors(newErrors);
            toast.error("Vui lòng kiểm tra lại thông tin còn thiếu");
            return;
        }

        // ... rest of logic


        try {
            setIsSubmitting(true);
            let attachmentUrl = "";

            if (!isLinkMode && file) {
                // 1. Upload File
                setIsUploading(true);
                const formData = new FormData();
                formData.append("files", file); // API expects 'files'

                const uploadRes = await uploadMultipleFiles(formData);
                if (uploadRes && uploadRes.length > 0) {
                    attachmentUrl = uploadRes[0].fileUrl;
                } else {
                    throw new Error("Upload file thất bại");
                }
                setIsUploading(false);
            } else {
                // Use Link
                attachmentUrl = linkUrl;
            }

            // 2. Submit Request
            await studentCreditTransferApi.createRequest({
                equivalentCourseId: equivalentCourse.id,
                description: description,
                attachmentUrl: attachmentUrl,
            });

            toast.success("Gửi yêu cầu quy đổi thành công!");
            onSuccess();
            onClose();
            // Reset form
            setDescription("");
            setFile(null);
            setLinkUrl("");
            setIsLinkMode(false);
        } catch (error: any) {
            console.error("Submit error:", error);
            const msg = error.response?.data?.message || error.message || "Có lỗi xảy ra";
            toast.error(msg);
        } finally {
            setIsSubmitting(false);
            setIsUploading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl">
                <DialogHeader>
                    <DialogTitle>Đăng ký Quy đổi tín chỉ</DialogTitle>
                </DialogHeader>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 py-4">
                    {/* Left: Source Course */}
                    <div className="p-4 border rounded-lg bg-gray-50 flex flex-col gap-2">
                        <div className="text-sm font-semibold text-gray-500 uppercase">Khóa học Nguồn (Bên ngoài)</div>
                        <h3 className="font-bold text-lg text-primary">{equivalentCourse.sourceCourseName}</h3>
                        <div className="text-sm">
                            <span className="font-medium">Đơn vị:</span> {equivalentCourse.sourceEducationalUnit}
                        </div>
                        <div className="text-sm">
                            <span className="font-medium">Tín chỉ:</span> {equivalentCourse.sourceCourseCredits !== undefined ? equivalentCourse.sourceCourseCredits : "N/A"}
                        </div>
                    </div>

                    {/* Middle: Requirements */}
                    <div className="flex flex-col items-center justify-center p-4">
                        <ArrowRight className="h-8 w-8 text-gray-300 mb-2 rotate-90 md:rotate-0" />
                        <div className="w-full p-3 bg-blue-50 border border-blue-100 rounded text-center space-y-2">
                            <div className="text-xs font-bold text-blue-600 uppercase mb-1">Yêu cầu quy đổi</div>
                            <p className="text-sm text-blue-800">{equivalentCourse.requirements || equivalentCourse.description || "Không có yêu cầu cụ thể"}</p>

                            {/* Validation Status */}
                            {checkingEligibility ? (
                                <div className="text-xs text-gray-500 flex items-center justify-center gap-1">
                                    <Loader2 className="w-3 h-3 animate-spin" /> Đang kiểm tra điều kiện...
                                </div>
                            ) : eligibilityError ? (
                                <div className="bg-red-100/50 border border-red-200 rounded p-2 text-xs text-red-700 animate-in fade-in zoom-in">
                                    <div className="font-bold flex items-center justify-center gap-1 mb-1">
                                        <CircleX className="w-4 h-4" /> KHÔNG ĐỦ ĐIỀU KIỆN
                                    </div>
                                    {eligibilityError}
                                </div>
                            ) : (
                                <div className="bg-green-100/50 border border-green-200 rounded p-2 text-xs text-green-700 animate-in fade-in zoom-in">
                                    <div className="font-bold flex items-center justify-center gap-1">
                                        <CheckCircle2 className="w-4 h-4" /> ĐỦ ĐIỀU KIỆN
                                    </div>
                                    Bạn đáp ứng đủ các tiêu chí
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right: Target Course */}
                    <div className="p-4 border rounded-lg bg-gray-50 flex flex-col gap-2">
                        <div className="text-sm font-semibold text-gray-500 uppercase">Môn học được miễn (Nội bộ)</div>
                        <h3 className="font-bold text-lg text-green-700">{equivalentCourse.targetCourseName}</h3>
                        <div className="text-sm">
                            <span className="font-medium">Số tín chỉ:</span> {equivalentCourse.targetCourseCredits !== undefined ? equivalentCourse.targetCourseCredits : "N/A"}
                        </div>
                    </div>
                </div>

                {eligible === false && (
                    <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
                        <div className="flex">
                            <div className="flex-shrink-0">
                                <AlertTriangle className="h-5 w-5 text-red-500" aria-hidden="true" />
                            </div>
                            <div className="ml-3">
                                <p className="text-sm text-red-700">
                                    Bạn chưa đủ điều kiện để nộp đơn quy đổi này. Vui lòng kiểm tra lại yêu cầu của môn học.
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                <div className="space-y-4 border-t pt-4">
                    <div className="grid w-full gap-1.5">
                        <Label htmlFor="description">Ghi chú / Mô tả thêm</Label>
                        <Textarea
                            id="description"
                            placeholder="Ví dụ: Em đã hoàn thành khóa học này vào tháng 5/2024..."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                        />
                    </div>

                    <div className="grid w-full gap-1.5">
                        <Label>Minh chứng (Chọn một phương thức)</Label>
                        <div className="flex gap-4 mb-2">
                            <div className="flex items-center space-x-2">
                                <input
                                    type="radio"
                                    id="proof-file"
                                    name="proofType"
                                    checked={!isLinkMode}
                                    onChange={() => setIsLinkMode(false)}
                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                                />
                                <Label htmlFor="proof-file" className="font-normal cursor-pointer">Ảnh chụp / File (Khuyên dùng)</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <input
                                    type="radio"
                                    id="proof-link"
                                    name="proofType"
                                    checked={isLinkMode}
                                    onChange={() => setIsLinkMode(true)}
                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                                />
                                <Label htmlFor="proof-link" className="font-normal cursor-pointer">Chỉ gửi Link</Label>
                            </div>
                        </div>

                        {!isLinkMode ? (
                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => document.getElementById('file-upload')?.click()}
                                    >
                                        <Upload className="h-4 w-4 mr-2" />
                                        {file ? "Chọn lại file" : "Tải ảnh/file chứng chỉ"}
                                    </Button>
                                    <input
                                        id="file-upload"
                                        type="file"
                                        className="hidden"
                                        accept=".pdf,.jpg,.jpeg,.png"
                                        onChange={handleFileChange}
                                    />
                                    {file && (
                                        <span className="text-sm text-green-600 flex items-center">
                                            <FileText className="h-4 w-4 mr-1" />
                                            {file.name}
                                        </span>
                                    )}
                                </div>
                                <p className="text-xs text-orange-600 bg-orange-50 p-2 rounded">
                                    💡 <b>Lưu ý:</b> Với chứng chỉ Blockchain, hãy <b>chụp ảnh màn hình</b> thông báo "Certificate Completed" (như hình bạn thấy trên web) và tải lên đây để giảng viên dễ dàng xác thực.
                                </p>
                            </div>
                        ) : (
                            <div className="flex flex-col gap-2">
                                <input
                                    type="text"
                                    placeholder="Dán Transaction Hash (0x...) hoặc Link Verify Certificate vào đây"
                                    value={linkUrl}
                                    onChange={(e) => setLinkUrl(e.target.value)}
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                />
                                <p className="text-xs text-blue-600">
                                    💡 Mẹo: Bạn có thể copy <b>BLOCKCHAIN TRANSACTION HASH</b> hoặc đường dẫn từ nút <b>Verify on Explorer</b> trên chứng chỉ của bạn.
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
                        Hủy
                    </Button>
                    <Button onClick={handleSubmit} disabled={isSubmitting || eligible === false}>
                        {isSubmitting ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                {isUploading ? "Đang tải file..." : "Đang gửi..."}
                            </>
                        ) : (
                            "Gửi yêu cầu"
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default SubmitCreditTransferModal;
