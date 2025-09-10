package com.hoangphihiep.controller.EducationalUnit;

import com.hoangphihiep.dto.request.*;
import com.hoangphihiep.dto.response.*;
import com.hoangphihiep.exception.AppException;
import com.hoangphihiep.exception.ErrorCode;
import com.hoangphihiep.repository.httpclient.StudentRepository;
import com.hoangphihiep.service.*;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.*;
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
    private final CourseClassService classService;

    // ===================== COURSE MANAGEMENT =====================

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

    // ===================== TEACHER MANAGEMENT =====================

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

        TeacherResponse response = teacherService.getTeacherByTeacherId(teacherId);

        return ApiResponse.<TeacherResponse>builder()
                .result(response)
                .build();
    }

    // ===================== STUDENT MANAGEMENT =====================

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

    // ===================== DEPARTMENT MANAGEMENT =====================

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

    // ===================== CLASS MANAGEMENT =====================

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