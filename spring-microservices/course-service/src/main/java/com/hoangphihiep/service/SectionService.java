package com.hoangphihiep.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.hoangphihiep.dto.request.*;
import com.hoangphihiep.dto.response.SectionResponse;
import com.hoangphihiep.entity.*;
import com.hoangphihiep.exception.AppException;
import com.hoangphihiep.exception.ErrorCode;
import com.hoangphihiep.mapper.AssignmentMapper;
import com.hoangphihiep.mapper.SectionMapper;
import com.hoangphihiep.repository.*;
import com.hoangphihiep.repository.httpclient.FileHandlerRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.net.URL;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class SectionService {
    private final SectionRepository sectionRepository;
    private final CourseRepository courseRepository;
    private final LessonRepository lessonRepository;
    private final QuizRepository quizRepository;
    private final QuestionRepository questionRepository;
    private final AnswerRepository answerRepository;
    private final AssignmentRepository assignmentRepository;
    private final AssignmentSubmissionRepository assignmentSubmissionRepository;
    private final SectionMapper sectionMapper;
    private final AssignmentMapper assignmentMapper;
    private final FileHandlerRepository fileHandlerRepository;

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
    public List<SectionResponse> createSections(
            BulkSectionRequest request,
            List<MultipartFile> lessonFiles,
            List<MultipartFile> questionFiles,
            List<MultipartFile> assignmentFiles,
            List<MultipartFile> rubricFiles) {

        System.out.println(request);

        // Validate request
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

        System.out.println ("Có vào đây 888888888888888888888");

        // Upload question files


        List<SectionResponse> responses = new ArrayList<>();

        try {
            for (SectionRequest sectionRequest : request.getSections()) {
                SectionResponse sectionResponse = upsertSection(
                        sectionRequest,
                        course,
                        lessonFiles,
                        questionFiles,
                        assignmentFiles,
                        rubricFiles
                );
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

    @Transactional
    public SectionResponse upsertSection(
            SectionRequest request,
            Course course,
            List<MultipartFile> lessonFiles,
            List<MultipartFile> questionFiles,
            List<MultipartFile> assignmentFiles,
            List<MultipartFile> rubricFiles) {

        validateSectionRequest(request);
        Section section;

        try {
            if (request.getId() != null) {
                section = sectionRepository.findById(request.getId())
                        .orElse(null);

                if (section != null) {
                    log.info("Đang cập nhật section đã tồn tại với id: {}", request.getId());
                    updateSectionFields(section, request, course);
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
                upsertLessons(request.getLessons(), savedSection, lessonFiles);
            }

            // Process quizzes
            if (request.getQuizzes() != null && !request.getQuizzes().isEmpty()) {
                upsertQuizzes(request.getQuizzes(), savedSection, questionFiles);
            }

            // Process assignments
            if (request.getAssignments() != null && !request.getAssignments().isEmpty()) {
                upsertAssignments(request.getAssignments(), savedSection, assignmentFiles, rubricFiles);
            }

            // Refresh entity để load lại relationships
            sectionRepository.flush();
            Section refreshedSection = sectionRepository.findById(savedSection.getId())
                    .orElseThrow(() -> new AppException(ErrorCode.SECTION_NOT_FOUND));

            return sectionMapper.toSectionResponse(refreshedSection);
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

    private void updateSectionFields(Section section, SectionRequest request, Course course) {
        section.setTitle(request.getTitle());
        section.setDescription(request.getDescription());
        section.setOrderIndex(request.getOrderIndex());
        section.setIsPublished(request.getIsPublished());
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

    private void upsertLessons(
            Set<LessonRequest> lessonRequests,
            Section section,
            List<MultipartFile> lessonFiles) {

        int lessonFileIndex = 0;

        for (LessonRequest lessonRequest : lessonRequests) {
            validateLessonRequest(lessonRequest);
            System.out.println ("Xác thực lesson thành công");
            Lesson lesson;

            try {
                if (lessonRequest.getId() != null) {
                    lesson = lessonRepository.findById(lessonRequest.getId())
                            .orElse(null);

                    System.out.println("==== DEBUG LESSON ====");
                    System.out.println(lesson);

                    log.info("Đang cập nhật lesson đã tồn tại với id: {}", lessonRequest.getId());

                    updateLessonFields(lesson, lessonRequest, section);
                } else {
                    log.info("Đang tạo lesson mới với tiêu đề: {}", lessonRequest.getTitle());
                    lesson = createNewLesson(lessonRequest, section, lessonFiles);
                }

                Lesson savedLesson = lessonRepository.save(lesson);
                section.addLesson(savedLesson);

                log.info("Saved lesson: {} with {} attachments",
                        savedLesson.getTitle(),
                        savedLesson.getAttachments() != null ? savedLesson.getAttachments().size() : 0);

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
    }

    private void updateLessonFields(Lesson lesson, LessonRequest request, Section section) {
        lesson.setTitle(request.getTitle());
        lesson.setDescription(request.getDescription());
        lesson.setContent(request.getContent());
        lesson.setNumberItem(request.getNumberItem());
        lesson.setIsFreeLesson(request.getIsFreeLesson());
        lesson.setIsPublished(request.getIsPublished());
        lesson.setVideoUrl(request.getVideoUrl());
        lesson.setUpdateAt(new Date());
    }

    private Lesson createNewLesson(LessonRequest request, Section section, List<MultipartFile> lessonFiles) {
        Lesson lesson = new Lesson();
        lesson.setTitle(request.getTitle());
        lesson.setDescription(request.getDescription());
        lesson.setContent(request.getContent());

        List<String> processedAttachments = new ArrayList<>();


        if (request.getAttachments() != null){
            for (String attachment : request.getAttachments()) {
                if (attachment.startsWith("FILE_INDEX:")) {
                    // Extract file index
                    int fileIndex = Integer.parseInt(attachment.substring("FILE_INDEX:".length()));

                    // Get corresponding file
                    MultipartFile file = lessonFiles.get(fileIndex);
                    // Upload to S3/Cloud Storage
                    String uploadedUrl = fileHandlerRepository.uploadFile(file).get("url");
                    processedAttachments.add(uploadedUrl);
                } else {
                    // Already uploaded URL, keep as is
                    processedAttachments.add(attachment);
                }
            }

            lesson.setAttachments(processedAttachments);
        }

        lesson.setVideoUrl(request.getVideoUrl());
        lesson.setNumberItem(request.getNumberItem());
        lesson.setIsFreeLesson(request.getIsFreeLesson());
        lesson.setIsPublished(request.getIsPublished());
        lesson.setCreatedAt(new Date());
        lesson.setUpdateAt(new Date());
        lesson.setSection(section);

        return lesson;
    }

    private void upsertQuizzes(
            Set<QuizRequest> quizRequests,
            Section section,
            List<MultipartFile> questionFiles) {

        for (QuizRequest quizRequest : quizRequests) {
            validateQuizRequest(quizRequest);

            Quiz quiz;

            try {
                if (quizRequest.getId() != null) {
                    quiz = quizRepository.findById(quizRequest.getId())
                            .orElse(null);

                    if (quiz != null) {
                        log.info("Đang cập nhật quiz đã tồn tại với id: {}", quizRequest.getId());
                        updateQuizFields(quiz, quizRequest, section);
                    } else {
                        log.info("Không tìm thấy quiz với id {}, đang tạo quiz mới", quizRequest.getId());
                        quiz = createNewQuiz(quizRequest, section);
                    }
                } else {
                    log.info("Đang tạo quiz mới với tiêu đề: {}", quizRequest.getTitle());
                    quiz = createNewQuiz(quizRequest, section);
                }

                Quiz savedQuiz = quizRepository.save(quiz);
                section.addQuiz(savedQuiz);

                if (quizRequest.getQuestions() != null && !quizRequest.getQuestions().isEmpty()) {
                    upsertQuestions(quizRequest.getQuestions(), savedQuiz, questionFiles);
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
        if (request.getNumberItem() != null && request.getNumberItem() < 0) {
            throw new AppException(ErrorCode.INVALID_REQUEST);
        }
    }

    private void updateQuizFields(Quiz quiz, QuizRequest request, Section section) {
        quiz.setTitle(request.getTitle());
        quiz.setDescription(request.getDescription());
        quiz.setDuration(request.getDuration() != null ? request.getDuration() : 0);
        quiz.setAttemptLimit(request.getAttemptLimit() != null ? request.getAttemptLimit() : 0);
        quiz.setPassingScore(request.getPassingScore() != null ? request.getPassingScore() : 0);
        quiz.setNumberItem(request.getNumberItem());
        quiz.setIsPublished(request.getIsPublished());
        quiz.setShowResults(request.getShowResults());
        quiz.setStartTime(request.getStartTime());
        quiz.setEndTime(request.getEndTime());
        quiz.setUpdateAt(new Date());
    }

    private Quiz createNewQuiz(QuizRequest request, Section section) {
        Quiz quiz = new Quiz();
        quiz.setTitle(request.getTitle());
        quiz.setDescription(request.getDescription());
        quiz.setDuration(request.getDuration() != null ? request.getDuration() : 0);
        quiz.setAttemptLimit(request.getAttemptLimit() != null ? request.getAttemptLimit() : 0);
        quiz.setPassingScore(request.getPassingScore() != null ? request.getPassingScore() : 0);
        quiz.setNumberItem(request.getNumberItem());
        quiz.setIsPublished(request.getIsPublished());
        quiz.setShowResults(request.getShowResults());
        quiz.setStartTime(request.getStartTime());
        quiz.setEndTime(request.getEndTime());
        quiz.setCreatedAt(new Date());
        quiz.setUpdateAt(new Date());
        quiz.setSection(section);
        return quiz;
    }

    private void upsertQuestions(
            Set<QuestionRequest> questionRequests,
            Quiz quiz,
            List<MultipartFile> questionFiles) {

        int questionFileIndex = 0;

        for (QuestionRequest questionRequest : questionRequests) {
            validateQuestionRequest(questionRequest);

            Question question;

            try {
                if (questionRequest.getId() != null) {
                    question = questionRepository.findById(questionRequest.getId())
                            .orElse(null);

                    log.info("Đang cập nhật question đã tồn tại với id: {}", questionRequest.getId());
                    updateQuestionFields(question, questionRequest, quiz, questionFiles, questionFileIndex);
                } else {
                    log.info("Tạo question mới: {}", questionRequest.getQuestionText());
                    question = createNewQuestion(questionRequest, quiz, questionFiles, questionFileIndex);
                }

                Question savedQuestion = questionRepository.save(question);
                quiz.addQuestion(savedQuestion);

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

    private void updateQuestionFields(Question question, QuestionRequest request, Quiz quiz, List<MultipartFile> questionFiles, int startIndex) {
        question.setQuestionText(request.getQuestionText());
        question.setQuestionType(request.getQuestionType());
        question.setOrderIndex(request.getOrderIndex());
        if (request.getAttachments() != null && !request.getAttachments().isEmpty()) {
            List<String> uploadedUrls = new ArrayList<>();
            if (!uploadedUrls.isEmpty()) {
                question.setAttachments(uploadedUrls);
            }
        }
        question.setScore(request.getScore());
        question.setUpdateAt(new Date());
    }

    private Question createNewQuestion(QuestionRequest request, Quiz quiz, List<MultipartFile> questionFiles, int startIndex) {
        Question question = new Question();
        question.setQuestionText(request.getQuestionText());
        question.setQuestionType(request.getQuestionType());
        question.setOrderIndex(request.getOrderIndex());

        List<String> processedAttachments = new ArrayList<>();
        if (request.getAttachments() != null){
            for (String attachment : request.getAttachments()) {
                if (attachment.startsWith("FILE_INDEX:")) {
                    // Extract file index
                    int fileIndex = Integer.parseInt(attachment.substring("FILE_INDEX:".length()));

                    // Get corresponding file
                    MultipartFile file = questionFiles.get(fileIndex);
                    // Upload to S3/Cloud Storage
                    String uploadedUrl = fileHandlerRepository.uploadFile(file).get("url");
                    processedAttachments.add(uploadedUrl);
                } else {
                    // Already uploaded URL, keep as is
                    processedAttachments.add(attachment);
                }
            }
        }


        question.setAttachments(processedAttachments);

        question.setScore(request.getScore());
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
                        updateAnswerFields(answer, answerRequest, question);
                    } else {
                        log.info("Không tìm thấy answer với id {}, đang tạo answer mới", answerRequest.getId());
                        answer = createNewAnswer(answerRequest, question);
                    }
                } else {
                    log.info("Tạo mới answer: {}", answerRequest.getContent());
                    answer = createNewAnswer(answerRequest, question);
                }

                Answer savedAnswer = answerRepository.save(answer);
                question.addAnswer(savedAnswer);
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

    private void updateAnswerFields(Answer answer, AnswerRequest request, Question question) {
        answer.setContent(request.getContent());
        answer.setIsCorrect(request.getIsCorrect());
        answer.setOrderIndex(request.getOrderIndex());
        answer.setUpdateAt(new Date());
    }

    private Answer createNewAnswer(AnswerRequest request, Question question) {
        Answer answer = new Answer();
        answer.setContent(request.getContent());
        answer.setIsCorrect(request.getIsCorrect());
        answer.setOrderIndex(request.getOrderIndex());
        answer.setCreatedAt(new Date());
        answer.setUpdateAt(new Date());
        answer.setQuestion(question);
        return answer;
    }

    private void upsertAssignments(
            Set<AssignmentRequest> assignmentRequests,
            Section section,
            List<MultipartFile> assignmentFiles,
            List<MultipartFile> rubricFiles) {

        int assignmentFileIndex = 0;

        for (AssignmentRequest assignmentRequest : assignmentRequests) {
            validateAssignmentRequest(assignmentRequest);

            Assignment assignment;

            try {
                if (assignmentRequest.getId() != null) {
                    assignment = assignmentRepository.findById(assignmentRequest.getId())
                            .orElse(null);

                    log.info("Đang cập nhật assignment đã tồn tại với id: {}", assignmentRequest.getId());
                    updateAssignmentFields(assignment, assignmentRequest, section, assignmentFiles, rubricFiles, assignmentFileIndex);
                } else {
                    log.info("Đang tạo assignment mới với tiêu đề: {}", assignmentRequest.getTitle());
                    assignment = createNewAssignment(assignmentRequest, section, assignmentFiles, rubricFiles, assignmentFileIndex);
                }

                Assignment savedAssignment = assignmentRepository.save(assignment);
                section.addAssignment(savedAssignment);
            } catch (AppException e) {
                throw e;
            } catch (Exception e) {
                log.error("Lỗi khi upsert assignment: {}", assignmentRequest.getTitle(), e);
                throw new AppException(ErrorCode.DATA_INTEGRITY_VIOLATION);
            }
        }
    }
    private void validateAssignmentRequest(AssignmentRequest request) {
        if (request == null) {
            throw new AppException(ErrorCode.INVALID_REQUEST);
        }
        if (request.getTitle() == null || request.getTitle().trim().isEmpty()) {
            throw new AppException(ErrorCode.REQUIRED_FIELD_MISSING);
        }
        if (request.getTitle().length() > 255) {
            throw new AppException(ErrorCode.FIELD_VALUE_TOO_LONG);
        }
        if (request.getDeadline() == null) {
            throw new AppException(ErrorCode.REQUIRED_FIELD_MISSING);
        }
        if (request.getSubmissionType() == null || request.getSubmissionType().trim().isEmpty()) {
            throw new AppException(ErrorCode.REQUIRED_FIELD_MISSING);
        }
    }

    private void updateAssignmentFields(Assignment assignment, AssignmentRequest request, Section section, List<MultipartFile> assignmentFiles, List<MultipartFile> rubricFiles, int startIndex) {
        assignment.setTitle(request.getTitle());
        assignment.setDescription(request.getDescription());
        assignment.setDeadline(request.getDeadline());

        assignment.setSubmissionType(request.getSubmissionType());

        assignment.setMaxScore(request.getMaxScore());
        assignment.setNumberItem(request.getNumberItem());
        assignment.setIsPublished(request.getIsPublished());
        assignment.setUpdateAt(new Date());
    }

    private Assignment createNewAssignment(AssignmentRequest request, Section section, List<MultipartFile> assignmentFiles, List<MultipartFile> rubricFiles, int startIndex) {
        Assignment assignment = new Assignment();
        assignment.setTitle(request.getTitle());
        assignment.setDescription(request.getDescription());
        assignment.setDeadline(request.getDeadline());
        // MAP ASSIGNMENT FILES
        List<String> processedAttachments = new ArrayList<>();


        if (request.getAssignmentFiles() != null){
            for (String attachment : request.getAssignmentFiles()) {
                if (attachment.startsWith("FILE_INDEX:")) {
                    // Extract file index
                    int fileIndex = Integer.parseInt(attachment.substring("FILE_INDEX:".length()));
                    // Get corresponding file
                    MultipartFile file = assignmentFiles.get(fileIndex);
                    // Upload to S3/Cloud Storage
                    String uploadedUrl = fileHandlerRepository.uploadFile(file).get("url");
                    processedAttachments.add(uploadedUrl);
                } else {
                    // Already uploaded URL, keep as is
                    processedAttachments.add(attachment);
                }
            }
            assignment.setAssignmentFiles(processedAttachments);
        }


        assignment.setSubmissionType(request.getSubmissionType());

        if (request.getRubricFiles() != null){
            for (String attachment : request.getRubricFiles()) {
                if (attachment.startsWith("FILE_INDEX:")) {
                    // Extract file index
                    int fileIndex = Integer.parseInt(attachment.substring("FILE_INDEX:".length()));
                    // Get corresponding file
                    MultipartFile file = rubricFiles.get(fileIndex);
                    // Upload to S3/Cloud Storage
                    String uploadedUrl = fileHandlerRepository.uploadFile(file).get("url");
                    processedAttachments.add(uploadedUrl);
                } else {
                    // Already uploaded URL, keep as is
                    processedAttachments.add(attachment);
                }
            }

            assignment.setRubricFiles(processedAttachments);
        }

        assignment.setMaxScore(request.getMaxScore());
        assignment.setNumberItem(request.getNumberItem());
        assignment.setIsPublished(request.getIsPublished());
        assignment.setCreatedAt(new Date());
        assignment.setUpdateAt(new Date());
        assignment.setSection(section);
        return assignment;
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

            List<Assignment> assignments = assignmentRepository.findBySectionId(id);
            for (Assignment assignment : assignments) {
                List<AssignmentSubmission> submissions = assignmentSubmissionRepository.findByAssignmentId(assignment.getId());
                assignmentSubmissionRepository.deleteAll(submissions);
                assignmentSubmissionRepository.flush();
            }
            assignmentRepository.deleteAll(assignments);
            assignmentRepository.flush();
            log.debug("Đã xóa {} assignments cho section có id: {}", assignments.size(), id);

            sectionRepository.delete(section);
            sectionRepository.flush();
            log.info("Đã xóa thành công section có id: {} cùng toàn bộ nội dung liên quan", id);
        } catch (Exception e) {
            log.error("Lỗi khi xóa section id: {}", id, e);
            throw new AppException(ErrorCode.DATA_INTEGRITY_VIOLATION);
        }
    }
}