import { Button } from "@/components/ui/button";
import {
  MapPin,
  Users,
  Calendar,
  Heart,
  ExternalLink,
  Phone,
} from "lucide-react";

interface HeroBannerProps {
  name: string;
  address: string;
  foundedYear: number;
  studentCount: string;
  logoUrl?: string;
  bannerImage?: string;
  isFollowing?: boolean;
  onFollow?: () => void;
  onVisitWebsite?: () => void;
  onContact?: () => void;
}

export function HeroBanner({
  name,
  address,
  foundedYear,
  studentCount,
  logoUrl,
  bannerImage = "https://via.placeholder.com/1920x500",
  isFollowing = false,
  onFollow,
  onVisitWebsite,
  onContact,
}: HeroBannerProps) {
  return (
    <section className="relative min-h-[400px] md:min-h-[500px] overflow-hidden mt-20">
      {/* Background Image with Blue Overlay */}
      <div className="absolute inset-0">
        <img
          src={bannerImage}
          alt={`${name} campus`}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/60 via-blue-800/50 to-blue-950/65" />
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 py-12 md:py-16 h-full flex items-center">
        <div className="w-full">
          <div className="flex flex-col md:flex-row items-start gap-6 md:gap-8">
            {/* Logo - Square with image background */}
            <div className="w-28 h-28 md:w-32 md:h-32 rounded-2xl backdrop-blur-sm flex items-center justify-center shrink-0 border border-white/20 overflow-hidden bg-white/10">
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt={`${name} logo`}
                  className="w-full h-full object-contain p-2"
                />
              ) : (
                <span className="text-5xl md:text-6xl font-bold text-white">
                  {name.charAt(0)}
                </span>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 space-y-4 text-white">
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold">
                {name}
              </h1>

              <div className="flex flex-wrap items-center gap-4 md:gap-6 text-sm md:text-base text-white/90">
                <span className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 md:w-5 md:h-5" />
                  {address}
                </span>
                <span className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 md:w-5 md:h-5" />
                  Thành lập: {foundedYear}
                </span>
                <span className="flex items-center gap-2">
                  <Users className="w-4 h-4 md:w-5 md:h-5" />
                  {studentCount} sinh viên
                </span>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3 pt-2">
                <Button
                  onClick={onFollow}
                  className="gap-2 bg-blue-500 hover:bg-blue-600 text-white border-0"
                  size="lg"
                >
                  <Heart
                    className={`w-4 h-4 ${isFollowing ? "fill-current" : ""}`}
                  />
                  Theo dõi
                </Button>
                <Button
                  onClick={onVisitWebsite}
                  variant="outline"
                  className="gap-2 bg-transparent border-white/30 text-white hover:bg-white/10"
                  size="lg"
                >
                  <ExternalLink className="w-4 h-4" />
                  Ghé thăm trang
                </Button>
                <Button
                  onClick={onContact}
                  variant="outline"
                  className="gap-2 bg-transparent border-white/30 text-white hover:bg-white/10"
                  size="lg"
                >
                  <Phone className="w-4 h-4" />
                  Liên hệ
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
