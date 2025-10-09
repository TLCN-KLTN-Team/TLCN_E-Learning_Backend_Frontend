package com.hoangphihiep.repository;

import com.hoangphihiep.entity.QuizAttempt;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface QuizAttemptRepository extends JpaRepository<QuizAttempt, Integer> {

    List<QuizAttempt> findByQuizId(int quizId);

    @Query("SELECT qa FROM QuizAttempt qa WHERE qa.idUser = :userId AND qa.quiz.id = :quizId ORDER BY qa.submittedAt DESC")
    List<QuizAttempt> findByUserIdAndQuizIdOrderByAttemptDateDesc(@Param("userId") String userId, @Param("quizId") int quizId);

    @Query("SELECT qa FROM QuizAttempt qa WHERE qa.idUser = :userId AND qa.quiz.id = :quizId ORDER BY qa.score DESC")
    Optional<QuizAttempt> findBestAttemptByUserIdAndQuizId(@Param("userId") String userId, @Param("quizId") int quizId);

    @Query("SELECT AVG(qa.score) FROM QuizAttempt qa WHERE qa.quiz.id = :quizId")
    Double calculateAverageScoreByQuizId(@Param("quizId") int quizId);

    @Query("SELECT qa FROM QuizAttempt qa WHERE qa.idUser = :userId")
    List<QuizAttempt> findByUserId(String userId);
}
