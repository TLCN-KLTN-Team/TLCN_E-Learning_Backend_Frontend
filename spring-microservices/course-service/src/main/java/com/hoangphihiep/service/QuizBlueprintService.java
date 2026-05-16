package com.hoangphihiep.service;

import com.hoangphihiep.dto.response.QuizBlueprintResponse;
import com.hoangphihiep.entity.CourseObjective;
import com.hoangphihiep.entity.Quiz;
import com.hoangphihiep.entity.QuizBlueprint;
import com.hoangphihiep.exception.AppException;
import com.hoangphihiep.exception.ErrorCode;
import com.hoangphihiep.mapper.QuizBlueprintMapper;
import com.hoangphihiep.repository.CourseObjectiveRepository;
import com.hoangphihiep.repository.QuizBlueprintRepository;
import com.hoangphihiep.repository.QuizRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
@Service
@RequiredArgsConstructor
@Slf4j
public class QuizBlueprintService {

    private final QuizBlueprintRepository quizBlueprintRepository;
    private final QuizRepository quizRepository;
    private final CourseObjectiveRepository courseObjectiveRepository;
    private final QuizBlueprintMapper quizBlueprintMapper;

    @Transactional
    public QuizBlueprintResponse addCLOToBlueprint(Integer quizId, Integer cloId, Double percentage) {

        if (percentage == null || percentage < 0 || percentage > 100) {
            throw new AppException(ErrorCode.QUIZ_BLUEPRINT_PERCENTAGE_INVALID);
        }

        Quiz quiz = quizRepository.findById(quizId)
                .orElseThrow(() -> new AppException(ErrorCode.QUIZ_NOT_FOUND));

        CourseObjective clo = courseObjectiveRepository.findById(cloId)
                .orElseThrow(() -> new AppException(ErrorCode.CLO_NOT_FOUND));

        QuizBlueprint existing = quizBlueprintRepository.findByQuizIdAndCourseObjectiveId(quizId, cloId);
        if (existing != null) {
            throw new AppException(ErrorCode.QUIZ_BLUEPRINT_DUPLICATE_CLO);
        }

        QuizBlueprint blueprint = new QuizBlueprint();
        blueprint.setQuiz(quiz);
        blueprint.setCourseObjective(clo);
        blueprint.setPercentage(percentage);
        blueprint.setCreatedAt(LocalDateTime.now());
        blueprint.setUpdatedAt(LocalDateTime.now());

        QuizBlueprint saved = quizBlueprintRepository.save(blueprint);

        return quizBlueprintMapper.toQuizBlueprintResponse(saved);
    }

    @Transactional
    public QuizBlueprintResponse updateCLOPercentage(Integer quizId, Integer cloId, Double newPercentage) {

        if (newPercentage == null || newPercentage < 0 || newPercentage > 100) {
            throw new AppException(ErrorCode.QUIZ_BLUEPRINT_PERCENTAGE_INVALID);
        }

        QuizBlueprint blueprint = quizBlueprintRepository.findByQuizIdAndCourseObjectiveId(quizId, cloId);
        if (blueprint == null) {
            throw new AppException(ErrorCode.QUIZ_BLUEPRINT_NOT_FOUND);
        }

        blueprint.setPercentage(newPercentage);
        blueprint.setUpdatedAt(LocalDateTime.now());

        QuizBlueprint saved = quizBlueprintRepository.save(blueprint);

        return quizBlueprintMapper.toQuizBlueprintResponse(saved);
    }

    @Transactional
    public void removeCLOFromBlueprint(Integer quizId, Integer cloId) {
        QuizBlueprint blueprint = quizBlueprintRepository.findByQuizIdAndCourseObjectiveId(quizId, cloId);
        if (blueprint == null) {
            throw new AppException(ErrorCode.QUIZ_BLUEPRINT_NOT_FOUND);
        }

        quizBlueprintRepository.delete(blueprint);
    }

    @Transactional(readOnly = true)
    public List<QuizBlueprintResponse> getBlueprintByQuizId(Integer quizId) {
        // Verify quiz exists
        quizRepository.findById(quizId)
                .orElseThrow(() -> new AppException(ErrorCode.QUIZ_NOT_FOUND));

        return quizBlueprintMapper.toQuizBlueprintResponseList(findBlueprintEntitiesByQuizId(quizId));
    }

    @Transactional(readOnly = true)
    public void validateBlueprintTotalPercentage(Integer quizId) {

        Double totalPercentage = quizBlueprintRepository.getTotalPercentageByQuizId(quizId);

        if (totalPercentage == null || totalPercentage == 0) {
            throw new AppException(ErrorCode.QUIZ_BLUEPRINT_EMPTY);
        }

        if (Math.abs(totalPercentage - 100.0) > 0.001) {
            throw new AppException(ErrorCode.QUIZ_BLUEPRINT_TOTAL_PERCENTAGE_INVALID);
        }
    }

    @Transactional(readOnly = true)
    public Double getTotalPercentage(Integer quizId) {

        Double totalPercentage = quizBlueprintRepository.getTotalPercentageByQuizId(quizId);
        return totalPercentage != null ? totalPercentage : 0.0;
    }

    @Transactional(readOnly = true)
    public boolean isBlueprintComplete(Integer quizId) {
        Double totalPercentage = getTotalPercentage(quizId);
        return Math.abs(totalPercentage - 100.0) < 0.001;
    }

    @Transactional
    public void clearBlueprint(Integer quizId) {
        quizRepository.findById(quizId)
                .orElseThrow(() -> new AppException(ErrorCode.QUIZ_NOT_FOUND));

        quizBlueprintRepository.deleteByQuizId(quizId);
    }

    private List<QuizBlueprint> findBlueprintEntitiesByQuizId(Integer quizId) {
        return quizBlueprintRepository.findByQuizId(quizId);
    }
}
