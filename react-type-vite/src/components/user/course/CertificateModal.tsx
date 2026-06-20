import React, { useRef, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Award, Download, ExternalLink, Loader2, Copy } from "lucide-react";
import type { CertificateResponse } from "@/services/api/response/certificateResponse";
import { createRoute } from "@/constants/routes";
import { toast } from 'react-toastify';

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
    const ipfsGateway = import.meta.env.VITE_IPFS_GATEWAY_URL || "https://gateway.pinata.cloud/ipfs/";
    const blockchainExplorerUrl = (import.meta.env.VITE_BLOCKCHAIN_EXPLORER_URL || "").replace(/\/$/, "");
    const blockchainChainId = Number(import.meta.env.VITE_BLOCKCHAIN_CHAIN_ID || "1337");

    const resolveIpfsUrl = (value?: string | null): string | null => {
        if (!value) return null;

        if (value.startsWith("ipfs://")) {
            return `${ipfsGateway.replace(/\/?$/, "/")}${value.replace("ipfs://", "")}`;
        }

        return value;
    };

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
    const formatVietnameseName = (name: string): string => {
        if (!name) return name;
        const parts = name.trim().split(/\s+/);
        if (parts.length <= 1) return name;
        const lastName = parts[parts.length - 1];
        const firstNames = parts.slice(0, parts.length - 1).join(" ");
        return `${lastName} ${firstNames}`;
    };

    const rawStudentName = studentName?.trim() || certificate?.studentName?.trim() || certificate?.userId || "Học viên";
    const displayStudentName = rawStudentName !== "Học viên" && !rawStudentName.match(/^[0-9]+$/) ? formatVietnameseName(rawStudentName) : rawStudentName;
    const displayGrade = certificate?.grade?.trim() || deriveGradeFromScore(finalScoreValue);
    const displayGpa = finalScoreValue !== null ? finalScoreValue.toFixed(1) : "Không có";

    const getExplorerTxUrl = (txHash?: string | null): string | null => {
        if (!txHash) return null;

        if (blockchainExplorerUrl) {
            return `${blockchainExplorerUrl}/tx/${txHash}`;
        }

        switch (blockchainChainId) {
            case 137:
                return `https://polygonscan.com/tx/${txHash}`;
            case 80002:
                return `https://amoy.polygonscan.com/tx/${txHash}`;
            case 80001:
                return `https://mumbai.polygonscan.com/tx/${txHash}`;
            case 11155111:
                return `https://sepolia.etherscan.io/tx/${txHash}`;
            default:
                return null;
        }
    };

    const handleViewPolygonScan = () => {
        const explorerUrl = getExplorerTxUrl(certificate?.transactionHash);

        if (!certificate?.transactionHash) {
            toast.info('Transaction hash không khả dụng');
            return;
        }

        if (!explorerUrl) {
            toast.info('Chưa cấu hình blockchain explorer cho mạng hiện tại');
            return;
        }

        window.open(explorerUrl, '_blank', 'noopener,noreferrer');
    };

    const handleDownloadPdfFromBackend = async () => {
        if (!certificate?.certificateCode) {
            toast.error('Mã chứng chỉ không tìm thấy');
            return;
        }

        try {
            setIsDownloading(true);
            // Download the actual PDF from Pinata/backend (not regenerated client-side)
            // This ensures hash verification will work correctly
            const pdfUrl = resolveIpfsUrl(certificate.pdfUrl) || `${import.meta.env.VITE_BASE_URL || "http://localhost:8888/api/v1"}/certificates/${certificate.certificateCode}/pdf`;
            
            const response = await fetch(pdfUrl);
            if (!response.ok) throw new Error('Failed to fetch PDF');
            
            const blob = await response.blob();
            const blobUrl = URL.createObjectURL(blob);
            
            // Create temporary link to download
            const link = document.createElement('a');
            link.href = blobUrl;
            link.download = `${certificate.certificateCode}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            // revoke after download
            setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
        } catch (error) {
            console.error("Tải xuống PDF thất bại:", error);
            toast.error('Tải xuống PDF thất bại');
        } finally {
            setIsDownloading(false);
        }
    };

    const copyToClipboard = (text: string, label: string) => {
        navigator.clipboard.writeText(text);
        toast.success(`Đã sao chép ${label}`);
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
                        style={{ fontFamily: "'Times New Roman', Georgia, 'Palatino Linotype', serif" }}
                    >
                        {/* Khung viền trang trí */}
                        <div className="absolute inset-2 sm:inset-4 border-[3px] sm:border-4 border-double border-yellow-500 pointer-events-none z-0"></div>
                        <div className="absolute inset-3 sm:inset-6 border border-blue-900 pointer-events-none z-0"></div>

                        {/* Góc họa tiết - dùng SVG để không bị tràn */}
                        <svg className="absolute top-0 left-0 z-0 pointer-events-none" width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <polygon points="0,0 80,0 0,80" fill="#1e3a5f"/>
                        </svg>
                        <svg className="absolute top-0 right-0 z-0 pointer-events-none" width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <polygon points="80,0 0,0 80,80" fill="#1e3a5f"/>
                        </svg>
                        <svg className="absolute bottom-0 left-0 z-0 pointer-events-none" width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <polygon points="0,80 80,80 0,0" fill="#1e3a5f"/>
                        </svg>
                        <svg className="absolute bottom-0 right-0 z-0 pointer-events-none" width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <polygon points="80,80 0,80 80,0" fill="#1e3a5f"/>
                        </svg>

                        {/* Header */}
                        <div className="z-10 mt-1 sm:mt-2 text-center w-full px-4">
                            <h1 className="text-2xl sm:text-4xl md:text-5xl font-bold tracking-widest text-blue-900 uppercase mb-1" style={{ fontFamily: "'Times New Roman', Georgia, serif" }}>CHỨNG CHỈ</h1>
                            <p className="text-xs sm:text-sm md:text-lg text-yellow-600 tracking-[0.1em] sm:tracking-[0.2em] font-semibold uppercase">HOÀN THÀNH KHÓA HỌC</p>
                        </div>

                        {/* Tên học viên */}
                        <div className="z-10 w-full flex flex-col items-center px-4 mt-1">
                            <p className="text-xs sm:text-base text-gray-500 italic mb-1">Trân trọng trao tặng chứng chỉ này cho</p>
                            <h2
                                className="text-xl sm:text-3xl md:text-4xl text-blue-800 my-1 px-4 border-b-2 border-gray-200 pb-1 font-bold italic text-center w-full max-w-[85%] break-words leading-tight"
                            >
                                {displayStudentName}
                            </h2>
                        </div>

                        {/* Thông tin khóa học */}
                        <div className="z-10 w-full flex flex-col items-center px-4 mt-1">
                            <p className="text-[10px] sm:text-base text-gray-500 mb-1">Vì đã hoàn thành xuất sắc khóa học</p>
                            <h3 className="text-lg sm:text-2xl md:text-3xl font-bold text-gray-800 mb-1 w-full max-w-[90%] text-center break-words leading-tight">
                                {courseName}
                            </h3>
                            <p className="text-[10px] sm:text-xs md:text-sm text-gray-600 italic leading-snug text-center">
                                Chứng chỉ này xác nhận việc hoàn thành khóa học thành công.
                                <span className="block mt-0.5 font-semibold text-blue-800 not-italic">
                                    Học lực: {displayGrade} (Điểm: {displayGpa})
                                </span>
                            </p>
                        </div>

                        {/* Chữ ký & Badge */}
                        <div className="z-10 w-full grid grid-cols-3 items-end px-4 sm:px-10 mb-4 sm:mb-6 mt-2">
                            <div className="flex flex-col items-center text-center justify-end gap-1.5 sm:gap-2">
                                <img
                                    src={qrUrl}
                                    alt="Mã QR xác minh chứng chỉ"
                                    className="w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 rounded bg-white border border-slate-300 p-0.5 sm:p-1 shadow-sm"
                                />
                                <div className="w-20 sm:w-32 md:w-40">
                                    <div className="h-px w-full bg-gradient-to-r from-transparent via-slate-400 to-transparent"></div>
                                    <p className="text-[8px] sm:text-xs text-gray-500 mt-0.5">QR xác minh</p>
                                </div>
                            </div>

                            <div className="flex flex-col items-center justify-end mb-0.5">
                                <div className="w-12 h-12 sm:w-20 sm:h-20 md:w-24 md:h-24 bg-yellow-500 rounded-full flex flex-col items-center justify-center text-white shadow-md border-2 sm:border-4 border-white ring-1 ring-yellow-500 mb-1 sm:mb-2 z-10 shrink-0">
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

                            <div className="flex flex-col items-center text-center justify-end gap-1.5 sm:gap-2">
                                <div className="text-[10px] sm:text-sm md:text-lg font-bold text-gray-800 leading-tight">{issueDateStr}</div>
                                <div className="w-20 sm:w-32 md:w-40">
                                    <div className="h-px w-full bg-gradient-to-r from-transparent via-slate-400 to-transparent"></div>
                                    <p className="text-[8px] sm:text-xs text-gray-500 mt-0.5">Ngày cấp</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Controls */}
                <DialogFooter className="w-full flex flex-col gap-3 bg-white p-3 sm:p-4 rounded-xl shadow-sm border border-gray-200 mt-2 shrink-0">
                    {/* Public Verify Link */}
                    <div className="flex items-center gap-3 w-full bg-slate-50 p-2 sm:p-3 rounded-lg border border-slate-100 min-w-0">
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

                    {/* Blockchain Metadata */}
                    {(certificate?.certificateHash || certificate?.tokenId) && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full">
                            {certificate?.certificateHash && (
                                <div className="bg-purple-50 p-2 sm:p-3 rounded-lg border border-purple-100 flex items-center justify-between gap-2 min-w-0">
                                    <div className="min-w-0 flex-1">
                                        <p className="text-[9px] sm:text-xs font-semibold text-purple-600 uppercase tracking-wider mb-0.5">Certificate Hash</p>
                                        <p className="text-[11px] sm:text-xs font-mono text-purple-800 truncate" title={certificate.certificateHash}>
                                            {certificate.certificateHash.substring(0, 12)}...
                                        </p>
                                    </div>
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        className="h-8 w-8 p-0 flex-shrink-0"
                                        onClick={() => copyToClipboard(certificate.certificateHash || '', 'Certificate Hash')}
                                        title="Sao chép hash"
                                    >
                                        <Copy className="w-3.5 h-3.5" />
                                    </Button>
                                </div>
                            )}
                            
                            {certificate?.tokenId && (
                                <div className="bg-blue-50 p-2 sm:p-3 rounded-lg border border-blue-100 flex items-center justify-between gap-2 min-w-0">
                                    <div className="min-w-0 flex-1">
                                        <p className="text-[9px] sm:text-xs font-semibold text-blue-600 uppercase tracking-wider mb-0.5">Token ID</p>
                                        <p className="text-[11px] sm:text-xs font-mono text-blue-800 truncate" title={certificate.tokenId}>
                                            {certificate.tokenId}
                                        </p>
                                    </div>
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        className="h-8 w-8 p-0 flex-shrink-0"
                                        onClick={() => copyToClipboard(certificate.tokenId || '', 'Token ID')}
                                        title="Sao chép Token ID"
                                    >
                                        <Copy className="w-3.5 h-3.5" />
                                    </Button>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex flex-wrap items-center justify-end gap-2 w-full">
                        <Button
                            onClick={handleDownloadPdfFromBackend}
                            disabled={isDownloading}
                            className="flex-1 sm:flex-none bg-orange-600 hover:bg-orange-700 text-white gap-1.5 text-xs sm:text-sm h-9 px-3"
                            title="Mở PDF chứng chỉ"
                        >
                            {isDownloading ? <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" /> : <Download className="w-3.5 h-3.5 shrink-0" />}
                            <span className="truncate">Xem PDF</span>
                        </Button>

                        <Button
                            onClick={handleViewPolygonScan}
                            disabled={!certificate?.transactionHash}
                            className="flex-1 sm:flex-none bg-emerald-700 hover:bg-emerald-800 text-white gap-1.5 text-xs sm:text-sm h-9 px-3"
                            title="Xem giao dịch trên explorer"
                        >
                            <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                            <span className="truncate">View transaction</span>
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default CertificateModal;