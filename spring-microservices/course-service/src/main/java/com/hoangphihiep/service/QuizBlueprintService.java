package com.hoangphihiep.service;

import com.hoangphihiep.entity.CourseObjective;
import com.hoangphihiep.entity.Quiz;
import com.hoangphihiep.entity.QuizBlueprint;
import com.hoangphihiep.exception.AppException;
import com.hoangphihiep.exception.ErrorCode;
import com.hoangphihiep.repository.CourseObjectiveRepository;
import com.hoangphihiep.repository.QuizBlueprintRepository;
import com.hoangphihiep.repository.QuizRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class QuizBlueprintService {

    private final QuizBlueprintRepository quizBlueprintRepository;
    private final QuizRepository quizRepository;
    private final CourseObjectiveRepository courseObjectiveRepository;

    /**
     * Add a CLO to quiz blueprint
     */
    @Transactional
    public QuizBlueprint addCLOToBlueprint(Integer quizId, Integer cloId, Double percentage) {
        log.info("Adding CLO {} with percentage {} to quiz blueprint {}", cloId, percentage, quizId);

        // Validate inputs
        if (percentage == null || percentage < 0 || percentage > 100) {
            throw new AppException(ErrorCode.QUIZ_BLUEPRINT_PERCENTAGE_INVALID);
        }

        // Get quiz
        Quiz quiz = quizRepository.findById(quizId)
                .orElseThrow(() -> new AppException(ErrorCode.QUIZ_NOT_FOUND));

        // Get CLO
        CourseObjective clo = courseObjectiveRepository.findById(cloId)
                .orElseThrow(() -> new AppException(ErrorCode.CLO_NOT_FOUND));

        // Check if CLO already exists in blueprint
        QuizBlueprint existing = quizBlueprintRepository.findByQuizIdAndCourseObjectiveId(quizId, cloId);
        if (existing != null) {
            throw new AppException(ErrorCode.QUIZ_BLUEPRINT_DUPLICATE_CLO);
        }

        // Create new blueprint entry
        QuizBlueprint blueprint = new QuizBlueprint();
        blueprint.setQuiz(quiz);
        blueprint.setCourseObjective(clo);
        blueprint.setPercentage(percentage);
        blueprint.setCreatedAt(LocalDateTime.now());
        blueprint.setUpdatedAt(LocalDateTime.now());

        QuizBlueprint saved = quizBlueprintRepository.save(blueprint);
        log.info("Successfully added CLO to quiz blueprint with id {}", saved.getId());

        return saved;
    }

    /**
     * Update percentage for a CLO in blueprint
     */
    @Transactional
    public QuizBlueprint updateCLOPercentage(Integer quizId, Integer cloId, Double newPercentage) {
        log.info("Updating percentage for CLO {} in quiz {} to {}", cloId, quizId, newPercentage);

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
        log.info("Successfully updated CLO percentage in blueprint");

        return saved;
    }

    /**
     * Remove a CLO from blueprint
     */
    @Transactional
    public void removeCLOFromBlueprint(Integer quizId, Integer cloId) {
        log.info("Removing CLO {} from quiz blueprint {}", cloId, quizId);

        QuizBlueprint blueprint = quizBlueprintRepository.findByQuizIdAndCourseObjectiveId(quizId, cloId);
        if (blueprint == null) {
            throw new AppException(ErrorCode.QUIZ_BLUEPRINT_NOT_FOUND);
        }

        quizBlueprintRepository.delete(blueprint);
        log.info("Successfully removed CLO from blueprint");
    }

    /**
     * Get all blueprint entries for a quiz
     */
    @Transactional(readOnly = true)
    public List<QuizBlueprint> getBlueprintByQuizId(Integer quizId) {
        log.info("Retrieving blueprint for quiz {}", quizId);

        // Verify quiz exists
        quizRepository.findById(quizId)
                .orElseThrow(() -> new AppException(ErrorCode.QUIZ_NOT_FOUND));

        return quizBlueprintRepository.findByQuizId(quizId);
    }

    /**
     * Get blueprint as map for easier percentage lookup
     */
    @Transactional(readOnly = true)
    public Map<Integer, Double> getBlueprintMap(Integer quizId) {
        log.info("Retrieving blueprint map for quiz {}", quizId);

        List<QuizBlueprint> blueprints = getBlueprintByQuizId(quizId);
        return blueprints.stream()
                .collect(Collectors.toMap(
                        bp -> bp.getCourseObjective().getId(),
                        QuizBlueprint::getPercentage
                ));
    }

    /**
     * Validate that total percentage equals 100%
     * Throws exception if not
     */
    @Transactional(readOnly = true)
    public void validateBlueprintTotalPercentage(Integer quizId) {
        log.info("Validating total percentage for quiz blueprint {}", quizId);

        Double totalPercentage = quizBlueprintRepository.getTotalPercentageByQuizId(quizId);

        if (totalPercentage == null || totalPercentage == 0) {
            throw new AppException(ErrorCode.QUIZ_BLUEPRINT_EMPTY);
        }

        // Check if total is exactly 100 (allow small floating point differences)
        if (Math.abs(totalPercentage - 100.0) > 0.001) {
            throw new AppException(ErrorCode.QUIZ_BLUEPRINT_TOTAL_PERCENTAGE_INVALID);
        }

        log.info("Blueprint total percentage validation passed: {}", totalPercentage);
    }

    /**
     * Get total percentage for blueprint
     */
    @Transactional(readOnly = true)
    public Double getTotalPercentage(Integer quizId) {
        log.info("Getting total percentage for quiz blueprint {}", quizId);

        Double totalPercentage = quizBlueprintRepository.getTotalPercentageByQuizId(quizId);
        return totalPercentage != null ? totalPercentage : 0.0;
    }

    /**
     * Check if blueprint is complete (total = 100%)
     */
    @Transactional(readOnly = true)
    public boolean isBlueprintComplete(Integer quizId) {
        Double totalPercentage = getTotalPercentage(quizId);
        return Math.abs(totalPercentage - 100.0) < 0.001;
    }

    /**
     * Clear all blueprints for a quiz
     */
    @Transactional
    public void clearBlueprint(Integer quizId) {
        log.info("Clearing all blueprints for quiz {}", quizId);

        // Verify quiz exists
        quizRepository.findById(quizId)
                .orElseThrow(() -> new AppException(ErrorCode.QUIZ_NOT_FOUND));

        quizBlueprintRepository.deleteByQuizId(quizId);
        log.info("Successfully cleared blueprint for quiz");
    }
}
