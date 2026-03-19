import React, { useRef, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Award, Download, ExternalLink, ShieldCheck, Loader2 } from "lucide-react";
import type { CertificateResponse } from "@/services/api/response/certificateResponse";
import { createRoute } from "@/constants/routes";
import { toPng } from 'html-to-image'; // Đã thay thế html2canvas
import jsPDF from 'jspdf';

interface CertificateModalProps {
    open: boolean;
    onClose: () => void;
    certificate: CertificateResponse | null;
    courseName: string;
    studentName?: string;
}

const CertificateModal: React.FC<CertificateModalProps> = ({ open, onClose, certificate, courseName, studentName = "Học viên" }) => {
    const certificateRef = useRef<HTMLDivElement>(null);
    const [isDownloading, setIsDownloading] = useState(false);

    const deriveGradeFromScore = (score: number | null): string => {
        if (score === null) return "Không có";
        if (score >= 9.0) return "Xuất sắc";
        if (score >= 8.0) return "Giỏi";
        if (score >= 6.5) return "Khá";
        if (score >= 5.0) return "Trung bình";
        return "Yếu";
    };

    const isVerified = certificate?.status === "ISSUED" && certificate?.transactionHash;
    const issueDateStr = certificate?.issueDate ? new Date(certificate.issueDate).toLocaleDateString('vi-VN') : 'Không có';
    const finalScoreValue =
        typeof certificate?.finalScore === "number" && Number.isFinite(certificate.finalScore)
            ? certificate.finalScore
            : null;
    const txHash = certificate?.transactionHash;
    const txHashDisplay = txHash
        ? txHash.length > 18
            ? `${txHash.substring(0, 10)}...${txHash.substring(txHash.length - 8)}`
            : txHash
        : "Không có";
    const displayStudentName = studentName?.trim() || certificate?.studentName?.trim() || certificate?.userId || "Học viên";
    const displayGrade = certificate?.grade?.trim() || deriveGradeFromScore(finalScoreValue);
    const displayGpa = finalScoreValue !== null ? finalScoreValue.toFixed(1) : "Không có";

    const handleDownload = async (type: 'pdf' | 'image') => {
        if (!certificateRef.current) return;
        setIsDownloading(true);

        try {
            // Sử dụng html-to-image để fix lỗi màu oklch của Tailwind/Shadcn
            const dataUrl = await toPng(certificateRef.current, {
                quality: 1,
                pixelRatio: 2, // Tăng độ nét cho ảnh in ra
                backgroundColor: "#ffffff",
                style: {
                    transform: 'scale(1)',
                    transformOrigin: 'top left',
                    margin: '0'
                }
            });

            if (type === 'image') {
                const link = document.createElement('a');
                link.download = `ChungChi-${certificate?.certificateCode || 'OpenEdu'}.png`;
                link.href = dataUrl;
                link.click();
            } else {
                const pdf = new jsPDF('l', 'mm', 'a4');
                const pdfWidth = pdf.internal.pageSize.getWidth();
                const pdfHeight = pdf.internal.pageSize.getHeight();

                pdf.addImage(dataUrl, 'PNG', 0, 0, pdfWidth, pdfHeight);
                pdf.save(`ChungChi-${certificate?.certificateCode || 'OpenEdu'}.pdf`);
            }
        } catch (error) {
            console.error("Tải xuống thất bại:", error);
        } finally {
            setIsDownloading(false);
        }
    };

    if (!certificate) return null;

    const publicVerifyUrl = `${window.location.origin}${createRoute.certificateVerify(certificate.certificateCode)}`;
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(publicVerifyUrl)}`;

    return (
        <Dialog open={open} onOpenChange={onClose}>
            {/* Modal Container */}
            <DialogContent className="max-w-[95vw] md:max-w-4xl w-full h-auto max-h-[96vh] flex flex-col overflow-hidden p-3 sm:p-6 bg-slate-100/90 backdrop-blur-sm border-none shadow-2xl">
                <DialogTitle className="sr-only">Chi tiết chứng chỉ</DialogTitle>
                <DialogDescription className="sr-only">Xem chứng chỉ và xác minh blockchain</DialogDescription>

                {/* Vùng chứa Chứng chỉ (Scrollable) */}
                <div className="flex-1 w-full overflow-y-auto overflow-x-hidden flex flex-col items-center rounded-lg min-h-0">
                    <div
                        ref={certificateRef}
                        className="relative bg-white w-full max-w-[800px] aspect-[1.414/1] flex flex-col items-center justify-between p-4 sm:p-8 md:p-12 shadow-md border border-gray-200 overflow-hidden shrink-0"
                        style={{ fontFamily: "'Times New Roman', serif" }}
                    >
                        {/* Khung viền trang trí */}
                        <div className="absolute inset-2 sm:inset-4 border-[3px] sm:border-4 border-double border-yellow-500 pointer-events-none z-0"></div>
                        <div className="absolute inset-3 sm:inset-6 border border-blue-900 pointer-events-none z-0"></div>

                        {/* Góc họa tiết */}
                        <div className="absolute top-0 left-0 w-16 h-16 sm:w-24 sm:h-24 bg-blue-900 z-0" style={{ clipPath: 'polygon(0 0, 100% 0, 0 100%)' }}></div>
                        <div className="absolute top-0 right-0 w-16 h-16 sm:w-24 sm:h-24 bg-blue-900 z-0" style={{ clipPath: 'polygon(100% 0, 0 0, 100% 100%)' }}></div>
                        <div className="absolute bottom-0 left-0 w-16 h-16 sm:w-24 sm:h-24 bg-blue-900 z-0" style={{ clipPath: 'polygon(0 100%, 0 0, 100% 100%)' }}></div>
                        <div className="absolute bottom-0 right-0 w-16 h-16 sm:w-24 sm:h-24 bg-blue-900 z-0" style={{ clipPath: 'polygon(100% 100%, 100% 0, 0 100%)' }}></div>

                        {/* Header */}
                        <div className="z-10 mt-2 sm:mt-4 text-center w-full px-4">
                            <h1 className="text-2xl sm:text-4xl md:text-5xl font-bold tracking-widest text-blue-900 uppercase mb-1" style={{ fontFamily: "serif" }}>CHỨNG CHỈ</h1>
                            <p className="text-xs sm:text-sm md:text-lg text-yellow-600 tracking-[0.1em] sm:tracking-[0.2em] font-semibold uppercase">HOÀN THÀNH KHÓA HỌC</p>
                        </div>

                        {/* Tên học viên */}
                        <div className="z-10 w-full flex flex-col items-center px-4 mt-1 sm:mt-2">
                            <p className="text-xs sm:text-base text-gray-500 italic mb-1">Trân trọng trao tặng chứng chỉ này cho</p>
                            <h2
                                className="text-xl sm:text-3xl md:text-4xl text-blue-800 my-1 px-4 border-b-2 border-gray-200 pb-1 font-bold italic text-center w-full max-w-[85%] break-words leading-tight"
                            >
                                {displayStudentName}
                            </h2>
                        </div>

                        {/* Thông tin khóa học */}
                        <div className="z-10 w-full flex flex-col items-center px-4 mt-1 sm:mt-2">
                            <p className="text-[10px] sm:text-base text-gray-500 mb-1">Vì đã hoàn thành xuất sắc khóa học</p>
                            <h3 className="text-lg sm:text-2xl md:text-3xl font-bold text-gray-800 mb-1 w-full max-w-[90%] text-center break-words leading-tight">
                                {courseName}
                            </h3>
                            <p className="text-[10px] sm:text-xs md:text-sm text-gray-600 italic leading-snug text-center">
                                Chứng chỉ này xác nhận việc hoàn thành khóa học thành công.
                                <span className="block mt-1 font-semibold text-blue-800 not-italic">
                                    Học lực: {displayGrade} (Điểm: {displayGpa})
                                </span>
                            </p>
                        </div>

                        {/* Chữ ký & Badge */}
                        <div className="z-10 w-full grid grid-cols-3 items-end px-4 sm:px-10 mb-6 sm:mb-8 mt-2 sm:mt-4">
                            <div className="flex flex-col items-center text-center">
                                <div className="w-16 sm:w-28 md:w-36 border-b border-gray-400 mb-1 sm:mb-2"></div>
                                <p className="text-[10px] sm:text-sm md:text-lg font-bold text-blue-900 leading-tight">OpenEdu</p>
                                <p className="text-[8px] sm:text-xs text-gray-500">Chữ ký</p>
                            </div>

                            <div className="flex flex-col items-center justify-center">
                                <div className="w-12 h-12 sm:w-20 sm:h-20 md:w-24 md:h-24 bg-yellow-500 rounded-full flex flex-col items-center justify-center text-white shadow-md border-2 sm:border-4 border-white outline outline-1 sm:outline-2 outline-yellow-500 mb-1 sm:mb-2 z-10 shrink-0">
                                    <Award className="w-5 h-5 sm:w-8 sm:h-8 md:w-10 md:h-10" />
                                    {certificate.grade && (
                                        <span className="text-[6px] sm:text-[9px] font-bold uppercase tracking-wider bg-white/20 px-1 sm:px-2 py-0.5 rounded mt-0.5">
                                            {certificate.grade.split('(')[0].trim()}
                                        </span>
                                    )}
                                </div>
                                <div className="bg-blue-900 text-white text-[8px] sm:text-[10px] md:text-xs px-2 sm:px-3 py-0.5 sm:py-1 rounded-full shadow-sm whitespace-nowrap">
                                    {isVerified ? "Đã xác minh" : "Chờ xác minh"}
                                </div>
                            </div>

                            <div className="flex flex-col items-center text-center">
                                <div className="text-[10px] sm:text-sm md:text-lg font-bold text-gray-800 mb-1 sm:mb-2 leading-tight">{issueDateStr}</div>
                                <div className="w-16 sm:w-28 md:w-36 border-t border-gray-400 pt-1">
                                    <p className="text-[8px] sm:text-xs text-gray-500">Ngày cấp</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Controls */}
                <DialogFooter className="w-full flex flex-col md:flex-row gap-3 bg-white p-3 sm:p-4 rounded-xl shadow-sm border border-gray-200 mt-2 shrink-0">
                    <div className="flex items-center gap-3 w-full md:w-1/2 bg-slate-50 p-2 sm:p-3 rounded-lg border border-slate-100 min-w-0">
                        <img
                            src={qrUrl}
                            alt="Mã QR chứng chỉ"
                            className="w-10 h-10 sm:w-12 sm:h-12 rounded bg-white border border-slate-200 shrink-0"
                        />
                        <div className="flex flex-col min-w-0 w-full">
                            <span className="text-[10px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider mb-0.5">Liên kết xác minh công khai</span>
                            <a
                                href={publicVerifyUrl}
                                target="_blank"
                                rel="noreferrer"
                                title={publicVerifyUrl}
                                className="text-xs sm:text-sm text-blue-600 hover:text-blue-800 hover:underline truncate w-full block"
                            >
                                {publicVerifyUrl}
                            </a>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-end gap-2 w-full md:w-1/2">

                        <Button
                            onClick={() => handleDownload('image')}
                            disabled={isDownloading}
                            className="flex-1 sm:flex-none bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 text-xs sm:text-sm h-9 px-3"
                        >
                            {isDownloading ? <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" /> : <Download className="w-3.5 h-3.5 shrink-0" />}
                            <span className="truncate">Lưu ảnh</span>
                        </Button>

                        <Button
                            onClick={() => handleDownload('pdf')}
                            disabled={isDownloading}
                            className="flex-1 sm:flex-none bg-blue-900 hover:bg-blue-800 text-white gap-1.5 text-xs sm:text-sm h-9 px-3"
                        >
                            {isDownloading ? <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" /> : <Download className="w-3.5 h-3.5 shrink-0" />}
                            <span className="truncate">Tải PDF</span>
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default CertificateModal;