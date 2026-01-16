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
public class StudentQuizService {

    private final QuizRepository quizRepository;
    private final QuizAttemptRepository quizAttemptRepository;
    private final QuizAttemptAnswerRepository attemptAnswerRepository;
    private final QuestionRepository questionRepository;
    private final AnswerRepository answerRepository;
    private final QuizMapper quizMapper;

    /**
     * Get quiz detail for student
     */
    public QuizResponse getQuizDetail(Integer quizId) {
        Quiz quiz = quizRepository.findById(quizId)
                .orElseThrow(() -> new AppException(ErrorCode.QUIZ_NOT_FOUND));

        return quizMapper.toQuizResponse(quiz);
    }

    /**
     * Get quiz attempt history for current user
     */
    public List<QuizAttemptHistoryResponse> getQuizAttemptHistory(Integer quizId) {
        String userId = getCurrentUserId();

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

        // Check if quiz is available
        LocalDateTime now = LocalDateTime.now();
        if (quiz.getStartTime() != null && quiz.getStartTime().isAfter(now)) {
            throw new AppException(ErrorCode.QUIZ_NOT_STARTED);
        }
        if (quiz.getEndTime() != null && quiz.getEndTime().isBefore(now)) {
            throw new AppException(ErrorCode.QUIZ_ENDED);
        }

        // Check attempt limit
        int attemptCount = quizAttemptRepository.countByQuizIdAndIdUser(quizId, userId);
        if (attemptCount >= quiz.getAttemptLimit()) {
            throw new AppException(ErrorCode.QUIZ_ATTEMPT_LIMIT_REACHED);
        }

        // Create new attempt
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

    /**
     * Submit quiz attempt and calculate score
     */
    @Transactional
    public QuizAttemptResponse submitQuizAttempt(Integer quizId, QuizAttemptRequest request) {
        String userId = getCurrentUserId();

        Quiz quiz = quizRepository.findById(quizId)
                .orElseThrow(() -> new AppException(ErrorCode.QUIZ_NOT_FOUND));

        // THAY ĐỔI: Tìm attempt chưa submit (startedAt != null && submittedAt == null)
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
                // Handle multiple choice
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

                    // ✅ TẠO CHỈ 1 RECORD cho multiple choice
                    // Lưu danh sách IDs vào answerText dưới dạng JSON hoặc comma-separated
                    String selectedAnswersJson = answerRequest.getSelectedAnswerIds().stream()
                            .map(String::valueOf)
                            .collect(Collectors.joining(","));

                    QuizAttemptAnswer attemptAnswer = QuizAttemptAnswer.builder()
                            .quizAttempt(attempt)
                            .question(question)
                            .selectedAnswer(null) // Không set selectedAnswer cho multiple choice
                            .answerText(selectedAnswersJson) // Lưu IDs vào answerText
                            .isCorrect(isCorrect)
                            .pointsAwarded(pointsAwarded)
                            .answeredAt(LocalDateTime.now())
                            .build();

                    attemptAnswers.add(attemptAnswer);
                }
            } else if ("FILL_IN_THE_BLANK".equals(question.getQuestionType())) {
                // Handle fill in the blank
                if (answerRequest.getSelectedAnswerIds() != null &&
                        !answerRequest.getSelectedAnswerIds().isEmpty()) {

                    // Lấy tất cả các đáp án đúng cho câu hỏi, sắp xếp theo orderIndex
                    List<Answer> correctAnswers = answerRepository
                            .findByQuestionIdAndIsCorrect(question.getId(), true);
                    
                    // Tạo map: orderIndex -> correct answerId
                    Map<Integer, Integer> correctAnswerMap = correctAnswers.stream()
                            .collect(Collectors.toMap(
                                Answer::getOrderIndex,
                                Answer::getId
                            ));

                    // Kiểm tra từng blank
                    int correctBlanks = 0;
                    for (int i = 0; i < answerRequest.getSelectedAnswerIds().size(); i++) {
                        Integer selectedAnswerId = answerRequest.getSelectedAnswerIds().get(i);
                        Integer correctAnswerId = correctAnswerMap.get(i);
                        
                        if (selectedAnswerId != null && selectedAnswerId.equals(correctAnswerId)) {
                            correctBlanks++;
                        }
                    }

                    // Tính điểm: đúng hết mới có điểm (hoặc có thể tính theo tỷ lệ)
                    isCorrect = (correctBlanks == correctAnswers.size());
                    if (isCorrect) {
                        pointsAwarded = question.getScore();
                        earnedScore += pointsAwarded;
                    }

                    // Lưu danh sách IDs vào answerText
                    String selectedAnswersJson = answerRequest.getSelectedAnswerIds().stream()
                            .map(String::valueOf)
                            .collect(Collectors.joining(","));

                    QuizAttemptAnswer attemptAnswer = QuizAttemptAnswer.builder()
                            .quizAttempt(attempt)
                            .question(question)
                            .selectedAnswer(null)
                            .answerText(selectedAnswersJson) // Lưu IDs vào answerText
                            .isCorrect(isCorrect)
                            .pointsAwarded(pointsAwarded)
                            .answeredAt(LocalDateTime.now())
                            .build();

                    attemptAnswers.add(attemptAnswer);
                }
            } else {
                // Handle single choice & true/false - GIỮ NGUYÊN
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

        // Calculate pass/fail
        double percentage = (earnedScore / totalScore) * 100;
        boolean isPassed = percentage >= quiz.getPassingScore();

        attempt.setScore(earnedScore);
        attempt.setTotalScore(totalScore);
        attempt.setIsPassed(isPassed);
        attempt.setSubmittedAt(new Date());
        attempt.setTimeSpent(request.getTimeSpent());

        QuizAttempt savedAttempt = quizAttemptRepository.save(attempt);

        // Save answers
        attemptAnswerRepository.saveAll(attemptAnswers);

        // Build response
        return toQuizAttemptResponse(savedAttempt, attemptAnswers);
    }

    /**
     * Get attempt result by ID
     */
    public QuizAttemptResponse getAttemptResult(Integer attemptId) {
        String userId = getCurrentUserId();

        QuizAttempt attempt = quizAttemptRepository.findById(attemptId)
                .orElseThrow(() -> new AppException(ErrorCode.QUIZ_ATTEMPT_NOT_FOUND));

        // Verify ownership
        if (!attempt.getIdUser().equals(userId)) {
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }

        return toQuizAttemptResponse(attempt, attempt.getAnswers());
    }

    // Helper methods
    private String getCurrentUserId() {
        return SecurityContextHolder.getContext().getAuthentication().getName();
    }

    private QuizAttemptResponse toQuizAttemptResponse(
            QuizAttempt attempt,
            List<QuizAttemptAnswer> answers) {

        List<QuizAttemptAnswerResponse> answerResponses = answers.stream()
                .map(answer -> {
                    Integer selectedAnswerId = null;
                    List<Integer> selectedAnswerIds = null;

                    // Nếu là multiple choice (answerText chứa comma-separated IDs)
                    if (answer.getAnswerText() != null && answer.getAnswerText().contains(",")) {
                        selectedAnswerIds = Arrays.stream(answer.getAnswerText().split(","))
                                .map(String::trim)
                                .map(Integer::parseInt)
                                .collect(Collectors.toList());
                    }
                    // Nếu là single choice
                    else if (answer.getSelectedAnswer() != null) {
                        selectedAnswerId = answer.getSelectedAnswer().getId();
                    }

                    return QuizAttemptAnswerResponse.builder()
                            .id(answer.getId())
                            .questionId(answer.getQuestion().getId())
                            .selectedAnswerId(selectedAnswerId)
                            .selectedAnswerIds(selectedAnswerIds) // ← THÊM
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
