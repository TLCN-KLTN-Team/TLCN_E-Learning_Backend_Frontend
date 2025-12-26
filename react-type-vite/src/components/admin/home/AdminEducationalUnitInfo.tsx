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
  Edit,
  X,
  Save,
} from "lucide-react";
import educationUnitApi from "@/services/api/admin/educationUnitApi";
import type { EducationalUnitResponse } from "@/services/api/response/educationalUnitResponse";
import type { EducationalUnitRequest } from "@/services/api/request/educationUnitRequest";

const AdminEducationalUnitInfo: React.FC = () => {
  const [educationalUnit, setEducationalUnit] =
    useState<EducationalUnitResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    type: "",
    address: "",
    phone: "",
    email: "",
    website: "",
    establishedYear: "",
    description: "",
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadEducationalUnit();
  }, []);

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

  const openEditModal = () => {
    if (!educationalUnit) return;
    
    setFormData({
      name: educationalUnit.name || "",
      type: educationalUnit.type || "",
      address: educationalUnit.address || "",
      phone: educationalUnit.phone || "",
      email: educationalUnit.email || "",
      website: educationalUnit.website || "",
      establishedYear: educationalUnit.establishedYear?.toString() || "",
      description: educationalUnit.description || "",
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setFormData({
      name: "",
      type: "",
      address: "",
      phone: "",
      email: "",
      website: "",
      establishedYear: "",
      description: "",
    });
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async () => {
    if (!formData.name || formData.name.trim() === "") {
      alert("Vui lòng nhập tên đơn vị!");
      return;
    }

    setIsSaving(true);

    try {
      const updateData: EducationalUnitRequest = {
        name: formData.name,
        type: formData.type || undefined,
        address: formData.address || undefined,
        phone: formData.phone || undefined,
        email: formData.email || undefined,
        website: formData.website || undefined,
        establishedYear: formData.establishedYear
          ? parseInt(formData.establishedYear)
          : undefined,
        description: formData.description || undefined,
      };

      const updatedData = await educationUnitApi.updateEducationalUnit(updateData);
      setEducationalUnit(updatedData);
      closeModal();
      alert("Cập nhật thông tin thành công!");
    } catch (error) {
      console.error("Error updating educational unit:", error);
      alert("Có lỗi xảy ra khi cập nhật thông tin!");
    } finally {
      setIsSaving(false);
    }
  };

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
    <>
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                <Building className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Thông Tin Đơn Vị</h3>
                <p className="text-blue-100 text-xs">Cơ sở giáo dục của bạn</p>
              </div>
            </div>
            <button
              onClick={openEditModal}
              className="flex items-center space-x-2 bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg transition-colors"
            >
              <Edit className="w-4 h-4" />
              <span className="text-sm font-medium">Chỉnh sửa</span>
            </button>
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

      {/* Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"></div>
          <div className="relative bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">
                Chỉnh Sửa Thông Tin Đơn Vị
              </h3>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tên đơn vị <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Loại hình
                </label>
                <input
                  type="text"
                  name="type"
                  value={formData.type}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Địa chỉ
                </label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Số điện thoại
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Website
                  </label>
                  <input
                    type="url"
                    name="website"
                    value={formData.website}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Năm thành lập
                  </label>
                  <input
                    type="number"
                    name="establishedYear"
                    value={formData.establishedYear}
                    onChange={handleInputChange}
                    min="1900"
                    max="2100"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mô tả
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
              </div>

              {/* Modal Footer */}
              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  disabled={isSaving}
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isSaving}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSaving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Đang lưu...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Lưu thay đổi</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AdminEducationalUnitInfo;