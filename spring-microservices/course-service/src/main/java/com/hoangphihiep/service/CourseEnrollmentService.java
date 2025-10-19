package com.hoangphihiep.service;

import com.hoangphihiep.dto.response.*;
import com.hoangphihiep.entity.CourseClass;
import com.hoangphihiep.entity.CourseEnrollment;
import com.hoangphihiep.exception.AppException;
import com.hoangphihiep.exception.ErrorCode;
import com.hoangphihiep.repository.CourseClassRepository;
import com.hoangphihiep.repository.CourseEnrollmentRepository;
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
    private final CourseClassRepository classRepository;
    private final StudentRepository studentRepository;

    private static final String ENROLLMENT_STATUS_ACTIVE = "ACTIVE";

    /**
     * Enroll multiple students to a class
     */
    @Transactional
    public void enrollStudentsToClass(Long classId, List<String> studentIds) {
        validateEnrollmentRequest(classId, studentIds);

        CourseClass courseClass = classRepository.findById(classId)
                .orElseThrow(() -> new AppException(ErrorCode.CLASS_NOT_FOUND));

        List<StudentResponse> validStudents = validateStudentsForEnrollment(studentIds, courseClass.getCourse().getEducationalUnit().getId());

        // Check current enrollment count
        int currentEnrollmentCount = courseClass.getCurrentStudents();
        int availableSlots = courseClass.getMaxStudents() - currentEnrollmentCount;

        if (studentIds.size() > availableSlots) {
            throw new AppException(ErrorCode.COURSE_ENROLLMENT_CAPACITY_EXCEEDED);
        }

        // Filter out already enrolled students
        List<String> studentsToEnroll = studentIds.stream()
                .filter(studentId -> !enrollmentRepository.existsByClassIdAndStudentId(classId, studentId))
                .collect(Collectors.toList());

        if (studentsToEnroll.isEmpty()) {
            throw new AppException(ErrorCode.COURSE_ENROLLMENT_ALL_ALREADY_ENROLLED);
        }

        try {
            // Create enrollments
            List<CourseEnrollment> enrollments = studentsToEnroll.stream()
                    .map(studentId -> {
                        CourseEnrollment enrollment = new CourseEnrollment();
                        enrollment.setCourse(courseClass.getCourse());
                        enrollment.setCourseClass(courseClass);
                        enrollment.setStudentId(studentId);
                        enrollment.setEnrolledAt(new Date());
                        enrollment.setStatus(ENROLLMENT_STATUS_ACTIVE);
                        return enrollment;
                    })
                    .collect(Collectors.toList());

            enrollmentRepository.saveAll(enrollments);

            // Update class current students count
            courseClass.setCurrentStudents(currentEnrollmentCount + studentsToEnroll.size());
            classRepository.save(courseClass);

            log.info("Successfully enrolled {} students to class {}", studentsToEnroll.size(), classId);

        } catch (Exception e) {
            log.error("Error enrolling students to class {}: {}", classId, e.getMessage(), e);
            throw new AppException(ErrorCode.COURSE_ENROLLMENT_FAILED);
        }
    }

    /**
     * Get students enrolled in a class
     */
    public List<StudentResponse> getStudentsInClass(Long classId) {
        CourseClass courseClass = classRepository.findById(classId)
                .orElseThrow(() -> new AppException(ErrorCode.CLASS_NOT_FOUND));

        try {
            List<String> studentIds = enrollmentRepository.findStudentIdsByClassId(classId);

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
            log.error("Error fetching students for class {}: {}", classId, e.getMessage(), e);
            throw new AppException(ErrorCode.UNCATEGORIZED_EXCEPTION);
        }
    }

    /**
     * Get available students for a class (not yet enrolled)
     */
    public List<StudentResponse> getAvailableStudentsForClass(Long classId, Integer educationalUnitId) {
        CourseClass courseClass = classRepository.findById(classId)
                .orElseThrow(() -> new AppException(ErrorCode.CLASS_NOT_FOUND));

        try {
            ApiResponse<List<StudentResponse>> allStudentsResponse = studentRepository.getAllStudentsByEducationalUnit(educationalUnitId);

            if (allStudentsResponse.getResult() == null) {
                return new ArrayList<>();
            }

            List<StudentResponse> allStudents = allStudentsResponse.getResult();

            // Get already enrolled student IDs for this class
            List<String> enrolledStudentIds = enrollmentRepository.findStudentIdsByClassId(classId);

            // Filter out already enrolled students
            return allStudents.stream()
                    .filter(student -> !enrolledStudentIds.contains(student.getId()))
                    .collect(Collectors.toList());

        } catch (Exception e) {
            log.error("Error getting available students for class {}: {}", classId, e.getMessage(), e);
            throw new AppException(ErrorCode.UNCATEGORIZED_EXCEPTION);
        }
    }

    /**
     * Unenroll a student from a class
     */
    @Transactional
    public void unenrollStudentFromClass(Long classId, String studentId) {
        if (!enrollmentRepository.existsByClassIdAndStudentId(classId, studentId)) {
            throw new AppException(ErrorCode.COURSE_ENROLLMENT_NOT_FOUND);
        }

        try {
            enrollmentRepository.deleteByClassIdAndStudentId(classId, studentId);

            // Update class current students count
            CourseClass courseClass = classRepository.findById(classId)
                    .orElseThrow(() -> new AppException(ErrorCode.CLASS_NOT_FOUND));

            int currentCount = enrollmentRepository.countByClassId(classId);
            courseClass.setCurrentStudents(currentCount);
            classRepository.save(courseClass);

            log.info("Successfully unenrolled student {} from class {}", studentId, classId);

        } catch (Exception e) {
            log.error("Error unenrolling student {} from class {}: {}", studentId, classId, e.getMessage(), e);
            throw new AppException(ErrorCode.COURSE_UNENROLLMENT_FAILED);
        }
    }

    /**
     * Remove a specific enrollment by ID
     */
    @Transactional
    public void removeEnrollment(Long enrollmentId, Long classId) {
        CourseEnrollment enrollment = enrollmentRepository.findById(enrollmentId)
                .orElseThrow(() -> new AppException(ErrorCode.COURSE_ENROLLMENT_NOT_FOUND));

        try {
            enrollmentRepository.delete(enrollment);

            // Update class current students count
            CourseClass courseClass = classRepository.findById(classId)
                    .orElseThrow(() -> new AppException(ErrorCode.CLASS_NOT_FOUND));

            int currentCount = enrollmentRepository.countByClassId(classId);
            courseClass.setCurrentStudents(currentCount);
            classRepository.save(courseClass);

            log.info("Successfully removed enrollment {} from class {}", enrollmentId, classId);

        } catch (Exception e) {
            log.error("Error removing enrollment {} from class {}: {}", enrollmentId, classId, e.getMessage(), e);
            throw new AppException(ErrorCode.COURSE_UNENROLLMENT_FAILED);
        }
    }

    /**
     * Check if a student is enrolled in a class
     */
    public boolean isStudentEnrolledInClass(Long classId, String studentId) {
        return enrollmentRepository.existsByClassIdAndStudentId(classId, studentId);
    }

    /**
     * Get enrollment count for a class
     */
    public int getEnrollmentCountByClass(Long classId) {
        return enrollmentRepository.countByClassId(classId);
    }

    /**
     * Get list of enrolled student IDs for a class
     */
    public List<String> getEnrolledStudentIds(Long classId) {
        return enrollmentRepository.findStudentIdsByClassId(classId);
    }

    // Private helper methods

    private void validateEnrollmentRequest(Long classId, List<String> studentIds) {
        if (classId == null || classId <= 0) {
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

    private List<StudentResponse> validateStudentsForEnrollment(List<String> studentIds, int educationalUnitId) {
        List<StudentResponse> validStudents = new ArrayList<>();

        for (String studentId : studentIds) {
            try {
                ApiResponse<StudentResponse> response = studentRepository.getStudentByStudentId(studentId);

                if (response == null || response.getResult() == null) {
                    throw new AppException(ErrorCode.STUDENT_NOT_FOUND);
                }

                StudentResponse student = response.getResult();

                if (!String.valueOf(educationalUnitId).equals(student.getEducationalUnitId())) {
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