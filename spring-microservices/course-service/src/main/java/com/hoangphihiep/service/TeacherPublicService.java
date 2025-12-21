package com.hoangphihiep.service;

import com.hoangphihiep.dto.response.PaginatedResponse;
import com.hoangphihiep.dto.response.ReviewResponse;
import com.hoangphihiep.dto.response.TeacherCourseResponse;
import com.hoangphihiep.dto.response.TeacherDetailResponse;
import com.hoangphihiep.dto.response.DepartmentResponse;
import com.hoangphihiep.dto.response.EducationalUnitResponse;
import com.hoangphihiep.entity.Department;
import com.hoangphihiep.entity.EducationalUnit;
import com.hoangphihiep.entity.PublishedCourse;
import com.hoangphihiep.repository.*;
import com.hoangphihiep.repository.httpclient.TeacherRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class TeacherPublicService {
    private final TeacherRepository teacherRepository;
    private final PublishedCourseRepository publishedCourseRepository;
    private final ReviewRepository reviewRepository;
    private final DepartmentRepository departmentRepository;
    private final EducationalUnitRepository educationalUnitRepository;
    private final OrderRepository orderRepository;
    /**
     * Get teacher detail by teacher ID
     */
        public TeacherDetailResponse getTeacherDetail(String teacherId) {
        log.info("Fetching teacher detail for ID: {}", teacherId);

        // Get teacher info from identity-service
        var teacherResponse = teacherRepository.getTeacherByTeacherId(teacherId);
        var teacherInfo = teacherResponse.getResult();

        log.info("Teacher info from identity-service: {}", teacherInfo);

        // Get approved courses by this teacher
        List<PublishedCourse> approvedCourses = publishedCourseRepository
                .findApprovedCoursesByTeacherId(teacherId);

        // Calculate total students (distinct students from all courses)
        // Count enrollments from all courses

        Long countStudent = orderRepository.countUniqueStudentsByTeacherId(teacherId);

        // Calculate average rating from reviews
        Double averageRating = reviewRepository.getAverageRatingByTeacherId(teacherId);
        if (averageRating == null) {
            averageRating = 0.0;
        }

        // Build full name from identity-service data
        String fullName = (teacherInfo.getFirstName() != null ? teacherInfo.getFirstName() : "") + 
                         " " + 
                         (teacherInfo.getLastName() != null ? teacherInfo.getLastName() : "");
        fullName = fullName.trim();

        // Populate Department and Educational Unit by IDs from teacherInfo
        DepartmentResponse deptResponse = null;
        EducationalUnitResponse eduResponse = null;
        try {
            if (teacherInfo.getDepartmentId() != null && !teacherInfo.getDepartmentId().isEmpty()) {
                int deptId = Integer.parseInt(teacherInfo.getDepartmentId());
                Department dept = departmentRepository.findById(deptId).orElse(null);
                if (dept != null) {
                    deptResponse = DepartmentResponse.builder()
                            .id(String.valueOf(dept.getId()))
                            .name(dept.getName())
                            .description(dept.getDescription())
                            .build();
                }
            }

            if (teacherInfo.getEducationalUnitId() != null && !teacherInfo.getEducationalUnitId().isEmpty()) {
                int eduId = Integer.parseInt(teacherInfo.getEducationalUnitId());
                EducationalUnit edu = educationalUnitRepository.findById(eduId).orElse(null);
                if (edu != null) {
                    eduResponse = EducationalUnitResponse.builder()
                            .id(edu.getId())
                            .name(edu.getName())
                            .description(edu.getDescription())
                            .build();
                }
            }
        } catch (Exception e) {
            log.warn("Failed to populate department/educational unit for teacher {}: {}", teacherId, e.getMessage());
        }

        return TeacherDetailResponse.builder()
                .id(teacherInfo.getId())
                .name(fullName.isEmpty() ? "Teacher " + teacherId : fullName)
                .email(teacherInfo.getEmail() != null ? teacherInfo.getEmail() : "teacher" + teacherId + "@example.com")
                .phone(teacherInfo.getPhoneNumber())
                .avatar(teacherInfo.getAvatarUrl())
                .bio(teacherInfo.getBio())
                .description(teacherInfo.getDescription())
                .department(deptResponse)
                .educationalUnit(eduResponse)
                .totalPublishedCourses(approvedCourses.size())
                .totalStudents(Math.toIntExact(countStudent))
                .averageRating(averageRating)
                .build();
    }

    /**
     * Get teacher's published courses with pagination
     */
    public PaginatedResponse<TeacherCourseResponse> getTeacherCourses(
            String teacherId,
            Pageable pageable) {
        log.info("Fetching courses for teacher ID: {}", teacherId);

        // Get approved courses by this teacher
        Page<PublishedCourse> coursesPage = publishedCourseRepository
                .findByTeacherIdAndStatus(teacherId, 2, pageable);

        List<TeacherCourseResponse> courseResponses = coursesPage.getContent()
                .stream()
                .map(this::mapPublishedCourseToTeacherCourseResponse)
                .collect(Collectors.toList());

        return PaginatedResponse.<TeacherCourseResponse>builder()
                .content(courseResponses)
                .totalElements(coursesPage.getTotalElements())
                .totalPages(coursesPage.getTotalPages())
                .page(coursesPage.getNumber())
                .size(coursesPage.getSize())
                .build();
    }

    /**
     * Map PublishedCourse to TeacherCourseResponse
     */
    private TeacherCourseResponse mapPublishedCourseToTeacherCourseResponse(PublishedCourse publishedCourse) {
        Double rating = reviewRepository.getAverageRatingByCourseId(publishedCourse.getId());
        if (rating == null) {
            rating = 0.0;
        }

        Long countStudent = orderRepository.countUniqueStudentsByTeacherIdAndCoureId(publishedCourse.getCourse().getIdTeacher(),publishedCourse.getId());

        return TeacherCourseResponse.builder()
                .id(publishedCourse.getId())
                .courseName(publishedCourse.getCourseName())
                .description(publishedCourse.getDescription())
                .courseIntroduction(publishedCourse.getCourseIntroduction())
                .thumbnailUrl(publishedCourse.getCourseImage())
                .coursePrice(publishedCourse.getCoursePrice() != null ? 
                        "₫" + publishedCourse.getCoursePrice().toPlainString() : "0")
                .rating(rating)
                .enrolledCount(Math.toIntExact(countStudent))
                .duration("0") // Course entity doesn't have duration field
                .level("Beginner") // Course entity doesn't have level field - using default
                .category("Technology") // Course entity doesn't have category field - using default
                .build();
    }
}
