package com.hoangphihiep.repository;

import com.hoangphihiep.entity.QuizBlueprint;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface QuizBlueprintRepository extends JpaRepository<QuizBlueprint, Integer> {

    @Query("SELECT qb FROM QuizBlueprint qb WHERE qb.quiz.id = :quizId")
    List<QuizBlueprint> findByQuizId(@Param("quizId") Integer quizId);

    @Query("SELECT SUM(qb.percentage) FROM QuizBlueprint qb WHERE qb.quiz.id = :quizId GROUP BY qb.quiz.id")
    Double getTotalPercentageByQuizId(@Param("quizId") Integer quizId);

    @Query("SELECT qb FROM QuizBlueprint qb WHERE qb.quiz.id = :quizId AND qb.courseObjective.id = :courseObjectiveId")
    QuizBlueprint findByQuizIdAndCourseObjectiveId(@Param("quizId") Integer quizId, @Param("courseObjectiveId") Integer courseObjectiveId);

    @Modifying
    @Query("DELETE FROM QuizBlueprint qb WHERE qb.quiz.id = :quizId")
    void deleteByQuizId(@Param("quizId") Integer quizId);
}
