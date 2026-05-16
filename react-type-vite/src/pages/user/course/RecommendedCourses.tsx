import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Star, Users } from "lucide-react";
import { Card } from "@/components/ui/card";
import type { PublishedCourseCardResponse, PublishedCourseResponse } from "@/types/course.types";
import PublishedCourseService from "@/services/api/anonymous/course.api";
import { useAuth } from "@/context/auth-context/useAuth";

interface RecommendedCoursesProps {
    currentCourseId?: string;
    category?: string;
}

const RecommendedCourses: React.FC<RecommendedCoursesProps> = ({ currentCourseId, category }) => {
    const { user } = useAuth();
    const [courses, setCourses] = useState<PublishedCourseCardResponse[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchRecommendations = async () => {
            console.log("RecommendedCourses: Effect triggered", { user: !!user, category, currentCourseId });
            setLoading(true);
            try {
                if (user) {
                    console.log("RecommendedCourses: Fetching for logged-in user");
                    const data = await PublishedCourseService.getRecommendedCourses();
                    // Filter out current course if it appears in recommendations
                    const filteredData = currentCourseId
                        ? data.filter(c => String(c.id) !== String(currentCourseId))
                        : data;
                    setCourses(filteredData);
                } else if (category) {
                    console.log("RecommendedCourses: Fetching for guest with category:", category);
                    // 1. Try fetching related courses by category
                    let data = await PublishedCourseService.searchAndFiltersPublishedCourses(
                        0, 5, undefined, undefined, undefined, undefined, undefined,
                        category, "popular"
                    );

                    console.log("RecommendedCourses: Category search result:", data);

                    // 2. If no related courses found (or only the current one matches), fallback to general popular courses
                    if (!data || !data.content || data.content.length === 0 || (data.content.length === 1 && String(data.content[0].id) === String(currentCourseId))) {
                        console.log("RecommendedCourses: Fallback to popular courses");
                        data = await PublishedCourseService.searchAndFiltersPublishedCourses(
                            0, 5, undefined, undefined, undefined, undefined, undefined,
                            undefined, "popular"
                        );
                        console.log("RecommendedCourses: Popular search result:", data);
                    }

                    if (data && data.content) {
                        const mappedCourses: PublishedCourseCardResponse[] = data.content
                            .filter((c: PublishedCourseResponse) => String(c.id) !== String(currentCourseId))
                            .slice(0, 4) // Limit to 4 courses
                            .map((c: PublishedCourseResponse) => ({
                                id: Number(c.id),
                                courseName: c.courseName,
                                authorName: c.authorName,
                                coursePrice: c.coursePrice,
                                rating: c.rating,
                                reviewCount: c.reviewCount,
                                studentCount: c.studentCount,
                                category: c.category,
                                thumbnailUrl: c.thumbnailUrl,
                                isHandsOn: c.isHandsOn,
                                duration: 0,
                                level: c.level,
                                status: "PUBLISHED"
                            }));
                        setCourses(mappedCourses);
                    }
                } else {
                    console.log("RecommendedCourses: No user and no category provided");
                }
            } catch (error) {
                console.error("Failed to fetch recommendations:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchRecommendations();
    }, [user, category, currentCourseId]);

    if (loading) {
        return <div>Loading recommendations...</div>;
    }

    if (courses.length === 0) {
        return <div>No recommendations found.</div>;
    }

    return (
        <div className="mt-12">
            <h2 className="text-2xl font-bold mb-6">
                {user ? "Khóa học dành cho bạn" : "Các khóa học cùng thể loại"}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {courses.map((course) => (
                    <Link
                        key={course.id}
                        to={`/course/${course.id}`}
                        className="group"
                    >
                        <Card className="h-full border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow">
                            {/* Thumbnail */}
                            <div className="relative aspect-video overflow-hidden bg-gray-100">
                                <img
                                    src={course.thumbnailUrl || "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop&q=60"}
                                    alt={course.courseName}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                />
                                {course.isHandsOn && (
                                    <div className="absolute top-2 right-2 bg-blue-600 text-white text-xs px-2 py-1 rounded-full font-medium">
                                        Thực hành
                                    </div>
                                )}
                            </div>

                            {/* Content */}
                            <div className="p-4 flex flex-col h-[calc(100%-aspect-video)]">
                                <span className="text-xs font-medium text-blue-600 mb-2 block">{course.category}</span>
                                <h3 className="font-bold text-gray-900 line-clamp-2 mb-2 group-hover:text-purple-600 transition-colors">
                                    {course.courseName}
                                </h3>

                                <p className="text-sm text-gray-600 mb-2 truncate">
                                    {course.authorName}
                                </p>

                                {/* Rating and Students */}
                                <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                                    <span className="font-bold text-yellow-500 flex items-center gap-1">
                                        {course.rating ? course.rating.toFixed(1) : "0.0"}
                                        <Star className="w-4 h-4 fill-current" />
                                    </span>
                                    <span>({course.reviewCount?.toLocaleString() || 0})</span>
                                </div>

                                <div className="flex items-center justify-between mt-auto">
                                    <div className="flex items-center gap-1 text-xs text-gray-500">
                                        <Users className="w-3 h-3" />
                                        <span>{course.studentCount?.toLocaleString() || 0} students</span>
                                    </div>
                                    <div className="font-bold text-gray-900">
                                        {course.coursePrice === "Free" ? "Miễn phí" : course.coursePrice}
                                    </div>
                                </div>
                            </div>
                        </Card>
                    </Link>
                ))}
            </div>
        </div>
    );
};

export default RecommendedCourses;
