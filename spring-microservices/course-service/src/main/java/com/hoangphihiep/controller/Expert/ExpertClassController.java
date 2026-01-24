package com.hoangphihiep.controller.Expert;

import com.hoangphihiep.dto.request.CourseClassRequest;
import com.hoangphihiep.dto.request.ClassImportRequest;
import com.hoangphihiep.dto.response.ApiResponse;
import com.hoangphihiep.dto.response.ClassStudentStatsResponse;
import com.hoangphihiep.dto.response.CourseClassResponse;
import com.hoangphihiep.dto.response.ClassImportResponse;
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
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/expert/educational-unit/{educationalUnitId}")
@RequiredArgsConstructor
@Slf4j
public class ExpertClassController {

    private final CourseEnrollmentService enrollmentService;
    private final CourseClassService classService;

    @GetMapping("/classes")
    public ApiResponse<Page<CourseClassResponse>> getClassesByEducationalUnit(
            @PathVariable int educationalUnitId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String search) {

        Pageable pageable = PageRequest.of(page, size);
        Page<CourseClassResponse> classes = classService.getClassesByEducationalUnit(educationalUnitId, pageable, search);

        return ApiResponse.<Page<CourseClassResponse>>builder()
                .result(classes)
                .build();
    }

    @PostMapping("/classes")
    public ApiResponse<CourseClassResponse> createClass(
            @PathVariable int educationalUnitId,
            @Valid @RequestBody CourseClassRequest request) {

        CourseClassResponse response = classService.createClass(request);

        return ApiResponse.<CourseClassResponse>builder()
                .result(response)
                .build();
    }

    @GetMapping("/courses/{courseId}/classes")
    public ApiResponse<Page<CourseClassResponse>> getClassesByCourse(
            @PathVariable int educationalUnitId,
            @PathVariable int courseId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        Pageable pageable = PageRequest.of(page, size);
        Page<CourseClassResponse> classes = classService.getClassesByCourse(courseId, pageable);

        return ApiResponse.<Page<CourseClassResponse>>builder()
                .result(classes)
                .build();
    }

    @PostMapping("/courses/{courseId}/classes/bulk-import")
    public ApiResponse<ClassImportResponse> bulkImportClasses(
            @PathVariable int educationalUnitId,
            @PathVariable int courseId,
            @Valid @RequestBody ClassImportRequest request) {

        log.info("Bulk importing {} classes for course {} in educational unit {}", request.getClasses() != null ? request.getClasses().size() : 0, courseId, educationalUnitId);

        ClassImportResponse result = classService.bulkImportClasses(courseId, request.getClasses());

        return ApiResponse.<ClassImportResponse>builder()
                .result(result)
                .build();
    }

    @PutMapping("/classes/{classId}")
    public ApiResponse<CourseClassResponse> updateClass(
            @PathVariable int educationalUnitId,
            @PathVariable Integer classId,
            @Valid @RequestBody CourseClassRequest request) {

        CourseClassResponse response = classService.updateClass(classId, request);

        return ApiResponse.<CourseClassResponse>builder()
                .result(response)
                .build();
    }

    @DeleteMapping("/classes/{classId}")
    public ApiResponse<Void> deleteClass(
            @PathVariable int educationalUnitId,
            @PathVariable Integer classId) {

        classService.deleteClass(classId);

        return ApiResponse.<Void>builder()
                .message("Class successfully deleted")
                .build();
    }

    // ===================== CLASS ENROLLMENT MANAGEMENT =====================

    @PostMapping("/classes/{classId}/enroll-students")
    public ApiResponse<String> enrollStudentsInClass(
            @PathVariable int educationalUnitId,
            @PathVariable Integer classId,
            @RequestBody List<String> studentIds) {
        try {
            enrollmentService.enrollStudentsToClass(classId, studentIds);

            String message = String.format("Successfully enrolled %d students to class", studentIds.size());

            return ApiResponse.<String>builder()
                    .result(message)
                    .build();

        } catch (AppException e) {
            throw e;
        } catch (Exception e) {
            throw new AppException(ErrorCode.COURSE_ENROLLMENT_FAILED);
        }
    }

    @GetMapping("/classes/{classId}/students")
    public ApiResponse<List<StudentResponse>> getStudentsInClass(
            @PathVariable int educationalUnitId,
            @PathVariable Integer classId) {

        List<StudentResponse> students = enrollmentService.getStudentsInClass(classId);

        return ApiResponse.<List<StudentResponse>>builder()
                .result(students)
                .build();
    }

    @GetMapping("/classes/{classId}/available-students")
    public ApiResponse<List<StudentResponse>> getAvailableStudentsForClass(
            @PathVariable int educationalUnitId,
            @PathVariable Integer classId) {

        List<StudentResponse> students = enrollmentService.getAvailableStudentsForClass(classId, educationalUnitId);

        return ApiResponse.<List<StudentResponse>>builder()
                .result(students)
                .build();
    }

    @DeleteMapping("/classes/{classId}/students/{studentId}")
    public ApiResponse<Void> unenrollStudentFromClass(
            @PathVariable int educationalUnitId,
            @PathVariable Integer classId,
            @PathVariable String studentId) {

        enrollmentService.unenrollStudentFromClass(classId, studentId);

        return ApiResponse.<Void>builder()
                .message("Student successfully unenrolled from class")
                .build();
    }

    @DeleteMapping("/classes/{classId}/enrollments/{enrollmentId}")
    public ApiResponse<Void> removeEnrollmentFromClass(
            @PathVariable int educationalUnitId,
            @PathVariable Integer classId,
            @PathVariable Integer enrollmentId) {

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

    @GetMapping("/classes/{classId}/statistics")
    public ResponseEntity<ApiResponse<ClassStudentStatsResponse>> getClassStatistics(
            @PathVariable Integer educationalUnitId,
            @PathVariable Integer classId) {

        log.info("Fetching statistics for class {} in educational unit {}", classId, educationalUnitId);
        ClassStudentStatsResponse stats = enrollmentService.getClassStatistics(classId);

        return ResponseEntity.ok(ApiResponse.<ClassStudentStatsResponse>builder()
                .result(stats)
                .build());
    }
}
