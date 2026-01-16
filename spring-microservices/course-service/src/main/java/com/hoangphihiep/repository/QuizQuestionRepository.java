package com.hoangphihiep.repository;

import com.hoangphihiep.entity.QuizQuestion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface QuizQuestionRepository extends JpaRepository<QuizQuestion, QuizQuestion.QuizQuestionId> {

    @Query("SELECT qq FROM QuizQuestion qq WHERE qq.quizId = :quizId ORDER BY qq.orderIndex")
    List<QuizQuestion> findByQuizIdOrderByOrderIndex(@Param("quizId") Integer quizId);

    @Modifying
    @Query("DELETE FROM QuizQuestion qq WHERE qq.quizId = :quizId")
    void deleteByQuizId(@Param("quizId") Integer quizId);
    
    @Query("SELECT COUNT(qq) FROM QuizQuestion qq WHERE qq.quizId = :quizId")
    int countByQuizId(@Param("quizId") Integer quizId);
    
    @Modifying
    @Query("DELETE FROM QuizQuestion qq WHERE qq.questionId = :questionId")
    void deleteByQuestionId(@Param("questionId") Integer questionId);
}
