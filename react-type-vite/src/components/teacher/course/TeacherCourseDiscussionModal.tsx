import React, { useState, useEffect, useRef } from "react";
import { X, BookOpen, ClipboardCheck, FileText, MessageSquare, Loader2 } from "lucide-react";
import CourseDiscussionSection from "@/components/user/course/CourseDiscussionSection";
import { getSectionsByCourseId } from "@/services/api/user/sectionApi";
import type { SectionResponse } from "@/services/api/response/sectionResponse";
import type { User as UserType } from "@/context/auth-context/types";
import { toast } from "react-toastify";
import { getCourseBatchQuizUnreadCounts } from "@/services/api/courseQuizDiscussionApi";
import { getCourseBatchAssignmentUnreadCounts } from "@/services/api/courseAssignmentDiscussionApi";
import { getCourseBatchLessonUnreadCounts } from "@/services/api/courseLessonDiscussionApi";
import SockJS from "sockjs-client";
import { Client } from "@stomp/stompjs";

interface TeacherCourseDiscussionModalProps {
  courseId: number;
  publishedCourseId: number;
  courseName: string;
  user: UserType | null;
  onClose: () => void;
}

type ContentItem = {
  id: number;
  type: "lesson" | "quiz" | "assignment";
  title: string;
  orderIndex: number;
  sectionId: number;
  sectionTitle: string;
};

const TeacherCourseDiscussionModal: React.FC<TeacherCourseDiscussionModalProps> = ({
  publishedCourseId,
  courseName,
  user,
  onClose,
}) => {
  const [sections, setSections] = useState<SectionResponse[]>([]);
  const [contentItems, setContentItems] = useState<ContentItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<ContentItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedSections, setExpandedSections] = useState<Set<number>>(new Set());
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});

  const stompClientRef = useRef<Client | null>(null);

  useEffect(() => {
    loadCourseContent();

    // Cleanup WebSocket on unmount
    return () => {
      if (stompClientRef.current) {
        stompClientRef.current.deactivate();
      }
    };
  }, [publishedCourseId]);

  const loadCourseContent = async () => {
    try {
      setLoading(true);
      const sectionsData = await getSectionsByCourseId(publishedCourseId);
      sectionsData.sort((a, b) => a.orderIndex - b.orderIndex);
      setSections(sectionsData);

      // Flatten all content items
      const items: ContentItem[] = [];

      sectionsData.forEach((section) => {
        // Add lessons
        if (section.lessons) {
          Array.from(section.lessons).forEach((lesson) => {
            items.push({
              id: lesson.id,
              type: "lesson",
              title: lesson.title,
              orderIndex: lesson.numberItem,
              sectionId: section.id,
              sectionTitle: section.title,
            });
          });
        }

        // Add quizzes
        if (section.quizs) {
          Array.from(section.quizs).forEach((quiz) => {
            items.push({
              id: quiz.id,
              type: "quiz",
              title: quiz.title,
              orderIndex: quiz.numberItem,
              sectionId: section.id,
              sectionTitle: section.title,
            });
          });
        }

        // Add assignments
        if (section.assignments) {
          Array.from(section.assignments).forEach((assignment) => {
            items.push({
              id: assignment.id,
              type: "assignment",
              title: assignment.title,
              orderIndex: assignment.numberItem,
              sectionId: section.id,
              sectionTitle: section.title,
            });
          });
        }
      });

      // Sort by section order and item order
      items.sort((a, b) => {
        const sectionA = sectionsData.find(s => s.id === a.sectionId);
        const sectionB = sectionsData.find(s => s.id === b.sectionId);
        if (sectionA && sectionB && sectionA.orderIndex !== sectionB.orderIndex) {
          return sectionA.orderIndex - sectionB.orderIndex;
        }
        return a.orderIndex - b.orderIndex;
      });

      setContentItems(items);

      // Expand first section by default
      if (sectionsData.length > 0) {
        setExpandedSections(new Set([sectionsData[0].id]));
      }

      // Fetch unread counts for all items
      await fetchUnreadCounts(items);

      // Setup WebSocket to listen for new messages
      setupWebSocket(items);
    } catch (error) {
      console.error("Error loading course content:", error);
      toast.error("Không thể tải nội dung khóa học");
    } finally {
      setLoading(false);
    }
  };

  const fetchUnreadCounts = async (items: ContentItem[]) => {
    try {
      // Group items by type
      const quizIds = items.filter(item => item.type === 'quiz').map(item => item.id);
      const assignmentIds = items.filter(item => item.type === 'assignment').map(item => item.id);
      const lessonIds = items.filter(item => item.type === 'lesson').map(item => item.id);

      console.log("📊 Fetching unread counts for:", {
        publishedCourseId,
        quizIds,
        assignmentIds,
        lessonIds
      });

      // Fetch counts in parallel
      const [quizCounts, assignmentCounts, lessonCounts] = await Promise.all([
        quizIds.length > 0 ? getCourseBatchQuizUnreadCounts(publishedCourseId, quizIds) : Promise.resolve({}),
        assignmentIds.length > 0 ? getCourseBatchAssignmentUnreadCounts(publishedCourseId, assignmentIds) : Promise.resolve({}),
        lessonIds.length > 0 ? getCourseBatchLessonUnreadCounts(publishedCourseId, lessonIds) : Promise.resolve({})
      ]);

      console.log("📥 Received unread counts:", { quizCounts, assignmentCounts, lessonCounts });

      // Merge all counts with type prefix
      const allCounts: Record<string, number> = {};

      Object.entries(quizCounts as Record<string, number>).forEach(([id, count]) => {
        allCounts[`quiz-${id}`] = count;
      });

      Object.entries(assignmentCounts as Record<string, number>).forEach(([id, count]) => {
        allCounts[`assignment-${id}`] = count;
      });

      Object.entries(lessonCounts as Record<string, number>).forEach(([id, count]) => {
        allCounts[`lesson-${id}`] = count;
      });

      console.log("✅ Merged unread counts:", allCounts);
      setUnreadCounts(allCounts);
    } catch (error) {
      console.error("❌ Error fetching unread counts:", error);
    }
  };

  // Setup WebSocket to listen for new messages and update unread counts
  const setupWebSocket = (items: ContentItem[]) => {
    const socket = new SockJS("http://localhost:8090/ws");
    const client = new Client({
      webSocketFactory: () => socket as any,
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
    });

    client.onConnect = () => {
      console.log("🔗 Teacher modal WebSocket connected for unread count updates");

      // Subscribe to all quiz discussions
      items.filter(item => item.type === 'quiz').forEach(item => {
        client.subscribe(
          `/topic/course/quiz/${publishedCourseId}/${item.id}/discussion`,
          (message) => {
            const data = JSON.parse(message.body);
            if (data.type === "NEW_MESSAGE") {
              // Increment unread count for this quiz
              setUnreadCounts(prev => ({
                ...prev,
                [`quiz-${item.id}`]: (prev[`quiz-${item.id}`] || 0) + 1
              }));
            }
          }
        );
      });

      // Subscribe to all assignment discussions
      items.filter(item => item.type === 'assignment').forEach(item => {
        client.subscribe(
          `/topic/course/assignment/${publishedCourseId}/${item.id}/discussion`,
          (message) => {
            const data = JSON.parse(message.body);
            if (data.type === "NEW_MESSAGE") {
              setUnreadCounts(prev => ({
                ...prev,
                [`assignment-${item.id}`]: (prev[`assignment-${item.id}`] || 0) + 1
              }));
            }
          }
        );
      });

      // Subscribe to all lesson discussions
      items.filter(item => item.type === 'lesson').forEach(item => {
        client.subscribe(
          `/topic/course/lesson/${publishedCourseId}/${item.id}/discussion`,
          (message) => {
            const data = JSON.parse(message.body);
            if (data.type === "NEW_MESSAGE") {
              setUnreadCounts(prev => ({
                ...prev,
                [`lesson-${item.id}`]: (prev[`lesson-${item.id}`] || 0) + 1
              }));
            }
          }
        );
      });
    };

    client.onStompError = (frame) => {
      console.error("🔴 Teacher modal WebSocket error:", frame);
    };

    client.activate();
    stompClientRef.current = client;
  };

  const toggleSection = (sectionId: number) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId);
    } else {
      newExpanded.add(sectionId);
    }
    setExpandedSections(newExpanded);
  };

  const getItemIcon = (type: string) => {
    switch (type) {
      case "lesson":
        return <BookOpen className="w-4 h-4 text-blue-600" />;
      case "quiz":
        return <ClipboardCheck className="w-4 h-4 text-purple-600" />;
      case "assignment":
        return <FileText className="w-4 h-4 text-green-600" />;
      default:
        return <BookOpen className="w-4 h-4" />;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-7xl h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <MessageSquare className="w-6 h-6 text-blue-600" />
              Thảo luận khóa học
            </h2>
            <p className="text-sm text-gray-600 mt-1">{courseName}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="Đóng"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : (
          <div className="flex-1 flex overflow-hidden">
            {/* Sidebar - Content List */}
            <div className="w-80 border-r overflow-y-auto">
              <div className="p-4">
                <h3 className="font-semibold text-gray-900 mb-4">Nội dung khóa học</h3>

                {sections.map((section) => {
                  const sectionItems = contentItems.filter(item => item.sectionId === section.id);
                  const isExpanded = expandedSections.has(section.id);

                  return (
                    <div key={section.id} className="mb-2">
                      {/* Section Header */}
                      <button
                        onClick={() => toggleSection(section.id)}
                        className="w-full flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg text-left transition-colors"
                      >
                        <span className="font-medium text-sm text-gray-900">{section.title}</span>
                        <span className="text-xs text-gray-500">{sectionItems.length}</span>
                      </button>

                      {/* Section Items */}
                      {isExpanded && (
                        <div className="ml-2 mt-1 space-y-1">
                          {sectionItems.map((item) => {
                            const countKey = `${item.type}-${item.id}`;
                            const unreadCount = unreadCounts[countKey] || 0;

                            // Debug log
                            if (unreadCount > 0) {
                              console.log(`🔔 Badge for ${countKey}: ${unreadCount}`);
                            }

                            return (
                              <button
                                key={`${item.type}-${item.id}`}
                                onClick={() => setSelectedItem(item)}
                                className={`w-full flex items-center gap-2 p-2 rounded text-left transition-colors ${selectedItem?.id === item.id && selectedItem?.type === item.type
                                  ? "bg-blue-50 border border-blue-200"
                                  : "hover:bg-gray-50"
                                  }`}
                              >
                                {getItemIcon(item.type)}
                                <span className="text-sm text-gray-700 flex-1">{item.title}</span>
                                {unreadCount > 0 && (
                                  <span className="inline-flex items-center justify-center px-2 py-0.5 text-xs font-bold leading-none text-white bg-red-600 rounded-full">
                                    {unreadCount}
                                  </span>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Main Content - Discussion */}
            <div className="flex-1 overflow-y-auto">
              {selectedItem ? (
                <div className="p-6">
                  <div className="mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      {getItemIcon(selectedItem.type)}
                      <h3 className="text-xl font-semibold text-gray-900">{selectedItem.title}</h3>
                    </div>
                    <p className="text-sm text-gray-600">{selectedItem.sectionTitle}</p>
                  </div>

                  <CourseDiscussionSection
                    key={`${selectedItem.type}-${selectedItem.id}`}
                    itemType={selectedItem.type}
                    itemId={selectedItem.id}
                    itemTitle={selectedItem.title}
                    publishedCourseId={publishedCourseId}
                    user={user}
                  />
                </div>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      Chọn nội dung để xem thảo luận
                    </h3>
                    <p className="text-gray-600">
                      Chọn một bài học, bài kiểm tra hoặc bài tập từ danh sách bên trái
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TeacherCourseDiscussionModal;
