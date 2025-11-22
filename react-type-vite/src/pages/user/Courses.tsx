import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Search, Filter, Star, Users, Clock, RotateCcw, X } from "lucide-react";
import { Input } from "../../components/ui/input";
import { Button } from "../../components/ui/button";
import { Card } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Checkbox } from "../../components/ui/checkbox";
import { LoadingDots } from "../../components/ui/LoadingDots";
import { Pagination } from "../../components/ui/Pagination";
import type {
  CompletionSuggestionResponse,
  Filters,
  PublishedCourseResponse,
} from "../../types/course.types";
import Header from "@/components/student/home/Header";
import Footer from "@/components/student/home/Footer";

import { toast } from "react-toastify";

import PublishedCourseService from "@/services/api/anonymous/course.api";

// Debounce hook
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

const Course: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [showFilters, setShowFilters] = useState(true);
  const [categories, setCategories] = useState<string[]>([]);

  // Auto-completion state
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const searchBoxRef = useRef<HTMLDivElement>(null);
  const isInitialMount = useRef(true);

  // Get initial values from URL params
  const getInitialSearchTerm = () => searchParams.get("keyword") || "";
  const getInitialFilters = (): Filters => ({
    priceRange: [
      parseInt(searchParams.get("minPrice") || "0"),
      parseInt(searchParams.get("maxPrice") || "500"),
    ],
    minRating: parseInt(searchParams.get("minRating") || "0"),
    levels: searchParams.getAll("levels"),
    practiceTypes: [],
    categories: searchParams.getAll("categories"),
    duration: [],
  });

  const [searchTerm, setSearchTerm] = useState(getInitialSearchTerm);
  const [filters, setFilters] = useState<Filters>(getInitialFilters);
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  // Pagination and data state
  const [courses, setCourses] = useState<PublishedCourseResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [currentPage, setCurrentPage] = useState(
    parseInt(searchParams.get("page") || "0")
  );
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const pageSize = 12;

  // Update URL params whenever filters, search term, or page changes
  const updateUrlParams = (
    newSearchTerm: string,
    newFilters: Filters,
    page: number
  ) => {
    const params = new URLSearchParams();

    if (newSearchTerm.trim()) {
      params.set("keyword", newSearchTerm.trim());
    }
    if (page > 0) {
      params.set("page", page.toString());
    }
    if (newFilters.priceRange[0] > 0) {
      params.set("minPrice", newFilters.priceRange[0].toString());
    }
    if (newFilters.priceRange[1] < 500) {
      params.set("maxPrice", newFilters.priceRange[1].toString());
    }
    if (newFilters.minRating > 0) {
      params.set("minRating", newFilters.minRating.toString());
    }
    newFilters.levels.forEach((level) => params.append("levels", level));
    newFilters.categories.forEach((category) =>
      params.append("categories", category)
    );

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
          filters.priceRange[0] > 0 ? filters.priceRange[0] : undefined,
          filters.priceRange[1] < 500 ? filters.priceRange[1] : undefined,
          filters.minRating > 0 ? filters.minRating : undefined,
          filters.levels.length > 0 ? filters.levels : undefined,
          filters.categories.length > 0 ? filters.categories : undefined,
          undefined // sortBy
        );
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

  // // Load categories on component mount
  // useEffect(() => {
  //   const loadCategories = async () => {
  //     try {
  //       const fetchedCategories = await CourseApiService.getCategories();
  //       setCategories(fetchedCategories);
  //     } catch (error) {
  //       console.error("Error fetching categories:", error);
  //       setCategories([]);
  //     }
  //   };

  //   loadCategories();
  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, []);

  // Fetch courses when URL params change (on mount and when filters/search/page change)
  useEffect(() => {
    fetchCourses();
    // Mark as not initial mount after first fetch
    if (isInitialMount.current) {
      isInitialMount.current = false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // Fetch auto-completion suggestions
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (!debouncedSearchTerm || debouncedSearchTerm.trim().length < 2) {
        setSuggestions([]);
        setShowSuggestions(false);
        return;
      }

      setLoadingSuggestions(true);
      try {
        const response: CompletionSuggestionResponse =
          await PublishedCourseService.autoCompletion(debouncedSearchTerm, 5);
        setSuggestions(response.titleSuggestions || []);
        setShowSuggestions(true);
      } catch (error) {
        console.error("Error fetching suggestions:", error);
        setSuggestions([]);
      } finally {
        setLoadingSuggestions(false);
      }
    };

    fetchSuggestions();
  }, [debouncedSearchTerm]);

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
      priceRange: [0, 500],
      minRating: 0,
      levels: [],
      practiceTypes: [],
      categories: [],
      duration: [],
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
    value: number | [number, number]
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
              {course.coursePrice}
            </span>
            {course.coursePrice && (
              <span className="text-sm text-gray-500 line-through">
                {course.coursePrice}
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
                    <span>0</span>
                    <span>{filters.priceRange[1]}</span>
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
              <div className="space-y-3 mb-6">
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
            {/* Search Bar */}
            <div className="mb-8">
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

              {!loading && totalElements > 0 && (
                <div className="text-sm text-gray-600">
                  Tìm thấy {totalElements} khóa học
                </div>
              )}
            </div>

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
            {!loading && !error && courses && courses.length > 0 && (
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

                {/* Pagination */}
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={handlePageChange}
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
