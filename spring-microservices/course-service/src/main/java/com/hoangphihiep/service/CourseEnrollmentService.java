package com.hoangphihiep.service;

import com.hoangphihiep.dto.response.*;
import com.hoangphihiep.entity.*;
import com.hoangphihiep.events.ClassCreatedEvent;
import com.hoangphihiep.events.EnrollStudentsEvent;
import com.hoangphihiep.exception.AppException;
import com.hoangphihiep.exception.ErrorCode;
import com.hoangphihiep.kafka.producer.ClassEventProducer;
import com.hoangphihiep.kafka.producer.CourseEventProducer;
import com.hoangphihiep.mapper.SectionMapper;
import com.hoangphihiep.repository.*;
import com.hoangphihiep.repository.httpclient.StudentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.context.SecurityContextHolder;
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
    private final CourseRepository courseRepository;
    private final StudentRepository studentRepository;
    private final CourseClassRepository courseClassRepository;
    private final SectionRepository sectionRepository;
    private final SectionMapper sectionMapper;
    private final ClassContentVisibilityRepository visibilityRepository;
    private final AssignmentRepository assignmentRepository;
    private final AssignmentSubmissionRepository submissionRepository;
    private final QuizRepository quizRepository;
    private final QuizAttemptRepository quizAttemptRepository;
    private final AssignmentSubmissionRepository assignmentSubmissionRepository;
    private final ClassEventProducer producer;
    private final StudentRepository studentClient;

    private static final String ENROLLMENT_STATUS_ACTIVE = "ACTIVE";

    // Get basic course info to show for students who see course catalog
    public PaginatedResponse<EnrolledCoursesResponse> getEnrolledCatalogCourses(int page, int size){
        try {
            String userId = SecurityContextHolder.getContext().getAuthentication().getName();
            StudentResponse studentResponse = studentRepository.getStudentById(userId).getResult();

            Pageable pageable = PageRequest.of(page, size);
            Page<CourseEnrollment> enrollments = enrollmentRepository
                    .findByStudentId(studentResponse.getStudentId(), pageable);
            List<EnrolledCoursesResponse> enrolledCourses = enrollments.stream()
                    .map(enrollment -> {
                        EnrolledCoursesResponse response = new EnrolledCoursesResponse();
                        Course course = courseRepository.findById(enrollment.getCourse().getId())
                                .orElseThrow(() -> new AppException(ErrorCode.COURSE_NOT_FOUND));
                        response.setCourseId(course.getId());
                        response.setClassId(enrollment.getCourseClass().getId());
                        response.setCourseName(course.getCourseName());
                        response.setEnrollmentDate(enrollment.getEnrolledAt().toString());
                        return response;
                    })
                    .toList();

            return PaginatedResponse.<EnrolledCoursesResponse>builder()
                    .content(enrolledCourses)
                    .page(page)
                    .size(size)
                    .totalElements(enrollments.getSize())
                    .totalPages(enrollments.getTotalPages())
                    .build();
        } catch (AppException e) {
            throw e;
        }
        catch (Exception e) {
            log.error("Error occurred while fetching enrolled catalog courses", e);
            throw new AppException(ErrorCode.UNCATEGORIZED_EXCEPTION);
        }
    }

    public List<SectionResponse> getEnrolledCourseContentByClassIdStrict(Integer classId) {
        CourseClass courseClass = courseClassRepository.findById(classId)
                .orElseThrow(() -> new AppException(ErrorCode.COURSE_CLASS_NOT_FOUND));

        Course course = courseRepository.findById(courseClass.getCourse().getId())
                .orElseThrow(() -> new AppException(ErrorCode.COURSE_NOT_FOUND));

        try {
            List<Section> sections = sectionRepository.findByCourseIdOrderByOrderIndex(course.getId());

            return sections.stream()
                    .filter(section -> isContentVisibleToClass(classId, "SECTION", section.getId()))
                    .map(section -> {
                        SectionResponse response = sectionMapper.toSectionResponse(section);

                        // Filter lessons
                        if (response.getLessons() != null) {
                            Set<LessonResponse> filteredLessons = response.getLessons().stream()
                                    .filter(lesson -> isContentVisibleToClass(classId, "LESSON", lesson.getId()))
                                    .collect(Collectors.toSet());
                            response.setLessons(filteredLessons);
                        }

                        // Filter quizzes
                        if (response.getQuizs() != null) {
                            Set<QuizResponse> filteredQuizzes = response.getQuizs().stream()
                                    .filter(quiz -> isContentVisibleToClass(classId, "QUIZ", quiz.getId()))
                                    .collect(Collectors.toSet());
                            response.setQuizs(filteredQuizzes);
                        }

                        // Filter assignments
                        if (response.getAssignments() != null) {
                            Set<AssignmentResponse> filteredAssignments = response.getAssignments().stream()
                                    .filter(assignment -> isContentVisibleToClass(classId, "ASSIGNMENT", assignment.getId()))
                                    .collect(Collectors.toSet());
                            response.setAssignments(filteredAssignments);
                        }

                        return response;
                    })
                    .collect(Collectors.toList());

        } catch (Exception e) {
            log.error("Error getting course content for class {}: {}", classId, e.getMessage(), e);
            throw new AppException(ErrorCode.UNCATEGORIZED_EXCEPTION);
        }
    }

    private boolean isContentVisibleToClass(Integer classId, String contentType, Integer contentId) {
        return visibilityRepository.existsByCourseClassIdAndContentTypeAndContentIdAndIsVisible(
                classId, contentType, contentId, true);
    }

    /**
     * Enroll multiple students to a class
     */
    @Transactional
    public void enrollStudentsToClass(Integer classId, List<String> studentIds) {
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

            // Update course total students count across all classes
            updateCourseTotalStudents(courseClass.getCourse().getId());

            // send event to create channel for a class
            Map<String, List<String>> request = new HashMap<>();
            request.put("studentIds", studentIds);
            List<String> userIdsOfStudents = studentClient.getUsersByStudentIds(request).getResult();
            EnrollStudentsEvent event = EnrollStudentsEvent.builder()
                    .courseId(courseClass.getCourse().getId())
                    .classId(courseClass.getId())
                    .studentIds(userIdsOfStudents)
                    .build();

            producer.addMembersToClassChannel(event);

            log.info("Successfully enrolled {} students to class {}", studentsToEnroll.size(), classId);

        } catch (Exception e) {
            log.error("Error enrolling students to class {}: {}", classId, e.getMessage(), e);
            throw new AppException(ErrorCode.COURSE_ENROLLMENT_FAILED);
        }
    }

    /**
     * Get students enrolled in a class
     */
    public List<StudentResponse> getStudentsInClass(Integer classId) {
        CourseClass courseClass = classRepository.findById(classId)
                .orElseThrow(() -> new AppException(ErrorCode.CLASS_NOT_FOUND));

        try {
            List<String> studentIds = enrollmentRepository.findStudentIdsByClassId(classId);

            if (studentIds.isEmpty()) {
                return new ArrayList<>();
            }

            // Get courseId from the class
            Integer courseId = courseClass.getCourse().getId();

            // Get total assignments and quizzes for this course (through sections)
            int totalAssignments = assignmentRepository.countByCourseId(courseId);
            System.out.println ("tổng số bài tập: " + totalAssignments);

            int totalQuizzes = quizRepository.countByCourseId(courseId);
            System.out.println ("tổng số bài kiểm tra: "+ totalQuizzes);
            // Batch fetch student details with statistics
            List<StudentResponse> students = new ArrayList<>();
            for (String studentId : studentIds) {
                try {
                    ApiResponse<StudentResponse> response = studentRepository.getStudentByStudentId(studentId);
                    if (response != null && response.getResult() != null) {
                        StudentResponse student = response.getResult();
                        System.out.println ("user id của student: " + studentId);
                        // Calculate statistics for this student
                        enrichStudentWithStatistics(student, student.getId(), courseId, totalAssignments, totalQuizzes);

                        students.add(student);
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
    public List<StudentResponse> getAvailableStudentsForClass(Integer classId, Integer educationalUnitId) {
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
    public void unenrollStudentFromClass(Integer classId, String studentId) {
        CourseClass courseClass = classRepository.findById(classId)
                .orElseThrow(() -> new AppException(ErrorCode.CLASS_NOT_FOUND));

        if (!enrollmentRepository.existsByClassIdAndStudentId(classId, studentId)) {
            throw new AppException(ErrorCode.COURSE_ENROLLMENT_NOT_FOUND);
        }

        try {
            enrollmentRepository.deleteByClassIdAndStudentId(classId, studentId);

            // Update class current students count
            int currentCount = enrollmentRepository.countByClassId(classId);
            courseClass.setCurrentStudents(currentCount);
            classRepository.save(courseClass);

            // Update course total students count across all classes
            updateCourseTotalStudents(courseClass.getCourse().getId());

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
    public void removeEnrollment(Integer enrollmentId, Integer classId) {
        CourseEnrollment enrollment = enrollmentRepository.findById(enrollmentId)
                .orElseThrow(() -> new AppException(ErrorCode.COURSE_ENROLLMENT_NOT_FOUND));

        CourseClass courseClass = classRepository.findById(classId)
                .orElseThrow(() -> new AppException(ErrorCode.CLASS_NOT_FOUND));

        try {
            enrollmentRepository.delete(enrollment);

            // Update class current students count
            int currentCount = enrollmentRepository.countByClassId(classId);
            courseClass.setCurrentStudents(currentCount);
            classRepository.save(courseClass);

            // Update course total students count across all classes
            updateCourseTotalStudents(courseClass.getCourse().getId());

            log.info("Successfully removed enrollment {} from class {}", enrollmentId, classId);

        } catch (Exception e) {
            log.error("Error removing enrollment {} from class {}: {}", enrollmentId, classId, e.getMessage(), e);
            throw new AppException(ErrorCode.COURSE_UNENROLLMENT_FAILED);
        }
    }

    /**
     * Update total students count for a course based on all its classes
     */
    @Transactional
    public void updateCourseTotalStudents(int courseId) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new AppException(ErrorCode.COURSE_NOT_FOUND));

        // Get all classes for this course
        List<CourseClass> classes = classRepository.findAllByCourseId(courseId);

        // Calculate total students across all classes
        int totalStudents = classes.stream()
                .mapToInt(CourseClass::getCurrentStudents)
                .sum();

        // Update course total students
        course.setCurrentStudents(totalStudents);
        courseRepository.save(course);

        log.info("Updated course {} total students to {}", courseId, totalStudents);
    }

    @Transactional(readOnly = true)
    public List<SectionResponse> getEnrolledCourseContents(Integer classId) {
        // Lấy userId từ SecurityContext
        String userId = SecurityContextHolder.getContext().getAuthentication().getName();

        // Verify enrollment
        CourseClass courseClass = courseClassRepository.findById(classId)
                .orElseThrow(() -> new AppException(ErrorCode.CLASS_NOT_FOUND));

        Course course = courseClass.getCourse();

        // Get published sections
        List<Section> sections = sectionRepository.findByCourse_IdAndIsPublishedTrue(course.getId());

        // Map to responses with counts
        return sections.stream()
                .map(section -> {
                    SectionResponse response = sectionMapper.toSectionResponse(section);

                    // Populate quiz attempts count for each quiz
                    if (response.getQuizs() != null) {
                        response.getQuizs().forEach(quizResponse -> {
                            int attemptsCount = quizAttemptRepository
                                    .countByIdUserAndQuiz_Id(userId, quizResponse.getId());
                            quizResponse.setAttemptsCount(attemptsCount);
                        });
                    }

                    // Populate assignment submissions count for each assignment
                    if (response.getAssignments() != null) {
                        response.getAssignments().forEach(assignmentResponse -> {
                            int submissionsCount = assignmentSubmissionRepository
                                    .countByIdUserAndAssignment_Id(userId, assignmentResponse.getId());
                            assignmentResponse.setSubmissionsCount(submissionsCount);
                        });
                    }

                    return response;
                })
                .collect(Collectors.toList());
    }

    // Private helper methods

    private void validateEnrollmentRequest(Integer classId, List<String> studentIds) {
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

    private void enrichStudentWithStatistics(StudentResponse student, String studentId,
                                             Integer courseId, int totalAssignments, int totalQuizzes) {
        try {
            // Get submitted assignments count
            int submittedAssignments = submissionRepository.countSubmittedAssignmentsByStudentAndCourse(studentId, courseId);

            // Get completed quizzes count
            int completedQuizzes = quizAttemptRepository.countCompletedQuizzesByStudentAndCourse(studentId, courseId);

            // Calculate average score from both assignments and quizzes
            Double averageScore = calculateAverageScore(studentId, courseId);

            // Set statistics
            student.setSubmittedAssignments(submittedAssignments);
            student.setTotalAssignments(totalAssignments);
            student.setCompletedQuizzes(completedQuizzes);
            student.setTotalQuizzes(totalQuizzes);
            student.setAverageScore(averageScore != null ? averageScore.intValue() : 0);

        } catch (Exception e) {
            log.warn("Error calculating statistics for student {}: {}", studentId, e.getMessage());
            // Set default values if calculation fails
            student.setSubmittedAssignments(0);
            student.setTotalAssignments(totalAssignments);
            student.setCompletedQuizzes(0);
            student.setTotalQuizzes(totalQuizzes);
            student.setAverageScore(0);
        }
    }

    private Double calculateAverageScore(String studentId, Integer courseId) {
        try {
            // Get average assignment score
            Double avgAssignmentScore = submissionRepository.getAverageScoreByStudentAndCourse(studentId, courseId);

            // Get average quiz score
            Double avgQuizScore = quizAttemptRepository.getAverageScoreByStudentAndCourse(studentId, courseId);

            // Calculate combined average
            if (avgAssignmentScore != null && avgQuizScore != null) {
                return (avgAssignmentScore + avgQuizScore) / 2.0;
            } else if (avgAssignmentScore != null) {
                return avgAssignmentScore;
            } else if (avgQuizScore != null) {
                return avgQuizScore;
            }

            return null;
        } catch (Exception e) {
            log.warn("Error calculating average score for student {}: {}", studentId, e.getMessage());
            return null;
        }
    }

    @Transactional(readOnly = true)
    public ClassStudentStatsResponse getClassStatistics(Integer classId) {
        // Verify class exists
        CourseClass courseClass = classRepository.findById(classId)
                .orElseThrow(() -> new AppException(ErrorCode.CLASS_NOT_FOUND));

        try {
            // Get total students count
            Integer totalStudents = enrollmentRepository.countTotalStudentsByClassId(classId);

            // Get active students count
            Integer activeStudents = enrollmentRepository.countActiveStudentsByClassId(classId);

            // Get all student IDs for calculating average score and completion rate
            List<String> studentIds = enrollmentRepository.findStudentIdsForStatistics(classId);

            Double averageScore = 0.0;
            Double completionRate = 0.0;

            if (!studentIds.isEmpty()) {
                Integer courseId = courseClass.getCourse().getId();

                // Get total assignments and quizzes for this course
                int totalAssignments = assignmentRepository.countByCourseId(courseId);
                int totalQuizzes = quizRepository.countByCourseId(courseId);
                int totalItems = totalAssignments + totalQuizzes;

                double totalScore = 0.0;
                int completedCount = 0;

                // Calculate statistics for each student
                for (String studentId : studentIds) {
                    try {
                        // Get student's user ID
                        ApiResponse<StudentResponse> studentResponse = studentRepository.getStudentByStudentId(studentId);
                        if (studentResponse != null && studentResponse.getResult() != null) {
                            String userId = studentResponse.getResult().getId();

                            // Calculate student's average score
                            Double studentAvgScore = calculateAverageScore(userId, courseId);
                            if (studentAvgScore != null) {
                                totalScore += studentAvgScore;
                            }

                            // Check completion status
                            if (totalItems > 0) {
                                int submittedAssignments = submissionRepository.countSubmittedAssignmentsByStudentAndCourse(userId, courseId);
                                int completedQuizzes = quizAttemptRepository.countCompletedQuizzesByStudentAndCourse(userId, courseId);
                                int completedItems = submittedAssignments + completedQuizzes;

                                // Consider completed if student finished >= 80% of total items
                                if (completedItems >= totalItems * 0.8) {
                                    completedCount++;
                                }
                            }
                        }
                    } catch (Exception e) {
                        log.warn("Error calculating statistics for student {}: {}", studentId, e.getMessage());
                    }
                }

                // Calculate averages
                if (studentIds.size() > 0) {
                    averageScore = totalScore / studentIds.size();
                    completionRate = totalItems > 0 ? (double) completedCount / studentIds.size() : 0.0;
                }
            }

            log.info("Class {} statistics - Total: {}, Active: {}, Avg Score: {}, Completion: {}%",
                    classId, totalStudents, activeStudents, averageScore, completionRate * 100);

            return ClassStudentStatsResponse.builder()
                    .totalStudents(totalStudents != null ? totalStudents : 0)
                    .activeStudents(activeStudents != null ? activeStudents : 0)
                    .averageScore(averageScore)
                    .completionRate(completionRate)
                    .build();

        } catch (Exception e) {
            log.error("Error calculating statistics for class {}: {}", classId, e.getMessage(), e);
            // Return default values if calculation fails
            return ClassStudentStatsResponse.builder()
                    .totalStudents(0)
                    .activeStudents(0)
                    .averageScore(0.0)
                    .completionRate(0.0)
                    .build();
        }
    }

}