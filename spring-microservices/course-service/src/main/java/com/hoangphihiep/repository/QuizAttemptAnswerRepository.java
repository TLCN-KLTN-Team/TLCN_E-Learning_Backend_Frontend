package com.hoangphihiep.repository;

import com.hoangphihiep.entity.QuizAttemptAnswer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface QuizAttemptAnswerRepository extends JpaRepository<QuizAttemptAnswer, Integer> {

    @Query("SELECT qaa FROM QuizAttemptAnswer qaa " +
            "WHERE qaa.quizAttempt.id = :attemptId " +
            "ORDER BY qaa.question.orderIndex")
    List<QuizAttemptAnswer> findByQuizAttemptId(@Param("attemptId") Integer attemptId);

}
