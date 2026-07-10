package com.hoangphihiep.mapper;

import com.hoangphihiep.dto.response.QuestionResponse;
import com.hoangphihiep.dto.response.QuizResponse;
import com.hoangphihiep.entity.Quiz;
import com.hoangphihiep.entity.QuizQuestion;
import com.hoangphihiep.repository.QuizAttemptRepository;
import com.hoangphihiep.repository.QuizQuestionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.LinkedHashSet;
import java.util.List;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
public class QuizMapper {
    
    private final QuizQuestionRepository quizQuestionRepository;
    private final QuestionMapper questionMapper;
    private final QuizAttemptRepository quizAttemptRepository;
    
    public QuizResponse toQuizResponse(Quiz quiz) {
        if (quiz == null) {
            return null;
        }
        
        QuizResponse response = new QuizResponse();
        response.setId(quiz.getId());
        response.setTitle(quiz.getTitle());
        response.setDescription(quiz.getDescription());
        response.setDuration(quiz.getDuration());
        response.setAttemptLimit(quiz.getAttemptLimit());
        response.setPassingScore(quiz.getPassingScore());
        response.setNumberItem(quiz.getNumberItem());
        response.setShowResults(quiz.getShowResults());
        response.setIsPublished(quiz.getIsPublished());
        response.setCreatedAt(quiz.getCreatedAt());
        response.setUpdateAt(quiz.getUpdateAt());
        response.setStartTime(quiz.getStartTime());
        response.setEndTime(quiz.getEndTime());
        
        if (quiz.getSection() != null) {
            response.setSectionId(quiz.getSection().getId());
            response.setSectionName(quiz.getSection().getTitle());
        }
        
        int attemptsCount = quizAttemptRepository.countByQuizId(quiz.getId());
        response.setAttemptsCount(attemptsCount);
        
        // Load questions via many-to-many relationship
        List<QuizQuestion> quizQuestions = quizQuestionRepository.findByQuizIdOrderByOrderIndex(quiz.getId());
        LinkedHashSet<QuestionResponse> questions = quizQuestions.stream()
                .map(QuizQuestion::getQuestion)
                .map(questionMapper::toQuestionResponse)
                .collect(Collectors.toCollection(LinkedHashSet::new));
        response.setQuestions(questions);
        
        return response;
    }
}
