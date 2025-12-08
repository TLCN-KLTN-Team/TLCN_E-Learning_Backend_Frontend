import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { GraduationCap, BookOpen, Phone, Mail, Globe } from "lucide-react";

interface GeneralInfoProps {
  description: string;
  specializations: string[];
  educationLevels: string[];
  contact: {
    email?: string;
    phone?: string;
    website?: string;
  };
}

export function GeneralInfo({
  description,
  specializations,
  educationLevels,
  contact,
}: GeneralInfoProps) {
  return (
    <section className="py-10 md:py-16 bg-gray-50 dark:bg-gray-900/20">
      <div className="container mx-auto px-4">
        <Card className="overflow-hidden border shadow-sm">
          <CardContent className="p-6 md:p-10">
            <div className="grid md:grid-cols-2 gap-8 md:gap-12">
              {/* Left Column */}
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
                    Giới thiệu
                  </h2>
                  <p className="text-muted-foreground leading-relaxed text-base">
                    {description}
                  </p>
                </div>

                <div>
                  <h3 className="flex items-center gap-2 text-lg font-semibold text-foreground mb-3">
                    <GraduationCap className="w-5 h-5 text-blue-600" />
                    Chuyên ngành mạnh
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {specializations.map((spec, index) => (
                      <Badge
                        key={index}
                        className="px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 border-0 text-sm"
                      >
                        {spec}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="flex items-center gap-2 text-lg font-semibold text-foreground mb-3">
                    <BookOpen className="w-5 h-5 text-blue-600" />
                    Hệ đào tạo
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {educationLevels.map((level, index) => (
                      <Badge
                        key={index}
                        variant="outline"
                        className="px-3 py-1.5 border-blue-200 text-blue-700 hover:bg-blue-50 text-sm"
                      >
                        {level}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Column - Contact */}
              <div className="bg-gray-50 dark:bg-gray-800/30 rounded-xl p-6 space-y-4">
                <h3 className="text-lg font-semibold text-foreground mb-4">
                  Thông tin liên hệ
                </h3>

                <div className="space-y-4">
                  {contact.email && (
                    <a
                      href={`mailto:${contact.email}`}
                      className="flex items-center gap-3 text-foreground hover:text-blue-600 transition-colors group"
                    >
                      <div className="w-11 h-11 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center group-hover:bg-blue-200 dark:group-hover:bg-blue-900/50 transition-colors">
                        <Mail className="w-5 h-5 text-blue-600" />
                      </div>
                      <span className="text-base break-all">
                        {contact.email}
                      </span>
                    </a>
                  )}

                  {contact.phone && (
                    <a
                      href={`tel:${contact.phone}`}
                      className="flex items-center gap-3 text-foreground hover:text-blue-600 transition-colors group"
                    >
                      <div className="w-11 h-11 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center group-hover:bg-blue-200 dark:group-hover:bg-blue-900/50 transition-colors">
                        <Phone className="w-5 h-5 text-blue-600" />
                      </div>
                      <span className="text-base">{contact.phone}</span>
                    </a>
                  )}

                  {contact.website && (
                    <a
                      href={contact.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 text-foreground hover:text-blue-600 transition-colors group"
                    >
                      <div className="w-11 h-11 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center group-hover:bg-blue-200 dark:group-hover:bg-blue-900/50 transition-colors">
                        <Globe className="w-5 h-5 text-blue-600" />
                      </div>
                      <span className="text-base break-all">
                        {contact.website}
                      </span>
                    </a>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
