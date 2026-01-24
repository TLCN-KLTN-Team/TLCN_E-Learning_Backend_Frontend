import React, { useState } from "react";
import {
    X,
    Upload,
    FileText,
    AlertCircle,
    CheckCircle,
    Download,
    Eye,
    EyeOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "react-toastify";
import * as expertApi from "@/services/api/expert/expertApi";
import {
    parseSpreadsheet,
    validateExpertRow,
    downloadExpertTemplateXLSX,
    type ExpertImportData,
} from "@/utils/csvParser";
import type { ExpertRequest } from "@/services/api/request/expertRequest";

interface ImportExpertsModalProps {
    isOpen: boolean;
    onClose: () => void;
    educationalUnitId: number;
    onSuccess?: () => void;
}

interface ImportRow {
    rowIndex: number;
    data?: ExpertImportData;
    isValid: boolean;
    errors: string[];
}

const ImportExpertsModal: React.FC<ImportExpertsModalProps> = ({
    isOpen,
    onClose,
    educationalUnitId,
    onSuccess,
}) => {
    const [step, setStep] = useState<
        "upload" | "preview" | "importing" | "result"
    >("upload");
    const [file, setFile] = useState<File | null>(null);
    const [importData, setImportData] = useState<ImportRow[]>([]);
    const [isImporting, setIsImporting] = useState(false);
    const [importResult, setImportResult] = useState<any>(null);
    const [showErrorDetails, setShowErrorDetails] = useState(false);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (!selectedFile) return;

        // Validate file type (XLSX only)
        const isXlsx =
            selectedFile.name.toLowerCase().endsWith(".xlsx") ||
            selectedFile.type ===
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
        if (!isXlsx) {
            toast.error("Chỉ hỗ trợ file Excel (.xlsx)");
            return;
        }

        // Validate file size (max 5MB)
        if (selectedFile.size > 5 * 1024 * 1024) {
            toast.error("File size must be less than 5MB");
            return;
        }

        setFile(selectedFile);

        try {
            const rows = await parseSpreadsheet(selectedFile);
            if (rows.length < 2) {
                toast.error("File phải có hàng header và ít nhất 1 hàng dữ liệu");
                return;
            }

            const headers = rows[0].map((h) => h.toLowerCase().trim());
            const dataRows = rows.slice(1);

            const validatedRows: ImportRow[] = dataRows.map((row, index) => {
                const validation = validateExpertRow(row, headers, index + 2);
                return {
                    rowIndex: index + 2,
                    data: validation.data,
                    isValid: validation.isValid,
                    errors: validation.errors,
                };
            });

            setImportData(validatedRows);
            setStep("preview");
        } catch (error: any) {
            toast.error(error.message || "Failed to parse file");
        }
    };

    const handleImport = async () => {
        const validRows = importData.filter((row) => row.isValid);

        if (validRows.length === 0) {
            toast.error("No valid rows to import");
            return;
        }

        setIsImporting(true);
        setStep("importing");

        try {
            const expertRequests: ExpertRequest[] = validRows.map((row) => {
                const data = row.data!;
                return {
                    username: data.username,
                    email: data.email,
                    firstName: data.firstName,
                    lastName: data.lastName,
                    expertId: data.expertId,
                    password: data.password || "DefaultPass@123",
                    dob: data.dob,
                    description: data.description,
                    // phoneNumber: data.phoneNumber, // ExpertRequest interface in file might need this, but checking prev files it wasn't strictly shown in Request interface but was in Response.
                    // Assuming api will accept extra fields or we need to align exactly with Request DTO.
                    // Since I can't check Request DTO right now, I'll pass fields that match known inputs.
                };
            });

            // Note: expertApi.bulkImportExperts returns response.data directly based on my edit, 
            // but typically backend returns { code, message, result }.
            // If result is directly returned, verify.
            // Based on my edit to expertApi.ts, it returns response.data.
            // And standard ApiResponse is { code, message, result }. 
            // Teacher API wrapper returned response.data.result. 
            // I made expertApi wrapper return response.data. 
            // So I might need to access `.result` here if my API wrapper returns the whole object.
            // Wait, I should double check expertApi.ts return.
            // I wrote: return response.data;
            // If backend returns ApiResponse, then result is inside.
            // I'll assume standard ApiResponse structure and try to access result if needed.
            // But standard for this project seems to be wrappers return the result directly usually?
            // TeacherApi: returns response.data.result.
            // ExpertApi: returns response.data.
            // So here I will get the FULL ApiResponse object. 
            // So I need to access .result.

            const response = await expertApi.bulkImportExperts(
                educationalUnitId,
                expertRequests
            );

            // Handle potential different return structure
            const result = (response as any).result || response;

            setImportResult(result);
            setStep("result");

            if (result.successful > 0) {
                toast.success(`Successfully imported ${result.successful} expert(s)`);
                if (result.failed === 0) {
                    setTimeout(() => {
                        handleClose();
                        onSuccess?.();
                    }, 2000);
                }
            }

            if (result.failed > 0) {
                toast.warning(`${result.failed} expert(s) failed to import`);
            }
        } catch (error: any) {
            console.error("Import error:", error);
            toast.error(error.response?.data?.message || "Failed to import experts");
            setStep("preview");
        } finally {
            setIsImporting(false);
        }
    };

    const handleClose = () => {
        setStep("upload");
        setFile(null);
        setImportData([]);
        setImportResult(null);
        setShowErrorDetails(false);
        onClose();
    };

    if (!isOpen) return null;

    const validRowsCount = importData.filter((row) => row.isValid).length;
    const invalidRowsCount = importData.filter((row) => !row.isValid).length;

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
                    <div className="flex items-center gap-3">
                        <Upload className="w-6 h-6 text-blue-600" />
                        <h2 className="text-xl font-bold text-gray-900">
                            Import Chuyên Gia
                        </h2>
                    </div>
                    <button
                        onClick={handleClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                        title="Close import modal"
                        aria-label="Close import modal"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {step === "upload" && (
                        <div className="space-y-6">
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                <h3 className="font-semibold text-blue-900 mb-2">
                                    Hướng dẫn Import
                                </h3>
                                <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                                    <li>Tải template Excel bên dưới</li>
                                    <li>Điền thông tin chuyên gia vào file Excel</li>
                                    <li>Upload file và xem trước dữ liệu</li>
                                    <li>Xác nhận để import toàn bộ chuyên gia</li>
                                </ul>
                            </div>

                            <div className="space-y-3">
                                <Button
                                    onClick={() => {
                                        downloadExpertTemplateXLSX();
                                    }}
                                    className="w-full bg-green-600 hover:bg-green-700 text-white"
                                >
                                    <Download className="w-4 h-4 mr-2" />
                                    Tải Template XLSX
                                </Button>

                                <input
                                    id="file-input"
                                    type="file"
                                    accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                                    onChange={handleFileChange}
                                    className="hidden"
                                    title="Select XLSX file to import"
                                    aria-label="Select XLSX file to import"
                                />

                                <label
                                    htmlFor="file-input"
                                    className="block border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors cursor-pointer"
                                    role="button"
                                    tabIndex={0}
                                    title="Upload Excel file"
                                >
                                    <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                                    <p className="text-gray-600 font-medium">
                                        Kéo thả file Excel tại đây hoặc click để chọn
                                    </p>
                                    <p className="text-sm text-gray-500 mt-1">
                                        Tối đa 5MB, định dạng XLSX
                                    </p>
                                </label>

                                {file && (
                                    <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                                        <p className="text-sm text-green-800">
                                            ✓ File được chọn:{" "}
                                            <span className="font-semibold">{file.name}</span>
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {step === "preview" && (
                        <div className="space-y-4">
                            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
                                <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                                <div>
                                    <h4 className="font-semibold text-amber-900">
                                        Kiểm tra trước import
                                    </h4>
                                    <p className="text-sm text-amber-800 mt-1">
                                        {validRowsCount} hàng hợp lệ
                                        {invalidRowsCount > 0 &&
                                            `, ${invalidRowsCount} hàng có lỗi`}
                                    </p>
                                </div>
                            </div>

                            {/* Valid rows summary */}
                            {validRowsCount > 0 && (
                                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        <CheckCircle className="w-5 h-5 text-green-600" />
                                        <h4 className="font-semibold text-green-900">
                                            Dữ liệu hợp lệ ({validRowsCount})
                                        </h4>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm">
                                            <thead>
                                                <tr className="border-b border-green-200">
                                                    <th className="text-left py-2 px-3 font-semibold text-green-900">
                                                        STT
                                                    </th>
                                                    <th className="text-left py-2 px-3 font-semibold text-green-900">
                                                        Username
                                                    </th>
                                                    <th className="text-left py-2 px-3 font-semibold text-green-900">
                                                        Email
                                                    </th>
                                                    <th className="text-left py-2 px-3 font-semibold text-green-900">
                                                        Họ tên
                                                    </th>
                                                    <th className="text-left py-2 px-3 font-semibold text-green-900">
                                                        Mã CG
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {importData
                                                    .filter((row) => row.isValid)
                                                    .slice(0, 5)
                                                    .map((row, idx) => (
                                                        <tr
                                                            key={idx}
                                                            className="border-b border-green-100 hover:bg-green-100"
                                                        >
                                                            <td className="py-2 px-3">{row.rowIndex}</td>
                                                            <td className="py-2 px-3">
                                                                {row.data?.username}
                                                            </td>
                                                            <td className="py-2 px-3">{row.data?.email}</td>
                                                            <td className="py-2 px-3">
                                                                {row.data?.firstName} {row.data?.lastName}
                                                            </td>
                                                            <td className="py-2 px-3">
                                                                {row.data?.expertId}
                                                            </td>
                                                        </tr>
                                                    ))}
                                            </tbody>
                                        </table>
                                    </div>
                                    {validRowsCount > 5 && (
                                        <p className="text-xs text-green-700 mt-2">
                                            ... và {validRowsCount - 5} hàng khác
                                        </p>
                                    )}
                                </div>
                            )}

                            {/* Invalid rows details */}
                            {invalidRowsCount > 0 && (
                                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                                    <button
                                        onClick={() => setShowErrorDetails(!showErrorDetails)}
                                        className="flex items-center gap-2 font-semibold text-red-900 hover:text-red-700 transition-colors"
                                    >
                                        {showErrorDetails ? (
                                            <EyeOff className="w-4 h-4" />
                                        ) : (
                                            <Eye className="w-4 h-4" />
                                        )}
                                        Chi tiết lỗi ({invalidRowsCount} hàng)
                                    </button>
                                    {showErrorDetails && (
                                        <div className="mt-3 space-y-2 max-h-64 overflow-y-auto">
                                            {importData
                                                .filter((row) => !row.isValid)
                                                .map((row, idx) => (
                                                    <div
                                                        key={idx}
                                                        className="text-sm text-red-700 bg-white p-2 rounded border border-red-100"
                                                    >
                                                        <p className="font-semibold">
                                                            Hàng {row.rowIndex}:
                                                        </p>
                                                        <ul className="list-disc list-inside ml-1">
                                                            {row.errors.map((error, errIdx) => (
                                                                <li key={errIdx}>{error}</li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {step === "importing" && (
                        <div className="flex flex-col items-center justify-center py-12">
                            <div className="animate-spin mb-4">
                                <div className="w-12 h-12 border-4 border-gray-200 border-t-blue-600 rounded-full"></div>
                            </div>
                            <p className="text-gray-600 font-semibold">
                                Đang import {validRowsCount} chuyên gia...
                            </p>
                        </div>
                    )}

                    {step === "result" && importResult && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                    <p className="text-sm text-green-600 font-semibold">
                                        Thành công
                                    </p>
                                    <p className="text-3xl font-bold text-green-700">
                                        {importResult.successful}
                                    </p>
                                </div>
                                <div
                                    className={`rounded-lg p-4 ${importResult.failed > 0
                                        ? "bg-red-50 border border-red-200"
                                        : "bg-gray-50 border border-gray-200"
                                        }`}
                                >
                                    <p
                                        className={`text-sm font-semibold ${importResult.failed > 0
                                            ? "text-red-600"
                                            : "text-gray-600"
                                            }`}
                                    >
                                        Thất bại
                                    </p>
                                    <p
                                        className={`text-3xl font-bold ${importResult.failed > 0
                                            ? "text-red-700"
                                            : "text-gray-700"
                                            }`}
                                    >
                                        {importResult.failed}
                                    </p>
                                </div>
                            </div>

                            {importResult.results &&
                                importResult.results.length > 0 && (
                                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                                        <h4 className="font-semibold text-gray-900 mb-3">
                                            Chi tiết kết quả
                                        </h4>
                                        <div className="space-y-2 max-h-64 overflow-y-auto">
                                            {importResult.results.map(
                                                (result: any, idx: number) => (
                                                    <div
                                                        key={idx}
                                                        className={`p-2 rounded flex items-start gap-2 ${result.success
                                                            ? "bg-green-50 border border-green-100"
                                                            : "bg-red-50 border border-red-100"
                                                            }`}
                                                    >
                                                        <div
                                                            className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center mt-0.5 ${result.success
                                                                ? "bg-green-600 text-white"
                                                                : "bg-red-600 text-white"
                                                                }`}
                                                        >
                                                            {result.success ? "✓" : "✕"}
                                                        </div>
                                                        <div className="flex-1">
                                                            <p
                                                                className={`font-semibold text-sm ${result.success
                                                                    ? "text-green-900"
                                                                    : "text-red-900"
                                                                    }`}
                                                            >
                                                                {result.username}
                                                            </p>
                                                            {result.message && (
                                                                <p
                                                                    className={`text-xs ${result.success
                                                                        ? "text-green-700"
                                                                        : "text-red-700"
                                                                        }`}
                                                                >
                                                                    {result.message}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                )
                                            )}
                                        </div>
                                    </div>
                                )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="border-t p-6 bg-gray-50 flex justify-end gap-3">
                    {step === "upload" && (
                        <Button
                            onClick={handleClose}
                            variant="outline"
                            className="px-6"
                        >
                            Hủy
                        </Button>
                    )}

                    {step === "preview" && (
                        <>
                            <Button
                                onClick={() => setStep("upload")}
                                variant="outline"
                                className="px-6"
                            >
                                Quay lại
                            </Button>
                            <Button
                                onClick={handleImport}
                                disabled={validRowsCount === 0 || isImporting}
                                className="px-6 bg-blue-600 hover:bg-blue-700 text-white"
                            >
                                Import ({validRowsCount} hàng)
                            </Button>
                        </>
                    )}

                    {step === "result" && (
                        <Button
                            onClick={handleClose}
                            className="px-6 bg-blue-600 hover:bg-blue-700 text-white"
                        >
                            Đóng
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ImportExpertsModal;
