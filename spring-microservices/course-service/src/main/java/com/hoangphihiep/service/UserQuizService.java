package com.hoangphihiep.service;

import com.hoangphihiep.dto.request.QuizAttemptRequest;
import com.hoangphihiep.dto.response.*;
import com.hoangphihiep.entity.*;
import com.hoangphihiep.exception.AppException;
import com.hoangphihiep.exception.ErrorCode;
import com.hoangphihiep.repository.*;
import com.hoangphihiep.mapper.QuizMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;
import java.util.stream.IntStream;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserQuizService {

    private final QuizRepository quizRepository;
    private final QuizAttemptRepository quizAttemptRepository;
    private final QuizAttemptAnswerRepository attemptAnswerRepository;
    private final QuestionRepository questionRepository;
    private final AnswerRepository answerRepository;
    private final QuizMapper quizMapper;
    private final OrderItemRepository orderItemRepository;

    public QuizResponse getQuizDetail(Integer quizId) {
        String userId = getCurrentUserId();
        
        Quiz quiz = quizRepository.findById(quizId)
                .orElseThrow(() -> new AppException(ErrorCode.QUIZ_NOT_FOUND));

        verifyUserCourseAccess(quiz.getSection().getCourse().getId(), userId);

        return quizMapper.toQuizResponse(quiz);
    }

    public List<QuizAttemptHistoryResponse> getQuizAttemptHistory(Integer quizId) {
        String userId = getCurrentUserId();

        Quiz quiz = quizRepository.findById(quizId)
                .orElseThrow(() -> new AppException(ErrorCode.QUIZ_NOT_FOUND));

        // Verify access
        verifyUserCourseAccess(quiz.getSection().getCourse().getId(), userId);

        List<QuizAttempt> attempts = quizAttemptRepository
                .findByQuizIdAndIdUserOrderBySubmittedAtDesc(quizId, userId);

        return IntStream.range(0, attempts.size())
                .mapToObj(index -> {
                    QuizAttempt attempt = attempts.get(index);
                    return QuizAttemptHistoryResponse.builder()
                            .attemptNumber(attempts.size() - index)
                            .score(attempt.getScore())
                            .totalScore(attempt.getTotalScore())
                            .isPassed(attempt.getIsPassed())
                            .submittedAt(attempt.getSubmittedAt())
                            .timeSpent(attempt.getTimeSpent())
                            .build();
                })
                .collect(Collectors.toList());
    }

    /**
     * Start a new quiz attempt
     */
    @Transactional
    public Map<String, Integer> startQuizAttempt(Integer quizId) {
        String userId = getCurrentUserId();

        Quiz quiz = quizRepository.findById(quizId)
                .orElseThrow(() -> new AppException(ErrorCode.QUIZ_NOT_FOUND));

        verifyUserCourseAccess(quiz.getSection().getCourse().getId(), userId);

        LocalDateTime now = LocalDateTime.now();
        if (quiz.getStartTime() != null && quiz.getStartTime().isAfter(now)) {
            throw new AppException(ErrorCode.QUIZ_NOT_STARTED);
        }
        if (quiz.getEndTime() != null && quiz.getEndTime().isBefore(now)) {
            throw new AppException(ErrorCode.QUIZ_ENDED);
        }

        int attemptCount = quizAttemptRepository.countByQuizIdAndIdUser(quizId, userId);
        if (attemptCount >= quiz.getAttemptLimit()) {
            throw new AppException(ErrorCode.QUIZ_ATTEMPT_LIMIT_REACHED);
        }

        QuizAttempt attempt = QuizAttempt.builder()
                .idUser(userId)
                .quiz(quiz)
                .startedAt(new Date())
                .build();

        QuizAttempt savedAttempt = quizAttemptRepository.save(attempt);

        Map<String, Integer> response = new HashMap<>();
        response.put("attemptId", savedAttempt.getId());
        return response;
    }

    @Transactional
    public QuizAttemptResponse submitQuizAttempt(Integer quizId, QuizAttemptRequest request) {
        String userId = getCurrentUserId();

        Quiz quiz = quizRepository.findById(quizId)
                .orElseThrow(() -> new AppException(ErrorCode.QUIZ_NOT_FOUND));

        verifyUserCourseAccess(quiz.getSection().getCourse().getId(), userId);

        QuizAttempt attempt = quizAttemptRepository
                .findTopByQuizIdAndIdUserAndSubmittedAtIsNullOrderByStartedAtDesc(quizId, userId)
                .orElseThrow(() -> new AppException(ErrorCode.QUIZ_ATTEMPT_NOT_FOUND));

        double totalScore = 0.0;
        double earnedScore = 0.0;
        List<QuizAttemptAnswer> attemptAnswers = new ArrayList<>();

        for (var answerRequest : request.getAnswers()) {
            Question question = questionRepository.findById(answerRequest.getQuestionId())
                    .orElseThrow(() -> new AppException(ErrorCode.QUESTION_NOT_FOUND));

            totalScore += question.getScore();

            boolean isCorrect = false;
            double pointsAwarded = 0.0;

            if ("MULTIPLE_CHOICE".equals(question.getQuestionType())) {
                if (answerRequest.getSelectedAnswerIds() != null &&
                        !answerRequest.getSelectedAnswerIds().isEmpty()) {

                    List<Answer> correctAnswers = answerRepository
                            .findByQuestionIdAndIsCorrect(question.getId(), true);

                    Set<Integer> correctAnswerIds = correctAnswers.stream()
                            .map(Answer::getId)
                            .collect(Collectors.toSet());

                    Set<Integer> selectedAnswerIds = new HashSet<>(answerRequest.getSelectedAnswerIds());

                    isCorrect = correctAnswerIds.equals(selectedAnswerIds);

                    if (isCorrect) {
                        pointsAwarded = question.getScore();
                        earnedScore += pointsAwarded;
                    }

                    // Store selected IDs as comma-separated string
                    String selectedAnswersJson = answerRequest.getSelectedAnswerIds().stream()
                            .map(String::valueOf)
                            .collect(Collectors.joining(","));

                    QuizAttemptAnswer attemptAnswer = QuizAttemptAnswer.builder()
                            .quizAttempt(attempt)
                            .question(question)
                            .selectedAnswer(null)
                            .answerText(selectedAnswersJson)
                            .isCorrect(isCorrect)
                            .pointsAwarded(pointsAwarded)
                            .answeredAt(LocalDateTime.now())
                            .build();

                    attemptAnswers.add(attemptAnswer);
                }
            } else {
                if (answerRequest.getSelectedAnswerId() != null) {
                    Answer selectedAnswer = answerRepository.findById(answerRequest.getSelectedAnswerId())
                            .orElseThrow(() -> new AppException(ErrorCode.ANSWER_NOT_FOUND));

                    isCorrect = selectedAnswer.getIsCorrect();
                    if (isCorrect) {
                        pointsAwarded = question.getScore();
                        earnedScore += pointsAwarded;
                    }

                    QuizAttemptAnswer attemptAnswer = QuizAttemptAnswer.builder()
                            .quizAttempt(attempt)
                            .question(question)
                            .selectedAnswer(selectedAnswer)
                            .isCorrect(isCorrect)
                            .pointsAwarded(pointsAwarded)
                            .answeredAt(LocalDateTime.now())
                            .build();

                    attemptAnswers.add(attemptAnswer);
                }
            }
        }

        double percentage = totalScore > 0 ? (earnedScore / totalScore) * 100 : 0;
        boolean isPassed = percentage >= quiz.getPassingScore();

        attempt.setScore(earnedScore);
        attempt.setTotalScore(totalScore);
        attempt.setIsPassed(isPassed);
        attempt.setSubmittedAt(new Date());
        attempt.setTimeSpent(request.getTimeSpent());

        QuizAttempt savedAttempt = quizAttemptRepository.save(attempt);

        attemptAnswerRepository.saveAll(attemptAnswers);

        log.info("User {} submitted quiz {} with score {}/{}", userId, quizId, earnedScore, totalScore);

        return toQuizAttemptResponse(savedAttempt, attemptAnswers);
    }

    public QuizAttemptResponse getAttemptResult(Integer attemptId) {
        String userId = getCurrentUserId();

        QuizAttempt attempt = quizAttemptRepository.findById(attemptId)
                .orElseThrow(() -> new AppException(ErrorCode.QUIZ_ATTEMPT_NOT_FOUND));

        if (!attempt.getIdUser().equals(userId)) {
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }

        return toQuizAttemptResponse(attempt, attempt.getAnswers());
    }

    private String getCurrentUserId() {
        return SecurityContextHolder.getContext().getAuthentication().getName();
    }

    private void verifyUserCourseAccess(Integer courseId, String userId) {
        boolean hasPurchased = orderItemRepository
                .existsByUserIdAndCourseIdAndOrderCompleted(userId, courseId);

        if (!hasPurchased) {
            throw new AppException(ErrorCode.COURSE_NOT_ENROLLED);
        }
    }

    private QuizAttemptResponse toQuizAttemptResponse(
            QuizAttempt attempt,
            List<QuizAttemptAnswer> answers) {

        List<QuizAttemptAnswerResponse> answerResponses = answers.stream()
                .map(answer -> {
                    Integer selectedAnswerId = null;
                    List<Integer> selectedAnswerIds = null;

                    if (answer.getAnswerText() != null && answer.getAnswerText().contains(",")) {
                        selectedAnswerIds = Arrays.stream(answer.getAnswerText().split(","))
                                .map(String::trim)
                                .map(Integer::parseInt)
                                .collect(Collectors.toList());
                    }
                    else if (answer.getSelectedAnswer() != null) {
                        selectedAnswerId = answer.getSelectedAnswer().getId();
                    }

                    return QuizAttemptAnswerResponse.builder()
                            .id(answer.getId())
                            .questionId(answer.getQuestion().getId())
                            .selectedAnswerId(selectedAnswerId)
                            .selectedAnswerIds(selectedAnswerIds)
                            .answerText(answer.getAnswerText())
                            .isCorrect(answer.getIsCorrect())
                            .pointsAwarded(answer.getPointsAwarded())
                            .answeredAt(answer.getAnsweredAt())
                            .build();
                })
                .collect(Collectors.toList());

        return QuizAttemptResponse.builder()
                .id(attempt.getId())
                .userId(attempt.getIdUser())
                .quizId(attempt.getQuiz().getId())
                .score(attempt.getScore())
                .totalScore(attempt.getTotalScore())
                .isPassed(attempt.getIsPassed())
                .startedAt(attempt.getStartedAt())
                .submittedAt(attempt.getSubmittedAt())
                .timeSpent(attempt.getTimeSpent())
                .answers(answerResponses)
                .build();
    }
}
