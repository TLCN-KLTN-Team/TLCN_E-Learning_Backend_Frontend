package com.hoangphihiep.controller.Admin;

import com.hoangphihiep.dto.request.CourseClassRequest;
import com.hoangphihiep.dto.response.ApiResponse;
import com.hoangphihiep.dto.response.CourseClassResponse;
import com.hoangphihiep.dto.response.StudentResponse;
import com.hoangphihiep.exception.AppException;
import com.hoangphihiep.exception.ErrorCode;
import com.hoangphihiep.service.*;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/admin/institutions/{institutionId}")
@RequiredArgsConstructor
@Slf4j
public class ClassController {

    private final CourseEnrollmentService enrollmentService;
    private final CourseClassService classService;

    @GetMapping("/classes")
    public ApiResponse<Page<CourseClassResponse>> getClassesByInstitution(
            @PathVariable int institutionId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String search) {

        log.info("Admin getting classes for institution: {}", institutionId);

        Pageable pageable = PageRequest.of(page, size);
        Page<CourseClassResponse> classes = classService.getClassesByInstitution(institutionId, pageable, search);

        return ApiResponse.<Page<CourseClassResponse>>builder()
                .result(classes)
                .build();
    }

    @PostMapping("/classes")
    public ApiResponse<CourseClassResponse> createClass(
            @PathVariable int institutionId,
            @Valid @RequestBody CourseClassRequest request) {

        log.info("Admin creating class for institution: {}", institutionId);

        CourseClassResponse response = classService.createClass(request);

        return ApiResponse.<CourseClassResponse>builder()
                .result(response)
                .build();
    }

    @GetMapping("/courses/{courseId}/classes")
    public ApiResponse<Page<CourseClassResponse>> getClassesByCourse(
            @PathVariable int institutionId,
            @PathVariable int courseId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        log.info("Admin getting classes for course {} in institution: {}", courseId, institutionId);

        Pageable pageable = PageRequest.of(page, size);
        Page<CourseClassResponse> classes = classService.getClassesByCourse(courseId, pageable);

        return ApiResponse.<Page<CourseClassResponse>>builder()
                .result(classes)
                .build();
    }

    @PutMapping("/classes/{classId}")
    public ApiResponse<CourseClassResponse> updateClass(
            @PathVariable int institutionId,
            @PathVariable Long classId,
            @Valid @RequestBody CourseClassRequest request) {

        log.info("Admin updating class {} for institution: {}", classId, institutionId);

        CourseClassResponse response = classService.updateClass(classId, request);

        return ApiResponse.<CourseClassResponse>builder()
                .result(response)
                .build();
    }

    @DeleteMapping("/classes/{classId}")
    public ApiResponse<Void> deleteClass(
            @PathVariable int institutionId,
            @PathVariable Long classId) {

        log.info("Admin deleting class {} for institution: {}", classId, institutionId);

        classService.deleteClass(classId);

        return ApiResponse.<Void>builder()
                .message("Class successfully deleted")
                .build();
    }

    // ===================== CLASS ENROLLMENT MANAGEMENT =====================

    @PostMapping("/classes/{classId}/enroll-students")
    public ApiResponse<String> enrollStudentsInClass(
            @PathVariable int institutionId,
            @PathVariable Long classId,
            @RequestBody List<String> studentIds) {
        log.info("Admin enrolling students {} to class {} for institution: {}", studentIds, classId, institutionId);

        try {
            enrollmentService.enrollStudentsToClass(classId, studentIds);

            String message = String.format("Successfully enrolled %d students to class", studentIds.size());

            return ApiResponse.<String>builder()
                    .result(message)
                    .build();

        } catch (AppException e) {
            log.error("Failed to enroll students to class {}: {}", classId, e.getMessage());
            throw e;
        } catch (Exception e) {
            log.error("Unexpected error enrolling students to class {}: {}", classId, e.getMessage(), e);
            throw new AppException(ErrorCode.COURSE_ENROLLMENT_FAILED);
        }
    }

    @GetMapping("/classes/{classId}/students")
    public ApiResponse<List<StudentResponse>> getStudentsInClass(
            @PathVariable int institutionId,
            @PathVariable Long classId) {

        log.info("Admin getting students in class {} for institution: {}", classId, institutionId);

        List<StudentResponse> students = enrollmentService.getStudentsInClass(classId);

        return ApiResponse.<List<StudentResponse>>builder()
                .result(students)
                .build();
    }

    @GetMapping("/classes/{classId}/available-students")
    public ApiResponse<List<StudentResponse>> getAvailableStudentsForClass(
            @PathVariable int institutionId,
            @PathVariable Long classId) {

        log.info("Admin getting available students for class {} in institution: {}", classId, institutionId);

        List<StudentResponse> students = enrollmentService.getAvailableStudentsForClass(classId, institutionId);

        return ApiResponse.<List<StudentResponse>>builder()
                .result(students)
                .build();
    }

    @DeleteMapping("/classes/{classId}/students/{studentId}")
    public ApiResponse<Void> unenrollStudentFromClass(
            @PathVariable int institutionId,
            @PathVariable Long classId,
            @PathVariable String studentId) {

        log.info("Admin unenrolling student {} from class {} for institution: {}",
                studentId, classId, institutionId);

        enrollmentService.unenrollStudentFromClass(classId, studentId);

        return ApiResponse.<Void>builder()
                .message("Student successfully unenrolled from class")
                .build();
    }

    @DeleteMapping("/classes/{classId}/enrollments/{enrollmentId}")
    public ApiResponse<Void> removeEnrollmentFromClass(
            @PathVariable int institutionId,
            @PathVariable Long classId,
            @PathVariable Long enrollmentId) {

        log.info("Admin removing enrollment {} from class {} for institution: {}",
                enrollmentId, classId, institutionId);

        try {
            enrollmentService.removeEnrollment(enrollmentId, classId);

            return ApiResponse.<Void>builder()
                    .message("Student successfully unenrolled from class")
                    .build();

        } catch (Exception e) {
            log.error("Error removing enrollment {}: {}", enrollmentId, e.getMessage(), e);
            throw new AppException(ErrorCode.COURSE_UNENROLLMENT_FAILED);
        }
    }
}
