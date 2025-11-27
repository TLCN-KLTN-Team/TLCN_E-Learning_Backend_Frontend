import {
  Building2,
  Users,
  X,
  Mail,
  Phone,
  MapPin,
  Calendar,
  FileText,
  Copyright,
  Eye,
  ExternalLink,
  MessageSquareReply,
  Building,
  Sigma,
} from "lucide-react";
import { getStatusStyle, unitStatus } from "../data/UnitStatus";
import React, { useState } from "react";
import type { EducationalUnitResponse } from "@/services/api/response/educationalUnitResponse";
import { toast } from "react-toastify";
import {
  approveEducationalUnit,
  rejectEducationalUnit,
  sendFeedbackToEducationalUnit,
  changeEducationalUnitStatus,
} from "@/services/api/superadmin/educationalUnit.api";

interface SubmissionModalProps {
  unit: EducationalUnitResponse;
  isOpen: boolean;
  onClose: () => void;
}

const SubmissionModal = ({ unit, isOpen, onClose }: SubmissionModalProps) => {
  const [showPreview, setShowPreview] = useState(false);
  const [feedback, setFeedback] = useState("");

  const handleApprove = async () => {
    try {
      await approveEducationalUnit(unit.id);
      toast.success("Duyệt đơn vị đào tạo thành công");
      window.location.reload();
      onClose();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Lỗi duyệt đơn vị";
      toast.error(errorMessage);
    }
  };

  const handleReject = async () => {
    try {
      await rejectEducationalUnit(unit.id, feedback);
      toast.success("Từ chối đơn vị đào tạo thành công");
      window.location.reload();
      onClose();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Lỗi từ chối đơn vị";
      toast.error(errorMessage);
    }
  };

  const handleSuspend = async () => {
    if (!feedback.trim()) {
      toast.error("Vui lòng nhập lý do tạm dừng");
      return;
    }

    try {
      await changeEducationalUnitStatus(unit.id, "suspend", feedback);
      toast.success("Tạm dừng đơn vị đào tạo thành công");
      window.location.reload();
      onClose();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Lỗi tạm dừng đơn vị";
      toast.error(errorMessage);
    }
  };

  const handleReactivate = async () => {
    if (!feedback.trim()) {
      toast.error("Vui lòng nhập lý do kích hoạt lại");
      return;
    }

    try {
      await changeEducationalUnitStatus(unit.id, "reactive", feedback);
      toast.success("Kích hoạt lại đơn vị đào tạo thành công");
      window.location.reload();
      onClose();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Lỗi kích hoạt lại đơn vị";
      toast.error(errorMessage);
    }
  };

  const sendFeedback = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();

    if (!feedback.trim()) {
      toast.error("Vui lòng nhập nội dung phản hồi");
      return;
    }

    sendFeedbackToEducationalUnit(unit.id, feedback)
      .then(() => {
        toast.success("Gửi phản hồi thành công");
        setFeedback("");
        onClose();
      })
      .catch((error) => {
        const errorMessage =
          error instanceof Error ? error.message : "Lỗi gửi phản hồi";
        toast.error(errorMessage);
      });
  };

  if (!isOpen || !unit) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-white/40 backdrop-blur-[2px] transition-all duration-300" />

      {/* Modal Panel */}
      <div className="bg-white rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto transform transition-all duration-300 scale-100 border border-gray-200">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b">
          <div className="flex items-center gap-3">
            <Building2 className="w-6 h-6 text-blue-600" />
            <div>
              <h3 className="text-xl font-bold text-gray-900">{unit.name}</h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Basic Information */}
          <div>
            <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-blue-600" />
              Thông tin cơ bản
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Building className="w-4 h-4 text-gray-400" />
                  <span className="text-sm font-medium text-gray-700">
                    Tên đơn vị:
                  </span>
                  <span className="text-sm text-gray-900">{unit.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-gray-400" />
                  <span className="text-sm font-medium text-gray-700">
                    Đại diện:
                  </span>
                  <span className="text-sm text-gray-900">
                    {unit.representativeName}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <span className="text-sm font-medium text-gray-700">
                    Email:
                  </span>
                  <a
                    href={`mailto:${unit.representativeEmail}`}
                    className="text-sm text-blue-600 hover:underline"
                  >
                    {unit.email}
                  </a>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <span className="text-sm font-medium text-gray-700">
                    Điện thoại:
                  </span>
                  <span className="text-sm text-gray-900">
                    {unit.representativePhone}
                  </span>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-gray-400" />
                  <span className="text-sm font-medium text-gray-700">
                    Loại hình:
                  </span>
                  <span className="text-sm text-gray-900">{unit.type}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span className="text-sm font-medium text-gray-700">
                    Ngày thành lập:
                  </span>
                  <span className="text-sm text-gray-900">
                    {unit.establishedYear}
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                  <span className="text-sm font-medium text-gray-700">
                    Địa chỉ:
                  </span>
                  <span className="text-sm text-gray-900">{unit.address}</span>
                </div>
                <div className="flex items-start gap-2">
                  <Sigma className="w-4 h-4 text-gray-400 mt-0.5" />
                  <span className="text-sm font-medium text-gray-700">
                    Số lượng sinh viên dự kiến:
                  </span>
                  <span className="text-sm text-gray-900">{1}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Statistics */}
          {/* <div>
            <h4 className="text-lg font-semibold text-gray-900 mb-4">
              Thống kê hoạt động
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-600" />
                  <span className="text-sm font-medium text-blue-700">
                    Học viên
                  </span>
                </div>
                <p className="text-2xl font-bold text-blue-900 mt-1">
                  {unit.students.toLocaleString()}
                </p>
              </div>
              <div className="bg-green-50 rounded-lg p-4">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-green-600" />
                  <span className="text-sm font-medium text-green-700">
                    Khóa học
                  </span>
                </div>
                <p className="text-2xl font-bold text-green-900 mt-1">
                  {unit.courses}
                </p>
              </div>
              <div className="bg-purple-50 rounded-lg p-4">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-purple-600" />
                  <span className="text-sm font-medium text-purple-700">
                    Doanh thu
                  </span>
                </div>
                <p className="text-2xl font-bold text-purple-900 mt-1">
                  {unit.revenue.toLocaleString()} VNĐ
                </p>
              </div>
            </div>
          </div> */}

          {/* Documents */}
          <div>
            <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" />
              Giấy tờ kèm theo
            </h4>
            <div className="bg-gray-50 p-4 rounded-lg border">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Copyright className="w-5 h-5 text-gray-600" />
                  <div>
                    <p className="font-medium text-gray-900">
                      Giấy phép hoạt động
                    </p>
                    <p className="text-sm text-gray-600">
                      Tài liệu chứng nhận hoạt động kinh doanh
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowPreview(!showPreview)}
                    className="flex items-center gap-1 px-3 py-2 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                  >
                    <Eye className="w-4 h-4" />
                    {showPreview ? "Ẩn preview" : "Xem preview"}
                  </button>
                  <a
                    href={unit.businessLicense}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 px-3 py-2 text-sm bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Mở trong tab mới
                  </a>
                </div>
              </div>

              {/* Preview Section */}
              {showPreview && (
                <div className="mt-4 border-t pt-4">
                  <div className="bg-white rounded-lg p-4 border">
                    <h5 className="font-medium text-gray-900 mb-3">
                      Preview tài liệu:
                    </h5>
                    {unit.businessLicense ? (
                      <div className="space-y-3">
                        {/* Check if it's an image */}
                        {/\.(jpg|jpeg|png|gif|bmp|webp)$/i.test(
                          unit.businessLicense
                        ) ? (
                          <div className="max-w-full">
                            <img
                              src={unit.businessLicense}
                              alt="Giấy phép hoạt động"
                              className="max-w-full h-auto max-h-96 rounded border shadow-sm"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = "none";
                                const parent = target.parentElement;
                                if (parent) {
                                  parent.innerHTML = `
                                    <div class="flex items-center justify-center h-32 bg-gray-100 rounded border border-dashed border-gray-300">
                                      <div class="text-center">
                                        <FileText class="w-8 h-8 text-gray-400 mx-auto mb-2" />
                                        <p class="text-sm text-gray-600">Không thể hiển thị preview</p>
                                        <p class="text-xs text-gray-500 mt-1">Vui lòng mở file để xem</p>
                                      </div>
                                    </div>
                                  `;
                                }
                              }}
                            />
                          </div>
                        ) : (
                          /* For PDF and other document types */
                          <div className="flex items-center justify-center h-32 bg-gray-100 rounded border border-dashed border-gray-300">
                            <div className="text-center">
                              <FileText className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                              <p className="text-sm text-gray-600">
                                Preview không khả dụng cho loại file này
                              </p>
                              <p className="text-xs text-gray-500 mt-1">
                                Nhấn "Mở trong tab mới" để xem tài liệu
                              </p>
                            </div>
                          </div>
                        )}

                        <div className="pt-2">
                          <p className="text-xs text-gray-500">
                            URL:{" "}
                            <span className="font-mono break-all">
                              {unit.businessLicense}
                            </span>
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-24 bg-gray-50 rounded border border-dashed border-gray-300">
                        <p className="text-sm text-gray-500">
                          Chưa có tài liệu được tải lên
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Current Status */}
          <div>
            <h4 className="text-lg font-semibold text-gray-900 mb-4">
              Trạng thái hiện tại
            </h4>
            <div className="flex items-center gap-3">
              <span
                className={`inline-flex px-3 py-2 text-sm font-semibold rounded-full ${getStatusStyle(
                  unit.status
                )}`}
              >
                {unitStatus(unit.status.toLocaleLowerCase())}
              </span>
              <span className="text-sm text-gray-600">
                Cập nhật lần cuối: {new Date().toLocaleDateString("vi-VN")}
              </span>
            </div>
          </div>

          {/* Feedback */}
          <div>
            <h4 className="text-lg font-semibold mb-4 text-gray-900 flex items-center gap-2">
              <MessageSquareReply className="w-5 h-5 text-blue-600" />
              Phản hồi yêu cầu đăng ký
            </h4>
            <form
              onSubmit={(e) => e.preventDefault()}
              className="flex flex-col"
            >
              <textarea
                name="feedback"
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Nhập nội dung phản hồi..."
                className="w-full h-32 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              ></textarea>
              <button
                type="button"
                className="px-4 py-2 rounded-lg text-end bg-blue-600 text-white mt-3 hover:bg-blue-700 transition-colors self-end disabled:bg-gray-400 disabled:cursor-not-allowed"
                onClick={sendFeedback}
                disabled={!feedback.trim()}
              >
                Phản hồi
              </button>
            </form>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t bg-gray-50">
          {unit?.status === "PENDING" ? (
            // Trạng thái PENDING: hiển thị DUYỆT và TỪ CHỐI
            <>
              <button
                onClick={handleReject}
                disabled={!feedback.trim()}
                className="px-4 py-2 text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                Từ chối
              </button>
              <button
                onClick={handleApprove}
                className="px-4 py-2 text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors"
              >
                Duyệt
              </button>
            </>
          ) : unit?.status === "ACTIVE" ? (
            // Trạng thái ACTIVE: hiển thị TẠM DỪNG và ĐÓNG
            <>
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Đóng
              </button>
              <button
                onClick={handleSuspend}
                disabled={!feedback.trim()}
                className="px-4 py-2 text-white bg-orange-600 rounded-lg hover:bg-orange-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                Tạm dừng
              </button>
            </>
          ) : unit?.status === "SUSPEND" ? (
            // Trạng thái SUSPEND: hiển thị KÍCH HOẠT LẠI và ĐÓNG
            <>
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Đóng
              </button>
              <button
                onClick={handleReactivate}
                disabled={!feedback.trim()}
                className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                Kích hoạt lại
              </button>
            </>
          ) : (
            // Các trạng thái khác (REJECTED): chỉ hiển thị ĐÓNG
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Đóng
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default SubmissionModal;
