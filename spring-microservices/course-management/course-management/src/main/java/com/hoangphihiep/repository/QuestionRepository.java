package com.hoangphihiep.repository;

import com.hoangphihiep.entity.Question;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface QuestionRepository extends JpaRepository<Question, Integer> {

    List<Question> findByQuizId(int quizId);

    @Query("SELECT q FROM Question q WHERE q.quiz.id = :quizId ORDER BY q.orderIndex")
    List<Question> findByQuizIdOrderByOrderIndex(@Param("quizId") int quizId);

    @Query("SELECT q FROM Question q WHERE LOWER(q.questionText) LIKE LOWER(CONCAT('%', :text, '%'))")
    List<Question> findByQuestionTextContaining(@Param("text") String text);

    List<Question> findByQuestionType(String questionType);
}
