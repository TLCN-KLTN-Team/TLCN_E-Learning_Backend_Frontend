import {
  Building2,
  Users,
  BookOpen,
  DollarSign,
  X,
  Mail,
  Phone,
  MapPin,
  Calendar,
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
} from "lucide-react";
import { UnitStatus, getStatusStyle } from "../data/UnitStatus";

interface Unit {
  id: number;
  name: string;
  code: string;
  status: string;
  students: number;
  courses: number;
  revenue: number;
  representative: string;
  email: string;
  type: string;
  phone: string;
  address: string;
  establishedDate: string;
  documents: Array<{
    name: string;
    status: string;
    url: string;
  }>;
}

interface SubmissionModalProps {
  unit: Unit | null;
  isOpen: boolean;
  onClose: () => void;
}

const SubmissionModal = ({ unit, isOpen, onClose }: SubmissionModalProps) => {
  if (!isOpen || !unit) return null;

  const getDocumentIcon = (status: string) => {
    switch (status) {
      case "approved":
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case "rejected":
        return <XCircle className="w-4 h-4 text-red-600" />;
      case "pending":
        return <Clock className="w-4 h-4 text-yellow-600" />;
      case "expired":
        return <AlertTriangle className="w-4 h-4 text-orange-600" />;
      default:
        return <FileText className="w-4 h-4 text-gray-600" />;
    }
  };

  const getDocumentStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-green-100 text-green-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "expired":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

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
              <p className="text-sm text-gray-600">Mã đơn vị: {unit.code}</p>
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
                  <Users className="w-4 h-4 text-gray-400" />
                  <span className="text-sm font-medium text-gray-700">
                    Đại diện:
                  </span>
                  <span className="text-sm text-gray-900">
                    {unit.representative}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <span className="text-sm font-medium text-gray-700">
                    Email:
                  </span>
                  <a
                    href={`mailto:${unit.email}`}
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
                  <span className="text-sm text-gray-900">{unit.phone}</span>
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
                    {new Date(unit.establishedDate).toLocaleDateString("vi-VN")}
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                  <span className="text-sm font-medium text-gray-700">
                    Địa chỉ:
                  </span>
                  <span className="text-sm text-gray-900">{unit.address}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Statistics */}
          <div>
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
          </div>

          {/* Documents */}
          <div>
            <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" />
              Giấy tờ kèm theo
            </h4>
            <div className="space-y-3">
              {unit.documents.map((doc, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 border border-gray-200 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    {getDocumentIcon(doc.status)}
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {doc.name}
                      </p>
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getDocumentStatusColor(
                          doc.status
                        )}`}
                      >
                        {doc.status === "approved" && "Đã duyệt"}
                        {doc.status === "rejected" && "Bị từ chối"}
                        {doc.status === "pending" && "Chờ duyệt"}
                        {doc.status === "expired" && "Hết hạn"}
                      </span>
                    </div>
                  </div>
                  <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                    Xem file
                  </button>
                </div>
              ))}
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
                {UnitStatus[unit.status as keyof typeof UnitStatus]}
              </span>
              <span className="text-sm text-gray-600">
                Cập nhật lần cuối: {new Date().toLocaleDateString("vi-VN")}
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Đóng
          </button>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            Chỉnh sửa thông tin
          </button>
        </div>
      </div>
    </div>
  );
};

export default SubmissionModal;
