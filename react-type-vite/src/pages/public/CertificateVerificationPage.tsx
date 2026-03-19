import { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { verifyPublicCertificate } from "@/services/api/anonymous/certificate.api";
import type { PublicCertificateVerificationResponse } from "@/services/api/response/publicCertificateVerificationResponse";
import { PUBLIC_ROUTES } from "@/constants/routes";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ShieldCheck, ShieldX, Loader2, ExternalLink, GraduationCap, CalendarDays } from "lucide-react";

export default function CertificateVerificationPage() {
  const { code } = useParams();
  const [data, setData] = useState<PublicCertificateVerificationResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
      if (!code) {
        setErrorMessage("Thiếu mã chứng chỉ");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setErrorMessage(null);
        const result = await verifyPublicCertificate(code);
        setData(result);
      } catch (error: any) {
        setErrorMessage(error?.message || "Không thể xác minh chứng chỉ");
      } finally {
        setLoading(false);
      }
    };

    run();
  }, [code]);

  const verifyStatus = useMemo(() => {
    if (!data?.found) {
      return {
        label: "Không tìm thấy",
        badgeClass: "bg-red-100 text-red-800 border-red-200",
        icon: <ShieldX className="w-5 h-5 text-red-600" />,
      };
    }

    if (data.onChainChecked && data.onChainValid && data.dataMatched) {
      return {
        label: "Hợp lệ (Đã đối soát on-chain)",
        badgeClass: "bg-green-100 text-green-800 border-green-200",
        icon: <ShieldCheck className="w-5 h-5 text-green-600" />,
      };
    }

    if (data.onChainChecked && data.onChainValid && !data.dataMatched) {
      return {
        label: "Cảnh báo: dữ liệu không khớp",
        badgeClass: "bg-amber-100 text-amber-800 border-amber-200",
        icon: <ShieldX className="w-5 h-5 text-amber-600" />,
      };
    }

    if (data.onChainChecked && data.onChainValid === false) {
      return {
        label: "Không hợp lệ on-chain",
        badgeClass: "bg-red-100 text-red-800 border-red-200",
        icon: <ShieldX className="w-5 h-5 text-red-600" />,
      };
    }

    return {
      label: "Đã tìm thấy trên hệ thống",
      badgeClass: "bg-blue-100 text-blue-800 border-blue-200",
      icon: <ShieldCheck className="w-5 h-5 text-blue-600" />,
    };
  }, [data]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <Card className="w-full max-w-xl">
          <CardContent className="py-10 flex items-center justify-center gap-3 text-slate-600">
            <Loader2 className="w-5 h-5 animate-spin" />
            Đang xác minh chứng chỉ...
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4">
      <div className="max-w-3xl mx-auto space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-slate-800">
              <GraduationCap className="w-6 h-6" />
              Xác minh chứng chỉ
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              {verifyStatus.icon}
              <Badge variant="outline" className={verifyStatus.badgeClass}>
                {verifyStatus.label}
              </Badge>
            </div>

            {errorMessage && (
              <div className="text-red-600 text-sm">{errorMessage}</div>
            )}

            <div className="text-sm text-slate-600">
              {data?.message || "Không có thông tin xác minh"}
            </div>
          </CardContent>
        </Card>

        {data?.found && data.certificate && (
          <Card>
            <CardHeader>
              <CardTitle>Thông tin chứng chỉ</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-slate-700">
              <div><span className="font-semibold">Mã chứng chỉ:</span> {data.certificate.certificateCode}</div>
              <div><span className="font-semibold">Mã học viên (ẩn danh):</span> {data.certificate.userId}</div>
              <div><span className="font-semibold">Khóa học:</span> {data.certificate.courseName || `Published Course #${data.certificate.courseId}`}</div>
              <div><span className="font-semibold">Xếp loại:</span> {data.certificate.grade || "N/A"}</div>
              <div><span className="font-semibold">Điểm:</span> {typeof data.certificate.finalScore === "number" ? data.certificate.finalScore.toFixed(1) : "N/A"}</div>
              <div className="flex items-center gap-2">
                <CalendarDays className="w-4 h-4" />
                <span className="font-semibold">Ngày cấp:</span>
                {data.certificate.issueDate ? new Date(data.certificate.issueDate).toLocaleString("vi-VN") : "N/A"}
              </div>
              <div><span className="font-semibold">Trạng thái:</span> {data.certificate.status}</div>

              {data.certificate.transactionHash && (
                <div className="pt-2">
                  <Button
                    variant="outline"
                    className="gap-2"
                    onClick={() => window.open(`https://sepolia.etherscan.io/tx/${data.certificate?.transactionHash}`, "_blank")}
                  >
                    <ExternalLink className="w-4 h-4" />
                    Xem giao dịch trên Etherscan
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <div className="pt-2">
          <Link to={PUBLIC_ROUTES.HOME}>
            <Button variant="ghost">Quay về trang chủ</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
