package com.hoangphihiep.service;

import com.hoangphihiep.dto.request.CourseRequest;
import com.hoangphihiep.dto.response.ApiResponse;
import com.hoangphihiep.dto.response.CourseResponse;
import com.hoangphihiep.dto.response.CourseTypeResponse;
import com.hoangphihiep.entity.Course;
import com.hoangphihiep.entity.CourseType;
import com.hoangphihiep.repository.CourseRepository;
import com.hoangphihiep.repository.CourseTypeRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Date;
import java.util.HashSet;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class CourseService {

    private final CourseRepository courseRepository;
    private final CourseTypeRepository courseTypeRepository;
    private final SectionService sectionService;

    public ApiResponse<List<CourseResponse>> getAllCourses(int page, int size, String search) {
        try {
            Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
            Page<Course> coursePage = courseRepository.findBySearch(search, pageable);

            List<CourseResponse> courses = coursePage.getContent().stream()
                    .map(this::mapToResponse)
                    .toList();

            return ApiResponse.<List<CourseResponse>>builder()
                    .code(1000)
                    .message("Get courses successfully")
                    .result(courses)
                    .build();
        } catch (Exception e) {
            log.error("Error getting courses", e);
            return ApiResponse.<List<CourseResponse>>builder()
                    .code(1001)
                    .message("Error getting courses: " + e.getMessage())
                    .build();
        }
    }

    public ApiResponse<CourseResponse> getCourseById(Integer id) {
        try {
            Course course = courseRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Course not found with id: " + id));

            return ApiResponse.<CourseResponse>builder()
                    .code(1000)
                    .message("Get course successfully")
                    .result(mapToResponse(course))
                    .build();
        } catch (Exception e) {
            log.error("Error getting course by id: {}", id, e);
            return ApiResponse.<CourseResponse>builder()
                    .code(1001)
                    .message("Error getting course: " + e.getMessage())
                    .build();
        }
    }

    @Transactional
    public ApiResponse<CourseResponse> createCourse(CourseRequest request) {
        try {
            // Validate course type exists
            CourseType courseType = courseTypeRepository.findById(request.getCourseTypeId())
                    .orElseThrow(() -> new RuntimeException("Course type not found with id: " + request.getCourseTypeId()));

            Course course = new Course();
            course.setCourseName(request.getCourseName());
            course.setCourseType(courseType);
            course.setCoursePrice(request.getCoursePrice());
            course.setVisibility(request.getVisibility());
            course.setIdTeacher(request.getIdTeacher());
            course.setCreatedAt(new Date());
            course.setUpdatedAt(new Date());
            Course savedCourse = courseRepository.save(course);

            return ApiResponse.<CourseResponse>builder()
                    .code(1000)
                    .message("Course created successfully")
                    .result(mapToResponse(savedCourse))
                    .build();
        } catch (Exception e) {
            log.error("Error creating course", e);
            return ApiResponse.<CourseResponse>builder()
                    .code(1001)
                    .message("Error creating course: " + e.getMessage())
                    .build();
        }
    }

    @Transactional
    public ApiResponse<CourseResponse> updateCourse(Integer id, CourseRequest request) {
        try {
            Course course = courseRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Course not found with id: " + id));

            if (request.getCourseName() != null) {
                course.setCourseName(request.getCourseName());
            }
            if (request.getCourseTypeId() != null) {
                CourseType courseType = courseTypeRepository.findById(request.getCourseTypeId())
                        .orElseThrow(() -> new RuntimeException("Course type not found with id: " + request.getCourseTypeId()));
                course.setCourseType(courseType);
            }
            if (request.getCoursePrice() != null) {
                course.setCoursePrice(request.getCoursePrice());
            }
            if (request.getVisibility() != null) {
                course.setVisibility(request.getVisibility());
            }
            if (request.getIsApproved() != null) {
                course.setIsApproved(request.getIsApproved());
            }
            if (request.getStatus() != null) {
                course.setStatus(request.getStatus());
            }

            course.setUpdatedAt(new Date());
            Course updatedCourse = courseRepository.save(course);

            return ApiResponse.<CourseResponse>builder()
                    .code(1000)
                    .message("Course updated successfully")
                    .result(mapToResponse(updatedCourse))
                    .build();
        } catch (Exception e) {
            log.error("Error updating course with id: {}", id, e);
            return ApiResponse.<CourseResponse>builder()
                    .code(1001)
                    .message("Error updating course: " + e.getMessage())
                    .build();
        }
    }

    @Transactional
    public ApiResponse<Void> deleteCourse(Integer id) {
        try {
            Course course = courseRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Course not found with id: " + id));

            courseRepository.delete(course);

            return ApiResponse.<Void>builder()
                    .code(1000)
                    .message("Course deleted successfully")
                    .build();
        } catch (Exception e) {
            log.error("Error deleting course with id: {}", id, e);
            return ApiResponse.<Void>builder()
                    .code(1001)
                    .message("Error deleting course: " + e.getMessage())
                    .build();
        }
    }

    public ApiResponse<List<CourseResponse>> getCoursesByTeacher(String teacherId) {
        try {
            List<Course> courses = courseRepository.findByIdTeacher(teacherId);
            List<CourseResponse> courseResponses = courses.stream()
                    .map(this::mapToResponse)
                    .toList();

            return ApiResponse.<List<CourseResponse>>builder()
                    .code(1000)
                    .message("Get courses by teacher successfully")
                    .result(courseResponses)
                    .build();
        } catch (Exception e) {
            log.error("Error getting courses by teacher: {}", teacherId, e);
            return ApiResponse.<List<CourseResponse>>builder()
                    .code(1001)
                    .message("Error getting courses by teacher: " + e.getMessage())
                    .build();
        }
    }

    @Transactional
    public ApiResponse<CourseResponse> updateCourseWithDetails(Integer id, CourseRequest request) {
        return null;
    }

    private CourseResponse mapToResponse(Course course) {
        CourseTypeResponse courseTypeResponse = null;
        if (course.getCourseType() != null) {
            courseTypeResponse = CourseTypeResponse.builder()
                    .id(course.getCourseType().getId())
                    .courseTypeName(course.getCourseType().getCourseTypeName())
                    .build();
        }

        return CourseResponse.builder()
                .id(course.getId())
                .courseName(course.getCourseName())
                .courseType(courseTypeResponse)
                .coursePrice(course.getCoursePrice())
                .visibility(course.getVisibility())
                .publishedAt(course.getPublishedAt())
                .createdAt(course.getCreatedAt())
                .updatedAt(course.getUpdatedAt())
                .isApproved(course.getIsApproved())
                .idTeacher(course.getIdTeacher())
                .status(course.getStatus())
                .sections(
                        course.getSections() != null
                                ? course.getSections().stream()
                                .map(sectionService::mapToResponse)
                                .collect(Collectors.toSet())
                                : new HashSet<>()
                )
                .reviewsCount(course.getReview() != null ? course.getReview().size() : 0)
                .build();
    }
}
