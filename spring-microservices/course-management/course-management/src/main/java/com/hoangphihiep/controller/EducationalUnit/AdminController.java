package com.hoangphihiep.controller.EducationalUnit;

import com.hoangphihiep.dto.request.CourseRequest;
import com.hoangphihiep.dto.request.DepartmentRequest;
import com.hoangphihiep.dto.request.TeacherRequest;
import com.hoangphihiep.dto.request.StudentRequest;
import com.hoangphihiep.dto.response.*;
import com.hoangphihiep.exception.AppException;
import com.hoangphihiep.exception.ErrorCode;
import com.hoangphihiep.repository.httpclient.StudentRepository;
import com.hoangphihiep.service.CourseEnrollmentService;
import com.hoangphihiep.service.CourseService;
import com.hoangphihiep.service.TeacherService;
import com.hoangphihiep.service.StudentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/admin/institutions/{institutionId}")
@RequiredArgsConstructor
@Slf4j
public class AdminController {
    private final StudentRepository studentRepository;

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

        try {
            enrollmentService.enrollStudentsToCourse(courseId, studentIds);

            String message = String.format("Successfully enrolled %d students to course", studentIds.size());

            return ApiResponse.<String>builder()
                    .result(message)
                    .build();

        } catch (AppException e) {
            log.error("Failed to enroll students to course {}: {}", courseId, e.getMessage());
            throw e;
        } catch (Exception e) {
            log.error("Unexpected error enrolling students to course {}: {}", courseId, e.getMessage(), e);
            throw new AppException(ErrorCode.COURSE_ENROLLMENT_FAILED);
        }
    }

    @GetMapping("/courses/{courseId}/available-students")
    public ApiResponse<Page<StudentResponse>> getAvailableStudentsForCourse(
            @PathVariable int institutionId,
            @PathVariable int courseId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String search) {

        log.info("Admin getting available students for course {} in institution: {}", courseId, institutionId);

        try {
            // Get all students from the institution
            ApiResponse<Page<StudentResponse>> allStudentsResponse = studentRepository.getStudentsByInstitution(
                    institutionId, page, size, search);

            if (allStudentsResponse.getResult() == null) {
                throw new AppException(ErrorCode.STUDENT_NOT_FOUND);
            }

            Page<StudentResponse> allStudents = allStudentsResponse.getResult();

            // Get already enrolled student IDs for this course
            List<String> enrolledStudentIds = enrollmentService.getEnrolledStudentIds(courseId);

            // Filter out already enrolled students
            List<StudentResponse> availableStudents = allStudents.getContent().stream()
                    .filter(student -> !enrolledStudentIds.contains(student.getId()))
                    .collect(Collectors.toList());

            // Create new page with filtered results
            Page<StudentResponse> availableStudentsPage = new PageImpl<>(
                    availableStudents,
                    allStudents.getPageable(),
                    Math.max(0, allStudents.getTotalElements() - enrolledStudentIds.size())
            );

            return ApiResponse.<Page<StudentResponse>>builder()
                    .result(availableStudentsPage)
                    .build();

        } catch (Exception e) {
            log.error("Error getting available students for course {}: {}", courseId, e.getMessage(), e);
            throw new AppException(ErrorCode.UNCATEGORIZED_EXCEPTION);
        }
    }

    @DeleteMapping("/courses/{courseId}/enrollments/{enrollmentId}")
    public ApiResponse<Void> removeEnrollment(
            @PathVariable int institutionId,
            @PathVariable int courseId,
            @PathVariable Long enrollmentId) {

        log.info("Admin removing enrollment {} from course {} for institution: {}",
                enrollmentId, courseId, institutionId);

        try {
            enrollmentService.removeEnrollment(enrollmentId, courseId);

            return ApiResponse.<Void>builder()
                    .message("Student successfully unenrolled from course")
                    .build();

        } catch (Exception e) {
            log.error("Error removing enrollment {}: {}", enrollmentId, e.getMessage(), e);
            throw new AppException(ErrorCode.COURSE_UNENROLLMENT_FAILED);
        }
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

    // Lấy danh sách departments của đơn vị đào tạo
    @GetMapping("/departments")
    public ApiResponse<Page<DepartmentResponse>> getDepartmentsByInstitution(
            @PathVariable int institutionId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String search) {

        log.info("Admin getting departments for institution: {}", institutionId);

        Page<DepartmentResponse> departments = adminCourseService.getDepartmentsByInstitution(institutionId, page, size, search);

        return ApiResponse.<Page<DepartmentResponse>>builder()
                .result(departments)
                .build();
    }

    // Tạo department cho đơn vị đào tạo
    @PostMapping("/departments")
    public ApiResponse<DepartmentResponse> createDepartment(
            @PathVariable int institutionId,
            @Valid @RequestBody DepartmentRequest request) {

        log.info("Admin creating department for institution: {}", institutionId);

        DepartmentResponse response = adminCourseService.createDepartmentForInstitution(institutionId, request);

        return ApiResponse.<DepartmentResponse>builder()
                .result(response)
                .build();
    }

    // Cập nhật department
    @PutMapping("/departments/{departmentId}")
    public ApiResponse<DepartmentResponse> updateDepartment(
            @PathVariable int institutionId,
            @PathVariable int departmentId,
            @Valid @RequestBody DepartmentRequest request) {

        log.info("Admin updating department {} for institution: {}", departmentId, institutionId);

        DepartmentResponse response = adminCourseService.updateDepartmentForInstitution(institutionId, departmentId, request);

        return ApiResponse.<DepartmentResponse>builder()
                .result(response)
                .build();
    }
    // Lấy department theo ID
    @GetMapping("/departments/{departmentId}")
    public ApiResponse<DepartmentResponse> getDepartmentById(
            @PathVariable int institutionId,
            @PathVariable int departmentId) {

        log.info("Admin getting department {} for institution: {}", departmentId, institutionId);

        DepartmentResponse response = adminCourseService.getDepartmentByIdForInstitution(institutionId, departmentId);

        return ApiResponse.<DepartmentResponse>builder()
                .result(response)
                .build();
    }
}