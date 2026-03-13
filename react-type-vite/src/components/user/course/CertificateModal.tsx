import React, { useRef, useState } from 'react';
import { Dialog, DialogContent, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Award, CheckCircle, Download, ExternalLink, ShieldCheck, Loader2 } from "lucide-react";
import type { CertificateResponse } from "@/services/api/response/certificateResponse";
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface CertificateModalProps {
    open: boolean;
    onClose: () => void;
    certificate: CertificateResponse | null;
    courseName: string;
    studentName?: string; // Add student name prop if available, otherwise use "Student"
}

const CertificateModal: React.FC<CertificateModalProps> = ({ open, onClose, certificate, courseName, studentName = "Học viên" }) => {
    const certificateRef = useRef<HTMLDivElement>(null);
    const [isDownloading, setIsDownloading] = useState(false);

    const isVerified = certificate?.status === "ISSUED" && certificate?.transactionHash;
    const issueDateStr = certificate?.issueDate ? new Date(certificate.issueDate).toLocaleDateString('vi-VN') : 'N/A';

    const handleDownload = async (type: 'pdf' | 'image') => {
        if (!certificateRef.current) return;
        setIsDownloading(true);

        try {
            const canvas = await html2canvas(certificateRef.current, {
                scale: 2, // Higher resolution
                useCORS: true,
                backgroundColor: "#ffffff"
            });

            if (type === 'image') {
                const link = document.createElement('a');
                link.download = `Certificate-${certificate?.certificateCode || 'OpenEdu'}.png`;
                link.href = canvas.toDataURL('image/png');
                link.click();
            } else {
                const imgData = canvas.toDataURL('image/png');
                const pdf = new jsPDF('l', 'mm', 'a4'); // Landscape, A4
                const pdfWidth = pdf.internal.pageSize.getWidth();
                const pdfHeight = pdf.internal.pageSize.getHeight();

                pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
                pdf.save(`Certificate-${certificate?.certificateCode || 'OpenEdu'}.pdf`);
            }
        } catch (error) {
            console.error("Download failed:", error);
        } finally {
            setIsDownloading(false);
        }
    };

    if (!certificate) return null;

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-5xl w-full bg-transparent border-none shadow-none p-0 md:p-4">
                {/* Certificate Container - Scalable and printable */}
                <div
                    ref={certificateRef}
                    className="relative bg-white w-full aspect-[1.414/1] mx-auto overflow-hidden text-center flex flex-col items-center justify-between p-12 md:p-16 shadow-2xl"
                    style={{
                        fontFamily: "'Times New Roman', serif",
                        maxWidth: '1000px',
                    }}
                >
                    {/* Decorative Border */}
                    <div className="absolute inset-4 border-4 border-double border-yellow-500 pointer-events-none"></div>
                    <div className="absolute inset-6 border border-blue-900 pointer-events-none"></div>

                    {/* Corner Ornaments */}
                    <div className="absolute top-0 left-0 w-24 h-24 bg-blue-900" style={{ clipPath: 'polygon(0 0, 100% 0, 0 100%)' }}></div>
                    <div className="absolute top-0 right-0 w-24 h-24 bg-blue-900" style={{ clipPath: 'polygon(100% 0, 0 0, 100% 100%)' }}></div>
                    <div className="absolute bottom-0 left-0 w-24 h-24 bg-blue-900" style={{ clipPath: 'polygon(0 100%, 0 0, 100% 100%)' }}></div>
                    <div className="absolute bottom-0 right-0 w-24 h-24 bg-blue-900" style={{ clipPath: 'polygon(100% 100%, 100% 0, 0 100%)' }}></div>

                    {/* Header */}
                    <div className="z-10 mt-8">
                        <h1 className="text-5xl md:text-6xl font-bold tracking-widest text-blue-900 uppercase mb-2" style={{ fontFamily: "serif" }}>CERTIFICATE</h1>
                        <p className="text-xl text-yellow-600 tracking-[0.3em] font-semibold uppercase">OF COMPLETION</p>
                    </div>

                    {/* Presented To */}
                    <div className="z-10">
                        <p className="text-lg text-gray-500 italic mb-2">This certificate is proudly presented to</p>
                        <h2 className="text-4xl md:text-6xl text-blue-800 my-4 px-8 min-w-[300px] border-b-2 border-gray-200 pb-2 inline-block italic font-bold">
                            {studentName}
                        </h2>
                    </div>

                    {/* Course Info */}
                    <div className="z-10 max-w-2xl px-4">
                        <p className="text-lg text-gray-500 mb-2">For successfully completing the course</p>
                        <h3 className="text-3xl font-bold text-gray-800 mb-4">{courseName}</h3>
                        <p className="text-gray-600 italic">
                            Verified on Blockchain Technology. This credential confirms that the student has completed all required coursework and assessments.
                            {certificate.finalScore !== undefined && (
                                <span className="block mt-2 font-semibold text-blue-800">
                                    Grade: {certificate.grade} (GPA: {certificate.finalScore.toFixed(1)})
                                </span>
                            )}
                        </p>
                    </div>

                    {/* Footer / Signatures & Badge */}
                    <div className="z-10 w-full flex justify-between items-end mt-8 px-12">
                        <div className="text-center group">
                            <div className="w-48 border-b border-gray-400 mb-2 mx-auto"></div>
                            <p className="text-lg font-bold text-blue-900">OpenEdu Platform</p>
                            <p className="text-sm text-gray-500">Authorized Signature</p>
                        </div>

                        {/* Central Badge */}
                        <div className="relative -mb-6">
                            <div className="w-32 h-32 bg-yellow-500 rounded-full flex items-center justify-center text-white shadow-lg mx-auto border-4 border-white outline outline-4 outline-yellow-500 flex-col">
                                <Award className="w-12 h-12 mb-1" />
                                {certificate.grade && (
                                    <span className="text-[10px] font-bold uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded">
                                        {certificate.grade.split('(')[0].trim()}
                                    </span>
                                )}
                            </div>
                            <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-blue-900 text-white text-xs px-3 py-1 rounded-full whitespace-nowrap shadow">
                                {isVerified ? "Verified" : "Pending"}
                            </div>
                        </div>

                        <div className="text-center">
                            <div className="text-lg font-bold text-gray-800 mb-1">{issueDateStr}</div>
                            <div className="w-48 border-t border-gray-400 mt-1 mx-auto pt-2">
                                <p className="text-sm text-gray-500">Date Issued</p>
                            </div>
                        </div>
                    </div>

                    {/* Blockchain Hash Footer */}
                    <div className="z-10 mt-8 w-full text-center">
                        <div className="inline-flex items-center gap-2 bg-gray-50 px-4 py-1 rounded-full text-[10px] md:text-xs text-gray-400 border border-gray-200 font-mono">
                            <ShieldCheck className="w-3 h-3 text-blue-500" />
                            ID: {certificate.certificateCode} | Hash: {certificate.transactionHash?.substring(0, 10)}...{certificate.transactionHash?.substring(certificate.transactionHash.length - 8)}
                        </div>
                    </div>
                </div>

                {/* Controls */}
                <DialogFooter className="mt-4 flex sm:justify-center gap-3 bg-white p-4 rounded-lg shadow-lg mx-4 md:mx-0">
                    <Button variant="outline" onClick={onClose}>Close</Button>

                    {certificate.transactionHash && (
                        <Button variant="outline" className="gap-2 border-blue-200 text-blue-700 hover:bg-blue-50" onClick={() => window.open(`https://sepolia.etherscan.io/tx/${certificate.transactionHash}`, '_blank')}>
                            <ExternalLink className="w-4 h-4" />
                            Verify on Blockchain
                        </Button>
                    )}

                    <Button onClick={() => handleDownload('image')} disabled={isDownloading} className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2">
                        {isDownloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                        Save Image
                    </Button>

                    <Button onClick={() => handleDownload('pdf')} disabled={isDownloading} className="bg-blue-900 hover:bg-blue-800 text-white gap-2">
                        {isDownloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                        Download PDF
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default CertificateModal;
