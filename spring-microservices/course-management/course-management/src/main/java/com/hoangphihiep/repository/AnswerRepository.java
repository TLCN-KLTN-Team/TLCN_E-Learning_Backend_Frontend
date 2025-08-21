package com.hoangphihiep.repository;

import com.hoangphihiep.entity.Answer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AnswerRepository extends JpaRepository<Answer, Integer> {

    List<Answer> findByQuestionId(int questionId);

    @Query("SELECT a FROM Answer a WHERE a.question.id = :questionId AND a.isCorrect = true")
    List<Answer> findCorrectAnswersByQuestionId(@Param("questionId") int questionId);

    @Query("SELECT a FROM Answer a WHERE a.question.id = :questionId ORDER BY a.orderIndex")
    List<Answer> findByQuestionIdOrderByOrderIndex(@Param("questionId") int questionId);
}
