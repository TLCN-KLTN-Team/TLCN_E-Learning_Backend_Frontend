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
    private final QuizQuestionRepository quizQuestionRepository;
    private final SectionMapper sectionMapper;
    private final FileHandlerRepository fileHandlerRepository;
    private final ContentVisibilityService contentVisibilityService;

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
        if (request.getSections() == null) {
            throw new AppException(ErrorCode.REQUIRED_FIELD_MISSING);
        }

        Course course = courseRepository.findById(request.getCourseId())
                .orElseThrow(() -> new AppException(ErrorCode.COURSE_NOT_FOUND));

        List<SectionResponse> responses = new ArrayList<>();

        try {
            Set<Integer> requestSectionIds = request.getSections().stream()
                    .filter(s -> s.getId() != null)
                    .map(SectionRequest::getId)
                    .collect(java.util.stream.Collectors.toSet());
            List<Section> existingSections = sectionRepository.findByCourseIdOrderByOrderIndex(course.getId());
            for (Section existingSection : new ArrayList<>(existingSections)) {
                if (!requestSectionIds.contains(existingSection.getId())) {
                    course.getSections().remove(existingSection);
                    sectionRepository.delete(existingSection);
                }
            }

            for (SectionRequest sectionRequest : new ArrayList<>(request.getSections())) {
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

            if (request.getVisibleClassIds() != null) {
                contentVisibilityService.updateSectionVisibility(
                        savedSection.getId(),
                        request.getVisibleClassIds()
                );
            }

            // Process lessons
            if (request.getLessons() != null) {
                upsertLessons(request.getLessons(), savedSection, lessonFiles);
            }

            // Process quizzes
            if (request.getQuizzes() != null) {
                upsertQuizzes(request.getQuizzes(), savedSection, questionFiles);
            }

            // Process assignments
            if (request.getAssignments() != null) {
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

        if (section.getLessons() != null) {
            Set<Integer> requestLessonIds = lessonRequests.stream()
                    .filter(l -> l.getId() != null)
                    .map(LessonRequest::getId)
                    .collect(java.util.stream.Collectors.toSet());
            List<Lesson> lessonsToRemove = new ArrayList<>();
            for (Lesson existingLesson : new ArrayList<>(section.getLessons())) {
                if (!requestLessonIds.contains(existingLesson.getId())) {
                    lessonsToRemove.add(existingLesson);
                }
            }
            for (Lesson lessonToRemove : lessonsToRemove) {
                section.getLessons().remove(lessonToRemove);
                lessonRepository.delete(lessonToRemove);
            }
        }

        int lessonFileIndex = 0;
        int lessonSeqIndex = 1;

        for (LessonRequest lessonRequest : new ArrayList<>(lessonRequests)) {
            lessonRequest.setNumberItem(lessonSeqIndex++);
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

                    updateLessonFields(lesson, lessonRequest, section, lessonFiles);
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

    private void updateLessonFields(Lesson lesson, LessonRequest request, Section section, List<MultipartFile> lessonFiles) {
        lesson.setTitle(request.getTitle());
        lesson.setDescription(request.getDescription());
        lesson.setContent(request.getContent());
        lesson.setIsPublished(request.getIsPublished());

        // XỬ LÝ ATTACHMENTS
        List<String> processedAttachments = new ArrayList<>();

        if (request.getAttachments() != null && !request.getAttachments().isEmpty()) {
            log.info("Processing {} attachments for lesson update", request.getAttachments().size());

            for (String attachment : request.getAttachments()) {
                // Case 1: FILE_INDEX - File mới cần upload
                if (attachment.startsWith("FILE_INDEX:")) {
                    try {
                        int fileIndex = Integer.parseInt(attachment.substring("FILE_INDEX:".length()));

                        if (fileIndex < 0 || fileIndex >= lessonFiles.size()) {
                            log.warn("Invalid file index: {} (total files: {})", fileIndex, lessonFiles.size());
                            continue;
                        }

                        MultipartFile file = lessonFiles.get(fileIndex);
                        log.info("Uploading new file: {} (index: {})", file.getOriginalFilename(), fileIndex);

                        Map<String, String> uploadResult = fileHandlerRepository.uploadFile(file);
                        String uploadedUrl = uploadResult.get("url");

                        if (uploadedUrl != null && !uploadedUrl.isEmpty()) {
                            processedAttachments.add(uploadedUrl);
                            log.info("Successfully uploaded file: {}", uploadedUrl);
                        }
                    } catch (NumberFormatException e) {
                        log.error("Invalid FILE_INDEX format: {}", attachment, e);
                    } catch (Exception e) {
                        log.error("Failed to upload file at index: {}", attachment, e);
                    }
                }
                // Case 2: HTTP/HTTPS URL - File cũ đã có trên server
                else if (attachment.startsWith("http://") || attachment.startsWith("https://")) {
                    log.info("Keeping existing server file: {}", attachment.substring(0, Math.min(50, attachment.length())));
                    processedAttachments.add(attachment);
                }
                // Case 3: JSON metadata với URL từ server
                else if (attachment.trim().startsWith("{")) {
                    try {
                        // Parse JSON để lấy URL
                        ObjectMapper mapper = new ObjectMapper();
                        Map<String, Object> metadata = mapper.readValue(attachment, Map.class);
                        String url = (String) metadata.get("url");

                        if (url != null && (url.startsWith("http://") || url.startsWith("https://"))) {
                            log.info("Keeping existing server file from JSON: {}", url.substring(0, Math.min(50, url.length())));
                            processedAttachments.add(url);
                        } else {
                            log.warn("Invalid URL in JSON metadata: {}", attachment.substring(0, Math.min(100, attachment.length())));
                        }
                    } catch (Exception e) {
                        log.error("Failed to parse JSON metadata: {}", attachment.substring(0, Math.min(100, attachment.length())), e);
                    }
                }
                // Case 4: Các trường hợp khác - log warning
                else {
                    log.warn("Unknown attachment format, skipping: {}", attachment.substring(0, Math.min(50, attachment.length())));
                }
            }

            log.info("Processed {} attachments for lesson: {}", processedAttachments.size(), lesson.getTitle());
            lesson.setAttachments(processedAttachments);
        } else {
            // Nếu request không có attachments, giữ nguyên attachments cũ
            log.info("No attachments in request, keeping existing attachments");
            // Không set null, giữ nguyên list cũ
        }

        lesson.setNumberItem(request.getNumberItem());
        lesson.setIsFreeLesson(request.getIsFreeLesson());
        
        // Xử lý videoUrl: nếu là FILE_INDEX thì upload, ngược lại giữ nguyên URL
        String videoUrl = request.getVideoUrl();
        if (videoUrl != null && videoUrl.startsWith("FILE_INDEX:")) {
            try {
                int fileIndex = Integer.parseInt(videoUrl.substring("FILE_INDEX:".length()));
                if (lessonFiles != null && fileIndex < lessonFiles.size()) {
                    MultipartFile videoFile = lessonFiles.get(fileIndex);
                    String uploadedUrl = fileHandlerRepository.uploadFile(videoFile).get("url");
                    lesson.setVideoUrl(uploadedUrl);
                    log.info("Uploaded video file for lesson: {}", uploadedUrl);
                } else {
                    log.warn("Video file index out of bounds: {}", fileIndex);
                    lesson.setVideoUrl(null);
                }
            } catch (NumberFormatException e) {
                log.error("Invalid FILE_INDEX format for video: {}", videoUrl, e);
                lesson.setVideoUrl(null);
            }
        } else {
            // Giữ nguyên URL (YouTube, Vimeo, hoặc URL đã upload trước đó)
            lesson.setVideoUrl(videoUrl);
        }
        
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

                    MultipartFile file = lessonFiles.get(fileIndex);
                    String uploadedUrl = fileHandlerRepository.uploadFile(file).get("url");
                    processedAttachments.add(uploadedUrl);
                } else {
                    // Already uploaded URL, keep as is
                    processedAttachments.add(attachment);
                }
            }

            lesson.setAttachments(processedAttachments);
        }

        // Xử lý videoUrl: nếu là FILE_INDEX thì upload, ngược lại giữ nguyên URL
        String videoUrl = request.getVideoUrl();
        if (videoUrl != null && videoUrl.startsWith("FILE_INDEX:")) {
            try {
                int fileIndex = Integer.parseInt(videoUrl.substring("FILE_INDEX:".length()));
                if (lessonFiles != null && fileIndex < lessonFiles.size()) {
                    MultipartFile videoFile = lessonFiles.get(fileIndex);
                    String uploadedUrl = fileHandlerRepository.uploadFile(videoFile).get("url");
                    lesson.setVideoUrl(uploadedUrl);
                    log.info("Uploaded video file for new lesson: {}", uploadedUrl);
                } else {
                    log.warn("Video file index out of bounds: {}", fileIndex);
                    lesson.setVideoUrl(null);
                }
            } catch (NumberFormatException e) {
                log.error("Invalid FILE_INDEX format for video: {}", videoUrl, e);
                lesson.setVideoUrl(null);
            }
        } else {
            // Giữ nguyên URL (YouTube, Vimeo, hoặc URL đã upload trước đó)
            lesson.setVideoUrl(videoUrl);
        }

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

        if (section.getQuizs() != null) {
            Set<Integer> requestQuizIds = quizRequests.stream()
                    .filter(q -> q.getId() != null)
                    .map(QuizRequest::getId)
                    .collect(java.util.stream.Collectors.toSet());
            List<Quiz> quizzesToRemove = new ArrayList<>();
            for (Quiz existingQuiz : new ArrayList<>(section.getQuizs())) {
                if (!requestQuizIds.contains(existingQuiz.getId())) {
                    quizzesToRemove.add(existingQuiz);
                }
            }
            for (Quiz quizToRemove : quizzesToRemove) {
                section.getQuizs().remove(quizToRemove);
                quizRepository.delete(quizToRemove);
            }
        }

        int quizSeqIndex = 1;
        for (QuizRequest quizRequest : new ArrayList<>(quizRequests)) {
            quizRequest.setNumberItem(quizSeqIndex++);
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

                // Handle many-to-many relationship via questionIds
                if (quizRequest.getQuestionIds() != null && !quizRequest.getQuestionIds().isEmpty()) {
                    linkQuestionsToQuiz(savedQuiz.getId(), quizRequest.getQuestionIds());
                } else if (quizRequest.getQuestions() != null && !quizRequest.getQuestions().isEmpty()) {
                    // Backward compatibility: still support old format
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
        quiz.setIsPublished(request.getIsPublished());
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
                // Removed direct relationship - questions are now linked via quiz_questions table

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

        // XỬ LÝ ATTACHMENTS
        List<String> processedAttachments = new ArrayList<>();

        if (request.getAttachments() != null && !request.getAttachments().isEmpty()) {
            log.info("Processing {} attachments for question update", request.getAttachments().size());

            for (String attachment : request.getAttachments()) {
                if (attachment.startsWith("FILE_INDEX:")) {
                    try {
                        int fileIndex = Integer.parseInt(attachment.substring("FILE_INDEX:".length()));

                        if (fileIndex >= 0 && fileIndex < questionFiles.size()) {
                            MultipartFile file = questionFiles.get(fileIndex);
                            log.info("Uploading new question file: {}", file.getOriginalFilename());

                            Map<String, String> uploadResult = fileHandlerRepository.uploadFile(file);
                            String uploadedUrl = uploadResult.get("url");

                            if (uploadedUrl != null && !uploadedUrl.isEmpty()) {
                                processedAttachments.add(uploadedUrl);
                            }
                        }
                    } catch (Exception e) {
                        log.error("Failed to upload question file: {}", attachment, e);
                    }
                }
                else if (attachment.startsWith("http://") || attachment.startsWith("https://")) {
                    processedAttachments.add(attachment);
                }
                else if (attachment.trim().startsWith("{")) {
                    try {
                        ObjectMapper mapper = new ObjectMapper();
                        Map<String, Object> metadata = mapper.readValue(attachment, Map.class);
                        String url = (String) metadata.get("url");

                        if (url != null && (url.startsWith("http://") || url.startsWith("https://"))) {
                            processedAttachments.add(url);
                        }
                    } catch (Exception e) {
                        log.error("Failed to parse question file metadata", e);
                    }
                }
            }

            question.setAttachments(processedAttachments);
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
        // Removed direct quiz relationship - using many-to-many via quiz_questions table
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

        if (section.getAssignments() != null) {
            Set<Integer> requestAssignmentIds = assignmentRequests.stream()
                    .filter(a -> a.getId() != null)
                    .map(AssignmentRequest::getId)
                    .collect(java.util.stream.Collectors.toSet());
            List<Assignment> assignmentsToRemove = new ArrayList<>();
            for (Assignment existingAssignment : new ArrayList<>(section.getAssignments())) {
                if (!requestAssignmentIds.contains(existingAssignment.getId())) {
                    assignmentsToRemove.add(existingAssignment);
                }
            }
            for (Assignment assignmentToRemove : assignmentsToRemove) {
                section.getAssignments().remove(assignmentToRemove);
                assignmentRepository.delete(assignmentToRemove);
            }
        }

        int assignmentFileIndex = 0;
        int assignmentSeqIndex = 1;

        for (AssignmentRequest assignmentRequest : new ArrayList<>(assignmentRequests)) {
            assignmentRequest.setNumberItem(assignmentSeqIndex++);
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

    private void updateAssignmentFields(
            Assignment assignment,
            AssignmentRequest request,
            Section section,
            List<MultipartFile> assignmentFiles,
            List<MultipartFile> rubricFiles,
            int startIndex) {

        assignment.setTitle(request.getTitle());
        assignment.setDescription(request.getDescription());
        assignment.setDeadline(request.getDeadline());
        assignment.setSubmissionType(request.getSubmissionType());
        assignment.setMaxScore(request.getMaxScore());
        assignment.setNumberItem(request.getNumberItem());
        assignment.setIsPublished(request.getIsPublished());

        // XỬ LÝ ASSIGNMENT FILES — DÙNG LIST RIÊNG
        if (request.getAssignmentFiles() != null && !request.getAssignmentFiles().isEmpty()) {
            List<String> assignmentProcessedFiles = processFileList(
                    request.getAssignmentFiles(),
                    assignmentFiles,
                    "assignment"
            );
            assignment.setAssignmentFiles(assignmentProcessedFiles);
        }

        // XỬ LÝ RUBRIC FILES — DÙNG LIST RIÊNG
        if (request.getRubricFiles() != null && !request.getRubricFiles().isEmpty()) {
            List<String> rubricProcessedFiles = processFileList(
                    request.getRubricFiles(),
                    rubricFiles,
                    "rubric"
            );
            assignment.setRubricFiles(rubricProcessedFiles);
        }

        assignment.setUpdateAt(new Date());
    }


    private List<String> processFileList(List<String> fileStrings, List<MultipartFile> files, String fileType) {
        List<String> processedFiles = new ArrayList<>();

        for (String fileStr : fileStrings) {
            if (fileStr.startsWith("FILE_INDEX:")) {
                try {
                    int fileIndex = Integer.parseInt(fileStr.substring("FILE_INDEX:".length()));

                    if (fileIndex >= 0 && fileIndex < files.size()) {
                        MultipartFile file = files.get(fileIndex);
                        log.info("Uploading new {} file: {}", fileType, file.getOriginalFilename());

                        Map<String, String> uploadResult = fileHandlerRepository.uploadFile(file);
                        String uploadedUrl = uploadResult.get("url");

                        if (uploadedUrl != null && !uploadedUrl.isEmpty()) {
                            processedFiles.add(uploadedUrl);
                            log.info("Successfully uploaded {} file: {}", fileType, uploadedUrl);
                        }
                    }
                } catch (Exception e) {
                    log.error("Failed to upload {} file: {}", fileType, fileStr, e);
                }
            }
            else if (fileStr.startsWith("http://") || fileStr.startsWith("https://")) {
                log.info("Keeping existing {} file: {}", fileType, fileStr.substring(0, Math.min(50, fileStr.length())));
                processedFiles.add(fileStr);
            }
            else if (fileStr.trim().startsWith("{")) {
                try {
                    ObjectMapper mapper = new ObjectMapper();
                    Map<String, Object> metadata = mapper.readValue(fileStr, Map.class);
                    String url = (String) metadata.get("url");

                    if (url != null && (url.startsWith("http://") || url.startsWith("https://"))) {
                        processedFiles.add(url);
                    }
                } catch (Exception e) {
                    log.error("Failed to parse {} file metadata", fileType, e);
                }
            }
        }

        log.info("Processed {} {} files", processedFiles.size(), fileType);
        return processedFiles;
    }

    private Assignment createNewAssignment(
            AssignmentRequest request,
            Section section,
            List<MultipartFile> assignmentFiles,
            List<MultipartFile> rubricFiles,
            int startIndex) {

        Assignment assignment = new Assignment();
        assignment.setTitle(request.getTitle());
        assignment.setDescription(request.getDescription());
        assignment.setDeadline(request.getDeadline());

        List<String> assignmentAttachments = new ArrayList<>();

        if (request.getAssignmentFiles() != null) {
            for (String attachment : request.getAssignmentFiles()) {

                if (attachment.startsWith("FILE_INDEX:")) {
                    int fileIndex = Integer.parseInt(attachment.substring("FILE_INDEX:".length()));
                    MultipartFile file = assignmentFiles.get(fileIndex);

                    String uploadedUrl = fileHandlerRepository.uploadFile(file).get("url");
                    assignmentAttachments.add(uploadedUrl);
                } else {
                    assignmentAttachments.add(attachment);
                }
            }
        }

        assignment.setAssignmentFiles(assignmentAttachments);

        assignment.setSubmissionType(request.getSubmissionType());

        List<String> rubricAttachments = new ArrayList<>();

        if (request.getRubricFiles() != null) {
            for (String attachment : request.getRubricFiles()) {

                if (attachment.startsWith("FILE_INDEX:")) {
                    int fileIndex = Integer.parseInt(attachment.substring("FILE_INDEX:".length()));
                    MultipartFile file = rubricFiles.get(fileIndex);

                    String uploadedUrl = fileHandlerRepository.uploadFile(file).get("url");
                    rubricAttachments.add(uploadedUrl);
                } else {
                    rubricAttachments.add(attachment);
                }
            }
        }

        assignment.setRubricFiles(rubricAttachments);

        assignment.setMaxScore(request.getMaxScore());
        assignment.setNumberItem(request.getNumberItem());
        assignment.setIsPublished(request.getIsPublished());
        assignment.setCreatedAt(new Date());
        assignment.setUpdateAt(new Date());
        assignment.setSection(section);

        return assignment;
    }


    /**
     * Link questions from library to quiz (many-to-many relationship)
     */
    private void linkQuestionsToQuiz(Integer quizId, Set<Integer> questionIds) {
        log.info("Linking {} questions to quiz {}", questionIds.size(), quizId);
        
        // First, remove existing links for this quiz
        quizQuestionRepository.deleteByQuizId(quizId);
        
        // Create new links
        int orderIndex = 1;
        for (Integer questionId : questionIds) {
            // Validate question exists
            Question question = questionRepository.findById(questionId)
                    .orElseThrow(() -> new AppException(ErrorCode.QUESTION_NOT_FOUND));
            
            // Validate it's a library question (not already owned by another quiz in one-to-many)
            // Since we removed the quiz field from Question, all questions are now library questions
            
            QuizQuestion quizQuestion = QuizQuestion.builder()
                    .quizId(quizId)
                    .questionId(questionId)
                    .orderIndex(orderIndex++)
                    .build();
            
            quizQuestionRepository.save(quizQuestion);
        }
        
        log.info("Successfully linked {} questions to quiz {}", questionIds.size(), quizId);
    }
}