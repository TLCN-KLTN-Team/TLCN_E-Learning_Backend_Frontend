import React, { useEffect, useMemo, useState } from "react";
import { X, Upload, FileText, AlertCircle, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "react-toastify";
import { parseSpreadsheet, validateClassRow, downloadClassTemplateXLSX } from "@/utils/csvParser";
import * as classApi from "@/services/api/admin/classApi";
import type { CourseResponse } from "@/services/api/response/courseResponse";
import type { CourseClassRequest } from "@/services/api/request/courseClassRequest";
import type { ClassImportResponse } from "@/services/api/response/classImportResponse";

interface ImportClassesModalProps {
  isOpen: boolean;
  onClose: () => void;
  educationalUnitId: number;
  course: CourseResponse | null;
  onSuccess?: () => void;
}

type Step = 1 | 2 | 3 | 4; // upload, preview, importing, result

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

const ImportClassesModal: React.FC<ImportClassesModalProps> = ({ isOpen, onClose, educationalUnitId, course, onSuccess }) => {
  const [step, setStep] = useState<Step>(1);
  const [file, setFile] = useState<File | null>(null);
  const [rows, setRows] = useState<string[][]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [validData, setValidData] = useState<CourseClassRequest[]>([]);
  const [invalidRows, setInvalidRows] = useState<{ index: number; errors: string[] }[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [result, setResult] = useState<ClassImportResponse | null>(null);

  useEffect(() => {
    if (isOpen) {
      resetState();
    }
  }, [isOpen]);

  const resetState = () => {
    setStep(1);
    setFile(null);
    setRows([]);
    setHeaders([]);
    setValidData([]);
    setInvalidRows([]);
    setIsImporting(false);
    setResult(null);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    if (!selected.name.toLowerCase().endsWith(".xlsx")) {
      toast.error("Chỉ hỗ trợ file Excel (.xlsx)");
      return;
    }
    if (selected.size > MAX_FILE_SIZE) {
      toast.error("File quá lớn, tối đa 5MB");
      return;
    }

    try {
      const data = await parseSpreadsheet(selected);
      if (!data || data.length < 2) {
        toast.error("File trống hoặc không có dữ liệu");
        return;
      }

      const hdrs = (data[0] as string[]).map((h) => String(h));
      const body = data.slice(1).filter((r) => r.some((c) => String(c).trim().length > 0));

      const valid: CourseClassRequest[] = [];
      const invalid: { index: number; errors: string[] }[] = [];

      body.forEach((row, idx) => {
        const res = validateClassRow(row.map((v) => String(v)), hdrs, idx + 2);
        if (res.isValid && res.data) {
          const req: CourseClassRequest = {
            className: res.data.className,
            classCode: res.data.classCode,
            courseId: course?.id ?? 0,
            maxStudents: res.data.maxStudents ? parseInt(res.data.maxStudents, 10) || 30 : 30,
            startDate: res.data.startDate ? new Date(res.data.startDate) : undefined,
            endDate: res.data.endDate ? new Date(res.data.endDate) : undefined,
            description: res.data.description || undefined,
          };
          valid.push(req);
        } else if (res.errors.length) {
          invalid.push({ index: idx + 2, errors: res.errors });
        }
      });

      setFile(selected);
      setRows(body as string[][]);
      setHeaders(hdrs);
      setValidData(valid);
      setInvalidRows(invalid);
      setStep(2);
    } catch (err) {
      console.error("Failed to parse file:", err);
      toast.error("Không thể đọc file. Vui lòng kiểm tra định dạng.");
    }
  };

  const handleImport = async () => {
    if (!course) {
      toast.error("Thiếu thông tin khóa học");
      return;
    }
    if (validData.length === 0) {
      toast.error("Không có dòng hợp lệ để import");
      return;
    }

    try {
      setIsImporting(true);
      setStep(3);
      const resp = await classApi.bulkImportClasses(educationalUnitId, course.id, validData);
      setResult(resp);
      setStep(4);
      toast.success(`Import xong: ${resp.successful} thành công, ${resp.failed} thất bại`);
      onSuccess?.();
    } catch (error: any) {
      console.error("Error importing classes:", error);
      const message = error?.response?.data?.message || "Import thất bại";
      toast.error(message);
      setStep(2);
    } finally {
      setIsImporting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                <Upload className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Import Lớp Học</h2>
                {course && <p className="text-blue-100 text-sm">{course.courseName}</p>}
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose} className="text-white hover:bg-white/20 h-8 w-8 p-0">
              <X size={18} />
            </Button>
          </div>
        </div>

        <div className="p-6 space-y-4">
          {step === 1 && (
            <div className="space-y-4">
              <p className="text-gray-600">Tải template và điền thông tin lớp học, sau đó upload file XLSX.</p>
              <div className="flex gap-3">
                <Button onClick={() => downloadClassTemplateXLSX()} className="bg-green-600 hover:bg-green-700 text-white">
                  <FileText size={16} className="mr-2" /> Tải Template XLSX
                </Button>
                <label className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded cursor-pointer">
                  <Upload size={16} className="mr-2" /> Chọn File
                  <input type="file" accept=".xlsx" className="hidden" onChange={handleFileChange} />
                </label>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <CheckCircle className="text-green-600" size={20} />
                <span className="text-sm text-gray-700">Hợp lệ: {validData.length} dòng</span>
                <AlertCircle className="text-red-600" size={20} />
                <span className="text-sm text-gray-700">Lỗi: {invalidRows.length} dòng</span>
              </div>
              <div className="flex gap-3">
                <Button onClick={() => setStep(1)} variant="outline">Chọn file khác</Button>
                <Button onClick={handleImport} className="bg-blue-600 hover:bg-blue-700 text-white">Import ({validData.length})</Button>
              </div>

              {invalidRows.length > 0 && (
                <div className="mt-4 border rounded p-3">
                  <p className="font-medium text-red-600 mb-2">Các dòng lỗi</p>
                  <ul className="space-y-2 text-sm text-gray-700 max-h-48 overflow-auto">
                    {invalidRows.map((r) => (
                      <li key={r.index}>
                        <span className="font-medium">Dòng {r.index}:</span> {r.errors.join("; ")}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {step === 3 && (
            <div className="py-10 text-center">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-3"></div>
              <p className="text-gray-600">Đang import lớp học...</p>
            </div>
          )}

          {step === 4 && result && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <CheckCircle className="text-green-600" size={20} />
                <span className="text-sm text-gray-700">Thành công: {result.successful}</span>
                <AlertCircle className="text-red-600" size={20} />
                <span className="text-sm text-gray-700">Thất bại: {result.failed}</span>
              </div>
              <div className="flex gap-3">
                <Button onClick={onClose} className="bg-blue-600 hover:bg-blue-700 text-white">Đóng</Button>
                <Button onClick={() => { resetState(); }} variant="outline">Import tiếp</Button>
              </div>
              <div className="border rounded p-3 max-h-64 overflow-auto">
                <p className="font-medium mb-2">Chi tiết</p>
                <ul className="space-y-1 text-sm text-gray-700">
                  {result.results.map((r, i) => (
                    <li key={i} className={r.success ? "text-green-700" : "text-red-700"}>
                      [{r.classCode}] - {r.success ? "Thành công" : "Thất bại"} - {r.message}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImportClassesModal;
