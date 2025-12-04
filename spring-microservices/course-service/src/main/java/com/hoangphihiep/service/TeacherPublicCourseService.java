package com.hoangphihiep.service;

import com.hoangphihiep.dto.request.GradeAssignmentRequest;
import com.hoangphihiep.dto.response.*;
import com.hoangphihiep.entity.*;
import com.hoangphihiep.exception.AppException;
import com.hoangphihiep.exception.ErrorCode;
import com.hoangphihiep.repository.*;
import com.hoangphihiep.repository.httpclient.UserInfoApi;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class TeacherPublicCourseService {

    private final CourseRepository courseRepository;
    private final CourseProgressRepository progressRepository;
    private final QuizAttemptRepository quizAttemptRepository;
    private final AssignmentSubmissionRepository assignmentSubmissionRepository;
    private final OrderItemRepository orderItemRepository;
    private final UserInfoApi userInfoApi;

    public Page<PublicCourseResponse> getPublicCoursesByTeacher(String teacherId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);

        Page<Course> courses = courseRepository.findByIdTeacherAndPriceGreaterThan(teacherId, 0.0, pageable);
        
        return courses.map(this::mapToPublicCourseResponse);
    }
    public List<PublicCourseStudentResponse> getCourseStudents(Integer courseId) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new AppException(ErrorCode.COURSE_NOT_FOUND));

        if (course.getPublishedCourse() == null || 
            course.getPublishedCourse().getCoursePrice() == null || 
            course.getPublishedCourse().getCoursePrice().doubleValue() <= 0) {
            throw new AppException(ErrorCode.COURSE_NOT_PUBLIC);
        }

        List<OrderItem> orderItems = orderItemRepository.findByOriginalCourseId(courseId);
        
        // Get unique user IDs
        List<String> userIds = orderItems.stream()
                .map(item -> item.getOrder().getIdUser())
                .distinct()
                .collect(Collectors.toList());

        return userIds.stream()
                .map(userId -> mapToPublicCourseStudentResponse(userId, courseId))
                .collect(Collectors.toList());
    }

    public List<StudentQuizAttemptResponse> getStudentQuizAttempts(Integer courseId, String userId) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new AppException(ErrorCode.COURSE_NOT_FOUND));

        List<QuizAttempt> attempts = quizAttemptRepository.findByUserIdAndCourseId(userId, courseId);

        return attempts.stream()
                .map(this::mapToStudentQuizAttemptResponse)
                .collect(Collectors.toList());
    }

    public QuizAttemptDetailResponse getQuizAttemptDetails(Integer attemptId) {
        QuizAttempt attempt = quizAttemptRepository.findById(attemptId)
                .orElseThrow(() -> new AppException(ErrorCode.QUIZ_ATTEMPT_NOT_FOUND));

        Quiz quiz = attempt.getQuiz();
        Set<Question> questionSet = quiz.getQuestions();
        List<Question> questions = new ArrayList<>(questionSet);
        questions.sort(Comparator.comparing(Question::getOrderIndex));
        
        List<QuizAttemptDetailResponse.QuestionAnswerDetail> questionDetails = new ArrayList<>();

        for (Question question : questions) {
            QuizAttemptAnswer studentAnswer = attempt.getAnswers().stream()
                    .filter(ans -> ans.getQuestion().getId().equals(question.getId()))
                    .findFirst()
                    .orElse(null);

            List<Integer> studentAnswers = new ArrayList<>();
            if (studentAnswer != null && studentAnswer.getSelectedAnswer() != null) {
                studentAnswers.add(studentAnswer.getSelectedAnswer().getId());
            }

            Set<Answer> answerSet = question.getAnswers();
            List<Answer> answers = new ArrayList<>(answerSet);
            answers.sort(Comparator.comparing(Answer::getOrderIndex));
            
            List<Integer> correctAnswers = new ArrayList<>();
            List<String> options = new ArrayList<>();
            
            for (int i = 0; i < answers.size(); i++) {
                Answer answer = answers.get(i);
                options.add(answer.getContent());
                if (answer.getIsCorrect()) {
                    correctAnswers.add(i);
                }
            }

            Boolean isCorrect = studentAnswer != null && studentAnswer.getIsCorrect();

            QuizAttemptDetailResponse.QuestionAnswerDetail detail = QuizAttemptDetailResponse.QuestionAnswerDetail.builder()
                    .questionId(question.getId())
                    .questionText(question.getQuestionText())
                    .questionType(question.getQuestionType())
                    .options(options)
                    .correctAnswers(correctAnswers)
                    .studentAnswers(studentAnswers)
                    .isCorrect(isCorrect)
                    .points(question.getScore())
                    .build();

            questionDetails.add(detail);
        }

        return QuizAttemptDetailResponse.builder()
                .attemptId(attempt.getId())
                .quizTitle(quiz.getTitle())
                .score(attempt.getScore())
                .maxScore(attempt.getTotalScore())
                .passed(attempt.getIsPassed())
                .duration(quiz.getDuration())
                .questions(questionDetails)
                .build();
    }

    public List<StudentAssignmentSubmissionResponse> getStudentAssignments(Integer courseId, String userId) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new AppException(ErrorCode.COURSE_NOT_FOUND));

        List<AssignmentSubmission> submissions = assignmentSubmissionRepository
                .findByUserIdAndCourseId(userId, courseId);

        return submissions.stream()
                .map(this::mapToStudentAssignmentSubmissionResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public StudentAssignmentSubmissionResponse gradeAssignment(Integer submissionId, GradeAssignmentRequest request) {
        AssignmentSubmission submission = assignmentSubmissionRepository.findById(submissionId)
                .orElseThrow(() -> new AppException(ErrorCode.SUBMISSION_NOT_FOUND));

        submission.setScore(request.getScore());
        submission.setFeedback(request.getFeedback());
        submission.setGradedAt(new Date());
        
        assignmentSubmissionRepository.save(submission);

        log.info("Assignment submission {} graded with score: {}", submissionId, request.getScore());

        return mapToStudentAssignmentSubmissionResponse(submission);
    }

    public TeacherPublicStatisticsResponse getTeacherStatistics(String teacherId) {
        List<Course> courses = courseRepository.findByIdTeacherAndPriceGreaterThan(teacherId, 0.0);
        
        int totalCourses = courses.size();
        int totalStudents = 0;
        double totalRevenue = 0.0;

        for (Course course : courses) {
            List<OrderItem> orderItems = orderItemRepository.findByOriginalCourseId(course.getId());
            long uniqueUsers = orderItems.stream()
                    .map(item -> item.getOrder().getIdUser())
                    .distinct()
                    .count();
            totalStudents += (int) uniqueUsers;
            if (course.getPublishedCourse() != null && course.getPublishedCourse().getCoursePrice() != null) {
                totalRevenue += course.getPublishedCourse().getCoursePrice().doubleValue() * uniqueUsers;
            }
        }

        int totalQuizAttempts = 0;
        int totalAssignmentsSubmitted = 0;
        int pendingAssignments = 0;

        for (Course course : courses) {
            totalQuizAttempts += quizAttemptRepository.countByCourseId(course.getId());
            totalAssignmentsSubmitted += assignmentSubmissionRepository.countByCourseId(course.getId());
            pendingAssignments += assignmentSubmissionRepository.countByCourseIdAndScoreIsNull(course.getId());
        }

        return TeacherPublicStatisticsResponse.builder()
                .totalCourses(totalCourses)
                .totalStudents(totalStudents)
                .totalRevenue(totalRevenue)
                .totalQuizAttempts(totalQuizAttempts)
                .totalAssignmentsSubmitted(totalAssignmentsSubmitted)
                .pendingAssignments(pendingAssignments)
                .averageCourseRating(0.0) // TODO: Calculate from reviews
                .build();
    }

    private PublicCourseResponse mapToPublicCourseResponse(Course course) {
        // Count users who purchased this course (not students in educational unit)
        List<OrderItem> orderItems = orderItemRepository.findByOriginalCourseId(course.getId());
        int purchasedCount = (int) orderItems.stream()
                .map(item -> item.getOrder().getIdUser())
                .distinct()
                .count();

        BigDecimal price = course.getPublishedCourse() != null ?
                course.getPublishedCourse().getCoursePrice() : BigDecimal.ZERO;

        LocalDateTime createdAt = course.getCreatedAt() != null ? 
                course.getCreatedAt().toInstant().atZone(ZoneId.systemDefault()).toLocalDateTime() : null;
        LocalDateTime updatedAt = course.getUpdatedAt() != null ?
                course.getUpdatedAt().toInstant().atZone(ZoneId.systemDefault()).toLocalDateTime() : null;
        
        return PublicCourseResponse.builder()
                .id(course.getId())
                .courseName(course.getCourseName())
                .description(course.getDescription())
                .credits(course.getCredits())
                .currentStudents(purchasedCount)
                .maxStudents(course.getMaxStudents())
                .price(price)
                .createdAt(createdAt)
                .updatedAt(updatedAt)
                .build();
    }

    private PublicCourseStudentResponse mapToPublicCourseStudentResponse(String userId, Integer courseId) {

        List<OrderItem> userOrders = orderItemRepository.findByOriginalCourseId(courseId).stream()
                .filter(item -> item.getOrder().getIdUser().equals(userId))
                .toList();
        
        LocalDateTime enrolledDate = userOrders.isEmpty() ? LocalDateTime.now() : 
                userOrders.get(0).getOrder().getOrderDate().toLocalDate().atStartOfDay();

        CourseProgress progress = progressRepository.findByUserIdAndCourseId(userId, courseId)
                .orElse(null);
        Double progressPercent = progress != null ? progress.getProgressPercentage() : 0.0;

        int quizzesTaken = quizAttemptRepository.countByUserIdAndCourseId(userId, courseId);

        int assignmentsSubmitted = assignmentSubmissionRepository.countByUserIdAndCourseId(userId, courseId);

        Double quizAvg = quizAttemptRepository.getAverageScoreByStudentAndCourse(userId, courseId);

        System.out.println("điểm trung bình cuủa quiz: " + quizAvg);
        Double assignmentAvg = assignmentSubmissionRepository.getAverageScoreByStudentAndCourse(userId, courseId);
        System.out.println("điểm trung bình cuủa assignment: " + assignmentAvg);
        double totalAvg = 0.0;
        int count = 0;
        if (quizAvg != null && quizAvg > 0) {
            totalAvg += quizAvg;
            count++;
        }
        if (assignmentAvg != null && assignmentAvg > 0) {
            totalAvg += assignmentAvg;
            count++;
        }
        // Convert from percentage (0-100) to scale of 10 (0-10)
        Double averageScore = count > 0 ? (totalAvg / count) / 10.0 : 0.0;

        ApiResponse<UserResponse> userResponse = userInfoApi.getUserInfo(userId);
        UserResponse user = userResponse.getResult();
        
        // Ưu tiên firstName + lastName, fallback về username, cuối cùng là userId
        String userName = "";
        if (user.getFirstName() != null && user.getLastName() != null) {
            userName = user.getLastName() + " " + user.getFirstName();
        } else if (user.getUsername() != null && !user.getUsername().isEmpty()) {
            userName = user.getUsername();
        } else {
            userName = user.getId();
        }
        String userEmail = user.getEmail();

        return PublicCourseStudentResponse.builder()
                .studentId(userId)
                .studentName(userName)
                .email(userEmail)
                .enrolledDate(enrolledDate)
                .progress(progressPercent)
                .quizzesTaken(quizzesTaken)
                .assignmentsSubmitted(assignmentsSubmitted)
                .averageScore(averageScore)
                .avatarUrl(null) // TODO: Get from identity service
                .build();
    }

    private StudentQuizAttemptResponse mapToStudentQuizAttemptResponse(QuizAttempt attempt) {
        Quiz quiz = attempt.getQuiz();
        int totalQuestions = quiz.getQuestions().size();

        List<QuizAttemptAnswer> answers = attempt.getAnswers() != null ? attempt.getAnswers() : new ArrayList<>();
        long correctCount = answers.stream().filter(ans -> ans.getIsCorrect() != null && ans.getIsCorrect()).count();

        LocalDateTime attemptDateTime = attempt.getSubmittedAt() != null 
            ? attempt.getSubmittedAt().toInstant().atZone(ZoneId.systemDefault()).toLocalDateTime()
            : null;

        log.info("🔍 Fetching user info for userId: {}", attempt.getIdUser());
        ApiResponse<UserResponse> userResponse = userInfoApi.getUserInfo(attempt.getIdUser());
        UserResponse user = userResponse.getResult();
        
        // Ưu tiên firstName + lastName, fallback về username, cuối cùng là userId
        String studentName = "";
        if (user.getFirstName() != null && user.getLastName() != null) {
            studentName = user.getLastName() + " " + user.getFirstName();
        } else if (user.getUsername() != null && !user.getUsername().isEmpty()) {
            studentName = user.getUsername();
        } else {
            studentName = user.getId();
        }
        log.info("✅ User fetched - ID: {}, Name: {}", user.getId(), studentName);

        return StudentQuizAttemptResponse.builder()
                .attemptId(attempt.getId())
                .quizId(quiz.getId())
                .quizTitle(quiz.getTitle())
                .studentName(studentName)
                .attemptDate(attemptDateTime)
                .duration(quiz.getDuration())
                .score(attempt.getScore())
                .maxScore(attempt.getTotalScore())
                .passed(attempt.getIsPassed())
                .questionsCorrect((int) correctCount)
                .totalQuestions(totalQuestions)
                .build();
    }

    private StudentAssignmentSubmissionResponse mapToStudentAssignmentSubmissionResponse(
            AssignmentSubmission submission) {
        
        Assignment assignment = submission.getAssignment();
        boolean isLate = submission.getSubmittedAt() != null && 
                         assignment.getDeadline() != null &&
                         submission.getSubmittedAt().after(assignment.getDeadline());

        List<String> files = submission.getSubmissionFiles() != null ? submission.getSubmissionFiles() : new ArrayList<>();

        String status = submission.getScore() != null ? "graded" : "pending";

        LocalDateTime attemptDateTime = submission.getSubmittedAt() != null
                ? submission.getSubmittedAt().toInstant().atZone(ZoneId.systemDefault()).toLocalDateTime()
                : null;

        LocalDateTime deadlineDateTime = assignment.getDeadline() != null
                ? assignment.getDeadline().toInstant().atZone(ZoneId.systemDefault()).toLocalDateTime()
                : null;

        ApiResponse<UserResponse> userResponse = userInfoApi.getUserInfo(submission.getIdUser());
        UserResponse user = userResponse.getResult();
        
        // Ưu tiên firstName + lastName, fallback về username, cuối cùng là userId
        String studentName = "";
        if (user.getFirstName() != null && user.getLastName() != null) {
            studentName = user.getLastName() + " " + user.getFirstName();
        } else if (user.getUsername() != null && !user.getUsername().isEmpty()) {
            studentName = user.getUsername();
        } else {
            studentName = user.getId();
        }

        return StudentAssignmentSubmissionResponse.builder()
                .submissionId(submission.getId())
                .assignmentId(assignment.getId())
                .assignmentTitle(assignment.getTitle())
                .studentName(studentName)
                .submittedDate(attemptDateTime)
                .deadline(deadlineDateTime)
                .content(submission.getSubmissionText())
                .files(files)
                .link(submission.getSubmissionLink())
                .score(submission.getScore())
                .maxScore(Double.valueOf(assignment.getMaxScore()))
                .feedback(submission.getFeedback())
                .status(status)
                .isLate(isLate)
                .build();
    }
}
