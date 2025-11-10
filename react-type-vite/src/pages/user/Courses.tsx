import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Filter, Star, Users, Clock, RotateCcw, X } from "lucide-react";
import { Input } from "../../components/ui/input";
import { Button } from "../../components/ui/button";
import { Card } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Checkbox } from "../../components/ui/checkbox";
import { LoadingDots } from "../../components/ui/LoadingDots";
import { ServerPagination } from "../../components/ui/ServerPagination";
import type {
  Filters,
  PublishedCourseResponse,
} from "../../types/course.types";
import type { PaginationRequest } from "../../types/pagination.types";
import { CourseApiService } from "../../services/api/user/courseApi";
import { useServerPagination } from "../../hooks/useServerPagination";
import Header from "@/components/student/home/Header";
import Footer from "@/components/student/home/Footer";

const Course: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(true);
  const [categories, setCategories] = useState<string[]>([]);

  const [filters, setFilters] = useState<Filters>({
    priceRange: [0, 500],
    minRating: 0,
    levels: [],
    practiceTypes: [],
    categories: [],
    duration: [],
  });

  // Fetch function for server pagination - send filter params to server
  const fetchCourses = useCallback(
    async (params: PaginationRequest) => {
      return await CourseApiService.getCoursesWithFilters({
        page: params.page,
        size: params.size,
        searchTerm: searchTerm || undefined,
        ...filters,
      });
    },
    [searchTerm, filters]
  );

  // Use server pagination hook
  const {
    data: courses,
    loading,
    error,
    currentPage,
    pageSize,
    totalElements,
    totalPages,
    startIndex,
    endIndex,
    goToPage,
    changePageSize,
    nextPage,
    previousPage,
    refresh,
    triggerFetch,
    getPageNumbers,
  } = useServerPagination<PublishedCourseResponse>({
    fetchFn: fetchCourses,
    initialPage: 0,
    initialSize: 12,
  });

  // Load categories on component mount
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const fetchedCategories = await CourseApiService.getCategories();
        setCategories(fetchedCategories);
      } catch (error) {
        console.error("Error fetching categories:", error);
        setCategories([]);
      }
    };

    loadCategories();
  }, []);

  // Trigger fetch when filters or searchTerm change
  useEffect(() => {
    triggerFetch();
  }, [filters, searchTerm, triggerFetch]);

  const resetFilters = () => {
    setFilters({
      priceRange: [0, 500],
      minRating: 0,
      levels: [],
      practiceTypes: [],
      categories: [],
      duration: [],
    });
    // Note: searchTerm is not reset here since it's now separate from filters
  };

  const handleSearch = () => {
    // Triggered when user presses Enter in search box
  };

  const clearSearch = () => {
    setSearchTerm("");
  };

  const updateFilter = (
    key: keyof Filters,
    value: number | [number, number]
  ) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const toggleArrayFilter = (key: keyof Filters, value: string) => {
    setFilters((prev) => ({
      ...prev,
      [key]: (prev[key] as string[]).includes(value)
        ? (prev[key] as string[]).filter((item) => item !== value)
        : [...(prev[key] as string[]), value],
    }));
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${
          i < Math.floor(rating)
            ? "text-yellow-400 fill-current"
            : "text-gray-300"
        }`}
      />
    ));
  };

  const CourseCard: React.FC<{ course: PublishedCourseResponse }> = ({
    course,
  }) => (
    <Card className="group hover:shadow-lg transition-all duration-300 overflow-hidden">
      <div className="relative">
        <img
          src={course.thumbnailUrl}
          alt={course.courseName}
          className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
        />
        {course.isHandsOn && (
          <Badge className="absolute top-2 right-2 bg-green-500 text-white">
            Hands-On
          </Badge>
        )}
      </div>

      <div className="p-4">
        <h3 className="font-semibold text-lg mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
          {course.courseName}
        </h3>

        <p className="text-gray-600 text-sm mb-2">{course.authorName}</p>

        <div className="flex items-center gap-2 mb-2">
          <div className="flex items-center">{renderStars(course.rating)}</div>
          <span className="text-sm font-medium">{course.rating}</span>
          <span className="text-gray-500 text-sm">
            ({course.reviewCount} reviews)
          </span>
        </div>

        <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
          <div className="flex items-center gap-1">
            <Users className="w-4 h-4" />
            <span>{course.studentCount.toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            <span>{course.duration}</span>
          </div>
        </div>

        <Badge variant="outline" className="mb-3">
          {course.level}
        </Badge>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold text-blue-600">
              ${course.coursePrice}
            </span>
            {course.coursePrice && (
              <span className="text-sm text-gray-500 line-through">
                ${course.coursePrice}
              </span>
            )}
          </div>
          <Button
            className="bg-blue-600 hover:bg-blue-700 text-white"
            onClick={() => navigate(`/courses/course/${course.id}`)}
          >
            View Details
          </Button>
        </div>
      </div>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <Header />

      <main className="pt-20 px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col lg:flex-row gap-6 border-t pt-6">
          {/* Filters Sidebar */}
          <div
            className={`${
              showFilters ? "block" : "hidden"
            } lg:block w-full lg:w-80 space-y-6`}
          >
            <Card className="p-6 custom-scrollbar max-h-[80vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Filters</h2>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={resetFilters}
                    className="text-blue-600 hover:text-blue-700"
                  >
                    <RotateCcw className="w-4 h-4 mr-1" />
                    Reset
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowFilters(!showFilters)}
                    className="lg:hidden"
                  >
                    <Filter className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Price Range */}
              <div className="space-y-3 mb-6">
                <h3 className="font-medium">Price Range</h3>
                <div className="px-3">
                  <input
                    type="range"
                    min="0"
                    max="500"
                    step="10"
                    value={filters.priceRange[1]}
                    onChange={(e) =>
                      updateFilter("priceRange", [
                        filters.priceRange[0],
                        parseInt(e.target.value),
                      ])
                    }
                    className="w-full"
                  />
                  <div className="flex justify-between text-sm text-gray-600 mt-1">
                    <span>$0</span>
                    <span>${filters.priceRange[1]}</span>
                  </div>
                </div>
              </div>

              {/* Rating */}
              <div className="space-y-3 mb-6">
                <h3 className="font-medium">Minimum Rating</h3>
                <div className="space-y-2">
                  {[4, 3, 2, 1].map((rating) => (
                    <label key={rating} className="flex items-center space-x-2">
                      <Checkbox
                        checked={filters.minRating === rating}
                        onCheckedChange={() =>
                          updateFilter(
                            "minRating",
                            filters.minRating === rating ? 0 : rating
                          )
                        }
                      />
                      <div className="flex items-center">
                        {renderStars(rating)}
                        <span className="ml-2 text-sm">& up</span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Level */}
              <div className="space-y-3 mb-6">
                <h3 className="font-medium">Level</h3>
                <div className="space-y-2">
                  {["Beginner", "Intermediate", "Advanced"].map((level) => (
                    <label key={level} className="flex items-center space-x-2">
                      <Checkbox
                        checked={filters.levels.includes(level)}
                        onCheckedChange={() =>
                          toggleArrayFilter("levels", level)
                        }
                      />
                      <span className="text-sm">{level}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Practice Type */}
              <div className="space-y-3 mb-6">
                <h3 className="font-medium">Practice Type</h3>
                <div className="space-y-2">
                  {["Hands-On only", "Theory only", "All courses"].map(
                    (type) => (
                      <label key={type} className="flex items-center space-x-2">
                        <Checkbox
                          checked={filters.practiceTypes.includes(type)}
                          onCheckedChange={() =>
                            toggleArrayFilter("practiceTypes", type)
                          }
                        />
                        <span className="text-sm">{type}</span>
                      </label>
                    )
                  )}
                </div>
              </div>

              {/* Categories */}
              <div className="space-y-3">
                <h3 className="font-medium">Categories</h3>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {categories.map((category) => (
                    <label
                      key={category}
                      className="flex items-center space-x-2"
                    >
                      <Checkbox
                        checked={filters.categories.includes(category)}
                        onCheckedChange={() =>
                          toggleArrayFilter("categories", category)
                        }
                      />
                      <span className="text-sm">{category}</span>
                    </label>
                  ))}
                </div>
              </div>
            </Card>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {/* Header Controls */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <div className="flex items-center gap-4">
                <h1 className="text-2xl font-bold">All Courses</h1>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowFilters(!showFilters)}
                  className="lg:hidden"
                >
                  <Filter className="w-4 h-4 mr-2" />
                  Filters
                </Button>
              </div>

              {!loading && (
                <div className="text-sm text-gray-600">
                  {totalElements} courses found
                </div>
              )}
            </div>

            {/* Search Bar */}
            <div className="mb-6 flex flex-col gap-2">
              <div className="relative max-w-lg">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  placeholder="Search courses, instructors, categories..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key == "Enter") {
                      handleSearch();
                    }
                  }}
                  className="pl-12 pr-12 py-6 text-base border-2 border-gray-200 rounded-xl transition-all duration-200 shadow-sm"
                />
                {searchTerm && (
                  <button
                    onClick={clearSearch}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors duration-200"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>

              <div className="text-sm text-gray-600">
                Từ khóa tìm kiếm: khi người dùng nhập từ khóa gần đúng
              </div>
            </div>

            {/* Error State */}
            {error && (
              <div className="text-center py-20">
                <div className="text-red-500 mb-4">
                  <span className="text-lg">⚠️</span>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Something went wrong
                </h3>
                <p className="text-gray-600 mb-4">
                  {error.message || "Failed to load courses"}
                </p>
                <Button onClick={refresh} variant="outline">
                  Try again
                </Button>
              </div>
            )}

            {/* Loading State */}
            {loading && (
              <div className="text-center py-20">
                <LoadingDots />
              </div>
            )}

            {/* Empty State */}
            {!loading && !error && courses.length === 0 && (
              <div className="text-center py-20">
                <div className="text-gray-400 mb-4">
                  <Search className="w-16 h-16 mx-auto" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No courses found
                </h3>
                <p className="text-gray-600 mb-4">
                  Try adjusting your search or filter criteria
                </p>
                <Button onClick={resetFilters} variant="outline">
                  Clear all filters
                </Button>
              </div>
            )}

            {/* Course Grid */}
            {!loading && !error && courses.length > 0 && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
                  {courses.map((course, index) => (
                    <div
                      key={course.id}
                      className="animate-fade-in"
                      style={{ animationDelay: `${index * 0.1}s` }}
                    >
                      <CourseCard course={course} />
                    </div>
                  ))}
                </div>

                {/* Server Pagination */}
                <ServerPagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  totalElements={totalElements}
                  startIndex={startIndex}
                  endIndex={endIndex}
                  pageSize={pageSize}
                  onPageChange={goToPage}
                  onPageSizeChange={changePageSize}
                  onNext={nextPage}
                  onPrevious={previousPage}
                  getPageNumbers={getPageNumbers}
                  className="mt-8"
                />
              </>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Course;
