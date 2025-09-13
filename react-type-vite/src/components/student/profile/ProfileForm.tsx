import { useEffect, useState, useRef } from "react";
import {
  Mail,
  Phone,
  Camera,
  Edit3,
  Save,
  X,
  Loader2,
  NotebookPen,
} from "lucide-react";
import { useTheme } from "@/context/theme-context/useTheme";
import { toast } from "react-toastify";
import type { User as UserType } from "@/context/auth-context/types";
import {
  updateAvatar,
  type UserUpdateRequest,
} from "@/services/api/superadmin/userApi";

interface ProfileFormProps {
  initialData: UserType;
  onSave: (data: UserUpdateRequest) => Promise<void>;
  isLoading?: boolean;
}

const ProfileForm = ({
  initialData,
  onSave,
  isLoading = false,
}: ProfileFormProps) => {
  const { resolvedTheme } = useTheme();
  const [isEditing, setIsEditing] = useState(false);
  const [userData, setUserData] = useState<UserType>(
    initialData || {
      id: "",
      firstName: "",
      lastName: "",
      email: "",
      phoneNumber: "",
      username: "",
      roles: [],
      avatarUrl: null,
      accountStatus: null,
      bio: null,
      dob: null,
    }
  );
  const [formData, setFormData] = useState<UserUpdateRequest>({
    firstName: initialData?.firstName || "",
    lastName: initialData?.lastName || "",
    email: initialData?.email || "",
    phoneNumber: initialData?.phoneNumber || "",
    dob: initialData?.dob || undefined,
    bio: initialData?.bio || "",
  });

  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [selectedAvatarFile, setSelectedAvatarFile] = useState<File | null>(
    null
  );
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle when initialData changes (e.g., from API)
  useEffect(() => {
    console.log("Initial data changed:", initialData);
    if (initialData) {
      setUserData(initialData);
      setFormData({
        firstName: initialData?.firstName || "",
        lastName: initialData?.lastName || "",
        email: initialData?.email || "",
        phoneNumber: initialData?.phoneNumber || "",
        dob: initialData?.dob || undefined,
        bio: initialData?.bio || "",
      });
    }
  }, [initialData]);

  // Cleanup avatar preview URL on unmount
  useEffect(() => {
    return () => {
      if (avatarPreview) {
        URL.revokeObjectURL(avatarPreview);
      }
    };
  }, [avatarPreview]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleEditProfile = () => {
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
  };

  const handleSaveProfile = async () => {
    await onSave(formData);
    // Update userData with new data after successful save
    setUserData({
      ...userData,
      firstName: formData.firstName || userData?.firstName || "",
      lastName: formData.lastName || userData?.lastName || "",
      email: formData.email || userData?.email || "",
      phoneNumber: formData.phoneNumber || userData?.phoneNumber || "",
      bio: formData.bio || userData?.bio || "",
    });
    setIsEditing(false);
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
      // Update userData with new avatar URL
      setUserData((prev) => ({ ...prev, avatarUrl: url }));
      toast.success("Cập nhật ảnh đại diện thành công!");

      // Clear preview and selected file
      setAvatarPreview(null);
      setSelectedAvatarFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error) {
      toast.error("Cập nhật ảnh đại diện thất bại!");
      console.error("Avatar update error:", error);
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

  return (
    <div
      className={`rounded-lg overflow-hidden ${
        resolvedTheme === "dark"
          ? "bg-slate-800/90 border border-slate-700"
          : "bg-white border border-slate-200"
      }`}
    >
      {/* Header Section */}
      <div className="p-6 border-b border-opacity-20">
        <div className="flex flex-col lg:flex-row lg:items-start gap-6">
          {/* Avatar Section */}
          <div className="flex flex-col items-center lg:items-start">
            <div className="relative">
              <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center">
                {avatarPreview || userData?.avatarUrl ? (
                  <img
                    src={avatarPreview || userData?.avatarUrl || ""}
                    alt="Profile"
                    className="w-24 h-24 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-24 h-24 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold text-2xl">
                    {userData.firstName?.[0]?.toUpperCase() || "U"}
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
              <div className="flex flex-col items-center space-y-2 mt-3">
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

          {/* Profile Info Section, it's just seen */}
          <div className="flex-1 text-center lg:text-left">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-4">
              <div className="flex flex-col">
                <h1
                  className={`text-2xl lg:text-3xl font-bold mb-2 lg:mb-0 ${
                    resolvedTheme === "dark" ? "text-white" : "text-slate-900"
                  }`}
                >
                  {userData.firstName + " " + userData?.lastName}
                </h1>
                <p className="text-sm text-gray-500 mb-2 lg:mb-0">
                  <NotebookPen className="w-4 h-4 inline-block mr-2" />
                  {userData?.bio}
                </p>
              </div>

              {!isEditing ? (
                <button
                  onClick={handleEditProfile}
                  className={`inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
                    resolvedTheme === "dark"
                      ? "bg-blue-600 hover:bg-blue-700 text-white"
                      : "bg-blue-500 hover:bg-blue-600 text-white"
                  }`}
                >
                  <Edit3 className="h-4 w-4 mr-2" />
                  Chỉnh sửa
                </button>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={handleSaveProfile}
                    disabled={isLoading}
                    className={`inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
                      isLoading
                        ? resolvedTheme === "dark"
                          ? "bg-gray-600 text-gray-400 cursor-not-allowed"
                          : "bg-gray-300 text-gray-500 cursor-not-allowed"
                        : resolvedTheme === "dark"
                        ? "bg-green-600 hover:bg-green-700 text-white"
                        : "bg-green-500 hover:bg-green-600 text-white"
                    }`}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {isLoading ? "Đang lưu..." : "Lưu"}
                  </button>
                  <button
                    onClick={handleCancelEdit}
                    className={`inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
                      resolvedTheme === "dark"
                        ? "bg-gray-600 hover:bg-gray-700 text-white"
                        : "bg-gray-500 hover:bg-gray-600 text-white"
                    }`}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Hủy
                  </button>
                </div>
              )}
            </div>

            <div className="space-y-2 mb-4">
              {userData?.email && (
                <div className="flex items-center justify-center lg:justify-start">
                  <Mail
                    className={`h-4 w-4 mr-2 ${
                      resolvedTheme === "dark"
                        ? "text-gray-400"
                        : "text-gray-600"
                    }`}
                  />
                  <span
                    className={`text-sm ${
                      resolvedTheme === "dark"
                        ? "text-gray-300"
                        : "text-gray-700"
                    }`}
                  >
                    {userData?.email}
                  </span>
                </div>
              )}
              {userData?.phoneNumber && (
                <div className="flex items-center justify-center lg:justify-start">
                  <Phone
                    className={`h-4 w-4 mr-2 ${
                      resolvedTheme === "dark"
                        ? "text-gray-400"
                        : "text-gray-600"
                    }`}
                  />
                  <span
                    className={`text-sm ${
                      resolvedTheme === "dark"
                        ? "text-gray-300"
                        : "text-gray-700"
                    }`}
                  >
                    {userData?.phoneNumber}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Profile Details Section */}
      {isEditing && (
        <div className="p-6">
          <h3
            className={`text-lg font-medium mb-6 ${
              resolvedTheme === "dark" ? "text-white" : "text-gray-900"
            }`}
          >
            Thông tin cá nhân
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* First Name */}
            <div>
              <label
                className={`block text-sm font-medium mb-2 ${
                  resolvedTheme === "dark" ? "text-gray-300" : "text-gray-700"
                }`}
              >
                Tên
              </label>
              <input
                type="text"
                name="firstName"
                value={formData.firstName || ""}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 rounded-lg border transition-colors duration-200 ${
                  resolvedTheme === "dark"
                    ? "bg-slate-700 border-slate-600 text-white placeholder-gray-400 focus:border-blue-500"
                    : "bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500"
                } focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
              />
            </div>

            {/* Last Name */}
            <div>
              <label
                className={`block text-sm font-medium mb-2 ${
                  resolvedTheme === "dark" ? "text-gray-300" : "text-gray-700"
                }`}
              >
                Họ
              </label>
              <input
                type="text"
                name="lastName"
                value={formData.lastName || ""}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 rounded-lg border transition-colors duration-200 ${
                  resolvedTheme === "dark"
                    ? "bg-slate-700 border-slate-600 text-white placeholder-gray-400 focus:border-blue-500"
                    : "bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500"
                } focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
              />
            </div>

            {/* Email */}
            <div>
              <label
                className={`block text-sm font-medium mb-2 ${
                  resolvedTheme === "dark" ? "text-gray-300" : "text-gray-700"
                }`}
              >
                Email
              </label>
              <div
                className={`flex items-center gap-2 p-3 rounded-lg ${
                  resolvedTheme === "dark" ? "bg-slate-700" : "bg-gray-50"
                }`}
              >
                <Mail className="w-4 h-4 text-gray-400" />
                <span
                  className={`${
                    resolvedTheme === "dark" ? "text-gray-300" : "text-gray-900"
                  }`}
                >
                  {formData.email || "Chưa cập nhật"}
                </span>
              </div>
              <p className="text-xs text-red-500 mt-1">
                Email không thể thay đổi
              </p>
            </div>

            {/* Phone */}
            <div>
              <label
                className={`block text-sm font-medium mb-2 ${
                  resolvedTheme === "dark" ? "text-gray-300" : "text-gray-700"
                }`}
              >
                Số điện thoại
              </label>
              <input
                type="text"
                name="phoneNumber"
                value={formData.phoneNumber || ""}
                onChange={handleInputChange}
                placeholder="Nhập số điện thoại"
                className={`w-full px-3 py-2 rounded-lg border transition-colors duration-200 ${
                  resolvedTheme === "dark"
                    ? "bg-slate-700 border-slate-600 text-white placeholder-gray-400 focus:border-blue-500"
                    : "bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500"
                } focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
              />
            </div>

            {/* Bio */}
            <div className="md:col-span-2">
              <label
                className={`block text-sm font-medium mb-2 ${
                  resolvedTheme === "dark" ? "text-gray-300" : "text-gray-700"
                }`}
              >
                Tiểu sử
              </label>
              <textarea
                name="bio"
                value={formData.bio || ""}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, bio: e.target.value }))
                }
                placeholder="Nhập tiểu sử của bạn..."
                rows={4}
                className={`w-full px-3 py-2 rounded-lg border transition-colors duration-200 resize-vertical ${
                  resolvedTheme === "dark"
                    ? "bg-slate-700 border-slate-600 text-white placeholder-gray-400 focus:border-blue-500"
                    : "bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500"
                } focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileForm;
