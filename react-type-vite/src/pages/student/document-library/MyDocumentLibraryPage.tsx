import { useState, useEffect, useCallback, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  Archive,
  BookOpen,
  Layers,
  Brain,
  Clock,
  Eye,
  Trash2,
  Search,
  Sparkles,
  Tag,
  TrendingUp,
  Wand2,
  ChevronRight,
} from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

import type { DocumentSet } from "@/types/document-library.types";
import documentLibraryApi from "@/services/api/user/documentLibraryApi";
import Header from "@/components/student/home/Header";
import { useAuth } from "@/context/auth-context/useAuth";
import { createRoute } from "@/constants/routes";

type TabValue = "all" | "flashcard" | "quiz";

interface TabDefinition {
  value: TabValue;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  activeClass: string;
}

const TAB_DEFS: TabDefinition[] = [
  {
    value: "all",
    label: "Tất cả",
    icon: BookOpen,
    activeClass: "bg-primary text-primary-foreground shadow-sm",
  },
  {
    value: "flashcard",
    label: "Flashcards",
    icon: Layers,
    activeClass:
      "bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-sm",
  },
  {
    value: "quiz",
    label: "Quizzes",
    icon: Brain,
    activeClass:
      "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-sm",
  },
];

export default function MyDocumentLibraryPage() {
  const { toast } = useToast();
  const { user } = useAuth();

  const [tab, setTab] = useState<TabValue>("all");
  const [sets, setSets] = useState<DocumentSet[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [deleting, setDeleting] = useState<string | null>(null);

  const loadDocumentSets = useCallback(async () => {
    if (!user?.id) {
      setSets([]);
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const data = await documentLibraryApi.getAllDocumentSets(user.id);
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
  }, [toast, user?.id]);

  useEffect(() => {
    loadDocumentSets();
  }, [loadDocumentSets]);

  const handleDelete = async (set: DocumentSet) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa "${set.name}"?`)) return;

    try {
      setDeleting(set.id);
      await documentLibraryApi.deleteDocumentSet(set.id, set.type);
      setSets((prev) => prev.filter((s) => s.id !== set.id));
      toast({
        title: "Đã xóa",
        description: `Đã xóa "${set.name}" khỏi kho.`,
      });
    } catch (error) {
      console.error("Failed to delete set:", error);
      toast({
        title: "Lỗi",
        description: "Không thể xóa bộ. Vui lòng thử lại.",
        variant: "destructive",
      });
    } finally {
      setDeleting(null);
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

  const flashcardCount = useMemo(
    () => sets.filter((s) => s.type === "flashcard").length,
    [sets],
  );
  const quizCount = useMemo(
    () => sets.filter((s) => s.type === "quiz").length,
    [sets],
  );
  const totalItems = useMemo(
    () => sets.reduce((sum, s) => sum + (s.count || 0), 0),
    [sets],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return sets.filter((set) => {
      if (tab !== "all" && set.type !== tab) return false;
      if (!q) return true;
      if (set.name.toLowerCase().includes(q)) return true;
      return set.tags?.some((t) => t.toLowerCase().includes(q));
    });
  }, [sets, tab, search]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="pt-16 lg:pt-20 flex items-center justify-center min-h-[calc(100vh-4rem)]">
          <div className="text-center">
            <div className="h-12 w-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Đang tải kho tài liệu...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground homepage-links">
      <Header />

      <main className="pt-16 lg:pt-24 mx-auto max-w-6xl px-4 py-8 pb-24 md:pb-8 space-y-8">
        {/* Hero Banner */}
        <section className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-primary/10 via-purple-500/10 to-blue-500/10 p-6 md:p-8">
          <div className="absolute inset-0 pointer-events-none opacity-30">
            <div className="absolute -top-12 -right-12 h-48 w-48 rounded-full bg-primary/30 blur-3xl" />
            <div className="absolute -bottom-12 -left-12 h-48 w-48 rounded-full bg-purple-500/30 blur-3xl" />
          </div>
          <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 rounded-full bg-background/70 backdrop-blur px-3 py-1 text-xs font-medium text-primary">
                <Sparkles className="h-3.5 w-3.5" />
                Kho tài liệu AI của bạn
              </div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
                Học mọi lúc, ôn mọi nơi
              </h1>
              <p className="text-sm text-muted-foreground max-w-lg">
                Tất cả flashcards và quizzes bạn đã tạo cùng AI đều được giữ lại
                tại đây — sẵn sàng cho lần ôn tập kế tiếp.
              </p>
            </div>
            <Link
              to="/student/review"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-lg hover:bg-primary/90 transition-all hover:shadow-xl hover:-translate-y-0.5"
            >
              <Wand2 className="h-4 w-4" />
              Tạo bộ mới với AI
            </Link>
          </div>
        </section>

        {/* Stats Cards */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          <StatCard
            label="Tổng bộ đã lưu"
            value={sets.length}
            icon={<BookOpen className="h-5 w-5" />}
            tone="primary"
          />
          <StatCard
            label="Bộ Flashcards"
            value={flashcardCount}
            icon={<Layers className="h-5 w-5" />}
            tone="blue"
          />
          <StatCard
            label="Bộ Quizzes"
            value={quizCount}
            icon={<Brain className="h-5 w-5" />}
            tone="purple"
          />
          <StatCard
            label="Tổng câu / thẻ"
            value={totalItems}
            icon={<TrendingUp className="h-5 w-5" />}
            tone="emerald"
          />
        </section>

        {/* Search + Tabs + List */}
        <section>
          <Card className="border-2">
            <CardContent className="p-4 md:p-6 space-y-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Tìm theo tên hoặc tag..."
                  className="pl-9 h-11"
                />
              </div>

              {/* Filter Tabs — segmented control */}
              <div
                role="tablist"
                aria-label="Lọc theo loại"
                className="inline-flex w-full md:w-auto rounded-xl border border-border bg-muted/60 p-1 gap-1 overflow-x-auto"
              >
                {TAB_DEFS.map(({ value, label, icon: Icon, activeClass }) => {
                  const count =
                    value === "all"
                      ? sets.length
                      : value === "flashcard"
                        ? flashcardCount
                        : quizCount;
                  const isActive = tab === value;
                  return (
                    <button
                      key={value}
                      role="tab"
                      aria-selected={isActive}
                      onClick={() => setTab(value)}
                      className={`group relative flex-1 md:flex-none inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg px-3.5 py-2 text-sm font-medium transition-all duration-200 ${
                        isActive
                          ? activeClass
                          : "text-muted-foreground hover:text-foreground hover:bg-background/60"
                      }`}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      <span>{label}</span>
                      <span
                        className={`inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full px-1.5 text-[11px] font-semibold tabular-nums transition-colors ${
                          isActive
                            ? "bg-white/25 text-white"
                            : "bg-background text-foreground"
                        }`}
                      >
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* List */}
              <div className="space-y-3 pt-1">
                {filtered.length === 0 ? (
                  <EmptyState
                    hasSearch={!!search.trim()}
                    isEmptyOverall={sets.length === 0}
                  />
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {filtered.map((set) => (
                      <SetCard
                        key={set.id}
                        set={set}
                        formatDate={formatDate}
                        isDeleting={deleting === set.id}
                        onDelete={() => handleDelete(set)}
                      />
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </section>
      </main>

      {/* Mobile Navigation */}
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

// ---------- Sub-components ----------

interface StatCardProps {
  label: string;
  value: number;
  icon: React.ReactNode;
  tone: "primary" | "blue" | "purple" | "emerald";
}

const TONE_STYLES: Record<StatCardProps["tone"], string> = {
  primary: "bg-primary/10 text-primary",
  blue: "bg-blue-500/10 text-blue-500",
  purple: "bg-purple-500/10 text-purple-500",
  emerald: "bg-emerald-500/10 text-emerald-500",
};

function StatCard({ label, value, icon, tone }: StatCardProps) {
  return (
    <Card className="border-2 hover:border-primary/50 transition-all hover:-translate-y-0.5 hover:shadow-md">
      <CardContent className="p-4 md:p-5">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="text-2xl md:text-3xl font-bold text-foreground mb-0.5 tabular-nums">
              {value}
            </p>
            <p className="text-xs md:text-sm text-muted-foreground truncate">
              {label}
            </p>
          </div>
          <div
            className={`h-10 w-10 md:h-11 md:w-11 rounded-xl flex items-center justify-center shrink-0 ${TONE_STYLES[tone]}`}
          >
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface SetCardProps {
  set: DocumentSet;
  formatDate: (dateString: string) => string;
  isDeleting: boolean;
  onDelete: () => void;
}

function SetCard({ set, formatDate, isDeleting, onDelete }: SetCardProps) {
  const isFlashcard = set.type === "flashcard";
  const accent = isFlashcard
    ? "from-blue-500/20 to-cyan-500/10 text-blue-500"
    : "from-purple-500/20 to-pink-500/10 text-purple-500";
  const ringHover = isFlashcard
    ? "hover:border-blue-500/40 hover:shadow-blue-500/10"
    : "hover:border-purple-500/40 hover:shadow-purple-500/10";

  return (
    <Card
      className={`group relative overflow-hidden border-2 transition-all hover:-translate-y-0.5 hover:shadow-lg ${ringHover}`}
    >
      <div
        className={`absolute inset-x-0 top-0 h-20 bg-gradient-to-br ${accent} opacity-50 pointer-events-none`}
      />
      <CardContent className="relative p-5 space-y-4">
        <div className="flex items-start gap-3">
          <div
            className={`h-12 w-12 rounded-xl flex items-center justify-center shrink-0 bg-background border border-border shadow-sm ${
              isFlashcard ? "text-blue-500" : "text-purple-500"
            }`}
          >
            {isFlashcard ? (
              <Layers className="h-5 w-5" />
            ) : (
              <Brain className="h-5 w-5" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-foreground line-clamp-2 mb-1">
              {set.name}
            </p>
            <div className="flex items-center gap-2 flex-wrap text-xs text-muted-foreground">
              <Badge
                variant={isFlashcard ? "default" : "secondary"}
                className="text-xs"
              >
                {set.count} {isFlashcard ? "thẻ" : "câu"}
              </Badge>
              <span className="inline-flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {formatDate(set.createdAt)}
              </span>
            </div>
          </div>
        </div>

        {set.tags && set.tags.length > 0 && (
          <div className="flex items-start gap-2">
            <Tag className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
            <div className="flex flex-wrap gap-1.5">
              {set.tags.slice(0, 4).map((t) => (
                <span
                  key={t}
                  className="rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground"
                >
                  {t}
                </span>
              ))}
              {set.tags.length > 4 && (
                <span className="text-[11px] text-muted-foreground">
                  +{set.tags.length - 4}
                </span>
              )}
            </div>
          </div>
        )}

        <div className="flex items-center justify-between pt-2 border-t border-border">
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="h-8 px-2 text-xs hover:bg-primary/10 hover:text-primary"
            title="Mở để ôn tập"
          >
            <Link
              to={
                isFlashcard
                  ? createRoute.documentLibraryFlashcard(set.id)
                  : createRoute.documentLibraryQuiz(set.id)
              }
            >
              <Eye className="h-3.5 w-3.5 mr-1" />
              Mở
              <ChevronRight className="h-3.5 w-3.5 ml-0.5 opacity-60" />
            </Link>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive disabled:opacity-50"
            onClick={onDelete}
            disabled={isDeleting}
            title="Xóa bộ"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

interface EmptyStateProps {
  hasSearch: boolean;
  isEmptyOverall: boolean;
}

function EmptyState({ hasSearch, isEmptyOverall }: EmptyStateProps) {
  if (hasSearch && !isEmptyOverall) {
    return (
      <div className="text-center py-12">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
          <Search className="h-7 w-7 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-2">
          Không tìm thấy kết quả
        </h3>
        <p className="text-sm text-muted-foreground">
          Thử dùng từ khóa khác hoặc bỏ bớt bộ lọc.
        </p>
      </div>
    );
  }

  return (
    <div className="text-center py-12">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
        <Archive className="h-7 w-7 text-primary" />
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-2">
        Chưa có bộ nào được lưu
      </h3>
      <p className="text-sm text-muted-foreground mb-4 max-w-sm mx-auto">
        Hãy tạo bộ flashcard hoặc quiz đầu tiên cùng AI để bắt đầu hành trình
        ôn tập của bạn.
      </p>
      <Link
        to="/student/review"
        className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
      >
        <Wand2 className="h-4 w-4" />
        Tạo bộ mới với AI
      </Link>
    </div>
  );
}
