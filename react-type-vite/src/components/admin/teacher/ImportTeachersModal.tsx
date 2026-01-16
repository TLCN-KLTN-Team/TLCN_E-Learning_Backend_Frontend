import React, { useState, useEffect } from "react";
import { X, Upload, FileText, AlertCircle, CheckCircle, Download, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "react-toastify";
import * as teacherApi from "@/services/api/admin/teacherApi";
import * as departmentApi from "@/services/api/admin/departmentApi";
import {
  parseSpreadsheet,
  validateTeacherRow,
  downloadTeacherTemplateXLSX,
  mapDepartmentNameToId,
  type TeacherImportData,
} from "@/utils/csvParser";
import type { TeacherRequest } from "@/services/api/request/teacherRequest";

interface ImportTeachersModalProps {
  isOpen: boolean;
  onClose: () => void;
  educationalUnitId: number;
  onSuccess?: () => void;
}

interface ImportRow {
  rowIndex: number;
  data?: TeacherImportData;
  isValid: boolean;
  errors: string[];
}

interface Department {
  id: string | number;
  name: string;
}

const ImportTeachersModal: React.FC<ImportTeachersModalProps> = ({
  isOpen,
  onClose,
  educationalUnitId,
  onSuccess,
}) => {
  const [step, setStep] = useState<"upload" | "preview" | "importing" | "result">("upload");
  const [file, setFile] = useState<File | null>(null);
  const [importData, setImportData] = useState<ImportRow[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<any>(null);
  const [showErrorDetails, setShowErrorDetails] = useState(false);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loadingDepartments, setLoadingDepartments] = useState(false);

  // Fetch departments when modal opens
  useEffect(() => {
    if (isOpen) {
      loadDepartments();
    }
  }, [isOpen]);

  const loadDepartments = async () => {
    try {
      setLoadingDepartments(true);
      const response = await departmentApi.getDepartmentsByEducationalUnit(
        educationalUnitId,
        0,
        100
      );
      const deptList = response.content || [];
      setDepartments(
        deptList.map((dept: any) => ({
          id: dept.id || dept.departmentId,
          name: dept.name || dept.departmentName,
        }))
      );
    } catch (error) {
      console.error("Failed to load departments:", error);
      toast.error("Không thể tải danh sách phòng ban");
    } finally {
      setLoadingDepartments(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    // Validate file type (XLSX only)
    const isXlsx = selectedFile.name.toLowerCase().endsWith(".xlsx") ||
      selectedFile.type === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
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

      const validatedRows: ImportRow[] = dataRows
        .map((row, index) => {
          const validation = validateTeacherRow(row, headers, index + 2);
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
      toast.error(error.message || "Failed to parse CSV file");
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
      const teacherRequests: TeacherRequest[] = validRows.map((row) => {
        const data = row.data!;
        // Map department name to departmentId if department is provided
        let departmentId = data.departmentId;
        if (data.department && !departmentId) {
          const mappedId = mapDepartmentNameToId(data.department);
          if (mappedId) {
            departmentId = mappedId;
          }
        }

        return {
          username: data.username,
          email: data.email,
          firstName: data.firstName,
          lastName: data.lastName,
          teacherId: data.teacherId,
          password: data.password || "DefaultPass@123",
          dob: data.dob,
          departmentId,
          description: data.description,
          bankAccountNumber: data.bankAccountNumber,
          educationalUnitId,
        };
      });

      const result = await teacherApi.bulkImportTeachers(
        educationalUnitId,
        teacherRequests
      );

      setImportResult(result);
      setStep("result");

      if (result.successful > 0) {
        toast.success(`Successfully imported ${result.successful} teacher(s)`);
        if (result.failed === 0) {
          setTimeout(() => {
            handleClose();
            onSuccess?.();
          }, 2000);
        }
      }

      if (result.failed > 0) {
        toast.warning(`${result.failed} teacher(s) failed to import`);
      }
    } catch (error: any) {
      console.error("Import error:", error);
      toast.error(error.response?.data?.message || "Failed to import teachers");
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
            <h2 className="text-xl font-bold text-gray-900">Import Giáo Viên</h2>
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
                <h3 className="font-semibold text-blue-900 mb-2">Hướng dẫn Import</h3>
                <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                  <li>Tải template CSV bên dưới</li>
                  <li>Điền thông tin giáo viên vào file CSV</li>
                  <li>Upload file CSV và xem trước dữ liệu</li>
                  <li>Xác nhận để import toàn bộ giáo viên</li>
                </ul>
              </div>

              <div className="space-y-3">
                <Button
                  onClick={() => {
                    if (!departments.length) {
                      toast.warn("Chưa có danh sách khoa/phòng ban, thử lại sau");
                      return;
                    }
                    downloadTeacherTemplateXLSX(departments);
                  }}
                  disabled={loadingDepartments}
                  className="w-full bg-green-600 hover:bg-green-700 text-white disabled:opacity-50"
                >
                  <Download className="w-4 h-4 mr-2" />
                  {loadingDepartments ? "Đang tải dữ liệu..." : "Tải Template XLSX"}
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
                  title="Upload CSV file"
                >
                  <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600 font-medium">
                    Kéo thả file CSV tại đây hoặc click để chọn
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    Tối đa 5MB, định dạng CSV
                  </p>
                </label>

                {file && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <p className="text-sm text-green-800">
                      ✓ File được chọn: <span className="font-semibold">{file.name}</span>
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
                  <h4 className="font-semibold text-amber-900">Kiểm tra trước import</h4>
                  <p className="text-sm text-amber-800 mt-1">
                    {validRowsCount} hàng hợp lệ
                    {invalidRowsCount > 0 && `, ${invalidRowsCount} hàng có lỗi`}
                  </p>
                </div>
              </div>

              {/* Valid rows summary */}
              {validRowsCount > 0 && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <h4 className="font-semibold text-green-900">Dữ liệu hợp lệ ({validRowsCount})</h4>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-green-200">
                          <th className="text-left py-2 px-3 font-semibold text-green-900">STT</th>
                          <th className="text-left py-2 px-3 font-semibold text-green-900">Username</th>
                          <th className="text-left py-2 px-3 font-semibold text-green-900">Email</th>
                          <th className="text-left py-2 px-3 font-semibold text-green-900">Họ tên</th>
                          <th className="text-left py-2 px-3 font-semibold text-green-900">Mã GV</th>
                        </tr>
                      </thead>
                      <tbody>
                        {importData
                          .filter((row) => row.isValid)
                          .slice(0, 5)
                          .map((row, idx) => (
                            <tr key={idx} className="border-b border-green-100 hover:bg-green-100">
                              <td className="py-2 px-3">{row.rowIndex}</td>
                              <td className="py-2 px-3">{row.data?.username}</td>
                              <td className="py-2 px-3">{row.data?.email}</td>
                              <td className="py-2 px-3">
                                {row.data?.firstName} {row.data?.lastName}
                              </td>
                              <td className="py-2 px-3">{row.data?.teacherId}</td>
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
                    {showErrorDetails ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    Chi tiết lỗi ({invalidRowsCount} hàng)
                  </button>
                  {showErrorDetails && (
                    <div className="mt-3 space-y-2 max-h-64 overflow-y-auto">
                      {importData
                        .filter((row) => !row.isValid)
                        .map((row, idx) => (
                          <div key={idx} className="text-sm text-red-700 bg-white p-2 rounded border border-red-100">
                            <p className="font-semibold">Hàng {row.rowIndex}:</p>
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
              <p className="text-gray-600 font-semibold">Đang import {validRowsCount} giáo viên...</p>
            </div>
          )}

          {step === "result" && importResult && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-sm text-green-600 font-semibold">Thành công</p>
                  <p className="text-3xl font-bold text-green-700">{importResult.successful}</p>
                </div>
                <div className={`rounded-lg p-4 ${
                  importResult.failed > 0
                    ? "bg-red-50 border border-red-200"
                    : "bg-gray-50 border border-gray-200"
                }`}>
                  <p className={`text-sm font-semibold ${
                    importResult.failed > 0 ? "text-red-600" : "text-gray-600"
                  }`}>
                    Thất bại
                  </p>
                  <p className={`text-3xl font-bold ${
                    importResult.failed > 0 ? "text-red-700" : "text-gray-700"
                  }`}>
                    {importResult.failed}
                  </p>
                </div>
              </div>

              {importResult.results && importResult.results.length > 0 && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-3">Chi tiết kết quả</h4>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {importResult.results.map((result: any, idx: number) => (
                      <div
                        key={idx}
                        className={`p-2 rounded flex items-start gap-2 ${
                          result.success
                            ? "bg-green-50 border border-green-100"
                            : "bg-red-50 border border-red-100"
                        }`}
                      >
                        <div className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center mt-0.5 ${
                          result.success
                            ? "bg-green-600 text-white"
                            : "bg-red-600 text-white"
                        }`}>
                          {result.success ? "✓" : "✕"}
                        </div>
                        <div className="flex-1">
                          <p className={`font-semibold text-sm ${
                            result.success ? "text-green-900" : "text-red-900"
                          }`}>
                            {result.username}
                          </p>
                          {result.message && (
                            <p className={`text-xs ${
                              result.success ? "text-green-700" : "text-red-700"
                            }`}>
                              {result.message}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
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

export default ImportTeachersModal;
