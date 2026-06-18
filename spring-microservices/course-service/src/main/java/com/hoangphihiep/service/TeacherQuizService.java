package com.hoangphihiep.service;

import com.hoangphihiep.dto.response.*;
import com.hoangphihiep.entity.*;
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

    public List<QuizResultResponse> getQuizResultsForClass(Integer classId) {
        // Verify class exists
        CourseClass courseClass = classRepository.findById(classId)
                .orElseThrow(() -> new AppException(ErrorCode.CLASS_NOT_FOUND));

        Integer courseId = courseClass.getCourse().getId();

        // Get students and map to user IDs
        List<String> studentIds = enrollmentRepository.findStudentIdsByClassId(classId);

        if (studentIds.isEmpty()) {
            return new ArrayList<>();
        }

        // Map student IDs to user IDs
        Map<String, StudentResponse> studentInfoMap = new HashMap<>();
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

        // Build response
        return attempts.stream()
                .map(attempt -> buildQuizResultResponse(attempt, studentInfoMap))
                .collect(Collectors.toList());
    }

    public Map<String, Object> getQuizStatistics(Integer classId) {

        CourseClass courseClass = classRepository.findById(classId)
                .orElseThrow(() -> new AppException(ErrorCode.CLASS_NOT_FOUND));

        Integer courseId = courseClass.getCourse().getId();

        // Get students and map to user IDs
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
                .sorted(Comparator.comparing(Answer::getOrderIndex, Comparator.nullsLast(Comparator.naturalOrder())))
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

        if (attemptAnswer.getAnswerText() != null && !attemptAnswer.getAnswerText().isEmpty()) {
            // Multiple choice or Fill in the blank - parse comma-separated IDs
            selectedAnswerIds = Arrays.stream(attemptAnswer.getAnswerText().split(","))
                    .map(String::trim)
                    .filter(s -> !s.isEmpty())
                    .map(Integer::parseInt)
                    .collect(Collectors.toList());

            selectedAnswers = selectedAnswerIds.stream()
                    .map(id -> allAnswers.stream().filter(a -> a.getId().equals(id)).findFirst().orElse(null))
                    .filter(Objects::nonNull)
                    .map(a -> AnswerOptionResponse.builder()
                            .id(a.getId())
                            .answerText(a.getContent())
                            .isCorrect(a.getIsCorrect())
                            .build())
                    .collect(Collectors.toList());
        }
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