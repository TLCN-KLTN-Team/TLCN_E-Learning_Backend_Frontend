package com.hoangphihiep.repository;

import com.hoangphihiep.entity.QuizAttemptAnswer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface QuizAttemptAnswerRepository extends JpaRepository<QuizAttemptAnswer, Integer> {

    List<QuizAttemptAnswer> findByQuizAttemptId(int quizAttemptId);

    List<QuizAttemptAnswer> findByQuestionId(int questionId);

    @Query("SELECT qaa FROM QuizAttemptAnswer qaa WHERE qaa.quizAttempt.idUser = :userId")
    List<QuizAttemptAnswer> findByUserId(@Param("userId") String userId);

    @Query("SELECT qaa FROM QuizAttemptAnswer qaa WHERE qaa.quizAttempt.id = :attemptId AND qaa.question.id = :questionId")
    List<QuizAttemptAnswer> findByQuizAttemptIdAndQuestionId(@Param("attemptId") int attemptId, @Param("questionId") int questionId);
}
