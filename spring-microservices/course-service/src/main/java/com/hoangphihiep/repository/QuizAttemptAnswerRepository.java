package com.hoangphihiep.repository;

import com.hoangphihiep.entity.QuizAttemptAnswer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface QuizAttemptAnswerRepository extends JpaRepository<QuizAttemptAnswer, Integer> {

    /**
     * Find all answers for a quiz attempt
     */
    @Query("SELECT qaa FROM QuizAttemptAnswer qaa " +
            "WHERE qaa.quizAttempt.id = :attemptId " +
            "ORDER BY qaa.question.orderIndex")
    List<QuizAttemptAnswer> findByQuizAttemptId(@Param("attemptId") Integer attemptId);

    /**
     * Find answers for a quiz attempt with question details
     */
    @Query("SELECT qaa FROM QuizAttemptAnswer qaa " +
            "LEFT JOIN FETCH qaa.question q " +
            "LEFT JOIN FETCH qaa.selectedAnswer " +
            "WHERE qaa.quizAttempt.id = :attemptId " +
            "ORDER BY q.orderIndex")
    List<QuizAttemptAnswer> findByQuizAttemptIdWithDetails(@Param("attemptId") Integer attemptId);
}
