import React, { useEffect, useState, useRef } from "react";
import {
  User,
  Mail,
  Phone,
  Calendar,
  Shield,
  Edit3,
  Save,
  X,
  Camera,
  Key,
  Settings,
  Eye,
  EyeOff,
  Loader2,
} from "lucide-react";
import { useAuth } from "@/context/auth-context/useAuth";
import { toast } from "react-toastify";
import {
  changePassword,
  updateAvatar,
  updateProfile,
  type UserUpdateRequest,
} from "@/services/api/superadmin/userApi";

const AdminProfilePage: React.FC = () => {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");
  const [formData, setFormData] = useState<UserUpdateRequest>();

  const [passwordData, setPasswordData] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [showPassword, setShowPassword] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [selectedAvatarFile, setSelectedAvatarFile] = useState<File | null>(
    null
  );
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      firstName: "",
      lastName: "",
      email: "",
      phoneNumber: "",
      avatar: undefined,
      ...prev,
      [name]: value,
    }));
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const togglePasswordVisibility = (field: "current" | "new" | "confirm") => {
    setShowPassword((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Create preview URL and store file
      const previewUrl = URL.createObjectURL(file);
      setAvatarPreview(previewUrl);
      setSelectedAvatarFile(file);
    }
  };

  const handleAvatarSave = async () => {
    if (!selectedAvatarFile) {
      toast.error("Vui lòng chọn ảnh trước khi lưu!");
      return;
    }

    try {
      setIsUploadingAvatar(true);
      toast.info("Đang tải lên avatar...");
      const url = await updateAvatar(selectedAvatarFile);
      user!.avatarUrl = url; // Update avatarUrl in user context
      toast.success("Cập nhật ảnh đại diện thành công!");

      // Clear preview and selected file
      setAvatarPreview(null);
      setSelectedAvatarFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Cập nhật ảnh đại diện thất bại!";
      toast.error("Cập nhật ảnh đại diện thất bại!");
      console.error("Avatar update error:", errorMessage);
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleAvatarCancel = () => {
    // Clear preview and selected file
    if (avatarPreview) {
      URL.revokeObjectURL(avatarPreview);
    }
    setAvatarPreview(null);
    setSelectedAvatarFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleSaveProfile = async () => {
    // TODO: Implement API call to update profile
    console.log("Saving profile:", formData);
    await updateProfile(formData as UserUpdateRequest);
    toast.success("Cập nhật thông tin thành công!");
    setIsEditing(false);
  };

  const handleChangePassword = async () => {
    try {
      // TODO: Implement API call to change password
      console.log("Changing password", passwordData);
      await changePassword(passwordData);
      toast.success("Đổi mật khẩu thành công!");
      setPasswordData({
        oldPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Đổi mật khẩu thất bại!"
      );
    }
  };

  const handleCancelEdit = () => {
    setFormData({
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
      email: user?.email || "",
      phoneNumber: user?.phoneNumber || "",
    });
    setIsEditing(false);
  };

  useEffect(() => {
    setFormData({
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
      email: user?.email || "",
      phoneNumber: user?.phoneNumber || "",
      avatar: undefined,
    });
  }, [user?.firstName, user?.lastName, user?.email, user?.phoneNumber]);

  // Cleanup avatar preview URL on unmount
  useEffect(() => {
    return () => {
      if (avatarPreview) {
        URL.revokeObjectURL(avatarPreview);
      }
    };
  }, [avatarPreview]);

  const tabs = [
    { id: "profile", label: "Thông tin cá nhân", icon: User },
    { id: "security", label: "Bảo mật", icon: Shield },
    { id: "settings", label: "Cài đặt", icon: Settings },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-gray-900">Hồ sơ cá nhân</h1>
          <p className="text-gray-600 mt-1">
            Quản lý thông tin cá nhân và cài đặt tài khoản
          </p>
        </div>

        {/* Profile Header Section */}
        <div className="p-6">
          <div className="flex items-start gap-6">
            {/* Avatar */}
            <div className="flex flex-col items-center space-y-3">
              <div className="relative">
                <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center">
                  {avatarPreview || user?.avatarUrl ? (
                    <img
                      src={avatarPreview || user?.avatarUrl || ""}
                      alt="Profile"
                      className="w-24 h-24 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-24 h-24 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold text-2xl">
                      {user?.firstName?.charAt(0) ||
                        user?.username?.charAt(0) ||
                        "A"}
                    </div>
                  )}
                </div>

                {/* Hidden file input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                />

                {/* Camera button */}
                <button
                  type="button"
                  onClick={handleAvatarClick}
                  className="absolute bottom-0 right-0 p-1 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors"
                >
                  <Camera className="w-4 h-4" />
                </button>
              </div>

              {/* Avatar action buttons - show when there's a preview */}
              {avatarPreview && selectedAvatarFile && (
                <div className="flex flex-col items-center space-y-2">
                  <div className="flex gap-2">
                    <button
                      onClick={handleAvatarSave}
                      disabled={isUploadingAvatar}
                      className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 disabled:bg-green-400 disabled:cursor-not-allowed transition-colors"
                    >
                      {isUploadingAvatar ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <Save className="w-3 h-3" />
                      )}
                      {isUploadingAvatar ? "Đang lưu..." : "Lưu"}
                    </button>
                    <button
                      onClick={handleAvatarCancel}
                      disabled={isUploadingAvatar}
                      className="flex items-center gap-1 px-3 py-1.5 bg-gray-500 text-white text-sm rounded-lg hover:bg-gray-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                    >
                      <X className="w-3 h-3" />
                      Hủy
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Basic Info */}
            <div className="flex-1">
              <h2 className="text-xl font-semibold text-gray-900">
                {user?.firstName} {user?.lastName}
              </h2>
              <p className="text-gray-600">{user?.email}</p>
              <div className="flex items-center gap-2 mt-2">
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  <Shield className="w-3 h-3 mr-1" />
                  System Administrator
                </span>
              </div>
            </div>

            {/* Action Button */}
            <div>
              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Edit3 className="w-4 h-4" />
                  Chỉnh sửa
                </button>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={handleSaveProfile}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <Save className="w-4 h-4" />
                    Lưu
                  </button>
                  <button
                    onClick={handleCancelEdit}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                  >
                    <X className="w-4 h-4" />
                    Hủy
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="border-b border-gray-200">
          <nav className="flex">
            {tabs.map((tab) => {
              const IconComponent = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700"
                  }`}
                >
                  <IconComponent className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === "profile" && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900">
                Thông tin cá nhân
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* First Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Họ
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      name="firstName"
                      value={formData?.firstName}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                      <User className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-900">
                        {formData?.firstName || "Chưa cập nhật"}
                      </span>
                    </div>
                  )}
                </div>

                {/* Last Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tên
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      name="lastName"
                      value={formData?.lastName}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                      <User className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-900">
                        {formData?.lastName || "Chưa cập nhật"}
                      </span>
                    </div>
                  )}
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-900">{formData?.email}</span>
                  </div>
                  <p className="text-xs text-red-500 mt-1">
                    Email không thể thay đổi
                  </p>
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Số điện thoại
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      name="phoneNumber"
                      value={formData?.phoneNumber}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Nhập số điện thoại"
                    />
                  ) : (
                    <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-900">
                        {formData?.phoneNumber || "Chưa cập nhật"}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Account Info */}
              <div className="pt-6 border-t border-gray-200">
                <h4 className="text-md font-medium text-gray-900 mb-4">
                  Thông tin tài khoản
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <div>
                      <span className="text-sm text-gray-500">
                        Ngày tạo tài khoản:
                      </span>
                      <span className="text-gray-900 ml-2">
                        {new Date().toLocaleDateString("vi-VN")}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                    <Shield className="w-4 h-4 text-gray-400" />
                    <div>
                      <span className="text-sm text-gray-500">Vai trò:</span>
                      <span className="text-gray-900 ml-2">
                        System Administrator
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "security" && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900">Bảo mật</h3>

              {/* Change Password */}
              <div className="bg-gray-50 rounded-lg p-6">
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-yellow-100 rounded-lg">
                    <Key className="w-5 h-5 text-yellow-600" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900 mb-2">
                      Đổi mật khẩu
                    </h4>
                    <p className="text-gray-600 text-sm mb-4">
                      Cập nhật mật khẩu để bảo vệ tài khoản của bạn
                    </p>

                    <div className="space-y-4 max-w-md">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Mật khẩu hiện tại
                        </label>
                        <div className="relative">
                          <input
                            type={showPassword.current ? "text" : "password"}
                            name="oldPassword"
                            value={passwordData.oldPassword}
                            onChange={handlePasswordChange}
                            className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                          <button
                            type="button"
                            onClick={() => togglePasswordVisibility("current")}
                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                            tabIndex={-1}
                          >
                            {showPassword.current ? (
                              <EyeOff className="w-4 h-4" />
                            ) : (
                              <Eye className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Mật khẩu mới
                        </label>
                        <div className="relative">
                          <input
                            type={showPassword.new ? "text" : "password"}
                            name="newPassword"
                            value={passwordData.newPassword}
                            onChange={handlePasswordChange}
                            className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                          <button
                            type="button"
                            onClick={() => togglePasswordVisibility("new")}
                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                            tabIndex={-1}
                          >
                            {showPassword.new ? (
                              <EyeOff className="w-4 h-4" />
                            ) : (
                              <Eye className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Xác nhận mật khẩu mới
                        </label>
                        <div className="relative">
                          <input
                            type={showPassword.new ? "text" : "password"}
                            name="confirmPassword"
                            value={passwordData.confirmPassword}
                            onChange={handlePasswordChange}
                            className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                          <button
                            type="button"
                            onClick={() => togglePasswordVisibility("confirm")}
                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                            tabIndex={-1}
                          >
                            {showPassword.new ? (
                              <EyeOff className="w-4 h-4" />
                            ) : (
                              <Eye className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </div>
                      {/* Change pasword action */}
                      <button
                        onClick={handleChangePassword}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Cập nhật mật khẩu
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Login History */}
              <div>
                <h4 className="font-medium text-gray-900 mb-4">
                  Lịch sử đăng nhập gần đây
                </h4>
                <div className="bg-white border rounded-lg divide-y">
                  <div className="p-4 flex justify-between items-center">
                    <div>
                      <div className="font-medium text-gray-900">
                        Windows PC
                      </div>
                      <div className="text-sm text-gray-500">192.168.1.100</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-900">Hiện tại</div>
                      <div className="text-xs text-green-600">
                        Đang hoạt động
                      </div>
                    </div>
                  </div>
                  <div className="p-4 flex justify-between items-center">
                    <div>
                      <div className="font-medium text-gray-900">
                        Mobile Device
                      </div>
                      <div className="text-sm text-gray-500">192.168.1.105</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-900">2 giờ trước</div>
                      <div className="text-xs text-gray-500">Đã đăng xuất</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "settings" && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900">Cài đặt</h3>

              {/* Notification Settings */}
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900">Thông báo</h4>
                <div className="space-y-3">
                  <label className="flex items-center justify-between">
                    <span className="text-gray-700">Thông báo email</span>
                    <input
                      type="checkbox"
                      defaultChecked
                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                    />
                  </label>
                  <label className="flex items-center justify-between">
                    <span className="text-gray-700">Thông báo hệ thống</span>
                    <input
                      type="checkbox"
                      defaultChecked
                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                    />
                  </label>
                  <label className="flex items-center justify-between">
                    <span className="text-gray-700">Báo cáo hàng tuần</span>
                    <input
                      type="checkbox"
                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                    />
                  </label>
                </div>
              </div>

              {/* Language Settings */}
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900">
                  Ngôn ngữ & Khu vực
                </h4>
                <div className="max-w-xs">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ngôn ngữ hiển thị
                  </label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="vi">Tiếng Việt</option>
                    <option value="en">English</option>
                  </select>
                </div>
              </div>

              {/* Privacy Settings */}
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900">Quyền riêng tư</h4>
                <div className="space-y-3">
                  <label className="flex items-center justify-between">
                    <span className="text-gray-700">
                      Hiển thị trạng thái hoạt động
                    </span>
                    <input
                      type="checkbox"
                      defaultChecked
                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                    />
                  </label>
                  <label className="flex items-center justify-between">
                    <span className="text-gray-700">
                      Cho phép người khác liên hệ
                    </span>
                    <input
                      type="checkbox"
                      defaultChecked
                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                    />
                  </label>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminProfilePage;
