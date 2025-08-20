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
import com.hoangphihiep.mapper.LessonMapper;
import com.hoangphihiep.mapper.QuizMapper;
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

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class SectionService {
    private final QuizMapper quizMapper;

    private final SectionRepository sectionRepository;
    private final CourseRepository courseRepository;
    private final LessonRepository lessonRepository;
    private final QuizRepository quizRepository;
    private final QuestionRepository questionRepository;
    private final AnswerRepository answerRepository;
    private final LessonMapper lessonMapper;

    public ApiResponse<List<SectionResponse>> getAllSections() {
        try {
            List<Section> sections = sectionRepository.findAll();
            List<SectionResponse> responses = sections.stream()
                    .map(this::mapToResponse)
                    .toList();

            return ApiResponse.<List<SectionResponse>>builder()
                    .code(1000)
                    .message("Get sections successfully")
                    .result(responses)
                    .build();
        } catch (Exception e) {
            log.error("Error getting sections", e);
            return ApiResponse.<List<SectionResponse>>builder()
                    .code(1001)
                    .message("Error getting sections: " + e.getMessage())
                    .build();
        }
    }

    public ApiResponse<SectionResponse> getSectionById(Integer id) {
        try {
            Section section = sectionRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Section not found with id: " + id));

            return ApiResponse.<SectionResponse>builder()
                    .code(1000)
                    .message("Get section successfully")
                    .result(mapToResponse(section))
                    .build();
        } catch (Exception e) {
            log.error("Error getting section by id: {}", id, e);
            return ApiResponse.<SectionResponse>builder()
                    .code(1001)
                    .message("Error getting section: " + e.getMessage())
                    .build();
        }
    }

    public ApiResponse<List<SectionResponse>> getSectionsByCourseId(Integer courseId) {
        try {
            List<Section> sections = sectionRepository.findByCourseIdOrderByOrderIndex(courseId);
            List<SectionResponse> responses = sections.stream()
                    .map(this::mapToResponse)
                    .toList();

            return ApiResponse.<List<SectionResponse>>builder()
                    .code(1000)
                    .message("Get sections by course successfully")
                    .result(responses)
                    .build();
        } catch (Exception e) {
            log.error("Error getting sections by course id: {}", courseId, e);
            return ApiResponse.<List<SectionResponse>>builder()
                    .code(1001)
                    .message("Error getting sections by course: " + e.getMessage())
                    .build();
        }
    }

    @Transactional
    public ApiResponse<List<SectionResponse>> createSections(CourseRequest request) {
        try {
            // Verify course exists
            Course course = courseRepository.findById(request.getId())
                    .orElseThrow(() -> new RuntimeException("Course not found with id: " + request.getId()));

            List<SectionResponse> responses = new ArrayList<>();

            for (SectionRequest sectionRequest : request.getSections()) {
                SectionResponse sectionResponse = upsertSection(sectionRequest, course);
                responses.add(sectionResponse);
            }

            return ApiResponse.<List<SectionResponse>>builder()
                    .code(1000)
                    .message("Sections processed successfully")
                    .result(responses)
                    .build();

        } catch (Exception e) {
            log.error("Error processing sections", e);
            return ApiResponse.<List<SectionResponse>>builder()
                    .code(1001)
                    .message("Error processing sections: " + e.getMessage())
                    .build();
        }
    }

    @Transactional
    public SectionResponse upsertSection(SectionRequest request, Course course) {
        Section section;

        // Check if section exists (id is not null and section exists in DB)
        if (request.getId() != null) {
            section = sectionRepository.findById(request.getId())
                    .orElse(null);

            if (section != null) {
                // Update existing section
                log.info("Updating existing section with id: {}", request.getId());
                section.setTitle(request.getTitle());
                section.setDescription(request.getDescription());
                section.setOrderIndex(request.getOrderIndex());
                section.setIsPublished(request.getIsPublished());
                section.setCreatedAt(request.getCreatedAt());
                section.setUpdateAt(new Date());
            } else {
                // ID provided but section doesn't exist, create new
                log.info("Section with id {} not found, creating new section", request.getId());
                section = createNewSection(request, course);
            }
        } else {
            // Create new section (id is null)
            log.info("Creating new section with title: {}", request.getTitle());
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

        return mapToResponse(savedSection);
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
            Lesson lesson;

            if (lessonRequest.getId() != null) {
                lesson = lessonRepository.findById(lessonRequest.getId())
                        .orElse(null);

                if (lesson != null) {
                    // Update existing lesson
                    log.info("Updating existing lesson with id: {}", lessonRequest.getId());
                    updateLessonFields(lesson, lessonRequest);
                } else {
                    // ID provided but lesson doesn't exist, create new
                    log.info("Lesson with id {} not found, creating new lesson", lessonRequest.getId());
                    lesson = createNewLesson(lessonRequest, section);
                }
            } else {
                // Create new lesson
                log.info("Creating new lesson with title: {}", lessonRequest.getTitle());
                lesson = createNewLesson(lessonRequest, section);
            }

            lessonRepository.save(lesson);
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
            Quiz quiz;

            if (quizRequest.getId() != null) {
                quiz = quizRepository.findById(quizRequest.getId())
                        .orElse(null);

                if (quiz != null) {
                    // Update existing quiz
                    log.info("Updating existing quiz with id: {}", quizRequest.getId());
                    updateQuizFields(quiz, quizRequest);
                } else {
                    // ID provided but quiz doesn't exist, create new
                    log.info("Quiz with id {} not found, creating new quiz", quizRequest.getId());
                    quiz = createNewQuiz(quizRequest, section);
                }
            } else {
                // Create new quiz
                log.info("Creating new quiz with title: {}", quizRequest.getTitle());
                quiz = createNewQuiz(quizRequest, section);
            }

            Quiz savedQuiz = quizRepository.save(quiz);

            // Process questions
            if (quizRequest.getQuestions() != null && !quizRequest.getQuestions().isEmpty()) {
                upsertQuestions(quizRequest.getQuestions(), savedQuiz);
            }
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
            Question question;

            if (questionRequest.getId() != null) {
                question = questionRepository.findById(questionRequest.getId())
                        .orElse(null);

                if (question != null) {
                    // Update existing question
                    log.info("Updating existing question with id: {}", questionRequest.getId());
                    updateQuestionFields(question, questionRequest);
                } else {
                    // ID provided but question doesn't exist, create new
                    log.info("Question with id {} not found, creating new question", questionRequest.getId());
                    question = createNewQuestion(questionRequest, quiz);
                }
            } else {
                // Create new question
                log.info("Creating new question: {}", questionRequest.getQuestionText());
                question = createNewQuestion(questionRequest, quiz);
            }

            Question savedQuestion = questionRepository.save(question);

            // Process answers
            if (questionRequest.getAnswers() != null && !questionRequest.getAnswers().isEmpty()) {
                upsertAnswers(questionRequest.getAnswers(), savedQuestion);
            }
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
        for (AnswerRequest answerRequest : answerRequests) {
            Answer answer;

            if (answerRequest.getId() != null) {
                answer = answerRepository.findById(answerRequest.getId())
                        .orElse(null);

                if (answer != null) {
                    // Update existing answer
                    log.info("Updating existing answer with id: {}", answerRequest.getId());
                    updateAnswerFields(answer, answerRequest);
                } else {
                    // ID provided but answer doesn't exist, create new
                    log.info("Answer with id {} not found, creating new answer", answerRequest.getId());
                    answer = createNewAnswer(answerRequest, question);
                }
            } else {
                // Create new answer
                log.info("Creating new answer: {}", answerRequest.getContent());
                answer = createNewAnswer(answerRequest, question);
            }

            answerRepository.save(answer);
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
    public ApiResponse<Void> deleteSection(Integer id) {
        try {
            Section section = sectionRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Section not found with id: " + id));

            log.info("Starting cascade delete for section id: {}", id);

            // Get all quizzes in this section
            List<Quiz> quizzes = quizRepository.findBySectionId(id);
            for (Quiz quiz : quizzes) {
                // Get all questions in each quiz
                List<Question> questions = questionRepository.findByQuizId(quiz.getId());
                for (Question question : questions) {
                    // Delete all answers for each question
                    List<Answer> answers = answerRepository.findByQuestionId(question.getId());
                    answerRepository.deleteAll(answers);
                    log.debug("Deleted {} answers for question id: {}", answers.size(), question.getId());
                }
                // Delete all questions in the quiz
                questionRepository.deleteAll(questions);
                log.debug("Deleted {} questions for quiz id: {}", questions.size(), quiz.getId());
            }
            // Delete all quizzes in the section
            quizRepository.deleteAll(quizzes);
            log.debug("Deleted {} quizzes for section id: {}", quizzes.size(), id);

            // Get and delete all lessons in this section
            List<Lesson> lessons = lessonRepository.findBySectionId(id);
            lessonRepository.deleteAll(lessons);
            log.debug("Deleted {} lessons for section id: {}", lessons.size(), id);

            // Finally delete the section
            sectionRepository.delete(section);
            log.info("Successfully deleted section id: {} with all related content", id);

            return ApiResponse.<Void>builder()
                    .code(1000)
                    .message("Section and all related content deleted successfully")
                    .build();
        } catch (Exception e) {
            log.error("Error deleting section with id: {}", id, e);
            return ApiResponse.<Void>builder()
                    .code(1001)
                    .message("Error deleting section: " + e.getMessage())
                    .build();
        }
    }

    public SectionResponse mapToResponse(Section section) {
        return SectionResponse.builder()
                .id(section.getId())
                .courseId(section.getCourse() != null ? section.getCourse().getId() : null)
                .courseName(section.getCourse() != null ? section.getCourse().getCourseName() : null)
                .title(section.getTitle())
                .description(section.getDescription())
                .orderIndex(section.getOrderIndex())
                .isPublished(section.getIsPublished())
                .createdAt(section.getCreatedAt())
                .updateAt(section.getUpdateAt())
                .quizs(
                        section.getQuizs() != null
                                ? section.getQuizs().stream()
                                .map(quizMapper::toQuizResponse)
                                .collect(Collectors.toSet())
                                : new HashSet<>()
                )
                .lessons(
                        section.getLessons() != null
                                ? section.getLessons().stream()
                                .map(lessonMapper::toLessonResponse)
                                .collect(Collectors.toSet())
                                : new HashSet<>()
                )
                .build();
    }
}
