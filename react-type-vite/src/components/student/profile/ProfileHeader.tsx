import { MapPin, Briefcase, Building, Camera } from "lucide-react";
import { getAvartarFromName } from "@/utils/callApiUtils";
import { useTheme } from "@/context/theme-context/useTheme";
import type { ProfileHeaderData } from "@/types/profile.types";

const ProfileHeader = ({
  name,
  jobTitle,
  location,
  company,
  avatar,
}: ProfileHeaderData) => {
  const { resolvedTheme } = useTheme();

  const handleAvatarClick = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        // Handle avatar change
        console.log("Avatar changed:", file);
      }
    };
    input.click();
  };

  return (
    <div
      className={`p-6 rounded-lg mb-6 ${
        resolvedTheme === "dark"
          ? "bg-slate-800/90 text-white border border-slate-700"
          : "bg-slate-50 text-slate-900 border border-slate-200"
      }`}
    >
      {/* Page Title */}
      <div className="mb-8">
        <h1
          className={`text-3xl font-bold ${
            resolvedTheme === "dark" ? "text-white" : "text-slate-900"
          }`}
        >
          Edit Profile
        </h1>
      </div>
      <div className="flex items-start gap-6">
        {/* Avatar */}
        <div
          className="relative group cursor-pointer"
          onClick={handleAvatarClick}
        >
          <div
            className={`w-20 h-20 rounded-full flex items-center justify-center text-xl font-semibold overflow-hidden ${
              resolvedTheme === "dark"
                ? "bg-orange-500 text-white"
                : "bg-orange-500 text-white"
            }`}
          >
            <img
              src={avatar ? avatar : getAvartarFromName("Alex Johnson")}
              alt={`${name}'s avatar`}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="absolute inset-0 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <Camera className="w-5 h-5 text-white" />
          </div>
        </div>

        {/* User Info */}
        <div className="flex-1">
          <h1 className="text-2xl font-bold mb-1">{name}</h1>

          <div
            className={`space-y-2 text-sm ${
              resolvedTheme === "dark" ? "text-slate-300" : "text-slate-600"
            }`}
          >
            {jobTitle && (
              <div className="flex items-center gap-2">
                <Briefcase className="w-4 h-4" />
                <span className="font-medium">{jobTitle}</span>
              </div>
            )}

            <div className="flex flex-wrap gap-4">
              {location && (
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  <span>{location}</span>
                </div>
              )}

              {company && (
                <div className="flex items-center gap-2">
                  <Building className="w-4 h-4" />
                  <span>{company}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileHeader;
