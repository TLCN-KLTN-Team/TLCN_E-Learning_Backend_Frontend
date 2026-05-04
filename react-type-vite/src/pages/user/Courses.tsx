import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Search,
  Filter,
  Star,
  StarHalf,
  RotateCcw,
  X,
  ChevronDown,
  Clock,
  BookOpen,
} from "lucide-react";
import { Input } from "../../components/ui/input";
import { Button } from "../../components/ui/button";
import { Card } from "../../components/ui/card";
import { Checkbox } from "../../components/ui/checkbox";
import { LoadingDots } from "../../components/ui/LoadingDots";
import { Pagination } from "../../components/ui/Pagination";
import type {
  CompletionSuggestionResponse,
  Filters,
  PublishedCourseResponse,
  CourseType,
} from "../../types/course.types";
import Header from "@/components/student/home/Header";
import Footer from "@/components/student/home/Footer";
import { toast } from "react-toastify";

import PublishedCourseService from "@/services/api/anonymous/course.api";
import { CourseApiService } from "@/services/api/user/courseApi";

const Course: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [showFilters, setShowFilters] = useState(true);

  // Auto-completion state
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const searchBoxRef = useRef<HTMLDivElement>(null);
  const isInitialMount = useRef(true);

  // Get initial values from URL params
  const getInitialSearchTerm = () => searchParams.get("keyword") || "";
  const getInitialFilters = (): Filters => ({
    minRating: parseInt(searchParams.get("minRating") || "0"),
    category: searchParams.get("category") || "",
    levels: searchParams.getAll("levels"),
    practiceTypes: searchParams.getAll("practiceTypes"),
    fees: searchParams.getAll("fees"),
    durations: [],
    sort: "",
  });

  const [searchTerm, setSearchTerm] = useState(getInitialSearchTerm);
  const [filters, setFilters] = useState<Filters>(getInitialFilters);

  // Course types state
  const [courseTypes, setCourseTypes] = useState<CourseType[]>([]);

  // Pagination and data state
  const [courses, setCourses] = useState<PublishedCourseResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [currentPage, setCurrentPage] = useState(
    parseInt(searchParams.get("page") || "0"),
  );
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const pageSize = 12;

  // Update URL params whenever filters, search term, or page changes
  const updateUrlParams = (
    newSearchTerm: string,
    newFilters: Filters,
    page: number,
  ) => {
    const params = new URLSearchParams();

    if (newSearchTerm.trim()) {
      params.set("keyword", newSearchTerm.trim());
    }
    if (page > 0) {
      params.set("page", page.toString());
    }
    if (newFilters.minRating > 0) {
      params.set("minRating", newFilters.minRating.toString());
    }
    newFilters.levels.forEach((level) => params.append("levels", level));
    if (newFilters.category) {
      params.set("category", newFilters.category);
    }

    newFilters.fees.forEach((fee) => params.append("fees", fee));

    newFilters.practiceTypes.forEach((type) => params.append("practiceTypes", type));

    if (newFilters.sort) {
      params.set("sort", newFilters.sort);
    }

    setSearchParams(params, { replace: true });
  };

  // Fetch courses from backend with search and filters
  const fetchCourses = async () => {
    setLoading(true);
    setError(null);

    try {
      const response =
        await PublishedCourseService.searchAndFiltersPublishedCourses(
          currentPage,
          pageSize,
          searchTerm.trim(),
          filters.minRating > 0 ? filters.minRating : undefined,
          filters.practiceTypes.length > 0 ? filters.practiceTypes : undefined,
          filters.fees.length > 0 ? filters.fees : undefined,
          filters.levels.length > 0 ? filters.levels : undefined,
          filters.category || undefined,
          filters.sort || undefined,
        );
      console.log("Filters applied:", filters);
      console.log("Fetched courses with filters:", response);

      setCourses(response?.content || []);
      setTotalPages(response?.totalPages || 0);
      setTotalElements(response?.totalElements || 0);
    } catch (err) {
      setError(err as Error);
      setCourses([]);
      toast.error("Không thể tải danh sách khóa học. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  // Fetch courses when URL params change (on mount and when filters/search/page change)
  useEffect(() => {
    fetchCourses();
    // Mark as not initial mount after first fetch
    if (isInitialMount.current) {
      isInitialMount.current = false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // Load course types on component mount
  useEffect(() => {
    const loadCourseTypes = async () => {
      try {
        const fetchedCourseTypes = await CourseApiService.getCourseTypes();
        setCourseTypes(fetchedCourseTypes);
        console.log("Fetched course types:", fetchedCourseTypes);
      } catch (error) {
        console.error("Error fetching course types:", error);
        setCourseTypes([]);
      }
    };

    loadCourseTypes();
  }, []);

  // Fetch auto-completion suggestions
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (!searchTerm || searchTerm.trim().length < 2) {
        setSuggestions([]);
        setShowSuggestions(false);
        return;
      } else {
        setLoadingSuggestions(true);
        try {
          const response: CompletionSuggestionResponse =
            await PublishedCourseService.autoCompletion(searchTerm, 5);
          setSuggestions(response.titleSuggestions || []);
          setShowSuggestions(true);
        } catch (error) {
          console.error("Error fetching suggestions:", error);
          setSuggestions([]);
        } finally {
          setLoadingSuggestions(false);
        }
      }
    };

    fetchSuggestions();
  }, [searchTerm]);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchBoxRef.current &&
        !searchBoxRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const resetFilters = () => {
    const newFilters: Filters = {
      minRating: 0,
      levels: [],
      practiceTypes: [],
      category: "",
      fees: [],
      durations: [],
      sort: "",
    };
    setFilters(newFilters);
    setSearchTerm("");
    updateUrlParams("", newFilters, 0);
    setCurrentPage(0);
  };

  const handleSearch = () => {
    setShowSuggestions(false);
    updateUrlParams(searchTerm, filters, 0);
    setCurrentPage(0);
  };

  const handleSuggestionClick = (suggestion: string) => {
    setSearchTerm(suggestion);
    setShowSuggestions(false);
    updateUrlParams(suggestion, filters, 0);
    setCurrentPage(0);
  };

  const clearSearch = () => {
    if (searchTerm.trim()) {
      setSearchTerm("");
      setSuggestions([]);
      setShowSuggestions(false);
      updateUrlParams("", filters, 0);
      setCurrentPage(0);
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    updateUrlParams(searchTerm, filters, page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const updateFilter = (
    key: keyof Filters,
    value: number | [number, number],
  ) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    updateUrlParams(searchTerm, newFilters, 0);
    setCurrentPage(0);
  };

  const toggleArrayFilter = (key: keyof Filters, value: string) => {
    const newFilters = {
      ...filters,
      [key]: (filters[key] as string[]).includes(value)
        ? (filters[key] as string[]).filter((item) => item !== value)
        : [...(filters[key] as string[]), value],
    };
    setFilters(newFilters);
    updateUrlParams(searchTerm, newFilters, 0);
    setCurrentPage(0);
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => {
      const startIndex = i + 1;

      if (rating >= startIndex) {
        return (
          <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
        );
      } else if (rating >= startIndex - 0.5) {
        return (
          <StarHalf key={i} className="w-4 h-4 text-yellow-400 fill-current" />
        );
      } else {
        return <Star key={i} className="w-4 h-4 text-gray-300" />;
      }
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <Header />

      <main className="pt-20 px-4 sm:px-6 lg:px-8 py-6">
        <div className="border-t pt-6">
          {/* Search Bar - Full Width */}
          <div className="mb-6">
            <div className="relative w-full" ref={searchBoxRef}>
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 z-10" />
              <Input
                placeholder="Tìm kiếm khóa học, giảng viên, danh mục..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleSearch();
                  }
                }}
                onFocus={() => {
                  if (suggestions.length > 0) {
                    setShowSuggestions(true);
                  }
                }}
                className="pl-12 pr-12 py-6 text-base border-2 border-gray-200 rounded-xl transition-all duration-200 focus:border-blue-500 hover:border-gray-300 w-full"
              />
              {searchTerm && (
                <button
                  onClick={clearSearch}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors z-10"
                  aria-label="Clear search"
                >
                  <X className="w-5 h-5" />
                </button>
              )}

              {/* Auto-completion Suggestions Dropdown */}
              {showSuggestions &&
                (suggestions.length > 0 || loadingSuggestions) && (
                  <div className="absolute z-50 w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg max-h-80 overflow-y-auto">
                    {loadingSuggestions ? (
                      <div className="p-4 text-center text-gray-500">
                        <LoadingDots />
                      </div>
                    ) : (
                      <ul className="py-2">
                        {suggestions.map((suggestion, index) => (
                          <li
                            key={index}
                            onClick={() => handleSuggestionClick(suggestion)}
                            className="px-4 py-3 hover:bg-gray-100 cursor-pointer transition-colors flex items-center gap-3"
                          >
                            <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
                            <span className="text-sm text-gray-700">
                              {suggestion}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
            </div>

            <div className="text-xs text-gray-500 mt-2">
              Gợi ý tự động sẽ xuất hiện khi bạn nhập từ khóa tìm kiếm
            </div>
          </div>

          {/* Filter Controls - Full Width */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div className="flex items-center gap-3">
              {/* Filter Toggle Button */}
              <Button
                variant="outline"
                size="default"
                onClick={() => setShowFilters(!showFilters)}
                className="border-gray-300 hover:bg-gray-50"
              >
                {showFilters ? (
                  <Filter className="w-4 h-4 mr-2 text-blue-500" />
                ) : (
                  <Filter className="w-4 h-4 mr-2" />
                )}
                Bộ lọc
              </Button>

              {/* Sort Dropdown */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-700 whitespace-nowrap">
                  Sắp xếp theo:
                </span>
                <div className="relative inline-block">
                  <select
                    className="appearance-none bg-white border border-gray-300 rounded-md pl-3 pr-10 py-2 text-sm text-gray-700 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer"
                    value={filters.sort}
                    onChange={(e) => {
                      const newFilters = {
                        ...filters,
                        sort: e.target.value,
                      };
                      setFilters(newFilters);
                      updateUrlParams(searchTerm, newFilters, 0);
                      setCurrentPage(0);
                    }}
                  >
                    <option value="popular">Phổ biến nhất</option>
                    <option value="newest">Mới nhất</option>
                    <option value="rating">Đánh giá cao</option>
                    <option value="price_asc">Giá thấp đến cao</option>
                    <option value="price_desc">Giá cao đến thấp</option>
                  </select>
                  <ChevronDown className="w-4 h-4 text-gray-500 absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Results Count */}
            {!loading && totalElements > 0 && (
              <div className="text-sm text-gray-700 font-medium">
                {totalElements.toLocaleString("vi-VN")} kết quả
              </div>
            )}
          </div>

          {/* Main Content Area with Filters and Course List */}
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Filters Sidebar */}
            <div
              className={`${
                showFilters ? "block" : "hidden"
              } w-full lg:w-64 space-y-6`}
            >
              <Card className="p-0 custom-scrollbar max-h-[80vh] overflow-y-auto divide-y divide-gray-200">
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4">
                  <h2 className="text-lg font-semibold">Bộ lọc</h2>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={resetFilters}
                      className="text-blue-600 hover:text-blue-700"
                    >
                      <RotateCcw className="w-4 h-4 mr-1" />
                      Đặt lại
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

                {/* Đánh giá */}
                <div className="px-5 pb-4">
                  <h3 className="font-medium mb-3">Đánh giá</h3>
                  <div className="space-y-3">
                    <label className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="radio"
                        name="rating"
                        checked={filters.minRating === 0}
                        onChange={() => updateFilter("minRating", 0)}
                        className="w-4 h-4 text-blue-600"
                      />
                      <span className="text-sm">Tất cả</span>
                    </label>
                    {[4.5, 4.0, 3.5, 3.0].map((rating) => (
                      <label
                        key={rating}
                        className="flex items-center space-x-3 cursor-pointer"
                      >
                        <input
                          type="radio"
                          name="rating"
                          checked={filters.minRating === rating}
                          onChange={() => updateFilter("minRating", rating)}
                          className="w-4 h-4 text-blue-600"
                        />
                        <div className="flex items-center">
                          {renderStars(rating)}
                          <span className="ml-2 text-sm">{rating} & up</span>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Thời lượng */}
                <div className="px-5 pb-4">
                  <h3 className="font-medium mb-3">Thời lượng</h3>
                  <div className="space-y-3">
                    {[
                      {label: "0-1 giờ", value: "0-1"},
                      {label: "1-3 giờ", value: "1-3"},
                      {label: "3-6 giờ", value: "3-6"},
                      {label: "6-10 giờ", value: "6-10"},
                      {label: "Hơn 10 giờ", value: "10+"},
                    ].map((option) => (
                      <label key={option.value} className="flex items-center space-x-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={filters.durations.includes(option.value)}
                          onChange={() => toggleArrayFilter("durations", option.value)}
                          className="w-4 h-4 text-blue-600"
                        />
                        <div className="flex items-center">
                          <Clock className="w-4 h-4 text-gray-500 mr-2" />
                          <span className="text-sm">{option.label}</span>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Thể loại */}
                {courseTypes.length > 0 && (
                  <div className="px-5 pb-4">
                    <h3 className="font-medium mb-3">Thể loại</h3>
                    <div className="space-y-3">
                      <label className="flex items-center space-x-3 cursor-pointer">
                        <input
                          type="radio"
                          name="courseType"
                          checked={!filters.category}
                          onChange={() => {
                            const newFilters = {
                              ...filters,
                              category: "",
                            };
                            setFilters(newFilters);
                            updateUrlParams(searchTerm, newFilters, 0);
                            setCurrentPage(0);
                          }}
                          className="w-4 h-4 text-blue-600"
                        />
                        <span className="text-sm">Tất cả thể loại</span>
                      </label>
                      {courseTypes.map((courseType) => (
                        <label
                          key={courseType.id}
                          className="flex items-center space-x-3 cursor-pointer"
                        >
                          <input
                            type="radio"
                            name="courseType"
                            checked={
                              filters.category === courseType.courseTypeName
                            }
                            onChange={() => {
                              const newFilters = {
                                ...filters,
                                category: courseType.courseTypeName,
                              };
                              setFilters(newFilters);
                              updateUrlParams(searchTerm, newFilters, 0);
                              setCurrentPage(0);
                            }}
                            className="w-4 h-4 text-blue-600"
                          />
                          <span className="text-sm">
                            {courseType.courseTypeName}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {/* Cấp độ */}
                {/* <div className="px-5 pb-4">
                  <h3 className="font-medium mb-3">Cấp độ</h3>
                  <div className="space-y-3">
                    {["Cơ bản", "Trung cấp", "Nâng cao", "Tất cả cấp độ"].map(
                      (level) => (
                        <label
                          key={level}
                          className="flex items-center space-x-3 cursor-pointer"
                        >
                          <Checkbox
                            checked={filters.levels.includes(level)}
                            onCheckedChange={() =>
                              toggleArrayFilter("levels", level)
                            }
                          />
                          <span className="text-sm">{level}</span>
                        </label>
                      ),
                    )}
                  </div>
                </div> */}

                {/* Giá */}
                <div className="px-5 pb-4">
                  <h3 className="font-medium mb-3">Giá</h3>
                  <div className="space-y-3">
                    {[{
                      label: "Miễn phí",
                      value: "free",
                    }, {
                      label: "Có phí",
                      value: "paid",
                    }].map((option) => (
                      <label
                        key={option.value}
                        className="flex items-center space-x-3 cursor-pointer"
                      >
                        <Checkbox
                          checked={filters.fees.includes(option.value)}
                          onCheckedChange={() => {
                            toggleArrayFilter("fees", option.value);
                          }}
                        />
                        <span className="text-sm">{option.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Bài tập */}
                <div className="px-5 pb-4">
                  <h3 className="font-medium mb-3">Tài liệu thực hành</h3>
                  <div className="space-y-3">
                    {[
                      { label: "Trắc nghiệm", value: "quiz" },
                      { label: "Bài kiểm tra thực hành", value: "practice-test" },
                      { label: "Bài tập coding", value: "coding" },
                    ].map((option) => (
                      <label
                        key={option.value}
                        className="flex items-center space-x-3 cursor-pointer"
                      >
                        <Checkbox
                          checked={filters.practiceTypes.includes(option.value)}
                          onCheckedChange={() =>
                            toggleArrayFilter("practiceTypes", option.value)
                          }
                        />
                        <span className="text-sm">{option.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </Card>
            </div>

            {/* Main Content */}
            <div className="flex-1">
              {/* Error State */}
              {error && (
                <div className="text-center py-20">
                  <div className="text-red-500 mb-4">
                    <span className="text-lg">⚠️</span>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Đã xảy ra lỗi
                  </h3>
                  <p className="text-gray-600 mb-4">
                    {error.message || "Không thể tải danh sách khóa học"}
                  </p>
                  <Button onClick={() => fetchCourses()} variant="outline">
                    Thử lại
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
              {!loading && !error && (!courses || courses.length === 0) && (
                <div className="text-center py-20">
                  <div className="text-gray-400 mb-4">
                    <Search className="w-16 h-16 mx-auto" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Không tìm thấy khóa học nào
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Hãy thử điều chỉnh từ khóa tìm kiếm hoặc tiêu chí lọc
                  </p>
                  <Button onClick={resetFilters} variant="outline">
                    Xóa tất cả bộ lọc
                  </Button>
                </div>
              )}

              {/* Course List */}
              {!loading && !error && courses && courses.length > 0 && (
                <>
                  <div className="space-y-4 mb-8">
                    {courses.map((course) => {
                      const formattedPrice =
                        course.amountPrice === 0
                          ? "Miễn phí"
                          : course.coursePrice;

                      return (
                        <Card
                          key={course.id}
                          className="hover:shadow-lg transition-shadow cursor-pointer"
                          onClick={() => navigate(`/courses/${course.id}`)}
                        >
                          <div className="flex gap-4 p-4">
                            {/* Course Thumbnail */}
                            <div className="flex-shrink-0">
                              <div className="w-64 h-36 bg-blue-100 rounded-lg flex items-center justify-center overflow-hidden">
                                {course.thumbnailUrl ? (
                                  <img
                                    src={course.thumbnailUrl}
                                    alt={course.courseName}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <BookOpen className="w-16 h-16 text-blue-400" />
                                )}
                              </div>
                            </div>

                            {/* Course Info */}
                            <div className="flex-1 flex flex-col justify-between">
                              <div>
                                <h3 className="font-semibold text-lg mb-1 line-clamp-2">
                                  {course.courseName}
                                </h3>
                                <p className="text-sm text-gray-600 mb-2">
                                  {course.authorName}
                                </p>

                                {/* Rating */}
                                <div className="flex items-center gap-2 mb-2">
                                  <span className="font-semibold text-amber-600">
                                    {course.rating.toFixed(1)}
                                  </span>
                                  <div className="flex">
                                    {renderStars(course.rating)}
                                  </div>
                                  <span className="text-sm text-gray-500">
                                    ({course.reviewCount})
                                  </span>
                                </div>

                                {/* Course Meta */}
                                <div className="flex items-center gap-3 text-sm text-gray-600">
                                  <span className="flex items-center gap-1">
                                    <Clock className="w-4 h-4" />
                                    {course.duration}{" "}
                                    {parseInt(course.duration) > 1
                                      ? "tháng"
                                      : "tháng"}
                                  </span>
                                  {/* {course.lectureCount && (
                                    <span>
                                      • {course.lectureCount} bài giảng
                                    </span>
                                  )}
                                  {course.level && (
                                    <span>• {course.level}</span>
                                  )} */}
                                </div>
                              </div>

                              {/* Badges */}
                              {/* <div className="flex items-center gap-2 mt-2">
                                {course.isBestSeller && (
                                  <span className="px-3 py-1 bg-amber-100 text-amber-800 text-xs font-medium rounded">
                                    Bán chạy nhất
                                  </span>
                                )}
                                {course.hasExercises && (
                                  <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-medium rounded">
                                    Có bài tập
                                  </span>
                                )}
                                {price === 0 && (
                                  <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded">
                                    Miễn phí
                                  </span>
                                )}
                              </div> */}
                            </div>

                            {/* Price and Action */}
                            <div className="flex flex-col items-end justify-between">
                              <div className="text-right">
                                <div
                                  className={`font-bold text-lg ${
                                    course.amountPrice === 0
                                      ? "text-green-600"
                                      : "text-gray-900"
                                  }`}
                                >
                                  {formattedPrice}
                                </div>
                              </div>
                            </div>
                          </div>
                        </Card>
                      );
                    })}
                  </div>

                  {/* Pagination */}
                  {totalPages > 0 && (
                    <div className="mt-8">
                      <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={handlePageChange}
                      />
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Course;
