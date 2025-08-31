package com.hoangphihiep.service;

import com.hoangphihiep.dto.request.CourseEnrollmentRequest;
import com.hoangphihiep.dto.response.*;
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

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class CourseEnrollmentService {

    private final CourseEnrollmentRepository enrollmentRepository;
    private final CourseRepository courseRepository;
    private final StudentRepository studentRepository;
    private final CourseEnrollmentMapper enrollmentMapper;

    private static final String ENROLLMENT_STATUS_ACTIVE = "ACTIVE";
    private static final String ENROLLMENT_STATUS_DROPPED = "DROPPED";

    /**
     * Enroll multiple students to a course
     */
    @Transactional
    public void enrollStudentsToCourse(int courseId, List<String> studentIds) {
        validateEnrollmentRequest(courseId, studentIds);

        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new AppException(ErrorCode.COURSE_NOT_FOUND));

        // Validate students exist and belong to the same institution
        List<StudentResponse> validStudents = validateStudentsForEnrollment(studentIds, course.getInstitution().getId());

        // Check current enrollment count
        int currentEnrollmentCount = enrollmentRepository.countByCourseId(courseId);
        int availableSlots = course.getMaxStudents() - currentEnrollmentCount;

        if (studentIds.size() > availableSlots) {
            throw new AppException(ErrorCode.COURSE_ENROLLMENT_CAPACITY_EXCEEDED);
        }

        // Filter out already enrolled students
        List<String> studentsToEnroll = studentIds.stream()
                .filter(studentId -> !enrollmentRepository.existsByCourseIdAndStudentId(courseId, studentId))
                .collect(Collectors.toList());

        if (studentsToEnroll.isEmpty()) {
            throw new AppException(ErrorCode.COURSE_ENROLLMENT_ALL_ALREADY_ENROLLED);
        }

        try {
            // Create enrollments
            List<CourseEnrollment> enrollments = studentsToEnroll.stream()
                    .map(studentId -> {
                        CourseEnrollment enrollment = new CourseEnrollment();
                        enrollment.setCourse(course);
                        enrollment.setStudentId(studentId);
                        enrollment.setEnrolledAt(new Date());
                        enrollment.setStatus(ENROLLMENT_STATUS_ACTIVE);
                        return enrollment;
                    })
                    .collect(Collectors.toList());

            enrollmentRepository.saveAll(enrollments);

            // Update course current students count
            course.setCurrentStudents(currentEnrollmentCount + studentsToEnroll.size());
            courseRepository.save(course);

            log.info("Successfully enrolled {} students to course {}", studentsToEnroll.size(), courseId);

        } catch (Exception e) {
            log.error("Error enrolling students to course {}: {}", courseId, e.getMessage(), e);
            throw new AppException(ErrorCode.COURSE_ENROLLMENT_FAILED);
        }
    }

    /**
     * Get enrollments for a specific course with pagination
     */
    public Page<CourseEnrollmentResponse> getEnrollmentsByCourse(int courseId, Pageable pageable) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new AppException(ErrorCode.COURSE_NOT_FOUND));

        try {
            Page<CourseEnrollment> enrollmentPage = enrollmentRepository.findByCourseId(courseId, pageable);

            return enrollmentPage.map(enrollment -> {
                CourseEnrollmentResponse response = enrollmentMapper.toEnrollmentResponse(enrollment);

                // Fetch student details
                try {
                    ApiResponse<StudentResponse> studentApiResponse = studentRepository.getStudentByStudentId(enrollment.getStudentId());
                    if (studentApiResponse != null && studentApiResponse.getResult() != null) {
                        StudentResponse student = studentApiResponse.getResult();
                        response.setStudentName(student.getFirstName() + " " + student.getLastName());
                    }
                } catch (Exception e) {
                    log.warn("Could not fetch student details for studentId: {} in course: {}",
                            enrollment.getStudentId(), courseId, e);
                    response.setStudentName("Unknown Student");
                }

                return response;
            });

        } catch (Exception e) {
            log.error("Error fetching enrollments for course {}: {}", courseId, e.getMessage(), e);
            throw new AppException(ErrorCode.UNCATEGORIZED_EXCEPTION);
        }
    }

    /**
     * Get students enrolled in a course
     */
    public List<StudentResponse> getStudentsInCourse(int courseId) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new AppException(ErrorCode.COURSE_NOT_FOUND));

        try {
            List<String> studentIds = enrollmentRepository.findStudentIdsByCourseId(courseId);

            if (studentIds.isEmpty()) {
                return new ArrayList<>();
            }

            // Batch fetch student details
            List<StudentResponse> students = new ArrayList<>();
            for (String studentId : studentIds) {
                try {
                    ApiResponse<StudentResponse> response = studentRepository.getStudentByStudentId(studentId);
                    if (response != null && response.getResult() != null) {
                        students.add(response.getResult());
                    }
                } catch (Exception e) {
                    log.warn("Could not fetch student details for studentId: {}", studentId, e);
                }
            }

            return students;

        } catch (Exception e) {
            log.error("Error fetching students for course {}: {}", courseId, e.getMessage(), e);
            throw new AppException(ErrorCode.UNCATEGORIZED_EXCEPTION);
        }
    }

    /**
     * Unenroll a student from a course
     */
    @Transactional
    public void unenrollStudent(int courseId, String studentId) {
        if (!enrollmentRepository.existsByCourseIdAndStudentId(courseId, studentId)) {
            throw new AppException(ErrorCode.COURSE_ENROLLMENT_NOT_FOUND);
        }

        try {
            enrollmentRepository.deleteByCourseIdAndStudentId(courseId, studentId);

            // Update course current students count
            Course course = courseRepository.findById(courseId)
                    .orElseThrow(() -> new AppException(ErrorCode.COURSE_NOT_FOUND));

            int currentCount = enrollmentRepository.countByCourseId(courseId);
            course.setCurrentStudents(currentCount);
            courseRepository.save(course);

            log.info("Successfully unenrolled student {} from course {}", studentId, courseId);

        } catch (Exception e) {
            log.error("Error unenrolling student {} from course {}: {}", studentId, courseId, e.getMessage(), e);
            throw new AppException(ErrorCode.COURSE_UNENROLLMENT_FAILED);
        }
    }

    /**
     * Get enrollments for a specific student
     */
    public Page<CourseEnrollmentResponse> getEnrollmentsByStudent(String studentId, Pageable pageable) {
        try {
            // Verify student exists
            ApiResponse<StudentResponse> studentApiResponse = studentRepository.getStudentByStudentId(studentId);
            if (studentApiResponse == null || studentApiResponse.getResult() == null) {
                throw new AppException(ErrorCode.STUDENT_NOT_FOUND);
            }

            Page<CourseEnrollment> enrollmentPage = enrollmentRepository.findByStudentId(studentId, pageable);

            return enrollmentPage.map(enrollment -> {
                CourseEnrollmentResponse response = enrollmentMapper.toEnrollmentResponse(enrollment);
                response.setStudentName(studentApiResponse.getResult().getFirstName() + " " +
                        studentApiResponse.getResult().getLastName());
                return response;
            });

        } catch (Exception e) {
            log.error("Error fetching enrollments for student {}: {}", studentId, e.getMessage(), e);
            throw new AppException(ErrorCode.UNCATEGORIZED_EXCEPTION);
        }
    }

    /**
     * Check if a student is enrolled in a course
     */
    public boolean isStudentEnrolledInCourse(int courseId, String studentId) {
        return enrollmentRepository.existsByCourseIdAndStudentId(courseId, studentId);
    }

    /**
     * Get enrollment count for a course
     */
    public int getEnrollmentCountByCourse(int courseId) {
        return enrollmentRepository.countByCourseId(courseId);
    }

    /**
     * Get list of enrolled student IDs for a course
     */
    public List<String> getEnrolledStudentIds(int courseId) {
        return enrollmentRepository.findStudentIdsByCourseId(courseId);
    }

    /**
     * Remove a specific enrollment by ID
     */
    @Transactional
    public void removeEnrollment(Long enrollmentId, int courseId) {
        CourseEnrollment enrollment = enrollmentRepository.findById(enrollmentId)
                .orElseThrow(() -> new AppException(ErrorCode.COURSE_ENROLLMENT_NOT_FOUND));

        try {
            enrollmentRepository.delete(enrollment);

            // Update course current students count
            Course course = courseRepository.findById(courseId)
                    .orElseThrow(() -> new AppException(ErrorCode.COURSE_NOT_FOUND));

            int currentCount = enrollmentRepository.countByCourseId(courseId);
            course.setCurrentStudents(currentCount);
            courseRepository.save(course);

            log.info("Successfully removed enrollment {} from course {}", enrollmentId, courseId);

        } catch (Exception e) {
            log.error("Error removing enrollment {} from course {}: {}", enrollmentId, courseId, e.getMessage(), e);
            throw new AppException(ErrorCode.COURSE_UNENROLLMENT_FAILED);
        }
    }

    // Private helper methods

    private void validateEnrollmentRequest(int courseId, List<String> studentIds) {
        if (courseId <= 0) {
            throw new AppException(ErrorCode.INVALID_REQUEST);
        }

        if (studentIds == null || studentIds.isEmpty()) {
            throw new AppException(ErrorCode.COURSE_ENROLLMENT_EMPTY_STUDENT_LIST);
        }

        // Remove duplicates and null/empty values
        Set<String> uniqueStudentIds = studentIds.stream()
                .filter(Objects::nonNull)
                .filter(id -> !id.trim().isEmpty())
                .collect(Collectors.toSet());

        if (uniqueStudentIds.size() != studentIds.size()) {
            throw new AppException(ErrorCode.COURSE_ENROLLMENT_DUPLICATE_STUDENTS);
        }

        if (uniqueStudentIds.size() > 50) { // Limit batch size
            throw new AppException(ErrorCode.COURSE_ENROLLMENT_BATCH_SIZE_EXCEEDED);
        }
    }

    private List<StudentResponse> validateStudentsForEnrollment(List<String> studentIds, int institutionId) {
        List<StudentResponse> validStudents = new ArrayList<>();

        for (String studentId : studentIds) {
            try {
                ApiResponse<StudentResponse> response = studentRepository.getStudentByStudentId(studentId);

                if (response == null || response.getResult() == null) {
                    throw new AppException(ErrorCode.STUDENT_NOT_FOUND);
                }

                StudentResponse student = response.getResult();

                // Verify student belongs to the same institution
                if (!String.valueOf(institutionId).equals(student.getEducationalUnitId())) {
                    throw new AppException(ErrorCode.STUDENT_NOT_BELONGS_TO_INSTITUTION);
                }

                validStudents.add(student);

            } catch (Exception e) {
                log.error("Error validating student {} for enrollment: {}", studentId, e.getMessage());
                throw new AppException(ErrorCode.STUDENT_VALIDATION_FAILED);
            }
        }

        return validStudents;
    }
}