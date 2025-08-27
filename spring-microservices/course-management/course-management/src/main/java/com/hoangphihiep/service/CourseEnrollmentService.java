package com.hoangphihiep.service;

import com.hoangphihiep.dto.response.ApiResponse;
import com.hoangphihiep.dto.response.CourseEnrollmentResponse;
import com.hoangphihiep.dto.response.StudentResponse;
import com.hoangphihiep.entity.Course;
import com.hoangphihiep.entity.CourseEnrollment;
import com.hoangphihiep.exception.AppException;
import com.hoangphihiep.exception.ErrorCode;
import com.hoangphihiep.mapper.CourseEnrollmentMapper;
import com.hoangphihiep.repository.CourseEnrollmentRepository;
import com.hoangphihiep.repository.CourseRepository;
import com.hoangphihiep.repository.httpclient.StudentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Date;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class CourseEnrollmentService {

    private final CourseEnrollmentRepository enrollmentRepository;
    private final CourseRepository courseRepository;
    private final StudentRepository studentRepository;
    private final CourseEnrollmentMapper enrollmentMapper;

    @Transactional
    public List<CourseEnrollmentResponse> enrollStudentsInCourse(int courseId, List<String> studentIds) {
        log.info("Enrolling {} students in course {}", studentIds.size(), courseId);

        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new AppException(ErrorCode.COURSE_NOT_FOUND));

        // Validate course capacity
        int currentEnrollments = enrollmentRepository.countByCourseId(courseId);
        if (course.getMaxStudents() != null &&
                currentEnrollments + studentIds.size() > course.getMaxStudents()) {
            throw new AppException(ErrorCode.COURSE_CAPACITY_EXCEEDED);
        }

        List<CourseEnrollmentResponse> results = studentIds.stream()
                .map(studentId -> enrollSingleStudent(course, studentId))
                .collect(Collectors.toList());

        // Update current students count
        course.setCurrentStudents(enrollmentRepository.countByCourseId(courseId));
        courseRepository.save(course);

        log.info("Successfully enrolled {} students in course {}", results.size(), courseId);
        return results;
    }

    private CourseEnrollmentResponse enrollSingleStudent(Course course, String studentId) {
        // Check if student exists
        try {
            ApiResponse<StudentResponse> studentResponse = studentRepository.getStudentByStudentId(studentId);
            if (studentResponse.getResult() == null) {
                throw new AppException(ErrorCode.STUDENT_NOT_FOUND);
            }

            // Validate student belongs to same institution
            StudentResponse student = studentResponse.getResult();
            if (!student.getEducationalUnitId().equals(String.valueOf(course.getInstitution().getId()))) {
                throw new AppException(ErrorCode.STUDENT_NOT_BELONGS_TO_INSTITUTION);
            }

        } catch (Exception e) {
            log.error("Error validating student {}: {}", studentId, e.getMessage());
            throw new AppException(ErrorCode.STUDENT_VALIDATION_FAILED);
        }

        // Check if already enrolled
        if (enrollmentRepository.existsByCourseIdAndStudentId(course.getId(), studentId)) {
            log.warn("Student {} is already enrolled in course {}", studentId, course.getId());
            throw new AppException(ErrorCode.STUDENT_ALREADY_ENROLLED);
        }

        // Create enrollment
        CourseEnrollment enrollment = CourseEnrollment.builder()
                .course(course)
                .studentId(studentId)
                .enrolledAt(new Date())
                .status("ACTIVE")
                .build();

        CourseEnrollment savedEnrollment = enrollmentRepository.save(enrollment);
        log.info("Student {} enrolled in course {}", studentId, course.getId());

        return enrollmentMapper.toEnrollmentResponse(savedEnrollment);
    }

    public Page<CourseEnrollmentResponse> getEnrollmentsByCourse(int courseId, Pageable pageable) {
        log.info("Getting enrollments for course: {}", courseId);

        if (!courseRepository.existsById(courseId)) {
            throw new AppException(ErrorCode.COURSE_NOT_FOUND);
        }

        Page<CourseEnrollment> enrollments = enrollmentRepository.findByCourseId(courseId, pageable);
        return enrollments.map(enrollmentMapper::toEnrollmentResponse);
    }

    public Page<CourseEnrollmentResponse> getEnrollmentsByStudent(String studentId, Pageable pageable) {
        log.info("Getting enrollments for student: {}", studentId);

        Page<CourseEnrollment> enrollments = enrollmentRepository.findByStudentId(studentId, pageable);
        return enrollments.map(enrollmentMapper::toEnrollmentResponse);
    }

    @Transactional
    public void unenrollStudent(int courseId, String studentId) {
        log.info("Unenrolling student {} from course {}", studentId, courseId);

        CourseEnrollment enrollment = enrollmentRepository.findByCourseIdAndStudentId(courseId, studentId)
                .orElseThrow(() -> new AppException(ErrorCode.ENROLLMENT_NOT_FOUND));

        enrollmentRepository.delete(enrollment);

        // Update current students count
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new AppException(ErrorCode.COURSE_NOT_FOUND));
        course.setCurrentStudents(enrollmentRepository.countByCourseId(courseId));
        courseRepository.save(course);

        log.info("Student {} unenrolled from course {}", studentId, courseId);
    }

    public List<StudentResponse> getStudentsInCourse(int courseId) {
        log.info("Getting students enrolled in course: {}", courseId);

        if (!courseRepository.existsById(courseId)) {
            throw new AppException(ErrorCode.COURSE_NOT_FOUND);
        }

        List<String> studentIds = enrollmentRepository.findStudentIdsByCourseId(courseId);

        return studentIds.stream()
                .map(this::getStudentById)
                .collect(Collectors.toList());
    }

    private StudentResponse getStudentById(String studentId) {
        try {
            ApiResponse<StudentResponse> response = studentRepository.getStudentByStudentId(studentId);
            if (response.getResult() == null) {
                log.warn("Student {} not found in identity service", studentId);
                return null;
            }
            return response.getResult();
        } catch (Exception e) {
            log.error("Error getting student {}: {}", studentId, e.getMessage());
            return null;
        }
    }
}