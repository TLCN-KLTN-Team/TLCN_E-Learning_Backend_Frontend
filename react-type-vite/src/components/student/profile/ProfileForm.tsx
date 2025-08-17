import { useState } from "react";
import { User, FileText, Tags, Save } from "lucide-react";
import { useTheme } from "@/context/theme-context/useTheme";
import type { ProfileFormData } from "@/types/profile.types";

interface ProfileFormProps {
  initialData?: Partial<ProfileFormData>;
  onSave: (data: ProfileFormData) => void;
  isLoading?: boolean;
}

const ProfileForm = ({
  initialData,
  onSave,
  isLoading = false,
}: ProfileFormProps) => {
  const { resolvedTheme } = useTheme();
  const [formData, setFormData] = useState<ProfileFormData>({
    fullName: initialData?.fullName || "",
    bio: initialData?.bio || "",
    interests: initialData?.interests || [],
  });

  const [newInterest, setNewInterest] = useState("");

  const handleAddInterest = () => {
    if (
      newInterest.trim() &&
      !formData.interests.includes(newInterest.trim())
    ) {
      setFormData((prev) => ({
        ...prev,
        interests: [...prev.interests, newInterest.trim()],
      }));
      setNewInterest("");
    }
  };

  const handleRemoveInterest = (interest: string) => {
    setFormData((prev) => ({
      ...prev,
      interests: prev.interests.filter((i) => i !== interest),
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div
      className={`p-6 rounded-lg shadow-lg ${
        resolvedTheme === "dark"
          ? "bg-slate-800 border border-slate-700"
          : "bg-white border border-slate-200"
      }`}
    >
      <div className="flex items-center space-x-2 mb-6">
        <User className="w-6 h-6 text-blue-600" />
        <h2
          className={`text-2xl font-bold ${
            resolvedTheme === "dark" ? "text-white" : "text-slate-900"
          }`}
        >
          Thông tin cá nhân
        </h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Full Name */}
        <div>
          <label
            className={`block text-sm font-medium mb-2 ${
              resolvedTheme === "dark" ? "text-slate-300" : "text-slate-700"
            }`}
          >
            Họ và tên
          </label>
          <input
            type="text"
            value={formData.fullName}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, fullName: e.target.value }))
            }
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              resolvedTheme === "dark"
                ? "border-slate-600 bg-slate-700 text-white placeholder-slate-400"
                : "border-slate-300 bg-white text-slate-900"
            }`}
            placeholder="Nhập họ và tên của bạn"
            required
          />
        </div>

        {/* Bio */}
        <div>
          <label
            className={`flex items-center space-x-2 text-sm font-medium mb-2 ${
              resolvedTheme === "dark" ? "text-slate-300" : "text-slate-700"
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Tiểu sử</span>
          </label>
          <textarea
            value={formData.bio}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, bio: e.target.value }))
            }
            rows={4}
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none ${
              resolvedTheme === "dark"
                ? "border-slate-600 bg-slate-700 text-white placeholder-slate-400"
                : "border-slate-300 bg-white text-slate-900"
            }`}
            placeholder="Hãy kể về bản thân bạn..."
          />
        </div>

        {/* Interests */}
        <div>
          <label
            className={`flex items-center space-x-2 text-sm font-medium mb-2 ${
              resolvedTheme === "dark" ? "text-slate-300" : "text-slate-700"
            }`}
          >
            <Tags className="w-4 h-4" />
            <span>Chủ đề quan tâm</span>
          </label>

          {/* Add new interest */}
          <div className="flex space-x-2 mb-3">
            <input
              type="text"
              value={newInterest}
              onChange={(e) => setNewInterest(e.target.value)}
              className={`flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                resolvedTheme === "dark"
                  ? "border-slate-600 bg-slate-700 text-white placeholder-slate-400"
                  : "border-slate-300 bg-white text-slate-900"
              }`}
              placeholder="Thêm chủ đề quan tâm..."
              onKeyPress={(e) =>
                e.key === "Enter" && (e.preventDefault(), handleAddInterest())
              }
            />
            <button
              type="button"
              onClick={handleAddInterest}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Thêm
            </button>
          </div>

          {/* Interest tags */}
          <div className="flex flex-wrap gap-2">
            {formData.interests.map((interest, index) => (
              <span
                key={index}
                className={`inline-flex items-center px-3 py-1 rounded-full text-sm ${
                  resolvedTheme === "dark"
                    ? "bg-blue-900 text-blue-200"
                    : "bg-blue-100 text-blue-800"
                }`}
              >
                {interest}
                <button
                  type="button"
                  onClick={() => handleRemoveInterest(interest)}
                  className={`ml-2 hover:opacity-80 ${
                    resolvedTheme === "dark" ? "text-blue-400" : "text-blue-600"
                  }`}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>

        {/* Submit Button */}
        <div className="pt-4">
          <button
            type="submit"
            disabled={isLoading}
            className="flex items-center space-x-2 w-full md:w-auto px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Save className="w-5 h-5" />
            <span>{isLoading ? "Đang lưu..." : "Lưu thay đổi"}</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProfileForm;
