package com.hoangphihiep.service;

import com.hoangphihiep.dto.request.QuestionRequest;
import com.hoangphihiep.dto.response.ApiResponse;
import com.hoangphihiep.dto.response.AnswerResponse;
import com.hoangphihiep.dto.response.QuestionResponse;
import com.hoangphihiep.dto.response.TeacherResponse;
import com.hoangphihiep.entity.Answer;
import com.hoangphihiep.entity.CourseObjective;
import com.hoangphihiep.entity.Question;
import com.hoangphihiep.exception.AppException;
import com.hoangphihiep.exception.ErrorCode;
import com.hoangphihiep.repository.CourseObjectiveRepository;
import com.hoangphihiep.repository.QuestionRepository;
import com.hoangphihiep.repository.httpclient.FileHandlerRepository;
import com.hoangphihiep.repository.httpclient.TeacherRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStream;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class QuestionLibraryService {

    private final QuestionRepository questionRepository;
    private final CourseObjectiveRepository courseObjectiveRepository;
    private final FileHandlerRepository fileHandlerRepository;
    private final TeacherRepository teacherRepository;

    public Page<QuestionResponse> getLibraryQuestions(String search, String questionType, String difficultyLevel, Pageable pageable) {
        String teacherId = SecurityContextHolder.getContext().getAuthentication().getName();

        Page<Question> questions;
        
        if (questionType != null && !questionType.isEmpty()) {
            questions = questionRepository.findLibraryQuestionsByType(teacherId, questionType, pageable);
        } else if (difficultyLevel != null && !difficultyLevel.isEmpty()) {
            questions = questionRepository.findLibraryQuestionsByDifficulty(teacherId, difficultyLevel, pageable);
        } else if (search != null && !search.isEmpty()) {
            questions = questionRepository.searchLibraryQuestions(teacherId, search, pageable);
        } else {
            questions = questionRepository.findLibraryQuestionsByTeacher(teacherId, pageable);
        }

        return questions.map(this::toQuestionResponse);
    }

    @Transactional
    public QuestionResponse createLibraryQuestion(QuestionRequest request, List<MultipartFile> imageFiles) {
        String teacherId = SecurityContextHolder.getContext().getAuthentication().getName();
        String mappedTeacherId = resolveMappedTeacherId(teacherId);

        // Upload images if provided
        List<String> uploadedUrls = new java.util.ArrayList<>();
        if (imageFiles != null && !imageFiles.isEmpty()) {
            for (MultipartFile file : imageFiles) {
                try {
                    var result = fileHandlerRepository.uploadFile(file);
                    uploadedUrls.add(result.get("url"));
                    log.info("Uploaded image: {}", result.get("url"));
                } catch (Exception e) {
                    log.error("Failed to upload image: {}", e.getMessage());
                    throw new AppException(ErrorCode.FILE_UPLOAD_FAILED);
                }
            }
        }

        // Combine existing attachments with newly uploaded URLs
        List<String> allAttachments = new java.util.ArrayList<>();
        if (request.getAttachments() != null) {
            allAttachments.addAll(request.getAttachments());
        }
        allAttachments.addAll(uploadedUrls);

        CourseObjective courseObjective = courseObjectiveRepository.findById(request.getCloId())
            .orElseThrow(() -> new AppException(ErrorCode.CLO_NOT_FOUND));
        if (courseObjective.getCourse() == null || !mappedTeacherId.equals(courseObjective.getCourse().getIdTeacher())) {
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }

        Question question = new Question();
        question.setQuestionText(request.getQuestionText());
        question.setQuestionType(request.getQuestionType());
        question.setScore(request.getScore());
        question.setDifficultyLevel(request.getDifficultyLevel());
        question.setTags(request.getTags());
        question.setAttachments(allAttachments.isEmpty() ? null : allAttachments);
        question.setTeacherId(teacherId);
        question.setEducationalUnitId(request.getEducationalUnitId());
        question.setCourseObjective(courseObjective);
        question.setCreatedAt(new Date());
        question.setUpdateAt(new Date());
        question.setAnswers(new HashSet<>());

        Question savedQuestion = questionRepository.save(question);

        // Add answers
        if (request.getAnswers() != null && !request.getAnswers().isEmpty()) {
            request.getAnswers().forEach(answerReq -> {
                Answer answer = new Answer();
                answer.setContent(answerReq.getContent());
                answer.setIsCorrect(answerReq.getIsCorrect());
                answer.setOrderIndex(answerReq.getOrderIndex());
                answer.setQuestion(savedQuestion);
                answer.setCreatedAt(new Date());
                answer.setUpdateAt(new Date());
                savedQuestion.addAnswer(answer);
            });
            questionRepository.save(savedQuestion);
        }

        return toQuestionResponse(savedQuestion);
    }

    @Transactional
    public QuestionResponse updateLibraryQuestion(Integer id, QuestionRequest request, List<MultipartFile> imageFiles) {
        String teacherId = SecurityContextHolder.getContext().getAuthentication().getName();
        String mappedTeacherId = resolveMappedTeacherId(teacherId);

        Question question = questionRepository.findByIdWithAnswers(id)
                .orElseThrow(() -> new AppException(ErrorCode.QUESTION_NOT_FOUND));

        if (!teacherId.equals(question.getTeacherId())) {
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }

        List<String> uploadedUrls = new java.util.ArrayList<>();
        if (imageFiles != null && !imageFiles.isEmpty()) {
            for (MultipartFile file : imageFiles) {
                try {
                    var result = fileHandlerRepository.uploadFile(file);
                    uploadedUrls.add(result.get("url"));
                    log.info("Uploaded image: {}", result.get("url"));
                } catch (Exception e) {
                    log.error("Failed to upload image: {}", e.getMessage());
                    throw new AppException(ErrorCode.FILE_UPLOAD_FAILED);
                }
            }
        }

        List<String> allAttachments = new java.util.ArrayList<>();
        if (request.getAttachments() != null) {
            allAttachments.addAll(request.getAttachments());
        }
        allAttachments.addAll(uploadedUrls);

        CourseObjective courseObjective = courseObjectiveRepository.findById(request.getCloId())
            .orElseThrow(() -> new AppException(ErrorCode.CLO_NOT_FOUND));
        if (courseObjective.getCourse() == null || !mappedTeacherId.equals(courseObjective.getCourse().getIdTeacher())) {
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }

        // Update question fields
        question.setQuestionText(request.getQuestionText());
        question.setQuestionType(request.getQuestionType());
        question.setScore(request.getScore());
        question.setDifficultyLevel(request.getDifficultyLevel());
        question.setTags(request.getTags());
        question.setAttachments(allAttachments.isEmpty() ? null : allAttachments);
        question.setEducationalUnitId(request.getEducationalUnitId());
        question.setCourseObjective(courseObjective);
        question.setUpdateAt(new Date());

        // Update answers - remove old answers and add new ones
        question.getAnswers().clear();
        
        if (request.getAnswers() != null && !request.getAnswers().isEmpty()) {
            request.getAnswers().forEach(answerReq -> {
                Answer answer = new Answer();
                answer.setContent(answerReq.getContent());
                answer.setIsCorrect(answerReq.getIsCorrect());
                answer.setOrderIndex(answerReq.getOrderIndex());
                answer.setQuestion(question);
                answer.setCreatedAt(new Date());
                answer.setUpdateAt(new Date());
                question.addAnswer(answer);
            });
        }

        Question updated = questionRepository.save(question);
        return toQuestionResponse(updated);
    }

    @Transactional
    public void deleteLibraryQuestion(Integer id) {
        String teacherId = SecurityContextHolder.getContext().getAuthentication().getName();

        Question question = questionRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.QUESTION_NOT_FOUND));

        // Verify ownership
        if (!teacherId.equals(question.getTeacherId())) {
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }

        // Delete question and cascade to quiz_questions (many-to-many links)
        questionRepository.delete(question);
    }

    @Transactional
    public Map<String, Object> importQuestionsFromCsv(MultipartFile file) {
        String teacherId = SecurityContextHolder.getContext().getAuthentication().getName();

        List<Question> importedQuestions = new ArrayList<>();
        List<String> errors = new ArrayList<>();
        int successCount = 0;
        int errorCount = 0;

        try (InputStream inputStream = file.getInputStream();
             Workbook workbook = new XSSFWorkbook(inputStream)) {

            Sheet sheet = workbook.getSheetAt(0);
            int rowNumber = 0;

            // Skip header row
            Iterator<Row> rowIterator = sheet.iterator();
            if (rowIterator.hasNext()) {
                rowIterator.next();
                rowNumber++;
            }

            while (rowIterator.hasNext()) {
                Row row = rowIterator.next();
                rowNumber++;

                try {
                    Question question = parseExcelRow(row, teacherId);
                    if (question != null) {
                        Question savedQuestion = questionRepository.save(question);
                        importedQuestions.add(savedQuestion);
                        successCount++;
                    }
                } catch (Exception e) {
                    errorCount++;
                    errors.add("Dòng " + rowNumber + ": " + e.getMessage());
                    log.error("Error parsing row {}: {}", rowNumber, e.getMessage());
                }
            }

        } catch (Exception e) {
            throw new AppException(ErrorCode.FILE_UPLOAD_FAILED);
        }

        Map<String, Object> result = new HashMap<>();
        result.put("successCount", successCount);
        result.put("errorCount", errorCount);
        result.put("errors", errors);
        result.put("importedQuestions", importedQuestions.stream()
                .map(this::toQuestionResponse)
                .collect(Collectors.toList()));

        return result;
    }

    private Question parseExcelRow(Row row, String teacherId) {
        if (row == null) return null;

        // Read basic fields
        String questionText = getCellValueAsString(row.getCell(0));
        String questionType = getCellValueAsString(row.getCell(1));
        String scoreStr = getCellValueAsString(row.getCell(2));
        String difficultyLevel = getCellValueAsString(row.getCell(3));
        String tags = getCellValueAsString(row.getCell(4));

        if (questionText.isEmpty() || questionType.isEmpty()) {
            throw new RuntimeException("Câu hỏi và loại câu hỏi không được để trống");
        }

        Question question = new Question();
        question.setQuestionText(questionText);
        question.setQuestionType(questionType.toUpperCase());
        question.setScore(scoreStr.isEmpty() ? null : Double.parseDouble(scoreStr));
        question.setDifficultyLevel(difficultyLevel.isEmpty() ? null : difficultyLevel.toUpperCase());
        question.setTags(tags);
        question.setTeacherId(teacherId);
        question.setCreatedAt(new Date());

        // Parse answers (pairs of answer content and isCorrect)
        Set<Answer> answers = new HashSet<>();
        int answerIndex = 1;

        for (int i = 5; i < row.getLastCellNum(); i += 2) {
            String answerContent = getCellValueAsString(row.getCell(i));
            String isCorrectStr = getCellValueAsString(row.getCell(i + 1));

            if (!answerContent.isEmpty()) {
                boolean isCorrect = "true".equalsIgnoreCase(isCorrectStr) || "1".equals(isCorrectStr);

                Answer answer = new Answer();
                answer.setContent(answerContent);
                answer.setIsCorrect(isCorrect);
                answer.setOrderIndex(answerIndex++);
                answer.setQuestion(question);
                answers.add(answer);
            }
        }

        if (answers.isEmpty()) {
            throw new RuntimeException("Câu hỏi phải có ít nhất 1 đáp án");
        }

        question.setAnswers(answers);
        return question;
    }

    private String getCellValueAsString(Cell cell) {
        if (cell == null) {
            return "";
        }

        return switch (cell.getCellType()) {
            case STRING -> cell.getStringCellValue().trim();
            case NUMERIC -> String.valueOf((int) cell.getNumericCellValue());
            case BOOLEAN -> String.valueOf(cell.getBooleanCellValue());
            case BLANK -> "";
            default -> "";
        };
    }

    private String resolveMappedTeacherId(String principalId) {
        try {
            ApiResponse<TeacherResponse> teacherByTeacherId = teacherRepository.getTeacherByTeacherId(principalId);
            if (teacherByTeacherId != null
                    && teacherByTeacherId.getResult() != null
                    && teacherByTeacherId.getResult().getTeacherId() != null
                    && !teacherByTeacherId.getResult().getTeacherId().isBlank()) {
                return teacherByTeacherId.getResult().getTeacherId();
            }
        } catch (Exception ex) {
            log.debug("Principal {} is not a teacherId, fallback to userId", principalId);
        }

        try {
            ApiResponse<TeacherResponse> teacherByUserId = teacherRepository.getTeacherByUserId(principalId);
            if (teacherByUserId != null
                    && teacherByUserId.getResult() != null
                    && teacherByUserId.getResult().getTeacherId() != null
                    && !teacherByUserId.getResult().getTeacherId().isBlank()) {
                return teacherByUserId.getResult().getTeacherId();
            }
        } catch (Exception ex) {
            log.warn("Cannot resolve teacher mapping for principal {}", principalId);
        }

        throw new AppException(ErrorCode.TEACHER_NOT_FOUND);
    }

    // Helper method to convert Question to QuestionResponse
    private QuestionResponse toQuestionResponse(Question question) {
        QuestionResponse response = new QuestionResponse();
        response.setId(question.getId());
        response.setQuestionText(question.getQuestionText());
        response.setQuestionType(question.getQuestionType());
        response.setOrderIndex(question.getOrderIndex());
        response.setScore(question.getScore());
        response.setDifficultyLevel(question.getDifficultyLevel());
        response.setTags(question.getTags());
        response.setTeacherId(question.getTeacherId());
        response.setEducationalUnitId(question.getEducationalUnitId());
        if (question.getCourseObjective() != null) {
            response.setCloId(question.getCourseObjective().getId());
            response.setCloCode(question.getCourseObjective().getCode());
        }
        response.setAttachments(question.getAttachments());
        response.setCreatedAt(question.getCreatedAt());
        response.setUpdateAt(question.getUpdateAt());

        if (question.getAnswers() != null) {
            response.setAnswers(question.getAnswers().stream()
                    .map(answer -> {
                        AnswerResponse answerResp = new AnswerResponse();
                        answerResp.setId(answer.getId());
                        answerResp.setContent(answer.getContent());
                        answerResp.setIsCorrect(answer.getIsCorrect());
                        answerResp.setOrderIndex(answer.getOrderIndex());
                        return answerResp;
                    })
                    .collect(Collectors.toSet()));
        }

        return response;
    }
}
