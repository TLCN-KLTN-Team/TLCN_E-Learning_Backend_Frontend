package com.hoangphihiep.service;

import com.hoangphihiep.dto.response.*;
import com.hoangphihiep.entity.*;
import com.hoangphihiep.events.ClassCreatedEvent;
import com.hoangphihiep.events.EnrollStudentsEvent;
import com.hoangphihiep.events.StudentInfo;
import com.hoangphihiep.exception.AppException;
import com.hoangphihiep.exception.ErrorCode;
import com.hoangphihiep.kafka.producer.ClassEventProducer;
import com.hoangphihiep.kafka.producer.CourseEventProducer;
import com.hoangphihiep.mapper.SectionMapper;
import com.hoangphihiep.repository.*;
import com.hoangphihiep.repository.httpclient.StudentRepository;
import com.hoangphihiep.repository.httpclient.NotificationRepository;
import com.hoangphihiep.dto.request.NotificationMessage;
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
    private final CourseProgressRepository courseProgressRepository;
    private final LessonProgressRepository lessonProgressRepository;
    private final LessonRepository lessonRepository;
    private final NotificationRepository notificationRepository;
    private final ProgressService progressService;

    private static final String ENROLLMENT_STATUS_ACTIVE = "ACTIVE";

    public PaginatedResponse<EnrolledCoursesResponse> getEnrolledCatalogCourses(int page, int size, String search, String sortBy){
        try {
            String userId = SecurityContextHolder.getContext().getAuthentication().getName();
            StudentResponse studentResponse = studentRepository.getStudentById(userId).getResult();

            List<CourseEnrollment> enrollments = new ArrayList<>();
            enrollments.addAll(enrollmentRepository.findByStudentId(userId, Pageable.unpaged()).getContent());
            if (studentResponse != null && studentResponse.getStudentId() != null) {
                enrollments.addAll(enrollmentRepository.findByStudentId(studentResponse.getStudentId(), Pageable.unpaged()).getContent());
            }
            // Deduplicate by classId
            enrollments = enrollments.stream()
                    .collect(Collectors.collectingAndThen(Collectors.toMap(e -> e.getCourseClass().getId(), e -> e, (e1, e2) -> e1), map -> new ArrayList<>(map.values())));

            String normalizedSearch = search == null ? "" : search.trim().toLowerCase(Locale.ROOT);
            List<EnrolledCoursesResponse> enrolledCourses = enrollments.stream()
                    .filter(enrollment -> enrollment.getCourseClass() == null
                            || !Boolean.TRUE.equals(enrollment.getCourseClass().getIsArchived()))
                    .map(enrollment -> {
                        EnrolledCoursesResponse response = new EnrolledCoursesResponse();
                        Course course = enrollment.getCourse();
                        response.setCourseId(course.getId());
                        response.setClassId(enrollment.getCourseClass().getId());
                        response.setCourseName(course.getCourseName());
                        response.setEnrollmentDate(enrollment.getEnrolledAt().toString());

                        double overallProgress = progressService.getClassProgressStats(enrollment.getCourseClass().getId()).getOverallProgress();
                        response.setProgressPercentage(overallProgress);
                        return response;
                    })
                    .filter(response -> normalizedSearch.isEmpty()
                            || response.getCourseName().toLowerCase(Locale.ROOT).contains(normalizedSearch))
                    .sorted((left, right) -> {
                        if ("progress".equalsIgnoreCase(sortBy)) {
                            return Double.compare(right.getProgressPercentage(), left.getProgressPercentage());
                        }
                        return left.getCourseName().compareToIgnoreCase(right.getCourseName());
                    })
                    .toList();

            int totalElements = enrolledCourses.size();
            int totalPages = totalElements == 0 ? 0 : (int) Math.ceil((double) totalElements / size);
            int start = Math.min(page * size, totalElements);
            int end = Math.min(start + size, totalElements);
            List<EnrolledCoursesResponse> pagedCourses = enrolledCourses.subList(start, end);

            return PaginatedResponse.<EnrolledCoursesResponse>builder()
                    .content(pagedCourses)
                    .page(page)
                    .size(size)
                    .totalElements(totalElements)
                    .totalPages(totalPages)
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
        // Get userId from SecurityContext
        String userId = SecurityContextHolder.getContext().getAuthentication().getName();
        log.info("=== getEnrolledCourseContentByClassIdStrict called for classId: {}, userId: {} ===", classId, userId);

        CourseClass courseClass = courseClassRepository.findById(classId)
                .orElseThrow(() -> new AppException(ErrorCode.COURSE_CLASS_NOT_FOUND));

        Course course = courseRepository.findById(courseClass.getCourse().getId())
                .orElseThrow(() -> new AppException(ErrorCode.COURSE_NOT_FOUND));

        log.info("Found course: {} (id: {})", course.getCourseName(), course.getId());

        // CHECK: Verify student has ACTIVE enrollment or auto-enroll if possible
        Optional<CourseEnrollment> enrollmentOpt = enrollmentRepository.findByCourseClassIdAndStudentId(classId, userId);
        CourseEnrollment enrollment;
        
        if (enrollmentOpt.isEmpty()) {
            // Auto-enroll logic: Create enrollment if user doesn't have one
            log.info("User {} not enrolled in class {}. Attempting auto-enrollment...", userId, classId);
            enrollment = autoEnrollUserToClass(userId, courseClass, course);
        } else {
            enrollment = enrollmentOpt.get();
            if (!"ACTIVE".equals(enrollment.getStatus())) {
                log.warn("User {} has invalid enrollment status: {} for class {}", userId, enrollment.getStatus(), classId);
                throw new AppException(ErrorCode.ACCESS_DENIED);
            }
        }

        try {
            List<Section> sections = sectionRepository.findByCourseIdOrderByOrderIndex(course.getId());
            log.info("Found {} sections", sections.size());

            return sections.stream()
                    .filter(section -> isContentVisibleToClass(classId, "SECTION", section.getId()))
                    .map(section -> {
                        log.info("Processing section: {} (id: {})", section.getTitle(), section.getId());
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
                            log.info("Section {} has {} quizzes before filter", section.getTitle(), response.getQuizs().size());
                            Set<QuizResponse> filteredQuizzes = response.getQuizs().stream()
                                    .filter(quiz -> isContentVisibleToClass(classId, "QUIZ", quiz.getId()))
                                    .collect(Collectors.toSet());
                            response.setQuizs(filteredQuizzes);
                            log.info("Section {} has {} quizzes after filter", section.getTitle(), filteredQuizzes.size());

                            // Populate quiz attempts count for each visible quiz
                            filteredQuizzes.forEach(quizResponse -> {
                                log.info("Counting attempts for quiz: {} (id: {})", quizResponse.getTitle(), quizResponse.getId());
                                int attemptsCount = quizAttemptRepository
                                        .countByIdUserAndQuiz_Id(userId, quizResponse.getId());
                                log.info("Quiz {} (id: {}) - attemptsCount: {} for user: {}", 
                                        quizResponse.getTitle(), quizResponse.getId(), attemptsCount, userId);
                                quizResponse.setAttemptsCount(attemptsCount);
                            });
                        } else {
                            log.info("Section {} has NO quizzes (null)", section.getTitle());
                        }

                        // Filter assignments
                        if (response.getAssignments() != null) {
                            log.info("Section {} has {} assignments before filter", section.getTitle(), response.getAssignments().size());
                            Set<AssignmentResponse> filteredAssignments = response.getAssignments().stream()
                                    .filter(assignment -> isContentVisibleToClass(classId, "ASSIGNMENT", assignment.getId()))
                                    .collect(Collectors.toSet());
                            response.setAssignments(filteredAssignments);
                            log.info("Section {} has {} assignments after filter", section.getTitle(), filteredAssignments.size());

                            // Populate assignment submissions count for each visible assignment
                            filteredAssignments.forEach(assignmentResponse -> {
                                int submissionsCount = assignmentSubmissionRepository
                                        .countByIdUserAndAssignment_Id(userId, assignmentResponse.getId());
                                log.info("Assignment {} (id: {}) - submissionsCount: {} for user: {}", 
                                        assignmentResponse.getTitle(), assignmentResponse.getId(), submissionsCount, userId);
                                assignmentResponse.setSubmissionsCount(submissionsCount);
                            });
                        } else {
                            log.info("Section {} has NO assignments (null)", section.getTitle());
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

    @Transactional
    public CourseEnrollment autoEnrollUserToClass(String userId, CourseClass courseClass, Course course) {
        try {
            log.info("Auto-enrolling user {} to class {} (course: {})", userId, courseClass.getId(), course.getId());
            
            // Check if class has available slots
            if (courseClass.getCurrentStudents() >= courseClass.getMaxStudents()) {
                log.warn("Cannot auto-enroll user {} to class {} - class is full ({}/{})", 
                        userId, courseClass.getId(), courseClass.getCurrentStudents(), courseClass.getMaxStudents());
                throw new AppException(ErrorCode.COURSE_ENROLLMENT_CAPACITY_EXCEEDED);
            }
            
            // Create enrollment
            CourseEnrollment enrollment = new CourseEnrollment();
            enrollment.setCourse(course);
            enrollment.setCourseClass(courseClass);
            enrollment.setStudentId(userId);
            enrollment.setEnrolledAt(new Date());
            enrollment.setStatus(ENROLLMENT_STATUS_ACTIVE);
            enrollmentRepository.save(enrollment);
            
            // Create course progress if not exists
            Optional<CourseProgress> existingProgress = courseProgressRepository
                    .findByUserIdAndCourseId(userId, course.getId());
            
            if (existingProgress.isEmpty()) {
                CourseProgress courseProgress = new CourseProgress();
                courseProgress.setIdUser(userId);
                courseProgress.setCourse(course);
                courseProgress.setProgressPercentage(0.0);
                courseProgress.setStartDate((java.sql.Date) new Date());
                courseProgress.setCompleted(false);
                courseProgressRepository.save(courseProgress);
                log.info("Created course progress for user {} in course {}", userId, course.getId());
            }
            
            // Update class current students count
            courseClass.setCurrentStudents(courseClass.getCurrentStudents() + 1);
            courseClassRepository.save(courseClass);
            
            // Update course total students count
            updateCourseTotalStudents(course.getId());
            
            log.info("Successfully auto-enrolled user {} to class {}", userId, courseClass.getId());
            return enrollment;
            
        } catch (Exception e) {
            log.error("Failed to auto-enroll user {} to class {}: {}", userId, courseClass.getId(), e.getMessage(), e);
            throw new AppException(ErrorCode.COURSE_ENROLLMENT_FAILED);
        }
    }

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
        List<StudentResponse> studentsToEnroll = validStudents.stream()
                .filter(student -> !enrollmentRepository.existsByCourseIdAndStudentId(courseClass.getCourse().getId(), student.getId()) &&
                                   !enrollmentRepository.existsByCourseIdAndStudentId(courseClass.getCourse().getId(), student.getStudentId()))
                .collect(Collectors.toList());

        if (studentsToEnroll.isEmpty()) {
            throw new AppException(ErrorCode.COURSE_ENROLLMENT_ALL_ALREADY_ENROLLED);
        }

        try {
            // Create enrollments using UUID (student.getId())
            List<CourseEnrollment> enrollments = studentsToEnroll.stream()
                    .map(student -> {
                        CourseEnrollment enrollment = new CourseEnrollment();
                        enrollment.setCourse(courseClass.getCourse());
                        enrollment.setCourseClass(courseClass);
                        enrollment.setStudentId(student.getId()); // Store UUID
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

            // Fetch student info để đưa vào event
            Map<String, List<String>> request = new HashMap<>();
            request.put("studentIds", studentIds);
            log.info("Fetching user IDs for notification. Student IDs: {}", studentIds);

            List<String> userIdsOfStudents = studentClient.getUsersByStudentIds(request).getResult();
            log.info("Found {} user IDs for notification: {}", userIdsOfStudents != null ? userIdsOfStudents.size() : 0, userIdsOfStudents);

            // Fetch full student info by userIds
            List<com.hoangphihiep.events.StudentInfo> studentInfoList = new ArrayList<>();
            if (userIdsOfStudents != null && !userIdsOfStudents.isEmpty()) {
                try {
                    Map<String, List<String>> userIdsRequest = new HashMap<>();
                    userIdsRequest.put("userIds", userIdsOfStudents);

                    List<StudentResponse> students = studentClient.getStudentsByUserIds(userIdsRequest).getResult();
                    log.info("✅ Fetched {} student info records", students != null ? students.size() : 0);

                    // Map StudentResponse sang StudentInfo
                    if (students != null) {
                        studentInfoList = students.stream()
                                .map(student -> StudentInfo.builder()
                                        .userId(student.getId())
                                        .username(student.getUsername())
                                        .email(student.getEmail())
                                        .firstName(student.getFirstName())
                                        .lastName(student.getLastName())
                                        .avatarUrl(student.getAvatarUrl())
                                        .studentId(student.getStudentId())
                                        .build())
                                .collect(Collectors.toList());
                    }
                } catch (Exception e) {
                    log.error("❌ Error fetching student info, will send event with userIds only", e);
                    // Fallback: nếu không fetch được student info, vẫn gửi event với userIds
                }
            }

            EnrollStudentsEvent event = EnrollStudentsEvent.builder()
                    .courseId(courseClass.getCourse().getId())
                    .classId(courseClass.getId())
                    .studentIds(userIdsOfStudents) // Backward compatible
                    .students(studentInfoList)      // New field với full info
                    .build();

            producer.addMembersToClassChannel(event);
            log.info("📨 Published STUDENTS_ENROLLED event with {} student info records", studentInfoList.size());

            // Send notification to each enrolled student
            if (userIdsOfStudents != null && !userIdsOfStudents.isEmpty()) {
                for (String userId : userIdsOfStudents) {
                    try {
                        log.info("Sending enrollment notification to user: {}", userId);
                        notificationRepository.sendNotification(NotificationMessage.builder()
                                .userId(userId)
                                .type("ENROLLMENT")
                                .message("Bạn đã được thêm vào lớp học: " + courseClass.getClassName() + " (" + courseClass.getCourse().getCourseName() + ")")
                            .link("/student/dashboard/course/classes/" + courseClass.getId())
                            .data(Map.of(
                                    "classId", courseClass.getId(),
                                    "className", courseClass.getClassName(),
                                    "courseId", courseClass.getCourse().getId(),
                                    "courseName", courseClass.getCourse().getCourseName()
                            ))
                            .build());
                } catch (Exception e) {
                    log.error("Failed to send notification to student {}", userId, e);
                    // Non-blocking, continue with other students
                }
            }
        }

            log.info("Successfully enrolled {} students to class {}", studentsToEnroll.size(), classId);

        } catch (Exception e) {
            log.error("Error enrolling students to class {}: {}", classId, e.getMessage(), e);
            throw new AppException(ErrorCode.COURSE_ENROLLMENT_FAILED);
        }
    }

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

            int totalLessons = lessonRepository.countByCourseId(courseId);
            System.out.println ("tổng số bài học: " + totalLessons);
            // Batch fetch student details with statistics
            List<StudentResponse> students = new ArrayList<>();
            Set<String> processedUserIds = new HashSet<>();
            for (String studentId : studentIds) {
                try {
                    ApiResponse<StudentResponse> response;
                    if (studentId.contains("-") && studentId.length() == 36) { // It's a UUID
                        response = studentRepository.getStudentById(studentId);
                    } else { // It's a student code
                        response = studentRepository.getStudentByStudentId(studentId);
                    }
                    
                    if (response != null && response.getResult() != null) {
                        StudentResponse student = response.getResult();
                        if (processedUserIds.contains(student.getId())) {
                            continue; // Skip duplicate
                        }
                        processedUserIds.add(student.getId());
                        System.out.println ("user id của student: " + studentId);
                        // Calculate statistics for this student
                        enrichStudentWithStatistics(student, student.getId(), courseId, totalAssignments, totalQuizzes, totalLessons);

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

            // Get already enrolled student IDs for the entire course
            List<String> enrolledStudentIds = enrollmentRepository.findStudentIdsByCourseId(courseClass.getCourse().getId());

            // Filter out already enrolled students
            return allStudents.stream()
                    .filter(student -> !enrolledStudentIds.contains(student.getId()) && !enrolledStudentIds.contains(student.getStudentId()))
                    .collect(Collectors.toList());

        } catch (Exception e) {
            log.error("Error getting available students for class {}: {}", classId, e.getMessage(), e);
            throw new AppException(ErrorCode.UNCATEGORIZED_EXCEPTION);
        }
    }

    @Transactional
    public void unenrollStudentFromClass(Integer classId, String studentId) {
        CourseClass courseClass = classRepository.findById(classId)
                .orElseThrow(() -> new AppException(ErrorCode.CLASS_NOT_FOUND));

        try {
            // studentId could be student CODE or UUID. Let's get both to be safe.
            String userId = studentId;
            String studentCode = studentId;
            try {
                ApiResponse<StudentResponse> response = studentRepository.getStudentByStudentId(studentId);
                if (response != null && response.getResult() != null) {
                    userId = response.getResult().getId();
                }
            } catch (Exception e) {
                // Ignore, might already be a UUID
            }

            enrollmentRepository.deleteByClassIdAndStudentId(classId, studentId);
            if (!userId.equals(studentId)) {
                enrollmentRepository.deleteByClassIdAndStudentId(classId, userId);
            }

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

    @Transactional
    public void updateCourseTotalStudents(int courseId) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new AppException(ErrorCode.COURSE_NOT_FOUND));

        // Get all active (non-archived) classes for this course
        List<CourseClass> classes = classRepository.findAllByCourseId(courseId);

        // Calculate total students across all active classes
        int totalStudents = classes.stream()
                .mapToInt(CourseClass::getCurrentStudents)
                .sum();

        // Update course total students
        course.setCurrentStudents(totalStudents);
        courseRepository.save(course);

        log.info("Updated course {} total students to {}", courseId, totalStudents);
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
                ApiResponse<StudentResponse> response;
                if (studentId.contains("-") && studentId.length() == 36) { // It's a UUID
                    response = studentRepository.getStudentById(studentId);
                } else { // It's a student code
                    response = studentRepository.getStudentByStudentId(studentId);
                }

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
                                             Integer courseId, int totalAssignments, int totalQuizzes, int totalLessons) {
        try {
            // Get submitted assignments count
            int submittedAssignments = submissionRepository.countSubmittedAssignmentsByStudentAndCourse(studentId, courseId);

            // Get completed quizzes count
            int completedQuizzes = quizAttemptRepository.countCompletedQuizzesByStudentAndCourse(studentId, courseId);

            int viewedLessons = lessonProgressRepository.countViewedLessonsByUserAndCourse(studentId, courseId);

            // Calculate average score from both assignments and quizzes
            Double averageScore = calculateAverageScore(studentId, courseId);

            // Set statistics
            student.setSubmittedAssignments(submittedAssignments);
            student.setTotalAssignments(totalAssignments);
            student.setCompletedQuizzes(completedQuizzes);
            student.setTotalQuizzes(totalQuizzes);
            student.setViewedLessons(viewedLessons);
            student.setTotalLessons(totalLessons);
            student.setAverageScore(averageScore != null ? averageScore : 0.0);

        } catch (Exception e) {
            log.warn("Error calculating statistics for student {}: {}", studentId, e.getMessage());
            // Set default values if calculation fails
            student.setSubmittedAssignments(0);
            student.setTotalAssignments(totalAssignments);
            student.setCompletedQuizzes(0);
            student.setTotalQuizzes(totalQuizzes);
            student.setViewedLessons(0);
            student.setTotalLessons(totalLessons);
            student.setAverageScore(0.0);
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
                return ((avgAssignmentScore + avgQuizScore) / 2.0) / 10.0;
            } else if (avgAssignmentScore != null) {
                return avgAssignmentScore / 10.0;
            } else if (avgQuizScore != null) {
                return avgQuizScore / 10.0;
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

                Set<String> processedUserIds = new HashSet<>();

                // Calculate statistics for each student
                for (String studentId : studentIds) {
                    try {
                        ApiResponse<StudentResponse> studentResponse;
                        if (studentId.contains("-") && studentId.length() == 36) { // It's a UUID
                            studentResponse = studentRepository.getStudentById(studentId);
                        } else { // It's a student code
                            studentResponse = studentRepository.getStudentByStudentId(studentId);
                        }
                        
                        if (studentResponse != null && studentResponse.getResult() != null) {
                            String userId = studentResponse.getResult().getId();

                            if (processedUserIds.contains(userId)) {
                                continue;
                            }
                            processedUserIds.add(userId);

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
                int uniqueCount = processedUserIds.size();
                if (uniqueCount > 0) {
                    averageScore = totalScore / uniqueCount;
                    completionRate = totalItems > 0 ? (double) completedCount / uniqueCount : 0.0;
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