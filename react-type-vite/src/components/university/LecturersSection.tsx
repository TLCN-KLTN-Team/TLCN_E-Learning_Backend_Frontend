import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Mail, ExternalLink } from "lucide-react";

interface Lecturer {
  id: string;
  name: string;
  department: string;
  email?: string;
  avatar?: string;
  title?: string;
}

interface LecturersSectionProps {
  lecturers: Lecturer[];
  departments: string[];
}
const getAvatarByName = (name: string): string => {
  const words = name.trim().split(" ");
  if (words.length >= 2) {
    return `${words[0].charAt(0)}${words[words.length - 1].charAt(
      0
    )}`.toUpperCase();
  }
  return name.charAt(0).toUpperCase();
};
export function LecturersSection({
  lecturers,
  departments,
}: LecturersSectionProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState<string>("all");

  const filteredLecturers = lecturers.filter((lecturer) => {
    const matchesSearch = lecturer.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesDepartment =
      selectedDepartment === "all" ||
      lecturer.department === selectedDepartment;
    return matchesSearch && matchesDepartment;
  });

  return (
    <section className="p-10 md:py-16 bg-background">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-foreground">
              Đội ngũ Giảng viên
            </h2>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Tìm kiếm giảng viên..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full sm:w-64"
              />
            </div>

            <Select
              value={selectedDepartment}
              onValueChange={setSelectedDepartment}
            >
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Lọc theo khoa" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả khoa</SelectItem>
                {departments.map((dept) => (
                  <SelectItem key={dept} value={dept}>
                    {dept}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-5">
          {filteredLecturers.map((lecturer) => (
            <Card
              key={lecturer.id}
              className="hover:shadow-lg transition-all duration-300 border"
            >
              <CardContent className="p-5">
                <div className="flex flex-col items-center text-center gap-3">
                  {/* Avatar */}
                  <Avatar className="w-16 h-16">
                    <AvatarImage src={lecturer.avatar} alt={lecturer.name} />
                    <AvatarFallback className="bg-blue-600 text-white text-lg font-semibold">
                      {getAvatarByName(lecturer.name)}
                    </AvatarFallback>
                  </Avatar>

                  {/* Info */}
                  <div className="w-full">
                    <h3 className="font-semibold text-foreground text-base mb-1">
                      {lecturer.name}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-2">
                      {lecturer.title || "Giảng viên"}
                    </p>
                    <Badge
                      variant="secondary"
                      className="text-xs bg-blue-50 text-blue-700"
                    >
                      {lecturer.department}
                    </Badge>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
                  {lecturer.email ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs text-muted-foreground hover:text-blue-600 p-0 h-auto"
                      onClick={() =>
                        (window.location.href = `mailto:${lecturer.email}`)
                      }
                    >
                      <Mail className="w-3.5 h-3.5 mr-1" />
                      Email
                    </Button>
                  ) : (
                    <span className="text-xs text-muted-foreground">
                      Chưa có email
                    </span>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs text-blue-600 hover:text-blue-700 p-0 h-auto"
                    onClick={() =>
                      window.open(
                        `${import.meta.env.VITE_APP_URL}/teacher/${lecturer.id}`,
                        "_blank"
                      )
                    }
                  >
                    <ExternalLink className="w-3.5 h-3.5 mr-1" />
                    Hồ sơ
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredLecturers.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-lg">
              Không tìm thấy giảng viên phù hợp
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
