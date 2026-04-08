import { useState, type FC } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Flag } from "lucide-react";
import { useForumModeration } from "@/hooks/useForumModeration";

interface ReportDialogProps {
    targetId: string;
    targetType: "POST" | "COMMENT";
    triggerClassName?: string;
}

const VIOLATION_REASONS = [
    { value: "SPAM", label: "Thư Rác" },
    { value: "OFFENSIVE_CONTENT", label: "Nội Dung Không Lịch Sự" },
    { value: "HATE_SPEECH", label: "Phát Biểu Kỳ Thị" },
    { value: "PLAGIARISM", label: "Đạo Văn" },
    { value: "MISINFORMATION", label: "Thông Tin Sai Lệch" },
    { value: "SEXUAL_CONTENT", label: "Nội Dung Tình Dục" },
    { value: "SELF_PROMOTION", label: "Tự Quảng Bá" },
    { value: "OFF_TOPIC", label: "Ngoài Chủ Đề" },
    { value: "OTHER", label: "Khác" },
];

export const ReportDialog: FC<ReportDialogProps> = ({
    targetId,
    targetType,
    triggerClassName = "",
}) => {
    const [open, setOpen] = useState(false);
    const [reason, setReason] = useState("");
    const [notes, setNotes] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const { reportPost, reportComment, canReport, isSuperAdmin } = useForumModeration();

    const handleSubmit = async () => {
        if (!reason) {
            alert("Vui lòng chọn một lý do");
            return;
        }

        setIsSubmitting(true);
        try {
            if (targetType === "POST") {
                await reportPost(targetId, reason, notes);
            } else {
                await reportComment(targetId, reason, notes);
            }
            setOpen(false);
            setReason("");
            setNotes("");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!canReport || isSuperAdmin) {
        return null;
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button
                    variant="ghost"
                    size="sm"
                    className={`text-red-500 hover:text-red-600 hover:bg-red-50 ${triggerClassName}`}
                    title="Báo cáo nội dung này"
                >
                    <Flag className="w-4 h-4 mr-2" />
                    Báo Cáo
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Báo Cáo Nội Dung</DialogTitle>
                    <DialogDescription>
                        Giúp chúng tôi giữ diễn đàn an toàn bằng cách báo cáo nội dung không phù hợp
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="reason">Lý Do Báo Cáo *</Label>
                        <Select value={reason} onValueChange={setReason}>
                            <SelectTrigger id="reason">
                                <SelectValue placeholder="Chọn một lý do" />
                            </SelectTrigger>
                            <SelectContent className="!bg-white !text-black border !border-gray-300 !shadow-lg">
                                {VIOLATION_REASONS.map((option) => (
                                    <SelectItem key={option.value} value={option.value}>
                                        {option.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="notes">Chi Tiết Bổ Sung (tùy chọn)</Label>
                        <Textarea
                            id="notes"
                            placeholder="Cung cấp bất kỳ thông tin bổ sung nào..."
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            rows={4}
                            className="resize-none"
                        />
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded p-3 text-sm text-blue-800">
                        Báo cáo của bạn sẽ được xem xét bởi những người kiểm duyệt. Cảm ơn bạn đã giúp giữ cộng đồng an toàn.
                    </div>
                </div>

                <div className="flex gap-2 justify-end">
                    <Button variant="outline" onClick={() => setOpen(false)}>
                        Hủy
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={isSubmitting || !reason}
                        className="bg-red-600 text-white hover:bg-red-700 hover:text-white"
                    >
                        {isSubmitting ? "Đang gửi..." : "Gửi Báo Cáo"}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
};
