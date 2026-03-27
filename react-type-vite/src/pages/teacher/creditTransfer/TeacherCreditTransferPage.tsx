import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Search, Eye, CalendarCheck2, CheckCircle2 } from "lucide-react";
import { toast } from "react-toastify";
import type { CreditTransferResponse } from "@/services/api/response/creditTransferResponse";
import {
  getTeacherCreditTransferDetail,
  scheduleCreditTransferInterview,
  searchTeacherCreditTransfers,
  submitCreditTransferInterviewScore,
  type TeacherCreditTransferStatus,
} from "@/services/api/teacher/creditTransferInterviewApi";

const TeacherCreditTransferPage: React.FC = () => {
  const [records, setRecords] = useState<CreditTransferResponse[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [status, setStatus] = useState<TeacherCreditTransferStatus | "all">("all");
  const [keyword, setKeyword] = useState("");
  const [loading, setLoading] = useState(false);

  const [selected, setSelected] = useState<CreditTransferResponse | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const [interviewScheduledAt, setInterviewScheduledAt] = useState("");
  const [interviewMode, setInterviewMode] = useState<"ONLINE" | "OFFLINE">("ONLINE");
  const [interviewMeetingLink, setInterviewMeetingLink] = useState("");
  const [interviewLocation, setInterviewLocation] = useState("");

  const [certificateScore, setCertificateScore] = useState("");
  const [interviewScore, setInterviewScore] = useState("");
  const [interviewFeedback, setInterviewFeedback] = useState("");

  const fetchData = async () => {
    try {
      setLoading(true);
      const result = await searchTeacherCreditTransfers(
        status === "all" ? undefined : status,
        keyword || undefined,
        page,
        10
      );
      setRecords(result.content || []);
      setTotalPages(result.totalPages || 0);
    } catch (error) {
      console.error(error);
      toast.error("Không thể tải danh sách hồ sơ quy đổi");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [page, status]);

  const openDetail = async (id: number) => {
    try {
      setActionLoading(true);
      const detail = await getTeacherCreditTransferDetail(id);
      setSelected(detail);
      setInterviewScheduledAt(detail.interviewScheduledAt ? detail.interviewScheduledAt.slice(0, 16) : "");
      setInterviewMode(detail.interviewMode || "ONLINE");
      setInterviewMeetingLink(detail.interviewMeetingLink || "");
      setInterviewLocation(detail.interviewLocation || "");
      setCertificateScore(detail.certificateScore?.toString() || "");
      setInterviewScore(detail.interviewScore?.toString() || "");
      setInterviewFeedback(detail.interviewFeedback || "");
      setIsModalOpen(true);
    } catch (error) {
      console.error(error);
      toast.error("Không thể tải chi tiết hồ sơ");
    } finally {
      setActionLoading(false);
    }
  };

  const handleSchedule = async () => {
    if (!selected) return;
    if (!interviewScheduledAt) {
      toast.warning("Vui lòng chọn thời gian vấn đáp");
      return;
    }

    if (interviewMode === "ONLINE" && !interviewMeetingLink.trim()) {
      toast.warning("Vui lòng nhập link phòng họp");
      return;
    }

    if (interviewMode === "OFFLINE" && !interviewLocation.trim()) {
      toast.warning("Vui lòng nhập địa điểm vấn đáp");
      return;
    }

    try {
      setActionLoading(true);
      await scheduleCreditTransferInterview(selected.id, {
        interviewScheduledAt: new Date(interviewScheduledAt).toISOString(),
        interviewMode,
        interviewMeetingLink: interviewMode === "ONLINE" ? interviewMeetingLink : undefined,
        interviewLocation: interviewMode === "OFFLINE" ? interviewLocation : undefined,
      });
      toast.success("Đã xếp lịch vấn đáp");
      await openDetail(selected.id);
      await fetchData();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Không thể xếp lịch vấn đáp");
    } finally {
      setActionLoading(false);
    }
  };

  const handleScore = async () => {
    if (!selected) return;

    try {
      setActionLoading(true);
      await submitCreditTransferInterviewScore(selected.id, {
        certificateScore: Number(certificateScore),
        interviewScore: Number(interviewScore),
        interviewFeedback,
      });
      toast.success("Đã lưu kết quả vấn đáp");
      await openDetail(selected.id);
      await fetchData();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Không thể lưu kết quả vấn đáp");
    } finally {
      setActionLoading(false);
    }
  };

  const statusText = (value: string) => {
    switch (value) {
      case "PENDING":
        return "Chờ xếp vấn đáp";
      case "INTERVIEW_SCHEDULED":
        return "Đã xếp lịch";
      case "INTERVIEW_SCORED":
        return "Đã chấm vấn đáp";
      case "PENDING_EXPERT_REVIEW":
        return "Chờ expert duyệt";
      case "APPROVED":
        return "Đã duyệt";
      case "REJECTED":
        return "Từ chối";
      default:
        return value;
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Vấn đáp quy đổi tín chỉ</h1>
        <p className="text-gray-600 text-sm">Giáo viên xếp lịch và chấm điểm vấn đáp trước khi expert duyệt cuối.</p>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm mb-4 flex flex-col md:flex-row gap-3 items-center">
        <select
          aria-label="Lọc trạng thái hồ sơ"
          value={status}
          onChange={(e) => setStatus(e.target.value as TeacherCreditTransferStatus | "all")}
          className="px-3 py-2 border rounded-lg text-sm"
        >
          <option value="all">Tất cả</option>
          <option value="PENDING">Chờ xếp vấn đáp</option>
          <option value="INTERVIEW_SCHEDULED">Đã xếp lịch</option>
          <option value="PENDING_EXPERT_REVIEW">Chờ expert duyệt</option>
        </select>

        <form
          className="relative w-full md:w-96"
          onSubmit={(e) => {
            e.preventDefault();
            setPage(0);
            fetchData();
          }}
        >
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="Tìm theo tên sinh viên hoặc khóa học..."
            className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm"
          />
        </form>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Sinh viên</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Môn nguồn</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Môn miễn</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Trạng thái</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td className="px-4 py-6 text-center text-sm text-gray-500" colSpan={5}>Đang tải...</td>
                </tr>
              ) : records.length === 0 ? (
                <tr>
                  <td className="px-4 py-6 text-center text-sm text-gray-500" colSpan={5}>Không có hồ sơ phù hợp.</td>
                </tr>
              ) : (
                records.map((item) => (
                  <tr key={item.id} className="border-b">
                    <td className="px-4 py-3 text-sm">
                      <div className="font-medium">{item.studentName}</div>
                      <div className="text-xs text-gray-500">{item.studentId}</div>
                    </td>
                    <td className="px-4 py-3 text-sm">{item.sourceCourseName}</td>
                    <td className="px-4 py-3 text-sm text-green-700 font-medium">{item.targetCourseName}</td>
                    <td className="px-4 py-3 text-sm">{statusText(item.status)}</td>
                    <td className="px-4 py-3 text-right">
                      <Button size="sm" variant="outline" onClick={() => openDetail(item.id)} disabled={actionLoading}>
                        <Eye className="w-4 h-4 mr-1" /> Chi tiết
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 0 && (
          <div className="p-3 flex items-center justify-between border-t text-sm">
            <span>Trang {page + 1} / {totalPages}</span>
            <div className="space-x-2">
              <Button size="sm" variant="outline" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>Trước</Button>
              <Button size="sm" variant="outline" disabled={page >= totalPages - 1} onClick={() => setPage((p) => p + 1)}>Sau</Button>
            </div>
          </div>
        )}
      </div>

      {isModalOpen && selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setIsModalOpen(false)} />
          <div className="relative bg-white w-full max-w-3xl rounded-xl shadow-xl p-5 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-3">Hồ sơ #{selected.id} - {selected.studentName}</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm mb-4">
              <div><span className="text-gray-500">Môn nguồn:</span> {selected.sourceCourseName}</div>
              <div><span className="text-gray-500">Môn miễn:</span> {selected.targetCourseName}</div>
              <div><span className="text-gray-500">Trạng thái:</span> {statusText(selected.status)}</div>
              <div><span className="text-gray-500">Điểm tổng hợp:</span> {selected.decisionScore ?? "-"}</div>
            </div>

            <div className="border rounded-lg p-4 mb-4 space-y-3">
              <div className="font-medium flex items-center gap-2"><CalendarCheck2 className="w-4 h-4" /> Xếp lịch vấn đáp</div>
              <input
                aria-label="Thời gian vấn đáp"
                type="datetime-local"
                value={interviewScheduledAt}
                onChange={(e) => setInterviewScheduledAt(e.target.value)}
                className="w-full border rounded px-3 py-2 text-sm"
              />
              <div className="flex gap-4 text-sm">
                <label><input type="radio" checked={interviewMode === "ONLINE"} onChange={() => setInterviewMode("ONLINE")} /> Online</label>
                <label><input type="radio" checked={interviewMode === "OFFLINE"} onChange={() => setInterviewMode("OFFLINE")} /> Offline</label>
              </div>
              {interviewMode === "ONLINE" ? (
                <input value={interviewMeetingLink} onChange={(e) => setInterviewMeetingLink(e.target.value)} placeholder="Link họp online" className="w-full border rounded px-3 py-2 text-sm" />
              ) : (
                <input value={interviewLocation} onChange={(e) => setInterviewLocation(e.target.value)} placeholder="Địa điểm vấn đáp" className="w-full border rounded px-3 py-2 text-sm" />
              )}
              <Button size="sm" onClick={handleSchedule} disabled={actionLoading || selected.status === "APPROVED" || selected.status === "REJECTED"}>
                Lưu lịch vấn đáp
              </Button>
            </div>

            <div className="border rounded-lg p-4 mb-4 space-y-3">
              <div className="font-medium flex items-center gap-2"><CheckCircle2 className="w-4 h-4" /> Chấm điểm vấn đáp</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input value={certificateScore} onChange={(e) => setCertificateScore(e.target.value)} placeholder="Điểm trung bình chứng chỉ (0-10)" className="w-full border rounded px-3 py-2 text-sm" />
                <input value={interviewScore} onChange={(e) => setInterviewScore(e.target.value)} placeholder="Điểm vấn đáp (0-10)" className="w-full border rounded px-3 py-2 text-sm" />
              </div>
              <textarea value={interviewFeedback} onChange={(e) => setInterviewFeedback(e.target.value)} placeholder="Nhận xét vấn đáp" className="w-full border rounded px-3 py-2 text-sm min-h-[90px]" />
              <Button
                size="sm"
                onClick={handleScore}
                disabled={actionLoading || (selected.status !== "INTERVIEW_SCHEDULED" && selected.status !== "INTERVIEW_SCORED")}
              >
                Lưu điểm & chuyển expert duyệt
              </Button>
            </div>

            <div className="flex justify-end">
              <Button variant="outline" onClick={() => setIsModalOpen(false)}>Đóng</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherCreditTransferPage;
