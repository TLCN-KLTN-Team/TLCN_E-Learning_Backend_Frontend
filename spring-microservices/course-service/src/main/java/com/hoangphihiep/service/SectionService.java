package com.hoangphihiep.service;

import com.hoangphihiep.dto.request.*;
import com.hoangphihiep.dto.response.ApiResponse;
import com.hoangphihiep.dto.response.SectionResponse;
import com.hoangphihiep.entity.Course;
import com.hoangphihiep.entity.Section;
import com.hoangphihiep.entity.Lesson;
import com.hoangphihiep.entity.Quiz;
import com.hoangphihiep.entity.Question;
import com.hoangphihiep.entity.Answer;
import com.hoangphihiep.exception.AppException;
import com.hoangphihiep.exception.ErrorCode;
import com.hoangphihiep.mapper.LessonMapper;
import com.hoangphihiep.mapper.QuizMapper;
import com.hoangphihiep.mapper.SectionMapper;
import com.hoangphihiep.repository.CourseRepository;
import com.hoangphihiep.repository.SectionRepository;
import com.hoangphihiep.repository.LessonRepository;
import com.hoangphihiep.repository.QuizRepository;
import com.hoangphihiep.repository.QuestionRepository;
import com.hoangphihiep.repository.AnswerRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.net.URL;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class SectionService {
    private final QuizMapper quizMapper;

    private final SectionRepository sectionRepository;
    private final CourseRepository courseRepository;
    private final LessonRepository lessonRepository;
    private final QuizRepository quizRepository;
    private final QuestionRepository questionRepository;
    private final AnswerRepository answerRepository;
    private final SectionMapper sectionMapper;

    public List<SectionResponse> getAllSections() {
        try {
            return sectionRepository.findAll()
                    .stream()
                    .map(sectionMapper::toSectionResponse)
                    .toList();
        } catch (Exception e) {
            throw new AppException(ErrorCode.UNCATEGORIZED_EXCEPTION);
        }
    }

    public SectionResponse getSectionById(Integer id) {
        if (id == null || id <= 0) {
            throw new AppException(ErrorCode.INVALID_REQUEST);
        }

        Section section = sectionRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.SECTION_NOT_FOUND));

        return sectionMapper.toSectionResponse(section);
    }

    public List<SectionResponse> getSectionsByCourseId(Integer courseId) {
        if (courseId == null || courseId <= 0) {
            throw new AppException(ErrorCode.INVALID_REQUEST);
        }
        courseRepository.findById(courseId)
                .orElseThrow(() -> new AppException(ErrorCode.COURSE_NOT_FOUND));

        try {
            List<Section> sections = sectionRepository.findByCourseIdOrderByOrderIndex(courseId);
            return sections.stream()
                    .map(sectionMapper::toSectionResponse)
                    .toList();
        } catch (Exception e) {
            throw new AppException(ErrorCode.UNCATEGORIZED_EXCEPTION);
        }
    }

    @Transactional
    public List<SectionResponse> createSections(BulkSectionRequest request) {
        if (request == null) {
            throw new AppException(ErrorCode.INVALID_REQUEST);
        }
        if (request.getCourseId() == null || request.getCourseId() <= 0) {
            throw new AppException(ErrorCode.INVALID_REQUEST);
        }
        if (request.getSections() == null || request.getSections().isEmpty()) {
            throw new AppException(ErrorCode.REQUIRED_FIELD_MISSING);
        }

        Course course = courseRepository.findById(request.getCourseId())
                .orElseThrow(() -> new AppException(ErrorCode.COURSE_NOT_FOUND));

        List<SectionResponse> responses = new ArrayList<>();

        try {
            for (SectionRequest sectionRequest : request.getSections()) {

                SectionResponse sectionResponse = upsertSection(sectionRequest, course);
                responses.add(sectionResponse);
            }
        } catch (AppException e) {
            throw e;
        } catch (Exception e) {
            log.error("Lỗi khi tạo sections cho course id: {}", request.getCourseId(), e);
            throw new AppException(ErrorCode.DATA_INTEGRITY_VIOLATION);
        }

        return responses;
    }

    private void validateCourseRequest(CourseRequest request) {
        if (request == null) {
            throw new AppException(ErrorCode.INVALID_REQUEST);
        }
        if (request.getId() == null || request.getId() <= 0) {
            throw new AppException(ErrorCode.INVALID_REQUEST);
        }
        if (request.getSections() == null || request.getSections().isEmpty()) {
            throw new AppException(ErrorCode.REQUIRED_FIELD_MISSING);
        }
    }

    @Transactional
    public SectionResponse upsertSection(SectionRequest request, Course course) {
        validateSectionRequest(request);
        Section section;
        try {
            if (request.getId() != null) {
                section = sectionRepository.findById(request.getId())
                        .orElse(null);

                if (section != null) {
                    log.info("Đang cập nhật section đã tồn tại với id: {}", request.getId());
                    updateSectionFields(section, request);
                } else {
                    log.info("Không tìm thấy section với id {}, đang tạo mục mới", request.getId());
                    section = createNewSection(request, course);
                }
            } else {
                log.info("Đang tạo section mới với tiêu đề: {}", request.getTitle());
                section = createNewSection(request, course);
            }

            Section savedSection = sectionRepository.save(section);

            // Process lessons
            if (request.getLessons() != null && !request.getLessons().isEmpty()) {
                upsertLessons(request.getLessons(), savedSection);
            }

            // Process quizzes
            if (request.getQuizzes() != null && !request.getQuizzes().isEmpty()) {
                upsertQuizzes(request.getQuizzes(), savedSection);
            }

            return sectionMapper.toSectionResponse(savedSection);
        } catch (AppException e) {
            throw e;
        } catch (Exception e) {
            log.error("Lỗi khi upsert section: {}", request.getTitle(), e);
            throw new AppException(ErrorCode.DATA_INTEGRITY_VIOLATION);
        }
    }

    private void validateSectionRequest(SectionRequest request) {
        if (request == null) {
            throw new AppException(ErrorCode.INVALID_REQUEST);
        }
        if (request.getTitle() == null || request.getTitle().trim().isEmpty()) {
            throw new AppException(ErrorCode.SECTION_TITLE_REQUIRED);
        }
        if (request.getTitle().length() > 255) {
            throw new AppException(ErrorCode.FIELD_VALUE_TOO_LONG);
        }
        if (request.getOrderIndex() != null && request.getOrderIndex() < 0) {
            throw new AppException(ErrorCode.SECTION_ORDER_INDEX_INVALID);
        }
    }

    private void updateSectionFields(Section section, SectionRequest request) {
        section.setTitle(request.getTitle());
        section.setDescription(request.getDescription());
        section.setOrderIndex(request.getOrderIndex());
        section.setIsPublished(request.getIsPublished());
        section.setCreatedAt(request.getCreatedAt());
        section.setUpdateAt(new Date());
    }

    private Section createNewSection(SectionRequest request, Course course) {
        Section section = new Section();
        section.setTitle(request.getTitle());
        section.setDescription(request.getDescription());
        section.setOrderIndex(request.getOrderIndex());
        section.setIsPublished(request.getIsPublished());
        section.setCourse(course);
        section.setCreatedAt(new Date());
        section.setUpdateAt(new Date());
        return section;
    }

    private void upsertLessons(Set<LessonRequest> lessonRequests, Section section) {
        for (LessonRequest lessonRequest : lessonRequests) {
            validateLessonRequest(lessonRequest);

            Lesson lesson;

            try {
                if (lessonRequest.getId() != null) {
                    lesson = lessonRepository.findById(lessonRequest.getId())
                            .orElse(null);

                    if (lesson != null) {
                        log.info("Đang cập nhật lesson đã tồn tại với id: {}", lessonRequest.getId());
                        updateLessonFields(lesson, lessonRequest);
                    } else {
                        log.info("Không tìm thấy lesson với id {}, đang tạo lesson mới", lessonRequest.getId());
                        lesson = createNewLesson(lessonRequest, section);
                    }
                } else {
                    log.info("Đang tạo lesson mới với tiêu đề: {}", lessonRequest.getTitle());
                    lesson = createNewLesson(lessonRequest, section);
                }

                lessonRepository.save(lesson);
            } catch (AppException e) {
                throw e;
            } catch (Exception e) {
                log.error("Lỗi khi upsert lesson: {}", lessonRequest.getTitle(), e);
                throw new AppException(ErrorCode.DATA_INTEGRITY_VIOLATION);
            }
        }
    }

    private void validateLessonRequest(LessonRequest request) {
        if (request == null) {
            throw new AppException(ErrorCode.INVALID_REQUEST);
        }
        if (request.getTitle() == null || request.getTitle().trim().isEmpty()) {
            throw new AppException(ErrorCode.LESSON_TITLE_REQUIRED);
        }
        if (request.getTitle().length() > 255) {
            throw new AppException(ErrorCode.FIELD_VALUE_TOO_LONG);
        }
        if (request.getNumberItem() != null && request.getNumberItem() < 0) {
            throw new AppException(ErrorCode.LESSON_NUMBER_ITEM_INVALID);
        }
        // Add more validations for video URL format if needed
        if (request.getVideoUrl() != null && !request.getVideoUrl().trim().isEmpty()) {
            if (!isValidUrl(request.getVideoUrl())) {
                throw new AppException(ErrorCode.LESSON_VIDEO_URL_INVALID);
            }
        }
    }

    private boolean isValidUrl(String url) {
        try {
            new URL(url);
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    private void updateLessonFields(Lesson lesson, LessonRequest request) {
        lesson.setTitle(request.getTitle());
        lesson.setDescription(request.getDescription());
        lesson.setContent(request.getContent());
        lesson.setAttachments(request.getAttachments());
        lesson.setNumberItem(request.getNumberItem() != null ? request.getNumberItem() : 0);
        lesson.setIsFreeLesson(request.getIsFreeLesson());
        lesson.setVideoUrl(request.getVideoUrl());
        lesson.setCreatedAt(request.getCreatedAt());
        lesson.setCreatedAt(request.getCreatedAt());
        lesson.setUpdateAt(new Date());
    }

    private Lesson createNewLesson(LessonRequest request, Section section) {
        Lesson lesson = new Lesson();
        updateLessonFields(lesson, request);
        lesson.setCreatedAt(request.getCreatedAt());
        lesson.setUpdateAt(request.getUpdateAt());
        lesson.setSection(section);
        return lesson;
    }

    private void upsertQuizzes(Set<QuizRequest> quizRequests, Section section) {
        for (QuizRequest quizRequest : quizRequests) {
            validateQuizRequest(quizRequest);

            Quiz quiz;

            try {
                if (quizRequest.getId() != null) {
                    quiz = quizRepository.findById(quizRequest.getId())
                            .orElse(null);

                    if (quiz != null) {
                        log.info("Đang cập nhật quiz đã tồn tại với id: {}", quizRequest.getId());
                        updateQuizFields(quiz, quizRequest);
                    } else {
                        log.info("Không tìm thấy quiz với id {}, đang tạo quiz mới", quizRequest.getId());
                        quiz = createNewQuiz(quizRequest, section);
                    }
                } else {
                    log.info("Đang tạo quiz mới với tiêu đề: {}", quizRequest.getTitle());
                    quiz = createNewQuiz(quizRequest, section);
                }

                Quiz savedQuiz = quizRepository.save(quiz);

                if (quizRequest.getQuestions() != null && !quizRequest.getQuestions().isEmpty()) {
                    upsertQuestions(quizRequest.getQuestions(), savedQuiz);
                } else {
                    if (Boolean.TRUE.equals(quizRequest.getIsPublished())) {
                        throw new AppException(ErrorCode.QUIZ_NO_QUESTIONS);
                    }
                }
            } catch (AppException e) {
                throw e;
            } catch (Exception e) {
                log.error("Lỗi khi upsert quiz: {}", quizRequest.getTitle(), e);
                throw new AppException(ErrorCode.DATA_INTEGRITY_VIOLATION);
            }
        }
    }
    private void validateQuizRequest(QuizRequest request) {
        if (request == null) {
            throw new AppException(ErrorCode.INVALID_REQUEST);
        }
        if (request.getTitle() == null || request.getTitle().trim().isEmpty()) {
            throw new AppException(ErrorCode.QUIZ_TITLE_REQUIRED);
        }
        if (request.getTitle().length() > 255) {
            throw new AppException(ErrorCode.FIELD_VALUE_TOO_LONG);
        }
        if (request.getDuration() != null && request.getDuration() < 0) {
            throw new AppException(ErrorCode.QUIZ_DURATION_INVALID);
        }
        if (request.getAttemptLimit() != null && request.getAttemptLimit() < 0) {
            throw new AppException(ErrorCode.QUIZ_ATTEMPT_LIMIT_INVALID);
        }
        if (request.getPassingScore() != null && (request.getPassingScore() < 0 || request.getPassingScore() > 100)) {
            throw new AppException(ErrorCode.QUIZ_PASSING_SCORE_INVALID);
        }
    }
    private void updateQuizFields(Quiz quiz, QuizRequest request) {
        quiz.setTitle(request.getTitle());
        quiz.setDescription(request.getDescription());
        quiz.setDuration(request.getDuration() != null ? request.getDuration() : 0);
        quiz.setAttemptLimit(request.getAttemptLimit() != null ? request.getAttemptLimit() : 0);
        quiz.setPassingScore(request.getPassingScore() != null ? request.getPassingScore() : 0);
        quiz.setNumberItem(request.getNumberItem() != null ? request.getNumberItem() : 0);
        quiz.setIsPublished(request.getIsPublished());
        quiz.setShowResults(request.getShowResults());
        quiz.setCreatedAt(request.getCreatedAt());
        quiz.setUpdateAt(new Date());
    }

    private Quiz createNewQuiz(QuizRequest request, Section section) {
        Quiz quiz = new Quiz();
        updateQuizFields(quiz, request);
        quiz.setCreatedAt(new Date());
        quiz.setUpdateAt(new Date());
        quiz.setSection(section);
        return quiz;
    }

    private void upsertQuestions(Set<QuestionRequest> questionRequests, Quiz quiz) {
        for (QuestionRequest questionRequest : questionRequests) {
            validateQuestionRequest(questionRequest);

            Question question;

            try {
                if (questionRequest.getId() != null) {
                    question = questionRepository.findById(questionRequest.getId())
                            .orElse(null);

                    if (question != null) {
                        log.info("Đang cập nhật question đã tồn tại với id: {}", questionRequest.getId());
                        updateQuestionFields(question, questionRequest);
                    } else {
                        log.info("Không tìm thấy question với id {}, đang tạo question mới", questionRequest.getId());
                        question = createNewQuestion(questionRequest, quiz);
                    }
                } else {
                    log.info("Tạo question mới: {}", questionRequest.getQuestionText());
                    question = createNewQuestion(questionRequest, quiz);
                }

                Question savedQuestion = questionRepository.save(question);

                // Process answers
                if (questionRequest.getAnswers() != null && !questionRequest.getAnswers().isEmpty()) {
                    upsertAnswers(questionRequest.getAnswers(), savedQuestion);
                } else {
                    throw new AppException(ErrorCode.QUESTION_INSUFFICIENT_ANSWERS);
                }
            } catch (AppException e) {
                throw e;
            } catch (Exception e) {
                log.error("Lỗi khi upsert question: {}", questionRequest.getQuestionText(), e);
                throw new AppException(ErrorCode.DATA_INTEGRITY_VIOLATION);
            }
        }
    }
    private void validateQuestionRequest(QuestionRequest request) {
        if (request == null) {
            throw new AppException(ErrorCode.INVALID_REQUEST);
        }
        if (request.getQuestionText() == null || request.getQuestionText().trim().isEmpty()) {
            throw new AppException(ErrorCode.QUESTION_TEXT_REQUIRED);
        }
        if (request.getQuestionText().length() > 1000) {
            throw new AppException(ErrorCode.FIELD_VALUE_TOO_LONG);
        }
        if (request.getScore() != null && request.getScore() < 0) {
            throw new AppException(ErrorCode.QUESTION_SCORE_INVALID);
        }
        if (request.getOrderIndex() != null && request.getOrderIndex() < 0) {
            throw new AppException(ErrorCode.INVALID_REQUEST);
        }
    }
    private void updateQuestionFields(Question question, QuestionRequest request) {
        question.setQuestionText(request.getQuestionText());
        question.setQuestionType(request.getQuestionType());
        question.setOrderIndex(request.getOrderIndex() != null ? request.getOrderIndex() : 0);
        question.setAttachments(request.getAttachments());
        question.setScore(request.getScore());
        question.setCreatedAt(request.getCreatedAt());
        question.setUpdateAt(new Date());
    }

    private Question createNewQuestion(QuestionRequest request, Quiz quiz) {
        Question question = new Question();
        updateQuestionFields(question, request);
        question.setCreatedAt(new Date());
        question.setUpdateAt(new Date());
        question.setQuiz(quiz);
        return question;
    }

    private void upsertAnswers(Set<AnswerRequest> answerRequests, Question question) {
        if (answerRequests.size() < 2) {
            throw new AppException(ErrorCode.QUESTION_INSUFFICIENT_ANSWERS);
        }

        boolean hasCorrectAnswer = answerRequests.stream()
                .anyMatch(answer -> Boolean.TRUE.equals(answer.getIsCorrect()));

        if (!hasCorrectAnswer) {
            throw new AppException(ErrorCode.QUESTION_NO_CORRECT_ANSWER);
        }

        for (AnswerRequest answerRequest : answerRequests) {
            validateAnswerRequest(answerRequest);

            Answer answer;

            try {
                if (answerRequest.getId() != null) {
                    answer = answerRepository.findById(answerRequest.getId())
                            .orElse(null);

                    if (answer != null) {
                        log.info("Đang cập nhật answer đã tồn tại với id: {}", answerRequest.getId());
                        updateAnswerFields(answer, answerRequest);
                    } else {
                        log.info("Không tìm thấy answer với id {}, đang tạo answer mới", answerRequest.getId());
                        answer = createNewAnswer(answerRequest, question);
                    }
                } else {
                    log.info("Tạo mới answer: {}", answerRequest.getContent());
                    answer = createNewAnswer(answerRequest, question);
                }

                answerRepository.save(answer);
            } catch (AppException e) {
                throw e;
            } catch (Exception e) {
                log.error("Lỗi upsert answer: {}", answerRequest.getContent(), e);
                throw new AppException(ErrorCode.DATA_INTEGRITY_VIOLATION);
            }
        }
    }
    private void validateAnswerRequest(AnswerRequest request) {
        if (request == null) {
            throw new AppException(ErrorCode.INVALID_REQUEST);
        }
        if (request.getContent() == null || request.getContent().trim().isEmpty()) {
            throw new AppException(ErrorCode.ANSWER_CONTENT_REQUIRED);
        }
        if (request.getContent().length() > 500) {
            throw new AppException(ErrorCode.FIELD_VALUE_TOO_LONG);
        }
        if (request.getOrderIndex() != null && request.getOrderIndex() < 0) {
            throw new AppException(ErrorCode.ANSWER_ORDER_INDEX_INVALID);
        }
    }
    private void updateAnswerFields(Answer answer, AnswerRequest request) {
        answer.setContent(request.getContent());
        answer.setIsCorrect(request.getIsCorrect());
        answer.setOrderIndex(request.getOrderIndex());
        answer.setCreatedAt(request.getCreatedAt());
        answer.setUpdateAt(new Date());
    }

    private Answer createNewAnswer(AnswerRequest request, Question question) {
        Answer answer = new Answer();
        updateAnswerFields(answer, request);
        answer.setCreatedAt(new Date());
        answer.setUpdateAt(new Date());
        answer.setQuestion(question);
        return answer;
    }

    @Transactional
    public void deleteSection(Integer id) {
        if (id == null || id <= 0) {
            throw new AppException(ErrorCode.INVALID_REQUEST);
        }

        Section section = sectionRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.SECTION_NOT_FOUND));

        try {
            log.info("Bắt đầu xóa theo chuỗi (cascade) cho section có id: {}", id);

            List<Quiz> quizzes = quizRepository.findBySectionId(id);
            for (Quiz quiz : quizzes) {
                List<Question> questions = questionRepository.findByQuizId(quiz.getId());
                for (Question question : questions) {
                    List<Answer> answers = answerRepository.findByQuestionId(question.getId());
                    answerRepository.deleteAll(answers);
                    answerRepository.flush();
                }
                questionRepository.deleteAll(questions);
                questionRepository.flush();
                log.debug("Đã xóa {} câu hỏi cho bài kiểm tra có id: {}", questions.size(), quiz.getId());
            }
            quizRepository.deleteAll(quizzes);
            quizRepository.flush();
            log.debug("Đã xóa {} bài kiểm tra cho section có id: {}", quizzes.size(), id);

            List<Lesson> lessons = lessonRepository.findBySectionId(id);
            lessonRepository.deleteAll(lessons);
            lessonRepository.flush();
            log.debug("Đã xóa {} bài học cho section có id: {}", lessons.size(), id);

            sectionRepository.delete(section);
            sectionRepository.flush();
            log.info("Đã xóa thành công section có id: {} cùng toàn bộ nội dung liên quan", id);
        } catch (Exception e) {
            log.error("Lỗi khi xóa section id: {}", id, e);
            throw new AppException(ErrorCode.DATA_INTEGRITY_VIOLATION);
        }
    }


}
