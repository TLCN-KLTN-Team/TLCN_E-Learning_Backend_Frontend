package com.hoangphihiep.service;

import com.hoangphihiep.dto.request.CourseDetailRequest;
import com.hoangphihiep.dto.response.ApiResponse;
import com.hoangphihiep.dto.response.CourseDetailResponse;
import com.hoangphihiep.entity.Course;
import com.hoangphihiep.entity.CourseDetail;
import com.hoangphihiep.repository.CourseDetailRepository;
import com.hoangphihiep.repository.CourseRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class CourseDetailService {

    private final CourseDetailRepository courseDetailRepository;
    private final CourseRepository courseRepository;

    public ApiResponse<List<CourseDetailResponse>> getAllCourseDetails() {
        try {
            List<CourseDetail> courseDetails = courseDetailRepository.findAll();
            List<CourseDetailResponse> responses = courseDetails.stream()
                    .map(this::mapToResponse)
                    .toList();

            return ApiResponse.<List<CourseDetailResponse>>builder()
                    .code(1000)
                    .message("Get course details successfully")
                    .result(responses)
                    .build();
        } catch (Exception e) {
            log.error("Error getting course details", e);
            return ApiResponse.<List<CourseDetailResponse>>builder()
                    .code(1001)
                    .message("Error getting course details: " + e.getMessage())
                    .build();
        }
    }

    public ApiResponse<CourseDetailResponse> getCourseDetailById(Integer id) {
        try {
            CourseDetail courseDetail = courseDetailRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Course detail not found with id: " + id));

            return ApiResponse.<CourseDetailResponse>builder()
                    .code(1000)
                    .message("Get course detail successfully")
                    .result(mapToResponse(courseDetail))
                    .build();
        } catch (Exception e) {
            log.error("Error getting course detail by id: {}", id, e);
            return ApiResponse.<CourseDetailResponse>builder()
                    .code(1001)
                    .message("Error getting course detail: " + e.getMessage())
                    .build();
        }
    }

    public ApiResponse<CourseDetailResponse> getCourseDetailByCourseId(Integer courseId) {
        try {
            CourseDetail courseDetail = courseDetailRepository.findByCourseId(courseId)
                    .orElseThrow(() -> new RuntimeException("Course detail not found for course id: " + courseId));

            return ApiResponse.<CourseDetailResponse>builder()
                    .code(1000)
                    .message("Get course detail successfully")
                    .result(mapToResponse(courseDetail))
                    .build();
        } catch (Exception e) {
            log.error("Error getting course detail by course id: {}", courseId, e);
            return ApiResponse.<CourseDetailResponse>builder()
                    .code(1001)
                    .message("Error getting course detail: " + e.getMessage())
                    .build();
        }
    }

    @Transactional
    public ApiResponse<CourseDetailResponse> createCourseDetail(CourseDetailRequest request) {
        try {
            Course course = courseRepository.findById(request.getCourseId())
                    .orElseThrow(() -> new RuntimeException("Course not found with id: " + request.getCourseId()));

            CourseDetail courseDetail = new CourseDetail();
            courseDetail.setCourse(course);
            courseDetail.setDescription(request.getDescription());
            courseDetail.setCourseIntroduction(request.getCourseIntroduction());
            courseDetail.setCourseImage(request.getCourseImage());
            courseDetail.setCourseVideo(request.getCourseVideo());
            courseDetail.setCourseTarget(request.getCourseTarget());
            courseDetail.setCourseLearner(request.getCourseLearner());
            courseDetail.setLearnerAchievements(request.getLearnerAchievements());
            CourseDetail savedCourseDetail = courseDetailRepository.save(courseDetail);

            return ApiResponse.<CourseDetailResponse>builder()
                    .code(1000)
                    .message("Course detail created successfully")
                    .result(mapToResponse(savedCourseDetail))
                    .build();
        } catch (Exception e) {
            log.error("Error creating course detail", e);
            return ApiResponse.<CourseDetailResponse>builder()
                    .code(1001)
                    .message("Error creating course detail: " + e.getMessage())
                    .build();
        }
    }

    @Transactional
    public ApiResponse<CourseDetailResponse> updateCourseDetail(Integer id, CourseDetailRequest request) {
        try {
            CourseDetail courseDetail = courseDetailRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Course detail not found with id: " + id));

            if (request.getDescription() != null) {
                courseDetail.setDescription(request.getDescription());
            }
            if (request.getCourseIntroduction() != null) {
                courseDetail.setCourseIntroduction(request.getCourseIntroduction());
            }
            if (request.getCourseImage() != null) {
                courseDetail.setCourseImage(request.getCourseImage());
            }
            if (request.getCourseVideo() != null) {
                courseDetail.setCourseVideo(request.getCourseVideo());
            }
            if (request.getCourseTarget() != null) {
                courseDetail.setCourseTarget(request.getCourseTarget());
            }
            if (request.getCourseLearner() != null) {
                courseDetail.setCourseLearner(request.getCourseLearner());
            }
            if (request.getLearnerAchievements() != null) {
                courseDetail.setLearnerAchievements(request.getLearnerAchievements());
            }

            CourseDetail updatedCourseDetail = courseDetailRepository.save(courseDetail);

            return ApiResponse.<CourseDetailResponse>builder()
                    .code(1000)
                    .message("Course detail updated successfully")
                    .result(mapToResponse(updatedCourseDetail))
                    .build();
        } catch (Exception e) {
            log.error("Error updating course detail with id: {}", id, e);
            return ApiResponse.<CourseDetailResponse>builder()
                    .code(1001)
                    .message("Error updating course detail: " + e.getMessage())
                    .build();
        }
    }

    @Transactional
    public ApiResponse<Void> deleteCourseDetail(Integer id) {
        try {
            CourseDetail courseDetail = courseDetailRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Course detail not found with id: " + id));

            courseDetailRepository.delete(courseDetail);

            return ApiResponse.<Void>builder()
                    .code(1000)
                    .message("Course detail deleted successfully")
                    .build();
        } catch (Exception e) {
            log.error("Error deleting course detail with id: {}", id, e);
            return ApiResponse.<Void>builder()
                    .code(1001)
                    .message("Error deleting course detail: " + e.getMessage())
                    .build();
        }
    }

    private CourseDetailResponse mapToResponse(CourseDetail courseDetail) {
        return CourseDetailResponse.builder()
                .id(courseDetail.getId())
                .courseId(courseDetail.getCourse() != null ? courseDetail.getCourse().getId() : null)
                .courseName(courseDetail.getCourse() != null ? courseDetail.getCourse().getCourseName() : null)
                .description(courseDetail.getDescription())
                .courseIntroduction(courseDetail.getCourseIntroduction())
                .courseImage(courseDetail.getCourseImage())
                .courseVideo(courseDetail.getCourseVideo())
                .courseTarget(courseDetail.getCourseTarget())
                .learnerAchievements(courseDetail.getLearnerAchievements())
                .build();
    }
}
