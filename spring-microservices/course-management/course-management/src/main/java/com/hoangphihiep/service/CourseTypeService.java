package com.hoangphihiep.service;

import com.hoangphihiep.dto.request.CourseTypeRequest;
import com.hoangphihiep.dto.response.ApiResponse;
import com.hoangphihiep.dto.response.CourseTypeResponse;
import com.hoangphihiep.entity.CourseType;
import com.hoangphihiep.repository.CourseTypeRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class CourseTypeService {

    private final CourseTypeRepository courseTypeRepository;

    public ApiResponse<List<CourseTypeResponse>> getAllCourseTypes(int page, int size, String search) {
        try {
            Pageable pageable = PageRequest.of(page, size, Sort.by("courseTypeName").ascending());
            Page<CourseType> courseTypePage = courseTypeRepository.findBySearch(search, pageable);

            List<CourseTypeResponse> courseTypes = courseTypePage.getContent().stream()
                    .map(this::mapToResponse)
                    .toList();

            return ApiResponse.<List<CourseTypeResponse>>builder()
                    .code(1000)
                    .message("Get course types successfully")
                    .result(courseTypes)
                    .build();
        } catch (Exception e) {
            log.error("Error getting course types", e);
            return ApiResponse.<List<CourseTypeResponse>>builder()
                    .code(1001)
                    .message("Error getting course types: " + e.getMessage())
                    .build();
        }
    }

    public ApiResponse<CourseTypeResponse> getCourseTypeById(Integer id) {
        try {
            CourseType courseType = courseTypeRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Course type not found with id: " + id));

            return ApiResponse.<CourseTypeResponse>builder()
                    .code(1000)
                    .message("Get course type successfully")
                    .result(mapToResponse(courseType))
                    .build();
        } catch (Exception e) {
            log.error("Error getting course type by id: {}", id, e);
            return ApiResponse.<CourseTypeResponse>builder()
                    .code(1001)
                    .message("Error getting course type: " + e.getMessage())
                    .build();
        }
    }

    @Transactional
    public ApiResponse<CourseTypeResponse> createCourseType(CourseTypeRequest request) {
        try {
            // Check if course type name already exists
            if (courseTypeRepository.existsByCourseTypeName(request.getCourseTypeName())) {
                return ApiResponse.<CourseTypeResponse>builder()
                        .code(1002)
                        .message("Course type name already exists")
                        .build();
            }

            CourseType courseType = CourseType.builder()
                    .courseTypeName(request.getCourseTypeName())
                    .build();

            CourseType savedCourseType = courseTypeRepository.save(courseType);

            return ApiResponse.<CourseTypeResponse>builder()
                    .code(1000)
                    .message("Course type created successfully")
                    .result(mapToResponse(savedCourseType))
                    .build();
        } catch (Exception e) {
            log.error("Error creating course type", e);
            return ApiResponse.<CourseTypeResponse>builder()
                    .code(1001)
                    .message("Error creating course type: " + e.getMessage())
                    .build();
        }
    }

    @Transactional
    public ApiResponse<CourseTypeResponse> updateCourseType(Integer id, CourseTypeRequest request) {
        try {
            CourseType courseType = courseTypeRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Course type not found with id: " + id));

            // Check if new name already exists (excluding current record)
            if (!courseType.getCourseTypeName().equals(request.getCourseTypeName()) &&
                    courseTypeRepository.existsByCourseTypeName(request.getCourseTypeName())) {
                return ApiResponse.<CourseTypeResponse>builder()
                        .code(1002)
                        .message("Course type name already exists")
                        .build();
            }

            courseType.setCourseTypeName(request.getCourseTypeName());
            CourseType updatedCourseType = courseTypeRepository.save(courseType);

            return ApiResponse.<CourseTypeResponse>builder()
                    .code(1000)
                    .message("Course type updated successfully")
                    .result(mapToResponse(updatedCourseType))
                    .build();
        } catch (Exception e) {
            log.error("Error updating course type with id: {}", id, e);
            return ApiResponse.<CourseTypeResponse>builder()
                    .code(1001)
                    .message("Error updating course type: " + e.getMessage())
                    .build();
        }
    }

    @Transactional
    public ApiResponse<Void> deleteCourseType(Integer id) {
        try {
            CourseType courseType = courseTypeRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Course type not found with id: " + id));

            // Check if course type has associated courses
            if (courseType.getCourse() != null && !courseType.getCourse().isEmpty()) {
                return ApiResponse.<Void>builder()
                        .code(1003)
                        .message("Cannot delete course type that has associated courses")
                        .build();
            }

            courseTypeRepository.delete(courseType);

            return ApiResponse.<Void>builder()
                    .code(1000)
                    .message("Course type deleted successfully")
                    .build();
        } catch (Exception e) {
            log.error("Error deleting course type with id: {}", id, e);
            return ApiResponse.<Void>builder()
                    .code(1001)
                    .message("Error deleting course type: " + e.getMessage())
                    .build();
        }
    }

    private CourseTypeResponse mapToResponse(CourseType courseType) {
        return CourseTypeResponse.builder()
                .id(courseType.getId())
                .courseTypeName(courseType.getCourseTypeName())
                .build();
    }
}
