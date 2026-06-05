import { useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle, XCircle, Clock, RefreshCw } from "lucide-react";
import * as studentCreditTransferApi from "@/services/api/student/studentCreditTransferApi";
import type { CreditTransferResponse } from "@/services/api/response/creditTransferResponse";
import type { EquivalentCourseResponse } from "@/types/course.types";
import SubmitCreditTransferModal from "@/components/student/creditTransfer/SubmitCreditTransferModal";
import { format } from "date-fns";

import Header from "./dashboard/Header";
import Footer from "./dashboard/Footer";
import "../../styles/student-dashboard.css";

const StudentCreditTransferPage = () => {
    const [activeTab, setActiveTab] = useState("available");
    const [equivalentCourses, setEquivalentCourses] = useState<EquivalentCourseResponse[]>([]);
    const [myRequests, setMyRequests] = useState<CreditTransferResponse[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    // Note: currently no client-side text/unit/status filters enabled

    // Modal State
    const [selectedCourse, setSelectedCourse] = useState<EquivalentCourseResponse | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const fetchEquivalentCourses = async () => {
        try {
            setIsLoading(true);
            const res = await studentCreditTransferApi.getEquivalentCourses();
            setEquivalentCourses(res.content);
        } catch (error) {
            console.error("Failed to fetch equivalent courses", error);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchMyRequests = async (showLoading = true) => {
        try {
            if (showLoading) setIsLoading(true);
            const res = await studentCreditTransferApi.getMyRequests();
            setMyRequests(res.content);
        } catch (error) {
            console.error("Failed to fetch my requests", error);
        } finally {
            if (showLoading) setIsLoading(false);
        }
    };

    useEffect(() => {
        if (activeTab === "available") {
            fetchEquivalentCourses();
            fetchMyRequests(false);
        } else {
            fetchMyRequests();
        }
    }, [activeTab]);

    const handleOpenModal = (course: EquivalentCourseResponse) => {
        setSelectedCourse(course);
        setIsModalOpen(true);
    };

    const getLatestRequestByEquivalentCourse = (equivalentCourseId: number) => {
        const matched = myRequests.filter((request) => request.equivalentCourseId === equivalentCourseId);
        if (matched.length === 0) return null;

        return matched.sort((a, b) => {
            const timeA = a.requestDate ? new Date(a.requestDate).getTime() : 0;
            const timeB = b.requestDate ? new Date(b.requestDate).getTime() : 0;
            return timeB - timeA;
        })[0];
    };

    const getActionState = (course: EquivalentCourseResponse) => {
        if (!course.status) {
            return {
                actionable: false,
                label: "Ngưng áp dụng",
                variant: "outline" as const,
                className: "text-foreground",
            };
        }

        const latestRequest = getLatestRequestByEquivalentCourse(course.id);
        if (!latestRequest) {
            return {
                actionable: true,
                label: "Đăng ký quy đổi",
                variant: "default" as const,
                className: "",
            };
        }

        switch (latestRequest.status) {
            case "APPROVED":
                return {
                    actionable: false,
                    label: "Đã được miễn",
                    variant: "secondary" as const,
                    className: "text-foreground font-medium",
                };
            case "PENDING":
                return {
                    actionable: false,
                    label: "Đã gửi yêu cầu",
                    variant: "outline" as const,
                    className: "text-foreground",
                };
            case "INTERVIEW_SCHEDULED":
                return {
                    actionable: false,
                    label: "Đã xếp vấn đáp",
                    variant: "outline" as const,
                    className: "text-foreground",
                };
            case "PENDING_EXPERT_REVIEW":
                return {
                    actionable: false,
                    label: "Chờ expert duyệt",
                    variant: "outline" as const,
                    className: "text-foreground",
                };
            default:
                return {
                    actionable: true,
                    label: "Đăng ký quy đổi",
                    variant: "default" as const,
                    className: "",
                };
        }
    };

    const renderStatusBadge = (status: string) => {
        switch (status) {
            case "APPROVED":
                return <Badge className="bg-green-600 text-white border-transparent"><CheckCircle className="w-3 h-3 mr-1" /> Đã được miễn</Badge>;
            case "REJECTED":
                return <Badge className="bg-red-600 text-white border-transparent"><XCircle className="w-3 h-3 mr-1" /> Bị từ chối</Badge>;
            case "INTERVIEW_SCHEDULED":
                return <Badge className="bg-indigo-600 text-white border-transparent"><Clock className="w-3 h-3 mr-1" /> Có vấn đáp</Badge>;
            case "INTERVIEW_SCORED":
                return <Badge className="bg-purple-600 text-white border-transparent"><Clock className="w-3 h-3 mr-1" /> Đã chấm</Badge>;
            case "PENDING_EXPERT_REVIEW":
                return <Badge className="bg-blue-600 text-white border-transparent"><Clock className="w-3 h-3 mr-1" />  Chờ duyệt</Badge>;
            case "PENDING":
                return <Badge className="bg-yellow-400 text-black border-transparent"><Clock className="w-3 h-3 mr-1" /> Đang xử lý</Badge>;
            default:
                return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" /> Chưa có trạng thái</Badge>;
        }
    };

    const renderExpertFeedback = (request: CreditTransferResponse) => {
        if (request.rejectionReason) {
            return <span className="text-red-500 italic">{request.rejectionReason}</span>;
        }

        if (request.status === "APPROVED") {
            return <span className="text-green-600">Đã được chấp nhận</span>;
        }

        return <span className="text-muted-foreground">Chưa có phản hồi</span>;
    };

    const renderInterviewSchedule = (request: CreditTransferResponse) => {
        if (!request.interviewScheduledAt) {
            return <span className="text-muted-foreground">Chưa xếp lịch</span>;
        }

        const modeLabel = request.interviewMode === "ONLINE"
            ? "Online"
            : request.interviewMode === "OFFLINE"
                ? "Offline"
                : "-";

        return (
            <div className="space-y-1 text-xs text-gray-600 leading-5">
                <div className="font-medium text-gray-900">
                    {format(new Date(request.interviewScheduledAt), "dd/MM/yyyy HH:mm")}
                </div>
                <div>Hình thức: {modeLabel}</div>
                {request.interviewMode === "ONLINE" && request.interviewMeetingLink && (
                    <a
                        href={request.interviewMeetingLink}
                        target="_blank"
                        rel="noreferrer"
                        className="block text-blue-600 hover:underline break-all"
                    >
                        Phòng họp: {request.interviewMeetingLink}
                    </a>
                )}
                {request.interviewMode === "OFFLINE" && request.interviewLocation && (
                    <div>Địa điểm: {request.interviewLocation}</div>
                )}
                {request.interviewFeedback && (
                    <div className="text-gray-500">Ghi chú: {request.interviewFeedback}</div>
                )}
            </div>
        );
    };

    return (
        <div className="student-dashboard student-dashboard-bg flex flex-col min-h-screen">
            <Header />

            <main className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 student-dashboard-main flex-1">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold">Quy đổi Tín chỉ</h1>
                </div>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="mb-4 bg-transparent p-1 rounded-lg">
                        <TabsTrigger
                            value="available"
                            className="font-medium text-muted-foreground px-4 data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-sm rounded-md"
                        >
                            Chương trình quy đổi khả dụng
                        </TabsTrigger>
                        <TabsTrigger
                            value="history"
                            className="font-medium text-muted-foreground px-4 data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-sm rounded-md"
                        >
                            Lịch sử yêu cầu của tôi
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="available">
                        <div className="border rounded-md bg-white">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Khóa học Nguồn</TableHead>
                                        <TableHead>Đơn vị</TableHead>
                                        <TableHead>Khóa học đích</TableHead>
                                        <TableHead>Yêu cầu / Điều kiện</TableHead>
                                        <TableHead>Trạng thái</TableHead>
                                        <TableHead className="text-right">Hành động</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {isLoading ? (
                                        <TableRow>
                                            <TableCell colSpan={6} className="text-center py-8">
                                                <div className="flex justify-center"><Loader2 className="animate-spin" /></div>
                                            </TableCell>
                                        </TableRow>
                                    ) : equivalentCourses.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                                                Hiện chưa có chương trình quy đổi nào.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        // hide already approved programs in Available tab
                                        equivalentCourses
                                            .filter((c) => {
                                                const latest = getLatestRequestByEquivalentCourse(c.id);
                                                return latest?.status !== "APPROVED";
                                            })
                                            .map((course) => {
                                                const latestRequest = getLatestRequestByEquivalentCourse(course.id);
                                                const actionState = getActionState(course);
                                                return (
                                                    <TableRow key={course.id} className="align-middle">
                                                        <TableCell className="font-medium py-2">{course.sourceCourseName}</TableCell>
                                                        <TableCell className="py-2">{course.sourceEducationalUnit}</TableCell>
                                                        <TableCell className="py-2">
                                                            <div className="font-bold text-green-700">{course.targetCourseName}</div>
                                                            <div className="text-xs text-gray-500">({course.targetCourseCredits || "?"} tín chỉ)</div>
                                                        </TableCell>
                                                        <TableCell className="max-w-[300px] py-2">
                                                            {course.requirements || course.description}
                                                        </TableCell>
                                                        <TableCell className="py-2">
                                                            {renderStatusBadge(latestRequest?.status || "")}
                                                        </TableCell>
                                                        <TableCell className="text-right py-2">
                                                            {actionState.actionable ? (
                                                                <div className="h-full flex items-center justify-end">
                                                                    <Button
                                                                        size="sm"
                                                                        variant={actionState.variant}
                                                                        className={`bg-blue-600 text-white hover:bg-blue-700 border border-blue-600 disabled:!bg-gray-200 disabled:!text-gray-700 disabled:!border-gray-300 disabled:!opacity-100 flex items-center gap-2 py-2 px-3 ${actionState.className}`}
                                                                        onClick={() => handleOpenModal(course)}
                                                                    >
                                                                        <RefreshCw className="w-4 h-4" />
                                                                        Quy đổi tín chỉ
                                                                    </Button>
                                                                </div>
                                                            ) : (
                                                                <div className="inline-flex flex-col items-end gap-1">
                                                                    <div className="text-xs text-gray-600">{latestRequest?.requestDate ? format(new Date(latestRequest.requestDate), "dd/MM/yyyy HH:mm") : "-"}</div>
                                                                    <div className="text-right">
                                                                        <Badge variant={actionState.variant} className={actionState.className}>
                                                                            {actionState.label}
                                                                        </Badge>
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </TableCell>
                                                    </TableRow>
                                                );
                                            })
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </TabsContent>

                    <TabsContent value="history">
                        <div className="border rounded-md bg-white">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Ngày gửi</TableHead>
                                        <TableHead>Khóa học quy đổi</TableHead>
                                        <TableHead>Môn học được miễn</TableHead>
                                        <TableHead>Ghi chú của tôi</TableHead>
                                        <TableHead>Lịch vấn đáp</TableHead>
                                        <TableHead>Trạng thái</TableHead>
                                        <TableHead>Phản hồi từ Chuyên gia</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {isLoading ? (
                                        <TableRow>
                                            <TableCell colSpan={7} className="text-center py-8">
                                                <div className="flex justify-center"><Loader2 className="animate-spin" /></div>
                                            </TableCell>
                                        </TableRow>
                                    ) : myRequests.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                                                Bạn chưa gửi yêu cầu quy đổi nào.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        myRequests.map((req) => (
                                            <TableRow key={req.id}>
                                                <TableCell>{req.requestDate ? format(new Date(req.requestDate), "dd/MM/yyyy HH:mm") : "-"}</TableCell>
                                                <TableCell>{req.sourceCourseName || "N/A"}</TableCell>
                                                <TableCell>{req.targetCourseName || "N/A"}</TableCell>
                                                <TableCell className="max-w-[200px] truncate" title={req.description}>{req.description}</TableCell>
                                                <TableCell>{renderInterviewSchedule(req)}</TableCell>
                                                <TableCell>{renderStatusBadge(req.status)}</TableCell>
                                                <TableCell>{renderExpertFeedback(req)}</TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </TabsContent>
                </Tabs>

                <SubmitCreditTransferModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    equivalentCourse={selectedCourse}
                    onSuccess={() => {
                        // Switch to history tab to see new request
                        setActiveTab("history");
                        fetchMyRequests();
                    }}
                />
            </main>
            <Footer />
        </div>
    );
};

export default StudentCreditTransferPage;
