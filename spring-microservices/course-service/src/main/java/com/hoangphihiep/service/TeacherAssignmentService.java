package com.hoangphihiep.service;

import com.hoangphihiep.dto.request.GradeAssignmentRequest;
import com.hoangphihiep.dto.response.*;
import com.hoangphihiep.entity.Assignment;
import com.hoangphihiep.entity.AssignmentSubmission;
import com.hoangphihiep.entity.CourseClass;
import com.hoangphihiep.exception.AppException;
import com.hoangphihiep.exception.ErrorCode;
import com.hoangphihiep.mapper.AssignmentSubmissionMapper;
import com.hoangphihiep.repository.*;
import com.hoangphihiep.repository.httpclient.StudentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class TeacherAssignmentService {

    private final AssignmentRepository assignmentRepository;
    private final AssignmentSubmissionRepository submissionRepository;
    private final CourseClassRepository classRepository;
    private final CourseRepository courseRepository;
    private final AssignmentSubmissionMapper submissionMapper;
    private final CourseEnrollmentRepository enrollmentRepository;
    private final StudentRepository studentRepository;

    /**
     * Get all submissions for assignments in a specific class
     * Grouped by student with their submission statistics
     */
    public List<AssignmentGradingResponse> getSubmissionsForGrading(Integer classId) {

        log.info("=== GET SUBMISSIONS FOR GRADING - Class ID: {} ===", classId);

        // Verify class exists and teacher has access
        CourseClass courseClass = classRepository.findById(classId)
                .orElseThrow(() -> new AppException(ErrorCode.CLASS_NOT_FOUND));

        Integer courseId = courseClass.getCourse().getId();
        log.info("Course ID: {}", courseId);

        // Get all students in this class (student IDs - MSSV)
        List<String> studentIds = enrollmentRepository.findStudentIdsByClassId(classId);
        log.info("Found {} students in class", studentIds.size());
        studentIds.forEach(id -> log.info("Student ID (MSSV): {}", id));

        if (studentIds.isEmpty()) {
            log.warn("No students found in class {}", classId);
            return new ArrayList<>();
        }

        // Map student IDs to user IDs
        Map<String, String> studentIdToUserIdMap = new HashMap<>();
        Map<String, StudentResponse> studentInfoMap = new HashMap<>();

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
                    String userId = student.getId(); // This is the UUID

                    studentIdToUserIdMap.put(studentId, userId);
                    studentInfoMap.put(userId, student);

                    log.info("Mapped: StudentID {} -> UserID {}", studentId, userId);
                }
            } catch (Exception e) {
                log.error("Error fetching student info for studentId: {}", studentId, e);
            }
        }

        // Get user IDs for query
        List<String> userIds = new ArrayList<>(studentIdToUserIdMap.values());
        log.info("Total user IDs for query: {}", userIds.size());

        if (userIds.isEmpty()) {
            log.warn("No user IDs found after mapping");
            return new ArrayList<>();
        }

        // Get all assignments for this course
        List<Assignment> assignments = assignmentRepository.findByCourseIdOrderByCreatedAtDesc(courseId);
        log.info("Found {} assignments for course", assignments.size());

        // Get all submissions for these USER IDs (not student IDs)
        List<AssignmentSubmission> submissions = submissionRepository
                .findByAssignmentCourseIdAndStudentIds(courseId, userIds);
        log.info("Found {} submissions", submissions.size());

        // Build response grouped by student
        return buildGradingResponse(studentIds, studentIdToUserIdMap, studentInfoMap, assignments, submissions);
    }

    /**
     * Grade a student's assignment submission
     */
    @Transactional
    public AssignmentSubmissionResponse gradeSubmission(Integer submissionId, GradeAssignmentRequest request) {

        log.info("=== GRADE SUBMISSION - ID: {}, Score: {} ===", submissionId, request.getScore());

        AssignmentSubmission submission = submissionRepository.findById(submissionId)
                .orElseThrow(() -> new AppException(ErrorCode.SUBMISSION_NOT_FOUND));

        // Validate score
        if (request.getScore() < 0 || request.getScore() > submission.getAssignment().getMaxScore()) {
            throw new AppException(ErrorCode.INVALID_SCORE);
        }

        // Update submission
        submission.setScore(request.getScore());
        submission.setFeedback(request.getFeedback());
        submission.setGradedAt(new Date());
        submission.setStatus("GRADED");

        AssignmentSubmission graded = submissionRepository.save(submission);

        log.info("Successfully graded submission {} with score {}", submissionId, request.getScore());

        return submissionMapper.toAssignmentSubmissionResponse(graded);
    }

    /**
     * Get grading statistics for a class
     */
    public Map<String, Object> getGradingStatistics(Integer classId) {

        log.info("=== GET GRADING STATISTICS - Class ID: {} ===", classId);

        CourseClass courseClass = classRepository.findById(classId)
                .orElseThrow(() -> new AppException(ErrorCode.CLASS_NOT_FOUND));

        Integer courseId = courseClass.getCourse().getId();

        // Get student IDs and map to user IDs
        List<String> studentIds = enrollmentRepository.findStudentIdsByClassId(classId);
        List<String> userIds = new ArrayList<>();

        for (String studentId : studentIds) {
            try {
                ApiResponse<StudentResponse> response;
                if (studentId.contains("-") && studentId.length() == 36) { // It's a UUID
                    response = studentRepository.getStudentById(studentId);
                } else { // It's a student code
                    response = studentRepository.getStudentByStudentId(studentId);
                }
                if (response != null && response.getResult() != null) {
                    userIds.add(response.getResult().getId());
                }
            } catch (Exception e) {
                log.error("Error fetching student: {}", studentId, e);
            }
        }

        int totalAssignments = assignmentRepository.countByCourseId(courseId);
        int totalSubmissions = submissionRepository.countByAssignmentCourseIdAndStudentIds(courseId, userIds);
        int gradedSubmissions = submissionRepository.countGradedByAssignmentCourseIdAndStudentIds(courseId, userIds);
        int pendingSubmissions = totalSubmissions - gradedSubmissions;

        Map<String, Object> stats = new HashMap<>();
        stats.put("totalAssignments", totalAssignments);
        stats.put("totalSubmissions", totalSubmissions);
        stats.put("gradedSubmissions", gradedSubmissions);
        stats.put("pendingSubmissions", pendingSubmissions);
        stats.put("gradingProgress", totalSubmissions > 0 ?
                (gradedSubmissions * 100.0 / totalSubmissions) : 0.0);

        log.info("Statistics: {}", stats);

        return stats;
    }

    private List<AssignmentGradingResponse> buildGradingResponse(
            List<String> studentIds,
            Map<String, String> studentIdToUserIdMap,
            Map<String, StudentResponse> studentInfoMap,
            List<Assignment> assignments,
            List<AssignmentSubmission> submissions) {

        // Group submissions by user ID
        Map<String, List<AssignmentSubmission>> submissionsByUserId = submissions.stream()
                .collect(Collectors.groupingBy(AssignmentSubmission::getIdUser));

        List<AssignmentGradingResponse> responses = new ArrayList<>();

        for (String studentId : studentIds) {
            String userId = studentIdToUserIdMap.get(studentId);
            if (userId == null) {
                log.warn("No user ID found for student ID: {}", studentId);
                continue;
            }

            StudentResponse studentInfo = studentInfoMap.get(userId);
            if (studentInfo == null) {
                log.warn("No student info found for user ID: {}", userId);
                continue;
            }

            List<AssignmentSubmission> studentSubmissions =
                    submissionsByUserId.getOrDefault(userId, new ArrayList<>());

            // Calculate statistics
            long totalSubmitted = studentSubmissions.stream()
                    .filter(s -> s.getStatus() != null &&
                            !s.getStatus().equals("DRAFT"))
                    .count();

            long graded = studentSubmissions.stream()
                    .filter(s -> s.getScore() != null)
                    .count();

            long pending = totalSubmitted - graded;

            Double averageScore = studentSubmissions.stream()
                    .filter(s -> s.getScore() != null)
                    .mapToDouble(s -> (s.getScore() * 10.0) / s.getAssignment().getMaxScore())
                    .average()
                    .orElse(0.0);

            // Get latest submissions
            List<AssignmentSubmissionResponse> latestSubmissions = studentSubmissions.stream()
                    .sorted(Comparator.comparing(AssignmentSubmission::getSubmittedAt).reversed())
                    .limit(10) // Get more submissions for display
                    .map(submissionMapper::toAssignmentSubmissionResponse)
                    .collect(Collectors.toList());

            AssignmentGradingResponse response = AssignmentGradingResponse.builder()
                    .studentId(studentId) // Use student ID (MSSV)
                    .studentName(studentInfo.getFirstName() + " " + studentInfo.getLastName())
                    .email(studentInfo.getEmail())
                    .totalAssignments(assignments.size())
                    .submittedAssignments((int) totalSubmitted)
                    .gradedAssignments((int) graded)
                    .pendingAssignments((int) pending)
                    .averageScore(averageScore)
                    .latestSubmissions(latestSubmissions)
                    .build();

            responses.add(response);

            log.info("Built response for student: {} - {} submissions",
                    studentInfo.getFirstName(), latestSubmissions.size());
        }

        log.info("Total responses built: {}", responses.size());
        return responses;
    }

    /**
     * Get all assignments for a class
     */
    public List<AssignmentResponse> getAssignmentsByClass(Integer classId) {
        log.info("=== GET ASSIGNMENTS BY CLASS {} ===", classId);

        // Verify class exists
        CourseClass courseClass = classRepository.findById(classId)
                .orElseThrow(() -> new AppException(ErrorCode.CLASS_NOT_FOUND));

        Integer courseId = courseClass.getCourse().getId();
        log.info("Course ID: {}", courseId);

        // Get all assignments for this course
        List<Assignment> assignments = assignmentRepository.findByCourseId(courseId);
        log.info("Found {} assignments for course", assignments.size());

        // Map to response DTOs
        return assignments.stream()
                .map(assignment -> AssignmentResponse.builder()
                        .id(assignment.getId())
                        .sectionId(assignment.getSection() != null ? assignment.getSection().getId() : null)
                        .sectionName(assignment.getSection() != null ? assignment.getSection().getTitle() : null)
                        .title(assignment.getTitle())
                        .description(assignment.getDescription())
                        .deadline(assignment.getDeadline())
                        .assignmentFiles(assignment.getAssignmentFiles())
                        .submissionType(assignment.getSubmissionType())
                        .rubricFiles(assignment.getRubricFiles())
                        .maxScore(assignment.getMaxScore())
                        .numberItem(assignment.getNumberItem())
                        .isPublished(assignment.getIsPublished())
                        .createdAt(assignment.getCreatedAt())
                        .updateAt(assignment.getUpdateAt())
                        .build())
                .collect(Collectors.toList());
    }
}