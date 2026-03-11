import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  Archive,
  BookOpen,
  Layers,
  Brain,
  Clock,
  Eye,
  Trash2,
} from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";

import type { DocumentSet } from "@/types/document-library.types";
import documentLibraryApi from "@/services/api/user/documentLibraryApi";
import Header from "@/components/student/home/Header";

type TabValue = "all" | "flashcard" | "quiz";

export default function MyDocumentLibraryPage() {
  const { toast } = useToast();
  const [tab, setTab] = useState<TabValue>("all");
  const [sets, setSets] = useState<DocumentSet[]>([]);
  const [loading, setLoading] = useState(true);

  // Load data when component mounts
  const loadDocumentSets = useCallback(async () => {
    try {
      setLoading(true);
      const data = await documentLibraryApi.getAllDocumentSets();
      setSets(data);
    } catch (error) {
      console.error("Failed to load document sets:", error);
      toast({
        title: "Lỗi",
        description: "Không thể tải dữ liệu. Vui lòng thử lại.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadDocumentSets();
  }, [loadDocumentSets]);

  const handleDelete = async (id: string) => {
    if (!confirm("Bạn có chắc chắn muốn xóa bộ này?")) {
      return;
    }

    try {
      await documentLibraryApi.deleteDocumentSet(id);
      setSets((prev) => prev.filter((set) => set.id !== id));
      toast({
        title: "Đã xóa",
        description: "Bộ đã được xóa thành công.",
      });
    } catch (error) {
      console.error("Failed to delete set:", error);
      toast({
        title: "Lỗi",
        description: "Không thể xóa bộ. Vui lòng thử lại.",
        variant: "destructive",
      });
    }
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Hôm nay";
    if (diffDays === 1) return "Hôm qua";
    if (diffDays < 7) return `${diffDays} ngày trước`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} tuần trước`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} tháng trước`;
    return date.toLocaleDateString("vi-VN");
  };

  // Filter sets based on active tab
  const filtered = sets.filter((set) => {
    if (tab === "all") return true;
    return set.type === tab;
  });

  // Calculate counts
  const flashcardCount = sets.filter((s) => s.type === "flashcard").length;
  const quizCount = sets.filter((s) => s.type === "quiz").length;

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="pt-16 lg:pt-20 flex items-center justify-center min-h-[calc(100vh-4rem)]">
          <div className="text-center">
            <div className="h-12 w-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Đang tải...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground homepage-links">
      <Header />

      {/* Main Content */}
      <main className="pt-16 lg:pt-24 mx-auto max-w-6xl px-4 py-8 pb-24 md:pb-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="border-2 hover:border-primary/50 transition-colors">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-3xl font-bold text-foreground mb-1">
                    {sets.length}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Tổng bộ đã lưu
                  </p>
                </div>
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <BookOpen className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 hover:border-primary/50 transition-colors">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-3xl font-bold text-foreground mb-1">
                    {flashcardCount}
                  </p>
                  <p className="text-sm text-muted-foreground">Bộ Flashcards</p>
                </div>
                <div className="h-12 w-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
                  <Layers className="h-6 w-6 text-blue-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 hover:border-primary/50 transition-colors">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-3xl font-bold text-foreground mb-1">
                    {quizCount}
                  </p>
                  <p className="text-sm text-muted-foreground">Bộ Quizzes</p>
                </div>
                <div className="h-12 w-12 rounded-xl bg-purple-500/10 flex items-center justify-center">
                  <Brain className="h-6 w-6 text-purple-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs & List */}
        <Card>
          <CardContent className="p-6">
            <Tabs
              value={tab}
              onValueChange={(value) => setTab(value as TabValue)}
            >
              <TabsList className="w-full grid grid-cols-3 mb-6">
                <TabsTrigger value="all" className="text-sm font-medium">
                  Tất cả ({sets.length})
                </TabsTrigger>
                <TabsTrigger value="flashcard" className="text-sm font-medium">
                  Flashcards ({flashcardCount})
                </TabsTrigger>
                <TabsTrigger value="quiz" className="text-sm font-medium">
                  Quizzes ({quizCount})
                </TabsTrigger>
              </TabsList>

              <TabsContent value={tab} className="space-y-3 mt-0">
                {filtered.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
                      <Archive className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">
                      Chưa có bộ nào được lưu
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Tạo bộ flashcard hoặc quiz mới từ tài liệu của bạn
                    </p>
                    <Link
                      to="/student/review"
                      className="inline-flex items-center gap-2 text-sm text-primary hover:underline font-medium"
                    >
                      Tạo bộ mới
                      <span>→</span>
                    </Link>
                  </div>
                ) : (
                  filtered.map((set) => (
                    <Card
                      key={set.id}
                      className="hover:shadow-lg hover:border-primary/20 transition-all border"
                    >
                      <CardContent className="p-5 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-4 min-w-0 flex-1">
                          <div
                            className={`h-12 w-12 rounded-xl flex items-center justify-center shrink-0 ${
                              set.type === "flashcard"
                                ? "bg-blue-500/10"
                                : "bg-purple-500/10"
                            }`}
                          >
                            {set.type === "flashcard" ? (
                              <Layers className="h-5 w-5 text-blue-500" />
                            ) : (
                              <Brain className="h-5 w-5 text-purple-500" />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-semibold text-foreground truncate mb-1">
                              {set.name}
                            </p>
                            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                <span>{formatDate(set.createdAt)}</span>
                              </div>
                              <Badge
                                variant={
                                  set.type === "flashcard"
                                    ? "default"
                                    : "secondary"
                                }
                                className="text-xs"
                              >
                                {set.count}{" "}
                                {set.type === "flashcard" ? "thẻ" : "câu"}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9 hover:bg-primary/10 hover:text-primary"
                            title="Xem chi tiết"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9 text-destructive hover:bg-destructive/10 hover:text-destructive"
                            onClick={() => handleDelete(set.id)}
                            title="Xóa bộ"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </main>

      {/* Mobile Navigation Buttons - Fixed at bottom */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 p-4 bg-background border-t border-border z-50">
        <div className="flex gap-2">
          <Link
            to="/student/quiz"
            className="flex-1 rounded-lg border border-border px-3 py-2 text-sm font-medium text-center text-foreground hover:bg-muted transition-colors"
          >
            Quiz
          </Link>
          <Link
            to="/student/flashcards"
            className="flex-1 rounded-lg border border-border px-3 py-2 text-sm font-medium text-center text-foreground hover:bg-muted transition-colors"
          >
            Flashcards
          </Link>
          <Link
            to="/student/review"
            className="flex-1 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-center text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Ôn tập AI
          </Link>
        </div>
      </div>
    </div>
  );
}
