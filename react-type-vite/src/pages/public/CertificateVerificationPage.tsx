import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import Header from "@/components/student/home/Header";
import Footer from "@/components/student/home/Footer";
import {
  verifyPublicCertificate,
  verifyPublicCertificateByHash,
} from "@/services/api/anonymous/certificate.api";
import type { PublicCertificateVerificationResponse } from "@/services/api/response/publicCertificateVerificationResponse";
import { PUBLIC_ROUTES } from "@/constants/routes";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ShieldCheck, ShieldX, Loader2, ExternalLink, GraduationCap, CalendarDays, Upload, FileText } from "lucide-react";

const toHex = (buffer: ArrayBuffer) =>
  Array.from(new Uint8Array(buffer))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");

const ipfsGateway = import.meta.env.VITE_IPFS_GATEWAY_URL || "https://gateway.pinata.cloud/ipfs/";
const blockchainExplorerUrl = (import.meta.env.VITE_BLOCKCHAIN_EXPLORER_URL || "").replace(/\/$/, "");
const blockchainChainId = Number(import.meta.env.VITE_BLOCKCHAIN_CHAIN_ID || "1337");

const resolveIpfsUrl = (value?: string | null) => {
  if (!value) return null;

  if (value.startsWith("ipfs://")) {
    return `${ipfsGateway.replace(/\/?$/, "/")}${value.replace("ipfs://", "")}`;
  }

  return value;
};

const getExplorerTxUrl = (txHash?: string | null): string | null => {
  if (!txHash) return null;

  if (blockchainExplorerUrl) {
    return `${blockchainExplorerUrl}/tx/${txHash}`;
  }

  switch (blockchainChainId) {
    case 137:
      return `https://polygonscan.com/tx/${txHash}`;
    case 80002:
      return `https://amoy.polygonscan.com/tx/${txHash}`;
    case 80001:
      return `https://mumbai.polygonscan.com/tx/${txHash}`;
    case 11155111:
      return `https://sepolia.etherscan.io/tx/${txHash}`;
    default:
      return null;
  }
};

export default function CertificateVerificationPage() {
  const { code } = useParams();
  const [data, setData] = useState<PublicCertificateVerificationResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [searchCode, setSearchCode] = useState(code ?? "");
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfHash, setPdfHash] = useState<string>("");
  const [hashLoading, setHashLoading] = useState(false);

  const runVerifyByCode = useCallback(async (certificateCode: string) => {
    if (!certificateCode.trim()) {
      setErrorMessage("Thiếu mã chứng chỉ");
      setLoading(false);
      return;
    }

    setLoading(true);
    setErrorMessage(null);
    try {
      const result = await verifyPublicCertificate(certificateCode.trim());
      setData(result);
    } catch (error: any) {
      setErrorMessage(error?.message || "Không thể xác minh chứng chỉ");
    } finally {
      setLoading(false);
    }
  }, []);

  const runVerifyByHash = async () => {
    if (!pdfHash) {
      setErrorMessage("Vui lòng chọn file PDF trước khi xác minh");
      return;
    }

    setLoading(true);
    setErrorMessage(null);
    try {
      const result = await verifyPublicCertificateByHash(pdfHash);
      setData(result);
    } catch (error: any) {
      setErrorMessage(error?.message || "Không thể xác minh PDF");
    } finally {
      setLoading(false);
    }
  };

  const handlePdfUpload = async (file?: File) => {
    if (!file) {
      setPdfFile(null);
      setPdfHash("");
      return;
    }

    if (file.type !== "application/pdf") {
      setErrorMessage("Chỉ chấp nhận file PDF");
      return;
    }

    setPdfFile(file);
    setHashLoading(true);
    setErrorMessage(null);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const digest = await crypto.subtle.digest("SHA-256", arrayBuffer);
      setPdfHash(toHex(digest));
    } catch (error: any) {
      setPdfHash("");
      setErrorMessage(error?.message || "Không thể tính hash của file PDF");
    } finally {
      setHashLoading(false);
    }
  };

  useEffect(() => {
    if (code) {
      runVerifyByCode(code);
    } else {
      setLoading(false);
    }
  }, [code, runVerifyByCode]);

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

  const certificate = data?.certificate ?? null;

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 px-4 homepage-links">
        <Header />
        <div className="pt-16 lg:pt-20 flex items-center justify-center">
          <Card className="w-full max-w-xl">
            <CardContent className="py-10 flex items-center justify-center gap-3 text-slate-600">
              <Loader2 className="w-5 h-5 animate-spin" />
              Đang xác minh chứng chỉ...
            </CardContent>
          </Card>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 homepage-links">
      <Header />
      <div className="max-w-3xl mx-auto space-y-4 pt-20 lg:pt-24">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-slate-800">
              <FileText className="w-6 h-6" />
              Tra cứu chứng chỉ
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 md:grid-cols-[1fr_auto]">
              <input
                value={searchCode}
                onChange={(event) => setSearchCode(event.target.value)}
                placeholder="Nhập mã chứng chỉ"
                className="h-11 rounded-md border border-slate-300 bg-white px-3 text-sm outline-none transition focus:border-slate-500"
              />
              <Button onClick={() => runVerifyByCode(searchCode)} className="h-11 gap-2">
                <ShieldCheck className="w-4 h-4" />
                Xác minh theo mã
              </Button>
            </div>

            <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 space-y-3">
              <div className="flex items-center gap-2 text-slate-700 font-medium">
                <Upload className="w-4 h-4" />
                Xác minh bằng file PDF
              </div>
              <input
                type="file"
                accept="application/pdf"
                onChange={(event) => handlePdfUpload(event.target.files?.[0])}
                title="Tải lên file PDF chứng chỉ"
                className="block w-full text-sm text-slate-600 file:mr-4 file:rounded-md file:border-0 file:bg-slate-900 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-slate-800"
              />
              <div className="text-xs text-slate-500">
                {pdfFile ? `Đã chọn: ${pdfFile.name}` : "Chọn file PDF để hệ thống tính SHA-256 và đối chiếu blockchain."}
              </div>
              <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div className="text-xs font-mono break-all text-slate-700">
                  {hashLoading ? "Đang tính hash..." : pdfHash || "Chưa có hash"}
                </div>
                <Button onClick={runVerifyByHash} disabled={!pdfHash || loading} variant="outline" className="gap-2">
                  <ShieldCheck className="w-4 h-4" />
                  Xác minh PDF
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

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

        {data?.found && certificate && (
          <Card>
            <CardHeader>
              <CardTitle>Thông tin chứng chỉ</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-slate-700">
              <div><span className="font-semibold">Mã chứng chỉ:</span> {certificate.certificateCode}</div>
              <div><span className="font-semibold">Mã học viên (ẩn danh):</span> {certificate.userId}</div>
              <div><span className="font-semibold">Khóa học:</span> {certificate.courseName || `Published Course #${certificate.courseId}`}</div>
              <div><span className="font-semibold">Xếp loại:</span> {certificate.grade || "N/A"}</div>
              <div><span className="font-semibold">Điểm:</span> {typeof certificate.finalScore === "number" ? certificate.finalScore.toFixed(1) : "N/A"}</div>
              <div className="flex items-center gap-2">
                <CalendarDays className="w-4 h-4" />
                <span className="font-semibold">Ngày cấp:</span>
                {certificate.issueDate ? new Date(certificate.issueDate).toLocaleString("vi-VN") : "N/A"}
              </div>
              <div><span className="font-semibold">Trạng thái:</span> {certificate.status}</div>

            {(certificate.pdfUrl || certificate.tokenUri) && (
              <div className="pt-3 grid gap-3 sm:grid-cols-2">
                {certificate.tokenUri && (
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 space-y-2">
                    <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Token URI</div>
                    <div className="break-all text-xs font-mono text-slate-700">{certificate.tokenUri}</div>
                    {resolveIpfsUrl(certificate.pdfUrl || certificate.tokenUri) && (
                      <Button variant="outline" className="gap-2 w-full" onClick={() => window.open(resolveIpfsUrl(certificate.pdfUrl || certificate.tokenUri)!, "_blank", "noopener,noreferrer") }>
                        <ExternalLink className="w-4 h-4" />
                        Mở PDF trên IPFS
                      </Button>
                    )}
                  </div>
                )}
              </div>
            )}

              {getExplorerTxUrl(certificate.transactionHash) && (
                <div className="pt-2">
                  <Button
                    variant="outline"
                    className="gap-2"
                    onClick={() => window.open(getExplorerTxUrl(certificate.transactionHash)!, "_blank")}
                  >
                    <ExternalLink className="w-4 h-4" />
                    Xem giao dịch trên explorer
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <div className="pt-2">
          <Link to={PUBLIC_ROUTES.HOME}>
            <Button
              variant="outline"
              className="border-slate-300 bg-white text-slate-700 hover:bg-slate-100 hover:text-slate-900"
            >
              Quay về trang chủ
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
