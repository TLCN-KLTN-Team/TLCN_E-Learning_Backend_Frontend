import { useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle, XCircle, Clock } from "lucide-react";
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

    const fetchMyRequests = async () => {
        try {
            setIsLoading(true);
            const res = await studentCreditTransferApi.getMyRequests();
            setMyRequests(res.content);
        } catch (error) {
            console.error("Failed to fetch my requests", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (activeTab === "available") {
            fetchEquivalentCourses();
        } else {
            fetchMyRequests();
        }
    }, [activeTab]);

    const handleOpenModal = (course: EquivalentCourseResponse) => {
        setSelectedCourse(course);
        setIsModalOpen(true);
    };

    const renderStatusBadge = (status: string) => {
        switch (status) {
            case "APPROVED":
                return <Badge className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" /> Đã duyệt</Badge>;
            case "REJECTED":
                return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" /> Từ chối</Badge>;
            default:
                return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" /> Chờ duyệt</Badge>;
        }
    };

    return (
        <div className="student-dashboard student-dashboard-bg flex flex-col min-h-screen">
            <Header />

            <main className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 student-dashboard-main flex-1">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold">Quy đổi Tín chỉ</h1>
                </div>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="mb-4">
                        <TabsTrigger value="available">Chương trình quy đổi khả dụng</TabsTrigger>
                        <TabsTrigger value="history">Lịch sử yêu cầu của tôi</TabsTrigger>
                    </TabsList>

                    <TabsContent value="available">
                        <div className="border rounded-md bg-white">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Khóa học Nguồn (Bên ngoài)</TableHead>
                                        <TableHead>Đơn vị đào tạo</TableHead>
                                        <TableHead>Môn học được miễn (Nội bộ)</TableHead>
                                        <TableHead>Yêu cầu / Điều kiện</TableHead>
                                        <TableHead className="text-right">Hành động</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {isLoading ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center py-8">
                                                <div className="flex justify-center"><Loader2 className="animate-spin" /></div>
                                            </TableCell>
                                        </TableRow>
                                    ) : equivalentCourses.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                                                Hiện chưa có chương trình quy đổi nào.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        equivalentCourses.map((course) => (
                                            <TableRow key={course.id}>
                                                <TableCell className="font-medium">{course.sourceCourseName}</TableCell>
                                                <TableCell>{course.sourceEducationalUnit}</TableCell>
                                                <TableCell>
                                                    <div className="font-bold text-green-700">{course.targetCourseName}</div>
                                                    <div className="text-xs text-gray-500">({course.targetCourseCredits || "?"} tín chỉ)</div>
                                                </TableCell>
                                                <TableCell className="max-w-[300px]">
                                                    {course.requirements || course.description}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Button size="sm" onClick={() => handleOpenModal(course)}>
                                                        Đăng ký quy đổi
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))
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
                                        <TableHead>Trạng thái</TableHead>
                                        <TableHead>Phản hồi từ Experts</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {isLoading ? (
                                        <TableRow>
                                            <TableCell colSpan={6} className="text-center py-8">
                                                <div className="flex justify-center"><Loader2 className="animate-spin" /></div>
                                            </TableCell>
                                        </TableRow>
                                    ) : myRequests.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={6} className="text-center py-8 text-gray-500">
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
                                                <TableCell>{renderStatusBadge(req.status)}</TableCell>
                                                <TableCell className="text-red-500 italic">
                                                    {req.rejectionReason || (req.status === "APPROVED" ? "Đã được chấp nhận" : "")}
                                                </TableCell>
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
