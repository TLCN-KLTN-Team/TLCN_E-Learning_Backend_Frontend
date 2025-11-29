import React, { useState, useEffect } from "react";
import {
  Building,
  MapPin,
  Phone,
  Mail,
  Globe,
  Calendar,
  CheckCircle,
  XCircle,
} from "lucide-react";
import educationUnitApi from "@/services/api/admin/educationUnitApi";
import type { EducationalUnitResponse } from "@/services/api/response/educationalUnitResponse";

const AdminEducationalUnitInfo: React.FC = () => {
  const [educationalUnit, setEducationalUnit] =
    useState<EducationalUnitResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadEducationalUnit = async () => {
      try {
        setLoading(true);
        const data = await educationUnitApi.getMyEducationalUnit();
        setEducationalUnit(data);
      } catch (error) {
        console.error("Error loading educational unit:", error);
      } finally {
        setLoading(false);
      }
    };

    loadEducationalUnit();
  }, []);

  const getStatusBadge = (status: string) => {
    const statusMap: Record<
      string,
      { label: string; className: string; icon: React.ReactElement }
    > = {
      ACTIVE: {
        label: "Đang hoạt động",
        className: "bg-green-100 text-green-800 border-green-200",
        icon: <CheckCircle className="w-4 h-4" />,
      },
      INACTIVE: {
        label: "Ngừng hoạt động",
        className: "bg-gray-100 text-gray-800 border-gray-200",
        icon: <XCircle className="w-4 h-4" />,
      },
    };

    const statusInfo = statusMap[status] || statusMap.INACTIVE;

    return (
      <span
        className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-medium border ${statusInfo.className}`}
      >
        {statusInfo.icon}
        <span>{statusInfo.label}</span>
      </span>
    );
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-48 mb-4"></div>
          <div className="space-y-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-4 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!educationalUnit) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <p className="text-gray-500 text-center">
          Không thể tải thông tin đơn vị đào tạo
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
            <Building className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Thông Tin Đơn Vị</h3>
            <p className="text-blue-100 text-xs">Cơ sở giáo dục của bạn</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 space-y-4">
        {/* Name and Status */}
        <div>
          <h4 className="text-xl font-bold text-gray-900 mb-2">
            {educationalUnit.name}
          </h4>
          {getStatusBadge(educationalUnit.status)}
        </div>

        {/* Details */}
        <div className="space-y-3 pt-2">
          {educationalUnit.type && (
            <div className="flex items-start space-x-3">
              <Building className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs text-gray-500">Loại hình</p>
                <p className="text-sm text-gray-900 font-medium">
                  {educationalUnit.type}
                </p>
              </div>
            </div>
          )}

          {educationalUnit.address && (
            <div className="flex items-start space-x-3">
              <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs text-gray-500">Địa chỉ</p>
                <p className="text-sm text-gray-900">
                  {educationalUnit.address}
                </p>
              </div>
            </div>
          )}

          {educationalUnit.phone && (
            <div className="flex items-start space-x-3">
              <Phone className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs text-gray-500">Số điện thoại</p>
                <p className="text-sm text-gray-900">{educationalUnit.phone}</p>
              </div>
            </div>
          )}

          {educationalUnit.email && (
            <div className="flex items-start space-x-3">
              <Mail className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs text-gray-500">Email</p>
                <p className="text-sm text-gray-900">{educationalUnit.email}</p>
              </div>
            </div>
          )}

          {educationalUnit.website && (
            <div className="flex items-start space-x-3">
              <Globe className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs text-gray-500">Website</p>
                <a
                  href={educationalUnit.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:underline"
                >
                  {educationalUnit.website}
                </a>
              </div>
            </div>
          )}

          {educationalUnit.establishedYear && (
            <div className="flex items-start space-x-3">
              <Calendar className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs text-gray-500">Năm thành lập</p>
                <p className="text-sm text-gray-900 font-medium">
                  {educationalUnit.establishedYear}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Description */}
        {educationalUnit.description && (
          <div className="pt-4 border-t border-gray-200">
            <p className="text-xs text-gray-500 mb-2">Mô tả</p>
            <p className="text-sm text-gray-700 leading-relaxed">
              {educationalUnit.description}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminEducationalUnitInfo;
