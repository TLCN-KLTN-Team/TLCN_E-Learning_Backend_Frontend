package com.hoangphihiep.service;

import com.hoangphihiep.dto.response.*;
import com.hoangphihiep.entity.*;
import com.hoangphihiep.entity.QuizQuestion;
import com.hoangphihiep.exception.AppException;
import com.hoangphihiep.exception.ErrorCode;
import com.hoangphihiep.repository.*;
import com.hoangphihiep.repository.httpclient.StudentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class TeacherQuizService {

    private final QuizRepository quizRepository;
    private final QuizAttemptRepository attemptRepository;
    private final QuizAttemptAnswerRepository attemptAnswerRepository;
    private final CourseClassRepository classRepository;
    private final CourseEnrollmentRepository enrollmentRepository;
    private final StudentRepository studentRepository;
    private final AnswerRepository answerRepository;
    private final QuestionRepository questionRepository;
    private final QuestionLibraryService questionLibraryService;
    private final QuizQuestionRepository quizQuestionRepository;

    /**
     * Get all quiz results for a class
     */
    public List<QuizResultResponse> getQuizResultsForClass(Integer classId) {
        log.info("=== GET QUIZ RESULTS FOR CLASS {} ===", classId);

        // Verify class exists
        CourseClass courseClass = classRepository.findById(classId)
                .orElseThrow(() -> new AppException(ErrorCode.CLASS_NOT_FOUND));

        Integer courseId = courseClass.getCourse().getId();

        // Get students and map to user IDs
        List<String> studentIds = enrollmentRepository.findStudentIdsByClassId(classId);
        log.info("Found {} students in class", studentIds.size());

        if (studentIds.isEmpty()) {
            return new ArrayList<>();
        }

        // Map student IDs to user IDs
        Map<String, StudentResponse> studentInfoMap = new HashMap<>();
        List<String> userIds = new ArrayList<>();

        for (String studentId : studentIds) {
            try {
                ApiResponse<StudentResponse> response = studentRepository.getStudentByStudentId(studentId);
                if (response != null && response.getResult() != null) {
                    StudentResponse student = response.getResult();
                    userIds.add(student.getId());
                    studentInfoMap.put(student.getId(), student);
                }
            } catch (Exception e) {
                log.error("Error fetching student: {}", studentId, e);
            }
        }

        // Get all quiz attempts for these users
        List<QuizAttempt> attempts = attemptRepository
                .findByQuizCourseIdAndUserIds(courseId, userIds);

        log.info("Found {} quiz attempts", attempts.size());

        // Build response
        return attempts.stream()
                .map(attempt -> buildQuizResultResponse(attempt, studentInfoMap))
                .collect(Collectors.toList());
    }

    /**
     * Get results for a specific quiz in a class
     */
    public List<QuizResultResponse> getResultsByQuiz(Integer quizId, Integer classId) {
        log.info("=== GET RESULTS FOR QUIZ {} IN CLASS {} ===", quizId, classId);

        // Get students and map to user IDs
        List<String> studentIds = enrollmentRepository.findStudentIdsByClassId(classId);
        Map<String, StudentResponse> studentInfoMap = new HashMap<>();
        List<String> userIds = new ArrayList<>();

        for (String studentId : studentIds) {
            try {
                ApiResponse<StudentResponse> response = studentRepository.getStudentByStudentId(studentId);
                if (response != null && response.getResult() != null) {
                    StudentResponse student = response.getResult();
                    userIds.add(student.getId());
                    studentInfoMap.put(student.getId(), student);
                }
            } catch (Exception e) {
                log.error("Error fetching student: {}", studentId, e);
            }
        }

        // Get attempts for this quiz
        List<QuizAttempt> attempts = attemptRepository
                .findByQuizIdAndUserIds(quizId, userIds);

        return attempts.stream()
                .map(attempt -> buildQuizResultResponse(attempt, studentInfoMap))
                .collect(Collectors.toList());
    }

    /**
     * Get quiz statistics for a class
     */
    public Map<String, Object> getQuizStatistics(Integer classId) {
        log.info("=== GET QUIZ STATISTICS FOR CLASS {} ===", classId);

        CourseClass courseClass = classRepository.findById(classId)
                .orElseThrow(() -> new AppException(ErrorCode.CLASS_NOT_FOUND));

        Integer courseId = courseClass.getCourse().getId();

        // Get students and map to user IDs
        List<String> studentIds = enrollmentRepository.findStudentIdsByClassId(classId);
        List<String> userIds = new ArrayList<>();

        for (String studentId : studentIds) {
            try {
                ApiResponse<StudentResponse> response = studentRepository.getStudentByStudentId(studentId);
                if (response != null && response.getResult() != null) {
                    userIds.add(response.getResult().getId());
                }
            } catch (Exception e) {
                log.error("Error fetching student: {}", studentId, e);
            }
        }

        // Get statistics
        int totalQuizzes = quizRepository.countByCourseId(courseId);
        List<QuizAttempt> attempts = attemptRepository
                .findByQuizCourseIdAndUserIds(courseId, userIds);

        int totalAttempts = attempts.size();
        int passedAttempts = (int) attempts.stream()
                .filter(QuizAttempt::getIsPassed)
                .count();
        int failedAttempts = totalAttempts - passedAttempts;

        double averageScore = attempts.stream()
                .mapToDouble(QuizAttempt::getScore)
                .average()
                .orElse(0.0);

        double averagePercentage = attempts.stream()
                .mapToDouble(a -> (a.getScore() / a.getTotalScore()) * 100)
                .average()
                .orElse(0.0);

        double highestScore = attempts.stream()
                .mapToDouble(a -> (a.getScore() / a.getTotalScore()) * 100)
                .max()
                .orElse(0.0);

        double lowestScore = attempts.stream()
                .mapToDouble(a -> (a.getScore() / a.getTotalScore()) * 100)
                .min()
                .orElse(0.0);

        Map<String, Object> stats = new HashMap<>();
        stats.put("totalQuizzes", totalQuizzes);
        stats.put("totalAttempts", totalAttempts);
        stats.put("passedAttempts", passedAttempts);
        stats.put("failedAttempts", failedAttempts);
        stats.put("averageScore", averageScore);
        stats.put("averagePercentage", averagePercentage);
        stats.put("highestScore", highestScore);
        stats.put("lowestScore", lowestScore);

        return stats;
    }

    /**
     * Get detailed result for a specific attempt
     */
    public QuizResultResponse getAttemptDetail(Integer attemptId) {
        log.info("=== GET ATTEMPT DETAIL {} ===", attemptId);

        QuizAttempt attempt = attemptRepository.findById(attemptId)
                .orElseThrow(() -> new AppException(ErrorCode.QUIZ_ATTEMPT_NOT_FOUND));

        // Get student info
        Map<String, StudentResponse> studentInfoMap = new HashMap<>();
        try {
            // Attempt stores user ID (UUID), need to get student info
            ApiResponse<StudentResponse> response = studentRepository.getStudentById(attempt.getIdUser());
            if (response != null && response.getResult() != null) {
                studentInfoMap.put(attempt.getIdUser(), response.getResult());
            }
        } catch (Exception e) {
            log.error("Error fetching student info", e);
        }

        return buildQuizResultResponse(attempt, studentInfoMap);
    }

    // Helper methods
    private String getCurrentUserId() {
        return SecurityContextHolder.getContext().getAuthentication().getName();
    }

    private QuizResultResponse buildQuizResultResponse(
            QuizAttempt attempt,
            Map<String, StudentResponse> studentInfoMap) {

        StudentResponse studentInfo = studentInfoMap.get(attempt.getIdUser());

        // Get all answers for this attempt
        List<QuizAttemptAnswer> answers = attemptAnswerRepository
                .findByQuizAttemptId(attempt.getId());

        // Build answer responses
        List<QuizAnswerResponse> answerResponses = answers.stream()
                .map(this::buildAnswerResponse)
                .collect(Collectors.toList());

        // Count attempt number for this student
        int attemptNumber = attemptRepository
                .countByQuizIdAndIdUser(attempt.getQuiz().getId(), attempt.getIdUser());

        return QuizResultResponse.builder()
                .id(attempt.getId())
                .studentId(studentInfo != null ? studentInfo.getStudentId() : attempt.getIdUser())
                .studentName(studentInfo != null ?
                        studentInfo.getFirstName() + " " + studentInfo.getLastName() :
                        "Unknown")
                .email(studentInfo != null ? studentInfo.getEmail() : "")
                .quizId(attempt.getQuiz().getId())
                .quizTitle(attempt.getQuiz().getTitle())
                .quizDescription(attempt.getQuiz().getDescription())
                .score(attempt.getScore())
                .totalScore(attempt.getTotalScore())
                .percentage((attempt.getScore() / attempt.getTotalScore()) * 100)
                .isPassed(attempt.getIsPassed())
                .attemptNumber(attemptNumber)
                .startedAt(attempt.getStartedAt())
                .submittedAt(attempt.getSubmittedAt())
                .timeSpent(attempt.getTimeSpent())
                .answers(answerResponses)
                .build();
    }

    private QuizAnswerResponse buildAnswerResponse(QuizAttemptAnswer attemptAnswer) {
        Question question = attemptAnswer.getQuestion();

        List<Answer> allAnswers = answerRepository.findByQuestionId(question.getId());

        List<AnswerOptionResponse> correctAnswers = allAnswers.stream()
                .filter(Answer::getIsCorrect)
                .map(a -> AnswerOptionResponse.builder()
                        .id(a.getId())
                        .answerText(a.getContent())
                        .isCorrect(true)
                        .build())
                .collect(Collectors.toList());

        List<Integer> correctAnswerIds = correctAnswers.stream()
                .map(AnswerOptionResponse::getId)
                .collect(Collectors.toList());

        List<AnswerOptionResponse> selectedAnswers = new ArrayList<>();
        List<Integer> selectedAnswerIds;

        if (attemptAnswer.getAnswerText() != null && attemptAnswer.getAnswerText().contains(",")) {
            // Multiple choice - parse comma-separated IDs
            selectedAnswerIds = Arrays.stream(attemptAnswer.getAnswerText().split(","))
                    .map(String::trim)
                    .map(Integer::parseInt)
                    .collect(Collectors.toList());

            selectedAnswers = allAnswers.stream()
                    .filter(a -> selectedAnswerIds.contains(a.getId()))
                    .map(a -> AnswerOptionResponse.builder()
                            .id(a.getId())
                            .answerText(a.getContent())
                            .isCorrect(a.getIsCorrect())
                            .build())
                    .collect(Collectors.toList());
        }
        // ✅ XỬ LÝ SINGLE CHOICE
        else {
            selectedAnswerIds = new ArrayList<>();
            if (attemptAnswer.getSelectedAnswer() != null) {
                selectedAnswers.add(AnswerOptionResponse.builder()
                        .id(attemptAnswer.getSelectedAnswer().getId())
                        .answerText(attemptAnswer.getSelectedAnswer().getContent())
                        .isCorrect(attemptAnswer.getSelectedAnswer().getIsCorrect())
                        .build());
                selectedAnswerIds.add(attemptAnswer.getSelectedAnswer().getId());
            }
        }

        return QuizAnswerResponse.builder()
                .id(attemptAnswer.getId())
                .questionId(question.getId())
                .questionText(question.getQuestionText())
                .questionType(question.getQuestionType())
                .questionScore(question.getScore())
                .selectedAnswerIds(selectedAnswerIds)
                .selectedAnswers(selectedAnswers)
                .correctAnswerIds(correctAnswerIds)
                .correctAnswers(correctAnswers)
                .isCorrect(attemptAnswer.getIsCorrect())
                .pointsAwarded(attemptAnswer.getPointsAwarded())
                .answeredAt(attemptAnswer.getAnsweredAt())
                .build();
    }

    /**
     * Add library questions to a quiz by copying them
     * This creates new Question instances attached to the quiz
     */
    public List<Question> addLibraryQuestionsToQuiz(Integer quizId, List<Integer> libraryQuestionIds) {
        log.info("Adding {} library questions to quiz {}", libraryQuestionIds.size(), quizId);

        // Verify quiz exists and belongs to teacher
        Quiz quiz = quizRepository.findById(quizId)
                .orElseThrow(() -> new AppException(ErrorCode.QUIZ_NOT_FOUND));

        String teacherId = SecurityContextHolder.getContext().getAuthentication().getName();

        // Get library questions (with ownership verification)
        List<QuestionResponse> libraryQuestions =
                questionLibraryService.getLibraryQuestionsByIds(libraryQuestionIds);

        // Copy each library question to the quiz
        List<Question> copiedQuestions = new ArrayList<>();

        int orderIndex = 1;
        for (QuestionResponse libQuestion : libraryQuestions) {
            // Create new Question instance
            Question newQuestion = new Question();
            // Removed direct quiz relationship - will link via QuizQuestion
            newQuestion.setQuestionText(libQuestion.getQuestionText());
            newQuestion.setQuestionType(libQuestion.getQuestionType());
            newQuestion.setScore(libQuestion.getScore());
            newQuestion.setDifficultyLevel(libQuestion.getDifficultyLevel());
            newQuestion.setTags(libQuestion.getTags());
            newQuestion.setTeacherId(teacherId);
            newQuestion.setEducationalUnitId(libQuestion.getEducationalUnitId());

            // Save the question first
            Question savedQuestion = questionRepository.save(newQuestion);

            // Copy answers
            if (libQuestion.getAnswers() != null) {
                for (com.hoangphihiep.dto.response.AnswerResponse libAnswer : libQuestion.getAnswers()) {
                    Answer newAnswer = new Answer();
                    newAnswer.setQuestion(savedQuestion);
                    newAnswer.setContent(libAnswer.getContent());
                    newAnswer.setIsCorrect(libAnswer.getIsCorrect());

                    answerRepository.save(newAnswer);
                }
            }

            copiedQuestions.add(savedQuestion);
            
            // Link question to quiz via QuizQuestion join table
            QuizQuestion quizQuestion = QuizQuestion.builder()
                    .quizId(quizId)
                    .questionId(savedQuestion.getId())
                    .orderIndex(orderIndex++)
                    .build();
            quizQuestionRepository.save(quizQuestion);
        }

        log.info("Successfully copied {} questions to quiz {}", copiedQuestions.size(), quizId);
        return copiedQuestions;
    }

    /**
     * Get all quizzes for a class
     */
    public List<QuizResponse> getQuizzesByClass(Integer classId) {
        log.info("=== GET QUIZZES BY CLASS {} ===", classId);

        // Verify class exists
        CourseClass courseClass = classRepository.findById(classId)
                .orElseThrow(() -> new AppException(ErrorCode.CLASS_NOT_FOUND));

        Integer courseId = courseClass.getCourse().getId();
        log.info("Course ID: {}", courseId);

        // Get all quizzes for this course
        List<Quiz> quizzes = quizRepository.findByCourseId(courseId);
        log.info("Found {} quizzes for course", quizzes.size());

        // Map to response DTOs
        return quizzes.stream()
                .map(quiz -> QuizResponse.builder()
                        .id(quiz.getId())
                        .sectionId(quiz.getSection() != null ? quiz.getSection().getId() : null)
                        .sectionName(quiz.getSection() != null ? quiz.getSection().getTitle() : null)
                        .title(quiz.getTitle())
                        .description(quiz.getDescription())
                        .duration(quiz.getDuration())
                        .attemptLimit(quiz.getAttemptLimit())
                        .passingScore(quiz.getPassingScore())
                        .numberItem(quiz.getNumberItem())
                        .showResults(quiz.getShowResults())
                        .isPublished(quiz.getIsPublished())
                        .startTime(quiz.getStartTime())
                        .endTime(quiz.getEndTime())
                        .createdAt(quiz.getCreatedAt())
                        .updateAt(quiz.getUpdateAt())
                        .build())
                .collect(Collectors.toList());
    }
}