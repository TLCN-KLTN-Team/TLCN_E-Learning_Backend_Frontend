import React, { useState, useEffect } from "react";
import { User, Mail, Phone, Shield, Calendar, Briefcase } from "lucide-react";
import * as educationUnitApi from "@/services/api/admin/educationUnitApi";
import type { EducationalUnitResponse } from "@/services/api/response/educationalUnitResponse";

const AdminProfileInfo: React.FC = () => {
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

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-48 mb-4"></div>
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
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
          Không thể tải thông tin quản trị viên
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-purple-700 px-6 py-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Thông Tin Quản Trị</h3>
            <p className="text-purple-100 text-xs">Người đại diện</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {educationalUnit.representativeName ||
          educationalUnit.representativeEmail ||
          educationalUnit.representativePhone ? (
          <div className="space-y-4">
            {/* Profile Avatar */}
            <div className="flex items-center space-x-4 pb-4 border-b border-gray-200">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-purple-200 rounded-full flex items-center justify-center">
                <User className="w-8 h-8 text-purple-600" />
              </div>
              <div>
                <h4 className="text-lg font-bold text-gray-900">
                  {educationalUnit.representativeName || "Chưa cập nhật"}
                </h4>
                <p className="text-sm text-gray-500">Quản trị viên</p>
              </div>
            </div>

            {/* Contact Details */}
            <div className="space-y-3">
              {educationalUnit.representativeEmail && (
                <div className="flex items-start space-x-3">
                  <Mail className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-gray-500">Email liên hệ</p>
                    <p className="text-sm text-gray-900">
                      {educationalUnit.representativeEmail}
                    </p>
                  </div>
                </div>
              )}

              {educationalUnit.representativePhone && (
                <div className="flex items-start space-x-3">
                  <Phone className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-gray-500">Số điện thoại</p>
                    <p className="text-sm text-gray-900">
                      {educationalUnit.representativePhone}
                    </p>
                  </div>
                </div>
              )}

              <div className="flex items-start space-x-3">
                <Briefcase className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs text-gray-500">Vai trò</p>
                  <p className="text-sm text-gray-900 font-medium">
                    Người đại diện đơn vị
                  </p>
                </div>
              </div>
            </div>

            {/* Subscription Info */}
            {(educationalUnit.subscriptionStartDate ||
              educationalUnit.subscriptionEndDate) && (
                <div className="pt-4 border-t border-gray-200">
                  <div className="bg-purple-50 rounded-lg p-4 space-y-2">
                    <div className="flex items-center space-x-2 text-purple-700">
                      <Calendar className="w-4 h-4" />
                      <span className="text-xs font-semibold uppercase">
                        Thông tin gói dịch vụ
                      </span>
                    </div>
                    {educationalUnit.subscriptionStartDate && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Ngày bắt đầu:</span>
                        <span className="font-medium text-gray-900">
                          {new Date(
                            educationalUnit.subscriptionStartDate
                          ).toLocaleDateString("vi-VN")}
                        </span>
                      </div>
                    )}
                    {educationalUnit.subscriptionEndDate && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Ngày hết hạn:</span>
                        <span className="font-medium text-gray-900">
                          {new Date(
                            educationalUnit.subscriptionEndDate
                          ).toLocaleDateString("vi-VN")}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
          </div>
        ) : (
          <div className="text-center py-8">
            <User className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-500">
              Chưa có thông tin người đại diện
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Vui lòng cập nhật thông tin trong cài đặt
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminProfileInfo;
