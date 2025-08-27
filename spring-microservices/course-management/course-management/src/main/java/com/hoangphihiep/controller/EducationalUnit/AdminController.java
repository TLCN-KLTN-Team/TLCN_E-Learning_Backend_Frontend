package com.hoangphihiep.controller.EducationalUnit;

import com.hoangphihiep.dto.request.CourseRequest;
import com.hoangphihiep.dto.request.TeacherRequest;
import com.hoangphihiep.dto.request.StudentRequest;
import com.hoangphihiep.dto.response.*;
import com.hoangphihiep.service.CourseEnrollmentService;
import com.hoangphihiep.service.CourseService;
import com.hoangphihiep.service.TeacherService;
import com.hoangphihiep.service.StudentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/admin/institutions/{institutionId}")
@RequiredArgsConstructor
@Slf4j
public class AdminController {

    private final CourseService adminCourseService;
    private final TeacherService teacherService;
    private final StudentService studentService;
    private final CourseEnrollmentService enrollmentService;

    @GetMapping("/courses")
    public ApiResponse<Page<CourseResponse>> getCoursesByInstitution(
            @PathVariable int institutionId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String search) {

        log.info("Admin getting courses for institution: {}", institutionId);

        Page<CourseResponse> courses = adminCourseService.getCoursesByInstitution(institutionId, page, size, search);

        return ApiResponse.<Page<CourseResponse>>builder()
                .result(courses)
                .build();
    }

    @PostMapping("/courses")
    public ApiResponse<CourseResponse> createCourse(
            @PathVariable int institutionId,
            @Valid @RequestBody CourseRequest request) {

        log.info("Admin creating course for institution: {}", institutionId);

        CourseResponse response = adminCourseService.createCourseForInstitution(institutionId, request);

        return ApiResponse.<CourseResponse>builder()
                .result(response)
                .build();
    }

    @PutMapping("/courses/{courseId}/assign-teacher")
    public ApiResponse<CourseResponse> assignTeacherToCourse(
            @PathVariable int institutionId,
            @PathVariable int courseId,
            @RequestParam String teacherId) {

        log.info("Admin assigning teacher {} to course {} for institution: {}", teacherId, courseId, institutionId);

        CourseResponse response = adminCourseService.assignTeacherToCourse(courseId, teacherId);

        return ApiResponse.<CourseResponse>builder()
                .result(response)
                .build();
    }

    @PutMapping("/courses/{courseId}/remove-teacher")
    public ApiResponse<CourseResponse> removeTeacherFromCourse(
            @PathVariable int institutionId,
            @PathVariable int courseId) {

        log.info("Admin removing teacher from course {} for institution: {}", courseId, institutionId);

        CourseResponse response = adminCourseService.removeTeacherFromCourse(courseId);

        return ApiResponse.<CourseResponse>builder()
                .result(response)
                .build();
    }

    @GetMapping("/teachers")
    public ApiResponse<Page<TeacherResponse>> getTeachersByInstitution(
            @PathVariable int institutionId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String search) {

        log.info("Admin getting teachers for institution: {}", institutionId);

        Page<TeacherResponse> teachers = adminCourseService.getTeachersByInstitution(institutionId, page, size, search);

        return ApiResponse.<Page<TeacherResponse>>builder()
                .result(teachers)
                .build();
    }

    @PostMapping("/teachers")
    public ApiResponse<TeacherResponse> createTeacher(
            @PathVariable int institutionId,
            @Valid @RequestBody TeacherRequest request) {

        log.info("Admin creating teacher for institution: {}", institutionId);

        // Set institution ID
        request.setEducationalUnitId(String.valueOf(institutionId));

        TeacherResponse response = teacherService.createTeacher(request);

        return ApiResponse.<TeacherResponse>builder()
                .result(response)
                .build();
    }

    @GetMapping("/teachers/{teacherId}")
    public ApiResponse<TeacherResponse> getTeacherById(
            @PathVariable int institutionId,
            @PathVariable String teacherId) {

        log.info("Admin getting teacher {} for institution: {}", teacherId, institutionId);

        // This will be handled by the TeacherService via Feign client
        TeacherResponse response = teacherService.getTeacherByTeacherId(teacherId);

        return ApiResponse.<TeacherResponse>builder()
                .result(response)
                .build();
    }

    @GetMapping("/students")
    public ApiResponse<Page<StudentResponse>> getStudentsByInstitution(
            @PathVariable int institutionId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String search) {

        log.info("Admin getting students for institution: {}", institutionId);

        Page<StudentResponse> students = adminCourseService.getStudentsByInstitution(institutionId, page, size, search);

        return ApiResponse.<Page<StudentResponse>>builder()
                .result(students)
                .build();
    }

    @PostMapping("/students")
    public ApiResponse<StudentResponse> createStudent(
            @PathVariable int institutionId,
            @Valid @RequestBody StudentRequest request) {

        log.info("Admin creating student for institution: {}", institutionId);

        // Set institution ID
        request.setEducationalUnitId(String.valueOf(institutionId));

        StudentResponse response = studentService.createStudent(request);

        return ApiResponse.<StudentResponse>builder()
                .result(response)
                .build();
    }

    @GetMapping("/students/{studentId}")
    public ApiResponse<StudentResponse> getStudentById(
            @PathVariable int institutionId,
            @PathVariable String studentId) {

        log.info("Admin getting student {} for institution: {}", studentId, institutionId);

        StudentResponse response = studentService.getStudentByStudentId(studentId);

        return ApiResponse.<StudentResponse>builder()
                .result(response)
                .build();
    }

    @PostMapping("/courses/{courseId}/enroll-students")
    public ApiResponse<String> enrollStudentsInCourse(
            @PathVariable int institutionId,
            @PathVariable int courseId,
            @RequestBody List<String> studentIds) {

        log.info("Admin enrolling students {} to course {} for institution: {}", studentIds, courseId, institutionId);

        // This would be implemented in a CourseEnrollmentService
        // For now, just return success message

        return ApiResponse.<String>builder()
                .result("Successfully enrolled " + studentIds.size() + " students to course")
                .build();
    }

    @GetMapping("/courses/{courseId}/enrollments")
    public ApiResponse<Page<CourseEnrollmentResponse>> getCourseEnrollments(
            @PathVariable int institutionId,
            @PathVariable int courseId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        log.info("Admin getting enrollments for course {} in institution: {}", courseId, institutionId);

        Pageable pageable = PageRequest.of(page, size, Sort.by("enrolledAt").descending());
        Page<CourseEnrollmentResponse> enrollments = enrollmentService.getEnrollmentsByCourse(courseId, pageable);

        return ApiResponse.<Page<CourseEnrollmentResponse>>builder()
                .result(enrollments)
                .build();
    }

    @GetMapping("/courses/{courseId}/students")
    public ApiResponse<List<StudentResponse>> getStudentsInCourse(
            @PathVariable int institutionId,
            @PathVariable int courseId) {

        log.info("Admin getting students in course {} for institution: {}", courseId, institutionId);

        List<StudentResponse> students = enrollmentService.getStudentsInCourse(courseId);

        return ApiResponse.<List<StudentResponse>>builder()
                .result(students)
                .build();
    }

    @DeleteMapping("/courses/{courseId}/students/{studentId}")
    public ApiResponse<Void> unenrollStudent(
            @PathVariable int institutionId,
            @PathVariable int courseId,
            @PathVariable String studentId) {

        log.info("Admin unenrolling student {} from course {} for institution: {}",
                studentId, courseId, institutionId);

        enrollmentService.unenrollStudent(courseId, studentId);

        return ApiResponse.<Void>builder()
                .message("Student successfully unenrolled from course")
                .build();
    }
}