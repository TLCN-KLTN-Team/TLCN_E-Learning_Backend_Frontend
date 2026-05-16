import React, { useEffect, useState } from "react";
import { X, GraduationCap, Plus, CheckCircle2, CircleOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "react-toastify";
import * as expertCourseApi from "@/services/api/expert/expertCourseApi";
import type { CourseResponse } from "@/services/api/response/courseResponse";

interface CourseObjectiveModalProps {
  isOpen: boolean;
  onClose: () => void;
  course: CourseResponse | null;
  educationalUnitId: number;
  onSuccess?: () => void;
}

const CourseObjectiveModal: React.FC<CourseObjectiveModalProps> = ({
  isOpen,
  onClose,
  course,
  educationalUnitId,
  onSuccess,
}) => {
  const [courseObjectives, setCourseObjectives] = useState<expertCourseApi.CourseObjectiveResponse[]>([]);
  const [cloCode, setCloCode] = useState("");
  const [cloDescription, setCloDescription] = useState("");
  const [cloLoading, setCloLoading] = useState(false);
  const [creatingClo, setCreatingClo] = useState(false);

  useEffect(() => {
    if (isOpen && course) {
      loadCourseObjectives();
      setCloCode("");
      setCloDescription("");
    }
  }, [isOpen, course]);

  const loadCourseObjectives = async () => {
    if (!course) return;
    try {
      setCloLoading(true);
      const clos = await expertCourseApi.getCourseObjectives(educationalUnitId, course.id);
      setCourseObjectives(clos);
    } catch (error) {
      console.error("Error loading CĐRs:", error);
      toast.error("Không thể tải danh sách CĐR");
    } finally {
      setCloLoading(false);
    }
  };

  const handleCreateClo = async () => {
    if (!course) return;
    if (!cloCode.trim()) {
      toast.warning("Vui lòng nhập mã CĐR");
      return;
    }

    try {
      setCreatingClo(true);
      await expertCourseApi.createCourseObjective(educationalUnitId, course.id, {
        code: cloCode.trim(),
        description: cloDescription.trim() || undefined,
      });
      toast.success("Tạo CĐR thành công");
      setCloCode("");
      setCloDescription("");
      await loadCourseObjectives();
      onSuccess?.();
    } catch (error: any) {
      console.error("Error creating CĐR:", error);
      const message = error?.response?.data?.message || "Không thể tạo CĐR";
      toast.error(message);
    } finally {
      setCreatingClo(false);
    }
  };

  const toggleCloStatus = async (clo: expertCourseApi.CourseObjectiveResponse) => {
    if (!course) return;
    try {
      setCloLoading(true);
      if (clo.isActive) {
        await expertCourseApi.deactivateCourseObjective(educationalUnitId, course.id, clo.id);
        toast.success("Đã ngưng kích hoạt CĐR");
      } else {
        await expertCourseApi.reactivateCourseObjective(educationalUnitId, course.id, clo.id);
        toast.success("Đã kích hoạt lại CĐR");
      }
      await loadCourseObjectives();
      onSuccess?.();
    } catch (error: any) {
      console.error("Error toggling CĐR status:", error);
      const message = error?.response?.data?.message || "Không thể cập nhật trạng thái CĐR";
      toast.error(message);
    } finally {
      setCloLoading(false);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen || !course) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={handleBackdropClick}
      ></div>

      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                <GraduationCap className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Quản Lý Chuẩn Đầu Ra</h2>
                <p className="text-purple-100 text-sm mt-1">Quản lý Chuẩn Đầu Ra cho khóa học</p>
              </div>
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

          <div className="bg-white/10 rounded-lg p-3 mt-3">
            <p className="font-semibold text-lg text-white">{course.courseName}</p>
            <p className="text-purple-100 text-sm">Số tín chỉ: {course.credits}</p>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)] space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <input
              type="text"
              placeholder="Mã CĐR (VD: CĐR1)"
              value={cloCode}
              onChange={(e) => setCloCode(e.target.value)}
              className="w-full p-2 border rounded-lg border-gray-300 focus:border-purple-500 outline-none"
            />
            <input
              type="text"
              placeholder="Mô tả CĐR"
              value={cloDescription}
              onChange={(e) => setCloDescription(e.target.value)}
              className="w-full p-2 border rounded-lg border-gray-300 focus:border-purple-500 outline-none"
            />
            <Button
              type="button"
              onClick={handleCreateClo}
              disabled={creatingClo || !cloCode.trim()}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              <Plus size={14} className="mr-2" />
              {creatingClo ? "Đang tạo..." : "Tạo CĐR"}
            </Button>
          </div>

          <div className="bg-white rounded-lg border border-purple-100 max-h-80 overflow-y-auto">
            {cloLoading ? (
              <div className="p-4 text-sm text-gray-500">Đang tải CĐR...</div>
            ) : courseObjectives.length === 0 ? (
              <div className="p-4 text-sm text-gray-500">Chưa có CĐR nào cho khóa học này.</div>
            ) : (
              courseObjectives.map((clo) => (
                <div key={clo.id} className="p-3 border-b last:border-b-0 flex items-start justify-between gap-3">
                  <div>
                    <div className="font-semibold text-gray-900">{clo.code}</div>
                    <div className="text-sm text-gray-600">{clo.description || "(Không có mô tả)"}</div>
                    <div className="text-xs mt-1">
                      {clo.isActive ? (
                        <span className="text-green-600 font-medium">Đang hoạt động</span>
                      ) : (
                        <span className="text-orange-600 font-medium">Đã ngưng kích hoạt</span>
                      )}
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => toggleCloStatus(clo)}
                    className={clo.isActive ? "text-orange-600 border-orange-200 hover:bg-orange-50" : "text-green-600 border-green-200 hover:bg-green-50"}
                  >
                    {clo.isActive ? (
                      <><CircleOff size={14} className="mr-1" /> Ngưng</>
                    ) : (
                      <><CheckCircle2 size={14} className="mr-1" /> Kích hoạt</>
                    )}
                  </Button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseObjectiveModal;
